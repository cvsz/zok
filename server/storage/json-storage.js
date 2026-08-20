import fs from 'node:fs/promises';
import path from 'node:path';
import { randomBytes } from 'node:crypto';

function postgresOwnsChatActivityMetadata() {
  return (process.env.ZOK_CHAT_STORAGE || '').trim().toLowerCase() === 'postgres';
}

function snapshotChatActivityMetadata(database) {
  if (!postgresOwnsChatActivityMetadata() || !Array.isArray(database?.chats)) return null;
  return new Map(database.chats.map(chat => [
    chat.id,
    {
      hasUnread: Object.prototype.hasOwnProperty.call(chat, 'unread'),
      unread: chat.unread,
      hasTime: Object.prototype.hasOwnProperty.call(chat, 'time'),
      time: chat.time,
    },
  ]));
}

function restoreChatActivityMetadata(database, snapshot) {
  if (!snapshot || !Array.isArray(database?.chats)) return;
  for (const chat of database.chats) {
    const previous = snapshot.get(chat.id);
    if (!previous) continue;
    if (previous.hasUnread) chat.unread = previous.unread;
    else delete chat.unread;
    if (previous.hasTime) chat.time = previous.time;
    else delete chat.time;
  }
}

export function createJsonStorage({ filePath, defaultData, validate }) {
  if (!filePath || typeof filePath !== 'string') {
    throw new TypeError('filePath is required');
  }
  if (typeof validate !== 'function') {
    throw new TypeError('validate must be a function');
  }

  let readyPromise;
  let mutationQueue = Promise.resolve();

  async function atomicWrite(data) {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    const temporaryFile = `${filePath}.${process.pid}.${randomBytes(8).toString('hex')}.tmp`;
    let renamed = false;

    try {
      await fs.writeFile(temporaryFile, JSON.stringify(data, null, 2), {
        encoding: 'utf8',
        mode: 0o600,
      });
      await fs.rename(temporaryFile, filePath);
      renamed = true;
    } finally {
      if (!renamed) {
        await fs.rm(temporaryFile, { force: true }).catch(() => undefined);
      }
    }
  }

  async function ensureReady() {
    if (!readyPromise) {
      readyPromise = (async () => {
        try {
          await fs.access(filePath);
        } catch (error) {
          if (error.code !== 'ENOENT') throw error;
          await atomicWrite(structuredClone(defaultData));
        }
      })();
    }
    return readyPromise;
  }

  async function read() {
    await ensureReady();
    const raw = await fs.readFile(filePath, 'utf8');
    try {
      return validate(JSON.parse(raw));
    } catch (error) {
      console.error('Database state is invalid; refusing to overwrite it:', error.message);
      throw new Error('Database is unavailable');
    }
  }

  function update(mutator) {
    if (typeof mutator !== 'function') {
      return Promise.reject(new TypeError('mutator must be a function'));
    }

    const operation = mutationQueue.then(async () => {
      const database = await read();
      const protectedChatActivity = snapshotChatActivityMetadata(database);
      const result = await mutator(database);
      restoreChatActivityMetadata(database, protectedChatActivity);
      await atomicWrite(database);
      return result;
    });

    mutationQueue = operation.catch(() => undefined);
    return operation;
  }

  return Object.freeze({ read, update });
}