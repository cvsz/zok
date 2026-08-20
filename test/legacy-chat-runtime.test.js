import test from 'node:test';
import assert from 'node:assert/strict';
import { createLegacyChatRuntime } from '../server/storage/postgres/legacy-chat-runtime.js';

const tenantId = 'bbbbbbbb-2222-4222-8222-bbbbbbbbbbbb';
const contactId = 'cccccccc-3333-4333-8333-cccccccccccc';
const conversationId = 'dddddddd-4444-4444-8444-dddddddddddd';

function createStorageFixture({ found = true } = {}) {
  const calls = [];
  const storage = {
    async withIdentityTransaction(identity, operation) {
      calls.push({ kind: 'identity', identity });
      return operation({
        tenantId: identity.tenantId,
        async query(text, values = []) {
          calls.push({ kind: 'query', text, values });
          if (/FROM conversations c\s+WHERE c\.external_thread_id = \$1/i.test(text)) {
            return {
              rows: found
                ? [{ id: conversationId, contactId, channel: 'line', externalThreadId: values[0], status: 'open' }]
                : [],
            };
          }
          if (/FROM contacts/i.test(text) && /WHERE id = \$1/i.test(text)) {
            return { rows: [{ id: contactId, metadata: { legacyChatId: 7, tags: [], unread: 0, displayTime: null } }] };
          }
          if (/UPDATE contacts/i.test(text) && /SET metadata = \$2::jsonb/i.test(text)) {
            return { rows: [{ id: contactId, metadata: JSON.parse(values[1]) }] };
          }
          if (/FROM messages m/i.test(text)) {
            return { rows: [{ id: 'eeeeeeee-5555-4555-8555-eeeeeeeeeeee', conversationId, direction: 'inbound', senderType: 'customer', body: 'hello' }] };
          }
          if (/INSERT INTO messages/i.test(text)) {
            return { rows: [{ id: 'ffffffff-6666-4666-8666-ffffffffffff', conversationId, direction: values[2], senderType: values[3], body: values[4] }] };
          }
          return { rows: [] };
        },
      });
    },
  };
  return { storage, calls };
}

test('legacy chat runtime binds authenticated tenant for bounded read and write', async () => {
  const { storage, calls } = createStorageFixture();
  const runtime = createLegacyChatRuntime({ storage });
  const request = { user: { tenantId, email: 'admin@example.test', role: 'owner' } };

  const readResult = await runtime.read(request, 7);
  assert.equal(readResult.conversation.externalThreadId, 'legacy-chat:7');
  assert.equal(readResult.messages[0].body, 'hello');
  assert.equal(readResult.metadata.unread, 0);

  const written = await runtime.writeMessage(request, 7, { sender: 'bot', text: '  bounded reply  ' });
  assert.equal(written.direction, 'outbound');
  assert.equal(written.senderType, 'ai');
  assert.equal(written.body, 'bounded reply');

  const metadataWrite = calls.find(call => call.kind === 'query' && /UPDATE contacts/i.test(call.text));
  assert.ok(metadataWrite);
  assert.deepEqual(JSON.parse(metadataWrite.values[1]), {
    legacyChatId: 7,
    tags: [],
    unread: 0,
    displayTime: 'Just now',
  });

  assert.equal(calls.filter(call => call.kind === 'identity').length, 2);
  assert.ok(calls.filter(call => call.kind === 'identity').every(call => call.identity.tenantId === tenantId));
  assert.ok(calls.some(call => call.kind === 'query' && call.values[0] === 'legacy-chat:7'));
});

test('legacy chat runtime applies active and inactive inbound unread semantics in PostgreSQL metadata', async () => {
  const activeFixture = createStorageFixture();
  const activeRuntime = createLegacyChatRuntime({ storage: activeFixture.storage });
  await activeRuntime.writeMessage(
    { user: { tenantId }, body: { activeChatId: 7 } },
    7,
    { sender: 'customer', text: 'active reply' },
  );
  const activeMetadataWrite = activeFixture.calls.find(call => call.kind === 'query' && /UPDATE contacts/i.test(call.text));
  assert.equal(JSON.parse(activeMetadataWrite.values[1]).unread, 0);
  assert.equal(JSON.parse(activeMetadataWrite.values[1]).displayTime, 'Just now');

  const inactiveFixture = createStorageFixture();
  const inactiveRuntime = createLegacyChatRuntime({ storage: inactiveFixture.storage });
  await inactiveRuntime.writeMessage(
    { user: { tenantId }, body: { activeChatId: 8 } },
    7,
    { sender: 'customer', text: 'inactive reply' },
  );
  const inactiveMetadataWrite = inactiveFixture.calls.find(call => call.kind === 'query' && /UPDATE contacts/i.test(call.text));
  assert.equal(JSON.parse(inactiveMetadataWrite.values[1]).unread, 1);
  assert.equal(JSON.parse(inactiveMetadataWrite.values[1]).displayTime, 'Just now');
});

test('legacy chat runtime fails closed for missing tenant identity and invalid input', async () => {
  const { storage, calls } = createStorageFixture();
  const runtime = createLegacyChatRuntime({ storage });

  await assert.rejects(() => runtime.read({ user: {} }, 1), /authenticated tenant identity is required/i);
  await assert.rejects(() => runtime.read({ user: { tenantId } }, 0), /positive integer/i);
  await assert.rejects(() => runtime.writeMessage({ user: { tenantId } }, 1, { text: '   ' }), /message text is required/i);
  await assert.rejects(() => runtime.writeMessage({ user: { tenantId } }, 1, { sender: 'hacker', text: 'x' }), /invalid sender/i);
  await assert.rejects(
    () => runtime.writeMessage({ user: { tenantId }, body: { activeChatId: 0 } }, 1, { text: 'hello' }),
    /activeChatId must be a positive integer/i,
  );
  assert.equal(calls.length, 0);
});

test('legacy chat runtime returns null when legacy thread is not imported', async () => {
  const { storage } = createStorageFixture({ found: false });
  const runtime = createLegacyChatRuntime({ storage });
  const request = { user: { tenantId } };

  assert.equal(await runtime.read(request, 99), null);
  assert.equal(await runtime.writeMessage(request, 99, { text: 'hello' }), null);
  assert.equal(await runtime.markRead(request, 99), null);
  assert.equal(await runtime.replaceTags(request, 99, ['VIP']), null);
});