import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  pbkdf2Sync,
  randomBytes,
  timingSafeEqual,
} from 'node:crypto';
import { createJsonStorage } from './server/storage/json-storage.js';
import {
  createChatRouteGate,
  overlayPostgresMessages,
} from './server/storage/postgres/chat-route-gate.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3005;
const DB_FILE = process.env.ZOK_DB_FILE || path.join(__dirname, 'server', 'db.json');
const NODE_ENV = process.env.NODE_ENV || 'development';
const IS_PRODUCTION = NODE_ENV === 'production';
const CHAT_STORAGE_MODE = (process.env.ZOK_CHAT_STORAGE || 'json').trim().toLowerCase();
const CHAT_POSTGRES_URL = (process.env.ZOK_POSTGRES_URL || '').trim();
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function boundedInteger(value, fallback, minimum, maximum) {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed >= minimum && parsed <= maximum
    ? parsed
    : fallback;
}

const SESSION_TTL_MS = boundedInteger(
  process.env.ZOK_SESSION_TTL_MS,
  8 * 60 * 60 * 1000,
  5 * 60 * 1000,
  7 * 24 * 60 * 60 * 1000,
);
const ADMIN_EMAIL = (process.env.ZOK_ADMIN_EMAIL || '').trim().toLowerCase();
const ADMIN_PASSWORD_HASH = process.env.ZOK_ADMIN_PASSWORD_HASH || '';
const ADMIN_TENANT_ID = (process.env.ZOK_ADMIN_TENANT_ID || '').trim();
if (ADMIN_TENANT_ID && !UUID_PATTERN.test(ADMIN_TENANT_ID)) {
  throw new Error('ZOK_ADMIN_TENANT_ID must be a UUID');
}
const AUTH_CONFIGURED = Boolean(ADMIN_EMAIL && ADMIN_PASSWORD_HASH);
const DEFAULT_ALLOWED_ORIGINS = IS_PRODUCTION
  ? ['https://zok.zeaz.dev']
  : [
      'http://127.0.0.1:5175',
      'http://localhost:5175',
      'http://127.0.0.1:3000',
      'http://localhost:3000',
      'https://zok.zeaz.dev',
    ];
const ALLOWED_ORIGINS = new Set(
  (process.env.ZOK_ALLOWED_ORIGINS || DEFAULT_ALLOWED_ORIGINS.join(','))
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean),
);
if (ALLOWED_ORIGINS.has('*')) {
  throw new Error('ZOK_ALLOWED_ORIGINS must not contain a wildcard');
}
const sessions = new Map();
const rateLimitBuckets = new Map();

const PASSWORD_HASH_PREFIX = 'pbkdf2_sha256';
const PASSWORD_HASH_ITERATIONS = 310000;
const MAX_PASSWORD_HASH_ITERATIONS = 2_000_000;

export function createPasswordHash(password) {
  if (typeof password !== 'string' || password.length < 12) {
    throw new Error('Password must contain at least 12 characters');
  }

  const salt = randomBytes(16).toString('base64url');
  const derivedKey = pbkdf2Sync(
    password,
    salt,
    PASSWORD_HASH_ITERATIONS,
    32,
    'sha256',
  ).toString('base64url');

  return `${PASSWORD_HASH_PREFIX}$${PASSWORD_HASH_ITERATIONS}$${salt}$${derivedKey}`;
}

function verifyPassword(password, storedHash) {
  if (typeof password !== 'string' || typeof storedHash !== 'string') return false;

  const [prefix, iterationsValue, salt, expectedValue] = storedHash.split('$');
  const iterations = Number(iterationsValue);
  if (
    prefix !== PASSWORD_HASH_PREFIX ||
    !Number.isSafeInteger(iterations) ||
    iterations < 100000 ||
    iterations > MAX_PASSWORD_HASH_ITERATIONS ||
    !salt ||
    !expectedValue
  ) {
    return false;
  }

  const expected = Buffer.from(expectedValue, 'base64url');
  if (expected.length !== 32) return false;
  const actual = pbkdf2Sync(password, salt, iterations, expected.length, 'sha256');
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

function parseCookies(req) {
  const header = req.headers.cookie || '';
  const cookies = {};

  for (const part of header.split(';')) {
    const [name, ...valueParts] = part.trim().split('=');
    if (!name || valueParts.length === 0) continue;
    try {
      cookies[name] = decodeURIComponent(valueParts.join('='));
    } catch {
      // Ignore malformed cookies and let authentication fail closed.
    }
  }

  return cookies;
}

function cookieHeader(name, value, options = {}) {
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    'Path=/',
    `SameSite=${options.sameSite || 'Strict'}`,
  ];
  if (options.httpOnly) parts.push('HttpOnly');
  if (IS_PRODUCTION) parts.push('Secure');
  if (options.maxAge !== undefined) parts.push(`Max-Age=${options.maxAge}`);
  return parts.join('; ');
}

function setAuthCookies(res, session) {
  res.setHeader('Set-Cookie', [
    cookieHeader('zok_session', session.token, { httpOnly: true, maxAge: Math.floor(SESSION_TTL_MS / 1000) }),
    cookieHeader('zok_csrf', session.csrfToken, { maxAge: Math.floor(SESSION_TTL_MS / 1000) }),
  ]);
}

function clearAuthCookies(res) {
  res.setHeader('Set-Cookie', [
    cookieHeader('zok_session', '', { httpOnly: true, maxAge: 0 }),
    cookieHeader('zok_csrf', '', { maxAge: 0 }),
  ]);
}

function sessionFromRequest(req) {
  pruneExpiredSessions();
  const token = parseCookies(req).zok_session;
  if (!token) return null;

  const session = sessions.get(token);
  if (!session || session.expiresAt <= Date.now()) {
    if (session) sessions.delete(token);
    return null;
  }

  return session;
}

function pruneExpiredSessions(now = Date.now()) {
  for (const [token, session] of sessions) {
    if (session.expiresAt <= now) sessions.delete(token);
  }
}

function rateLimit({ windowMs, max }) {
  return (req, res, next) => {
    const key = `${req.ip || 'unknown'}:${req.path}`;
    const now = Date.now();
    const existing = rateLimitBuckets.get(key);
    const bucket = existing && existing.expiresAt > now
      ? existing
      : { count: 0, expiresAt: now + windowMs };

    bucket.count += 1;
    rateLimitBuckets.set(key, bucket);
    if (rateLimitBuckets.size > 10000) {
      for (const [bucketKey, bucketValue] of rateLimitBuckets) {
        if (bucketValue.expiresAt <= now) rateLimitBuckets.delete(bucketKey);
      }
    }
    res.setHeader('RateLimit-Limit', max);
    res.setHeader('RateLimit-Remaining', Math.max(0, max - bucket.count));

    if (bucket.count > max) {
      res.setHeader('Retry-After', Math.ceil((bucket.expiresAt - now) / 1000));
      return res.status(429).json({ error: 'Too many requests' });
    }

    return next();
  };
}

function parseChatId(value) {
  if (!/^\d+$/.test(String(value))) return null;
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function requiredText(value, field, maxLength = 4000) {
  if (typeof value !== 'string') {
    return { error: `${field} must be a string` };
  }
  const text = value.trim();
  if (!text) return { error: `${field} is required` };
  if (text.length > maxLength) return { error: `${field} exceeds the ${maxLength}-character limit` };
  return { value: text };
}

function validateTags(tags) {
  if (!Array.isArray(tags) || tags.length > 32) return 'Tags must be an array of at most 32 items';
  if (tags.some(tag => typeof tag !== 'string' || !tag.trim() || tag.trim().length > 80)) {
    return 'Each tag must be a non-empty string of at most 80 characters';
  }
  return null;
}

function sameOriginOrAllowed(req) {
  const origin = req.get('origin');
  return !origin || ALLOWED_ORIGINS.has(origin);
}

function requireAuth(req, res, next) {
  if (req.path === '/health' || req.path === '/auth/config' || (req.path === '/auth/login' && req.method === 'POST')) {
    return next();
  }

  if (!AUTH_CONFIGURED) {
    return res.status(503).json({ error: 'Authentication is not configured' });
  }

  const session = sessionFromRequest(req);
  if (!session) return res.status(401).json({ error: 'Authentication required' });
  req.session = session;
  req.user = session.user;
  return next();
}

function requireCsrf(req, res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method) || req.path === '/auth/login') return next();
  if (!sameOriginOrAllowed(req)) return res.status(403).json({ error: 'Origin is not allowed' });

  const expected = req.session?.csrfToken;
  const received = req.get('x-csrf-token');
  if (!expected || !received) return res.status(403).json({ error: 'CSRF token is required' });

  const expectedBuffer = Buffer.from(expected);
  const receivedBuffer = Buffer.from(received);
  if (
    expectedBuffer.length !== receivedBuffer.length ||
    !timingSafeEqual(expectedBuffer, receivedBuffer)
  ) {
    return res.status(403).json({ error: 'Invalid CSRF token' });
  }

  return next();
}

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  if (IS_PRODUCTION) res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});

app.use('/api', (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  return next();
});
app.use(cors({
  credentials: true,
  origin(origin, callback) {
    if (!origin || ALLOWED_ORIGINS.has(origin)) return callback(null, true);
    return callback(new Error('Origin is not allowed by CORS'));
  },
}));
app.use('/api', rateLimit({ windowMs: 60_000, max: 180 }));
app.use(express.json({ limit: '64kb' }));
app.use('/api', requireAuth);
app.use('/api', requireCsrf);

const DEFAULT_DB = {
  chats: [
    {
      id: 1,
      name: 'Panacee Medical Centre',
      avatar: 'PMC',
      channel: 'line',
      unread: 2,
      time: '10:24 AM',
      messages: [
        { sender: 'customer', text: 'Hello, what are your clinic hours for tomorrow?', time: '10:20 AM' },
        { sender: 'customer', text: 'I would like to book a general checkup.', time: '10:21 AM' }
      ],
      details: {
        phone: '+66 2 712 0333',
        email: 'info@panacee.com',
        assigned: 'Sarah Connor',
        tags: ['New Lead', 'LINE OA', 'Medical Service'],
        orders: [
          { id: 'ORD-8812', date: '2026-08-01', total: '$149.00', status: 'Delivered' }
        ]
      }
    },
    {
      id: 2,
      name: 'Karmart Customer Support',
      avatar: 'KM',
      channel: 'whatsapp',
      unread: 0,
      time: '9:15 AM',
      messages: [
        { sender: 'customer', text: 'Hi, is my order #5512 shipped yet?', time: '9:10 AM' },
        { sender: 'agent', text: 'Hello! Yes, it was dispatched yesterday. Your tracking link is: kmt.express/38821', time: '9:12 AM' },
        { sender: 'customer', text: 'Awesome, thank you!', time: '9:15 AM' }
      ],
      details: {
        phone: '+65 9123 4567',
        email: 'support@karmart.com.sg',
        assigned: 'Alex Rivera',
        tags: ['Shopify Buyer', 'WhatsApp', 'VIP'],
        orders: [
          { id: 'ORD-5512', date: '2026-08-09', total: '$48.50', status: 'Shipped' },
          { id: 'ORD-4390', date: '2026-07-15', total: '$112.00', status: 'Delivered' }
        ]
      }
    },
    {
      id: 3,
      name: 'Wilfried Buiron',
      avatar: 'WB',
      channel: 'messenger',
      unread: 1,
      time: 'Yesterday',
      messages: [
        { sender: 'customer', text: 'Do you offer custom API endpoints for Shopify syncing?', time: 'Yesterday' }
      ],
      details: {
        phone: '+1 650 882 1190',
        email: 'wilfried@zok.zeaz.dev',
        assigned: 'Sarah Connor',
        tags: ['Enterprise', 'Messenger', 'Developer'],
        orders: []
      }
    },
    {
      id: 4,
      name: 'Nattapong (TikTok Seller)',
      avatar: 'NT',
      channel: 'tiktok',
      unread: 0,
      time: 'Yesterday',
      messages: [
        { sender: 'customer', text: 'Thanks for the quick response. Will test the AI automation feature tonight.', time: 'Yesterday' }
      ],
      details: {
        phone: '+66 89 123 4567',
        email: 'nattapong.tkt@gmail.com',
        assigned: 'Automated Bot',
        tags: ['TikTok Shop', 'Active Demo'],
        orders: [
          { id: 'TKT-9912', date: '2026-08-05', total: '$29.90', status: 'Delivered' }
        ]
      }
    },
    {
      id: 5,
      name: 'Emily Davis',
      avatar: 'ED',
      channel: 'shopify',
      unread: 0,
      time: '2 days ago',
      messages: [
        { sender: 'customer', text: 'I received a damaged package. Can I get a replacement?', time: '2 days ago' },
        { sender: 'agent', text: 'We are very sorry to hear that. I have triggered a replacement shipment. Your new order code is ORD-9011.', time: '2 days ago' }
      ],
      details: {
        phone: '+44 7700 900077',
        email: 'emily.davis@gmail.com',
        assigned: 'Alex Rivera',
        tags: ['Shopify Buyer', 'Support Ticket'],
        orders: [
          { id: 'ORD-9011', date: '2026-08-08', total: '$0.00', status: 'Processing' },
          { id: 'ORD-8321', date: '2026-07-28', total: '$85.00', status: 'Delivered' }
        ]
      }
    }
  ],
  aiConfig: {
    agentName: 'Zok AI Sales Agent',
    persona: 'sales',
    knowledgeBase: 'Zok is an e-commerce brand offering lifestyle accessories. Standard delivery takes 3-5 days. All products have a 1-year product warranty. Customers earn 5% cashback on loyalty purchases.',
    qaPairs: [
      { q: 'What is your return policy?', a: 'We offer a 14-day free return policy for all unused products. Returns are processed within 3 business days.' },
      { q: 'Do you offer free shipping?', a: 'Yes! We offer free shipping on all orders over $100. Standard shipping for smaller orders is $5.99.' },
      { q: 'Where are you located?', a: 'Our corporate headquarters are located in Singapore and Bangkok, Thailand. We ship globally!' }
    ]
  },
  flowNodes: [
    {
      id: 'node-1',
      type: 'trigger',
      title: 'Trigger: Keyword Message',
      description: 'When message contains "price" or "catalog"',
      x: 50,
      y: 120,
      details: { keywords: 'price, catalog' }
    },
    {
      id: 'node-2',
      type: 'action',
      title: 'Send WhatsApp Template',
      description: 'Send Catalog Link Template message',
      x: 320,
      y: 80,
      details: { template: 'WhatsApp Catalog Link', variable: 'customer_name' }
    },
    {
      id: 'node-3',
      type: 'condition',
      title: 'Check Customer Tag',
      description: 'Verify if tag matches "Shopify Buyer"',
      x: 320,
      y: 240,
      details: { tag: 'Shopify Buyer' }
    },
    {
      id: 'node-4',
      type: 'action',
      title: 'Send Discount Code',
      description: 'Send discount coupon code "VIP10"',
      x: 600,
      y: 200,
      details: { text: 'Here is your 10% discount code: VIP10!' }
    }
  ],
  campaigns: [
    {
      id: 1,
      name: 'August VIP Discount Promo',
      status: 'completed',
      channel: 'whatsapp',
      target: 'VIP Customers',
      recipients: 1450,
      delivered: '100%',
      opened: '84.2%',
      converted: '12.8%',
      date: '2026-08-05'
    },
    {
      id: 2,
      name: 'LINE OA Welcome Voucher Push',
      status: 'completed',
      channel: 'line',
      target: 'New Leads',
      recipients: 890,
      delivered: '98.5%',
      opened: '92.1%',
      converted: '15.4%',
      date: '2026-08-01'
    },
    {
      id: 3,
      name: 'Abandon Cart Recovery Followup',
      status: 'scheduled',
      channel: 'whatsapp',
      target: 'Shopify Buyer',
      recipients: 320,
      delivered: '--',
      opened: '--',
      converted: '--',
      date: '2026-08-15 (10:00 AM)'
    }
  ],
  integrations: [
    {
      id: 'shopify',
      name: 'Shopify Store Sync',
      description: 'Pull order history, client tags, and catalog details inside unified chat sidebar.',
      status: 'disconnected',
      category: 'E-commerce',
      logo: 'S'
    },
    {
      id: 'tiktok',
      name: 'TikTok Shop DM Integration',
      description: 'Consolidate TikTok seller chats and order statuses into Zok helpdesk.',
      status: 'disconnected',
      category: 'Social Commerce',
      logo: 'T'
    },
    {
      id: 'lazada',
      name: 'Lazada Messaging',
      description: 'Sync customer chats from Lazada Seller Center directly to your agents.',
      status: 'disconnected',
      category: 'Marketplace',
      logo: 'L'
    },
    {
      id: 'shopee',
      name: 'Shopee Seller Chat',
      description: 'Automate customer support for Shopee inquiries using Zok AI bot flow.',
      status: 'disconnected',
      category: 'Marketplace',
      logo: 'Sh'
    },
    {
      id: 'hubspot',
      name: 'HubSpot CRM Sync',
      description: 'Export customer details, active tickets, and chat history into HubSpot CRM leads.',
      status: 'disconnected',
      category: 'CRM',
      logo: 'H'
    }
  ],
  syncLogs: [
    `[10:20:00 AM] Sandbox integration data loaded; no provider credentials configured.`,
    `[10:20:01 AM] External channel delivery is disabled until account verification.`
  ]
};

function validateDatabase(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error('Database is unavailable');
  }

  const requiredCollections = ['chats', 'flowNodes', 'campaigns', 'integrations', 'syncLogs'];
  if (requiredCollections.some(collection => !Array.isArray(data[collection]))) {
    throw new Error('Database is unavailable');
  }

  if (!data.aiConfig || typeof data.aiConfig !== 'object' || Array.isArray(data.aiConfig)) {
    throw new Error('Database is unavailable');
  }

  if (data.chats.some(chat => (
    !chat ||
    !Number.isSafeInteger(chat.id) ||
    chat.id < 1 ||
    !Array.isArray(chat.messages) ||
    !chat.details ||
    typeof chat.details !== 'object' ||
    !Array.isArray(chat.details.tags)
  ))) {
    throw new Error('Database is unavailable');
  }

  return data;
}

const storage = createJsonStorage({
  filePath: DB_FILE,
  defaultData: DEFAULT_DB,
  validate: validateDatabase,
});
const chatRouteGate = createChatRouteGate({
  mode: CHAT_STORAGE_MODE,
  connectionString: CHAT_POSTGRES_URL,
});

async function readDB() {
  return storage.read();
}

function updateDB(mutator) {
  return storage.update(mutator);
}

async function postgresBackedChat(request, chat) {
  const state = await chatRouteGate.runtime.read(request, chat.id);
  if (!state) {
    const error = new Error('PostgreSQL chat import is incomplete');
    error.status = 503;
    throw error;
  }
  return overlayPostgresMessages(chat, state);
}

app.get('/api/health', async (_req, res) => {
  try {
    await readDB();
    return res.json({ status: 'ok', service: 'zok-api', environment: NODE_ENV });
  } catch (error) {
    console.error('Health check failed:', error.message);
    return res.status(503).json({ status: 'degraded', service: 'zok-api', environment: NODE_ENV });
  }
});

app.get('/api/auth/config', (req, res) => {
  res.json({ configured: AUTH_CONFIGURED, registrationEnabled: false });
});

app.post('/api/auth/login', rateLimit({ windowMs: 15 * 60_000, max: 10 }), (req, res) => {
  const emailResult = requiredText(req.body?.email, 'Email', 254);
  const passwordResult = requiredText(req.body?.password, 'Password', 256);

  if (emailResult.error || passwordResult.error) {
    return res.status(400).json({ error: emailResult.error || passwordResult.error });
  }
  if (!AUTH_CONFIGURED) {
    return res.status(503).json({ error: 'Authentication is not configured' });
  }

  const email = emailResult.value.toLowerCase();
  if (email !== ADMIN_EMAIL || !verifyPassword(passwordResult.value, ADMIN_PASSWORD_HASH)) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  pruneExpiredSessions();
  const token = randomBytes(32).toString('base64url');
  const session = {
    token,
    csrfToken: randomBytes(32).toString('base64url'),
    expiresAt: Date.now() + SESSION_TTL_MS,
    user: {
      email,
      role: 'owner',
      ...(ADMIN_TENANT_ID ? { tenantId: ADMIN_TENANT_ID } : {}),
    },
  };
  sessions.set(token, session);
  setAuthCookies(res, session);
  return res.json({ user: session.user });
});

app.get('/api/auth/me', (req, res) => {
  res.json({ user: req.user });
});

app.post('/api/auth/logout', (req, res) => {
  if (req.session?.token) sessions.delete(req.session.token);
  clearAuthCookies(res);
  return res.status(204).end();
});

app.get('/api/db', async (req, res) => {
  const db = await readDB();
  res.json(db);
});

app.get('/api/chats', async (req, res) => {
  const db = await readDB();
  if (chatRouteGate.mode === 'json') return res.json(db.chats);
  const chats = await Promise.all(db.chats.map(chat => postgresBackedChat(req, chat)));
  return res.json(chats);
});

app.post('/api/chats/:id/messages', async (req, res) => {
  const chatId = parseChatId(req.params.id);
  const textResult = requiredText(req.body?.text, 'Text content');
  const sender = req.body?.sender || 'agent';
  const activeChatId = req.body?.activeChatId === undefined
    ? chatId
    : parseChatId(req.body.activeChatId);

  if (chatId === null) return res.status(400).json({ error: 'Chat id must be a positive integer' });
  if (textResult.error) return res.status(400).json({ error: textResult.error });
  if (!['agent', 'customer', 'bot', 'system'].includes(sender)) {
    return res.status(400).json({ error: 'Invalid sender' });
  }
  if (activeChatId === null) return res.status(400).json({ error: 'activeChatId must be a positive integer' });

  let updatedChat;
  if (chatRouteGate.mode === 'postgres') {
    const db = await readDB();
    const metadataChat = db.chats.find(chat => chat.id === chatId);
    if (!metadataChat) return res.status(404).json({ error: 'Chat not found' });

    const written = await chatRouteGate.runtime.writeMessage(req, chatId, {
      sender,
      text: textResult.value,
    });
    if (!written) return res.status(404).json({ error: 'Chat not found' });

    await updateDB(currentDb => {
      const chat = currentDb.chats.find(item => item.id === chatId);
      if (chat) chat.time = 'Just now';
    });
    updatedChat = {
      ...(await postgresBackedChat(req, metadataChat)),
      time: 'Just now',
    };
  } else {
    updatedChat = await updateDB(db => {
      const chatIndex = db.chats.findIndex(c => c.id === chatId);
      if (chatIndex === -1) return null;

      const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      db.chats[chatIndex].messages.push({ sender, text: textResult.value, time: timeString });
      db.chats[chatIndex].time = 'Just now';
      return db.chats[chatIndex];
    });
  }

  if (!updatedChat) return res.status(404).json({ error: 'Chat not found' });
  res.status(201).json(updatedChat);

  setTimeout(async () => {
    try {
      let responseText = `Hi, thank you for writing back! I am currently away but our team will update you as soon as possible.`;
      const lowercaseText = textResult.value.toLowerCase();

      if (lowercaseText.includes('help') || lowercaseText.includes('support')) {
        responseText = `Got it. I've routed this conversation to our priority support desk. Alex Rivera will review this shortly!`;
      } else if (lowercaseText.includes('order') || lowercaseText.includes('track')) {
        responseText = `Sure thing! You can track all active orders directly in your customer profile page, or click: shopify.com/orders`;
      } else if (lowercaseText.includes('price') || lowercaseText.includes('cost')) {
        responseText = `Our standard pricing starts at $45/month (Basic) up to $97/month (Pro). Let us know if you'd like a custom demo.`;
      }

      if (chatRouteGate.mode === 'postgres') {
        await chatRouteGate.runtime.writeMessage(req, chatId, {
          sender: 'customer',
          text: responseText,
        });
        await updateDB(liveDb => {
          const liveChatIndex = liveDb.chats.findIndex(c => c.id === chatId);
          if (liveChatIndex === -1) return;
          liveDb.chats[liveChatIndex].time = 'Just now';
          liveDb.chats[liveChatIndex].unread = chatId !== activeChatId
            ? (liveDb.chats[liveChatIndex].unread || 0) + 1
            : 0;
        });
        return;
      }

      await updateDB(liveDb => {
        const liveChatIndex = liveDb.chats.findIndex(c => c.id === chatId);
        if (liveChatIndex === -1) return;

        liveDb.chats[liveChatIndex].messages.push({
          sender: 'customer',
          text: responseText,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        });
        liveDb.chats[liveChatIndex].time = 'Just now';
        liveDb.chats[liveChatIndex].unread = chatId !== activeChatId
          ? (liveDb.chats[liveChatIndex].unread || 0) + 1
          : 0;
      });
    } catch (e) {
      console.error('Error during simulated bot reply:', e);
    }
  }, 1500);
});

app.post('/api/chats/:id/read', async (req, res) => {
  const chatId = parseChatId(req.params.id);
  if (chatId === null) return res.status(400).json({ error: 'Chat id must be a positive integer' });

  if (chatRouteGate.mode === 'postgres') {
    const db = await readDB();
    const metadataChat = db.chats.find(chat => chat.id === chatId);
    if (!metadataChat) return res.status(404).json({ error: 'Chat not found' });
    const metadata = await chatRouteGate.runtime.markRead(req, chatId);
    if (!metadata) return res.status(404).json({ error: 'Chat not found' });
    return res.json(await postgresBackedChat(req, metadataChat));
  }

  const updatedChat = await updateDB(db => {
    const chatIndex = db.chats.findIndex(c => c.id === chatId);
    if (chatIndex === -1) return null;
    db.chats[chatIndex].unread = 0;
    return db.chats[chatIndex];
  });

  if (updatedChat) return res.json(updatedChat);
  return res.status(404).json({ error: 'Chat not found' });
});

app.post('/api/chats/:id/tags', async (req, res) => {
  const chatId = parseChatId(req.params.id);
  const { tags } = req.body || {};
  if (chatId === null) return res.status(400).json({ error: 'Chat id must be a positive integer' });

  const tagError = validateTags(tags);
  if (tagError) return res.status(400).json({ error: tagError });

  if (chatRouteGate.mode === 'postgres') {
    const db = await readDB();
    const metadataChat = db.chats.find(chat => chat.id === chatId);
    if (!metadataChat) return res.status(404).json({ error: 'Chat not found' });
    const metadata = await chatRouteGate.runtime.replaceTags(req, chatId, tags);
    if (!metadata) return res.status(404).json({ error: 'Chat not found' });
    return res.json(await postgresBackedChat(req, metadataChat));
  }

  const updatedChat = await updateDB(db => {
    const chatIndex = db.chats.findIndex(c => c.id === chatId);
    if (chatIndex === -1) return null;
    db.chats[chatIndex].details.tags = tags.map(tag => tag.trim());
    return db.chats[chatIndex];
  });

  if (updatedChat) return res.json(updatedChat);
  return res.status(404).json({ error: 'Chat not found' });
});

app.get('/api/ai-config', async (req, res) => {
  const db = await readDB();
  res.json(db.aiConfig);
});

app.post('/api/ai-config', async (req, res) => {
  const { agentName, persona, knowledgeBase, qaPairs } = req.body || {};
  const nameResult = requiredText(agentName, 'agentName', 120);
  const knowledgeResult = requiredText(knowledgeBase, 'knowledgeBase', 10000);
  if (nameResult.error || knowledgeResult.error) {
    return res.status(400).json({ error: nameResult.error || knowledgeResult.error });
  }
  if (!['sales', 'support', 'lead'].includes(persona)) {
    return res.status(400).json({ error: 'persona must be sales, support, or lead' });
  }
  if (!Array.isArray(qaPairs) || qaPairs.length > 100 || qaPairs.some(pair => (
    !pair ||
    requiredText(pair.q, 'question', 500).error ||
    requiredText(pair.a, 'answer', 2000).error
  ))) {
    return res.status(400).json({ error: 'qaPairs must contain at most 100 valid question/answer pairs' });
  }

  const aiConfig = {
    agentName: nameResult.value,
    persona,
    knowledgeBase: knowledgeResult.value,
    qaPairs: qaPairs.map(pair => ({ q: pair.q.trim(), a: pair.a.trim() })),
  };
  const savedConfig = await updateDB(db => {
    db.aiConfig = aiConfig;
    return db.aiConfig;
  });
  return res.json(savedConfig);
});

app.get('/api/flow-nodes', async (req, res) => {
  const db = await readDB();
  res.json(db.flowNodes);
});

app.post('/api/flow-nodes', async (req, res) => {
  const { nodes } = req.body || {};
  if (!Array.isArray(nodes) || nodes.length > 200 || nodes.some(node => !node || typeof node !== 'object')) {
    return res.status(400).json({ error: 'Nodes must be an array of at most 200 objects' });
  }
  const savedNodes = await updateDB(db => {
    db.flowNodes = nodes;
    return db.flowNodes;
  });
  return res.json(savedNodes);
});

app.get('/api/campaigns', async (req, res) => {
  const db = await readDB();
  res.json(db.campaigns);
});

app.post('/api/campaigns', async (req, res) => {
  const { name, channel, target } = req.body || {};
  const nameResult = requiredText(name, 'name', 160);
  const targetResult = requiredText(target, 'target', 120);
  if (nameResult.error || targetResult.error) {
    return res.status(400).json({ error: nameResult.error || targetResult.error });
  }
  if (!['whatsapp', 'line', 'messenger', 'tiktok', 'shopify'].includes(channel)) {
    return res.status(400).json({ error: 'Invalid campaign channel' });
  }

  const newCamp = await updateDB(db => {
    const campaign = {
      id: Date.now(),
      name: nameResult.value,
      status: 'completed',
      channel,
      target: targetResult.value,
      recipients: Math.floor(200 + Math.random() * 800),
      delivered: '100%',
      opened: `${(70 + Math.random() * 20).toFixed(1)}%`,
      converted: `${(5 + Math.random() * 10).toFixed(1)}%`,
      date: new Date().toISOString().split('T')[0],
    };
    db.campaigns.unshift(campaign);
    return campaign;
  });
  return res.status(201).json(newCamp);
});

app.get('/api/integrations', async (req, res) => {
  const db = await readDB();
  res.json({ integrations: db.integrations, syncLogs: db.syncLogs });
});

app.post('/api/integrations/:id/toggle', async (req, res) => {
  const integrationId = req.params.id;
  if (!/^[a-z0-9-]{1,64}$/.test(integrationId)) {
    return res.status(400).json({ error: 'Invalid integration id' });
  }

  const db = await readDB();
  const configuredIntegration = db.integrations.find(item => item.id === integrationId);
  if (!configuredIntegration) return res.status(404).json({ error: 'Integration not found' });
  if (configuredIntegration.verified !== true) {
    return res.status(409).json({ error: 'Integration verification is required before enabling provider routes' });
  }

  const result = await updateDB(currentDb => {
    const index = currentDb.integrations.findIndex(item => item.id === integrationId);
    if (index === -1) return null;

    const nextStatus = currentDb.integrations[index].status === 'connected' ? 'disconnected' : 'connected';
    currentDb.integrations[index].status = nextStatus;
    const timestamp = new Date().toLocaleTimeString();
    const actionText = nextStatus === 'connected' ? 'Connected & Webhooks Subscribed' : 'Disconnected & Sync suspended';
    currentDb.syncLogs.unshift(`[${timestamp}] ${currentDb.integrations[index].name} status updated: ${actionText}`);
    return { integrations: currentDb.integrations, syncLogs: currentDb.syncLogs };
  });

  if (result) return res.json(result);
  return res.status(404).json({ error: 'Integration not found' });
});

app.use((error, req, res, next) => {
  console.error(`[${req.method} ${req.originalUrl}]`, error.message);
  if (res.headersSent) return next(error);
  if (error.message === 'Origin is not allowed by CORS') {
    return res.status(403).json({ error: 'Origin is not allowed' });
  }
  if (error.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Request body is too large' });
  }
  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Request body must be valid JSON' });
  }
  if (error.message === 'Database is unavailable') {
    return res.status(503).json({ error: 'Database is unavailable' });
  }
  if (error.message === 'PostgreSQL chat import is incomplete') {
    return res.status(503).json({ error: 'PostgreSQL chat import is incomplete' });
  }
  return res.status(error.status || 500).json({ error: 'Internal server error' });
});

export function startServer(port = PORT) {
  const server = app.listen(port, '127.0.0.1', () => {
    console.log(`Server is running on port ${server.address().port}`);
  });
  if (chatRouteGate.mode === 'postgres') {
    server.once('close', () => {
      void chatRouteGate.close();
    });
  }
  return server;
}

if (process.env.NODE_ENV !== 'test' && process.env.ZOK_NO_LISTEN !== 'true') {
  startServer();
}

export { app };