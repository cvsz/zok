const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function createPostgresStorage({ pool } = {}) {
  if (!pool || typeof pool.connect !== 'function' || typeof pool.end !== 'function') {
    throw new TypeError('pool with connect() and end() is required');
  }

  let closed = false;

  async function withTenantTransaction(tenantId, operation) {
    if (typeof tenantId !== 'string' || !UUID_PATTERN.test(tenantId)) {
      throw new TypeError('tenantId is required and must be a UUID');
    }
    if (typeof operation !== 'function') {
      throw new TypeError('operation must be a function');
    }
    if (closed) throw new Error('PostgreSQL storage is closed');

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query("SELECT set_config('app.tenant_id', $1, true)", [tenantId]);
      const result = await operation(Object.freeze({
        query(text, values) {
          return client.query(text, values);
        },
      }));
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK').catch(() => undefined);
      throw error;
    } finally {
      client.release();
    }
  }

  async function close() {
    if (closed) return;
    closed = true;
    await pool.end();
  }

  return Object.freeze({ withTenantTransaction, close });
}
