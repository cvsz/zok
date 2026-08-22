const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const INTEGRATION_STATUSES = new Set(['disconnected', 'connected', 'error', 'disabled']);

export function createIntegrationsRepository(tx) {
  if (
    !tx ||
    typeof tx.query !== 'function' ||
    typeof tx.tenantId !== 'string' ||
    !UUID_PATTERN.test(tx.tenantId)
  ) {
    throw new TypeError('Tenant transaction context is required');
  }

  async function list() {
    const result = await tx.query(`
      SELECT id, provider, external_id AS "externalId", status, config,
        created_at AS "createdAt", updated_at AS "updatedAt"
      FROM integrations
      ORDER BY created_at ASC, id ASC
    `);
    return result.rows;
  }

  async function findByProvider(provider) {
    if (typeof provider !== 'string' || !provider.trim()) {
      throw new TypeError('Valid provider is required');
    }
    const normalizedProvider = provider.trim();
    if (normalizedProvider.length > 120) {
      throw new TypeError('Provider exceeds 120 characters');
    }

    const result = await tx.query(`
      SELECT id, provider, external_id AS "externalId", status, config,
        created_at AS "createdAt", updated_at AS "updatedAt"
      FROM integrations
      WHERE provider = $1
      LIMIT 1
    `, [normalizedProvider]);
    return result.rows[0] || null;
  }

  async function toggleStatus(id) {
    if (typeof id !== 'string' || !id.trim()) {
      throw new TypeError('Valid integration id is required');
    }
    const current = await tx.query(`
      SELECT id, status FROM integrations WHERE id = $1 LIMIT 1
    `, [id]);
    const row = current.rows[0];
    if (!row) return null;

    const nextStatus = row.status === 'connected' ? 'disconnected' : 'connected';
    const result = await tx.query(`
      UPDATE integrations
      SET status = $2, updated_at = now()
      WHERE id = $1
      RETURNING id, provider, external_id AS "externalId", status, config,
        created_at AS "createdAt", updated_at AS "updatedAt"
    `, [id, nextStatus]);
    return result.rows[0];
  }

  return Object.freeze({ list, findByProvider, toggleStatus });
}
