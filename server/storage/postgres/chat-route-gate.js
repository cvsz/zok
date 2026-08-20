import { createPostgresPool, createPostgresStorage } from '../postgres-storage.js';
import { createLegacyChatRuntime } from './legacy-chat-runtime.js';

const MODES = new Set(['json', 'postgres']);

export function createChatRouteGate({ mode = 'json', connectionString } = {}) {
  if (!MODES.has(mode)) {
    throw new TypeError('ZOK_CHAT_STORAGE must be json or postgres');
  }

  if (mode === 'json') {
    return Object.freeze({ mode, runtime: null, close: async () => undefined });
  }

  if (typeof connectionString !== 'string' || !connectionString.trim()) {
    throw new TypeError('PostgreSQL chat storage requires a connection string');
  }

  const pool = createPostgresPool({ connectionString: connectionString.trim() });
  const storage = createPostgresStorage({ pool });
  const runtime = createLegacyChatRuntime({ storage });

  return Object.freeze({
    mode,
    runtime,
    close() {
      return storage.close();
    },
  });
}

function formatMessageTime(message) {
  const legacyTime = message?.metadata?.legacyTime;
  if (typeof legacyTime === 'string' && legacyTime.trim()) return legacyTime.trim();
  if (!message?.sentAt) return '';
  const timestamp = new Date(message.sentAt);
  if (Number.isNaN(timestamp.getTime())) return '';
  return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function overlayPostgresMessages(chat, state) {
  if (!chat || typeof chat !== 'object' || Array.isArray(chat)) {
    throw new TypeError('Legacy chat metadata is required');
  }
  if (!state || !state.conversation || !Array.isArray(state.messages)) {
    throw new TypeError('PostgreSQL chat state is required');
  }

  return {
    ...chat,
    messages: state.messages.map(message => ({
      sender: message.senderType === 'ai' ? 'bot' : message.senderType,
      text: message.body,
      time: formatMessageTime(message),
    })),
  };
}
