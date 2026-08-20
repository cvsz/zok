import { withRequestTransaction } from '../request-transaction.js';
import { createConversationsRepository } from './conversations-repository.js';

const SENDERS = new Set(['agent', 'customer', 'bot', 'system']);

function parseLegacyChatId(value) {
  if (!/^\d+$/.test(String(value))) return null;
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function normalizeMessageInput(input = {}) {
  const body = typeof input.text === 'string' ? input.text.trim() : '';
  if (!body) throw new TypeError('Message text is required');
  if (body.length > 4000) throw new TypeError('Message text exceeds 4000 characters');
  const sender = input.sender || 'agent';
  if (typeof sender !== 'string' || !SENDERS.has(sender)) {
    throw new TypeError('Invalid sender');
  }
  return {
    direction: sender === 'customer' ? 'inbound' : 'outbound',
    senderType: sender === 'bot' ? 'ai' : sender,
    body,
  };
}

export function createLegacyChatRuntime({ storage } = {}) {
  if (!storage || typeof storage.withIdentityTransaction !== 'function') {
    throw new TypeError('PostgreSQL storage is required');
  }

  async function read(request, legacyChatId) {
    const parsedId = parseLegacyChatId(legacyChatId);
    if (parsedId === null) throw new TypeError('Legacy chat id must be a positive integer');
    const externalThreadId = `legacy-chat:${parsedId}`;

    return withRequestTransaction(storage, request, async tx => {
      const conversations = createConversationsRepository(tx);
      const conversation = await conversations.findByExternalThreadId(externalThreadId);
      if (!conversation) return null;
      const messages = await conversations.listMessages(conversation.id);
      return { conversation, messages };
    });
  }

  async function writeMessage(request, legacyChatId, input = {}) {
    const parsedId = parseLegacyChatId(legacyChatId);
    if (parsedId === null) throw new TypeError('Legacy chat id must be a positive integer');
    const messageInput = normalizeMessageInput(input);
    const externalThreadId = `legacy-chat:${parsedId}`;

    return withRequestTransaction(storage, request, async tx => {
      const conversations = createConversationsRepository(tx);
      const conversation = await conversations.findByExternalThreadId(externalThreadId);
      if (!conversation) return null;
      return conversations.addMessage(conversation.id, messageInput);
    });
  }

  return Object.freeze({ read, writeMessage });
}
