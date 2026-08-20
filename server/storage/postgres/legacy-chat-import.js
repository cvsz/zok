import { isDeepStrictEqual } from 'node:util';
import { createContactsRepository } from './contacts-repository.js';
import { createConversationsRepository } from './conversations-repository.js';
import { mapLegacyChatToNormalized } from './legacy-chat-mapping.js';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function sameJson(left, right) {
  return isDeepStrictEqual(left ?? {}, right ?? {});
}

function prepareChats(chats) {
  if (!Array.isArray(chats)) throw new TypeError('Legacy chats must be an array');

  const seenThreads = new Set();
  const seenMessages = new Set();
  return chats.map(chat => {
    const mapped = mapLegacyChatToNormalized(chat);
    const threadId = mapped.conversation.externalThreadId;
    if (seenThreads.has(threadId)) {
      throw new TypeError(`Duplicate legacy chat external id: ${threadId}`);
    }
    seenThreads.add(threadId);

    for (const message of mapped.messages) {
      if (seenMessages.has(message.externalMessageId)) {
        throw new TypeError(`Duplicate legacy message external id: ${message.externalMessageId}`);
      }
      seenMessages.add(message.externalMessageId);
    }
    return mapped;
  });
}

function buildSummary(mappedChats) {
  return {
    chats: mappedChats.length,
    messages: mappedChats.reduce((total, chat) => total + chat.messages.length, 0),
    contactsCreated: 0,
    contactsReused: 0,
    conversationsCreated: 0,
    conversationsReused: 0,
    messagesCreated: 0,
    messagesReused: 0,
  };
}

async function findContactByExternalId(tx, externalId) {
  const result = await tx.query(`
    SELECT id, name, email, phone, external_id AS "externalId", metadata
    FROM contacts
    WHERE external_id = $1
    ORDER BY id ASC
    LIMIT 2
  `, [externalId]);
  if (result.rows.length > 1) {
    throw new Error(`Ambiguous existing contact for ${externalId}`);
  }
  return result.rows[0] || null;
}

function assertExistingContactMatches(existing, expected) {
  if (
    existing.name !== expected.name ||
    (existing.email || null) !== (expected.email || null) ||
    (existing.phone || null) !== (expected.phone || null) ||
    !sameJson(existing.metadata, expected.metadata)
  ) {
    throw new Error(`Existing contact conflicts with import source for ${expected.externalId}`);
  }
}

function assertExistingConversationMatches(existing, expected, contactId) {
  if (existing.contactId !== contactId || existing.channel !== expected.channel) {
    throw new Error(`Existing conversation conflicts with import source for ${expected.externalThreadId}`);
  }
}

function assertExistingMessageMatches(existing, expected) {
  if (
    existing.direction !== expected.direction ||
    existing.senderType !== expected.senderType ||
    existing.body !== expected.body ||
    !sameJson(existing.metadata, expected.metadata)
  ) {
    throw new Error(`Existing message conflicts with import source for ${expected.externalMessageId}`);
  }
}

export async function importLegacyChats({ chats, tenantId, storage, dryRun = false } = {}) {
  if (typeof tenantId !== 'string' || !UUID_PATTERN.test(tenantId)) {
    throw new TypeError('tenantId is required and must be a UUID');
  }
  const mappedChats = prepareChats(chats);
  const summary = buildSummary(mappedChats);

  if (dryRun) {
    return Object.freeze({ ...summary, dryRun: true });
  }
  if (!storage || typeof storage.withTenantTransaction !== 'function') {
    throw new TypeError('PostgreSQL storage with withTenantTransaction() is required');
  }

  await storage.withTenantTransaction(tenantId, async tx => {
    const contacts = createContactsRepository(tx);
    const conversations = createConversationsRepository(tx);

    for (const mapped of mappedChats) {
      let contact = await findContactByExternalId(tx, mapped.contact.externalId);
      if (contact) {
        assertExistingContactMatches(contact, mapped.contact);
        summary.contactsReused += 1;
      } else {
        contact = await contacts.create(mapped.contact);
        summary.contactsCreated += 1;
      }

      let conversation = await conversations.findByExternalThreadId(mapped.conversation.externalThreadId);
      if (conversation) {
        assertExistingConversationMatches(conversation, mapped.conversation, contact.id);
        summary.conversationsReused += 1;
      } else {
        conversation = await conversations.create({
          contactId: contact.id,
          channel: mapped.conversation.channel,
          externalThreadId: mapped.conversation.externalThreadId,
        });
        summary.conversationsCreated += 1;
      }

      const existingMessages = await conversations.listMessages(conversation.id);
      const byExternalId = new Map();
      for (const existing of existingMessages) {
        if (!existing.externalMessageId) continue;
        if (byExternalId.has(existing.externalMessageId)) {
          throw new Error(`Ambiguous existing message for ${existing.externalMessageId}`);
        }
        byExternalId.set(existing.externalMessageId, existing);
      }

      for (const message of mapped.messages) {
        const existing = byExternalId.get(message.externalMessageId);
        if (existing) {
          assertExistingMessageMatches(existing, message);
          summary.messagesReused += 1;
          continue;
        }
        await conversations.addMessage(conversation.id, message);
        summary.messagesCreated += 1;
      }
    }
  });

  return Object.freeze({ ...summary, dryRun: false });
}
