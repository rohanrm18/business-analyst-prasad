/* Canonical inventory ledger migration (pure functions, no storage access).
   Converts the two legacy ledgers into one list of signed entries:
   - garment ledger (style + colour + size, pa_garment_stock_ledger_v1)
   - material ledger (typed item name + unit, pa_stock_moves_v1)
   Rules: nothing is dropped silently (bad rows go to `rejected`), nothing is guessed
   (missing colour/size stays empty), and entry ids are deterministic so running the
   migration again never creates a second copy of the same legacy row. */
(function (root) {
  'use strict';

  const GARMENT_OUT = new Set(['Dispatch / sale issue', 'Stock adjustment out']);
  const GARMENT_IN = new Set(['Opening balance', 'Production receipt', 'Purchase inward', 'Stock adjustment in']);

  const clean = v => String(v == null ? '' : v).trim();
  const lower = v => clean(v).toLowerCase();

  function hash(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return (h >>> 0).toString(36);
  }

  /* Same legacy row content gets the same id; identical rows get an occurrence number. */
  function makeIds(rows, ledger, fingerprint) {
    const seen = new Map();
    return rows.map(row => {
      if (row && row.id != null && clean(row.id) !== '') return ledger + ':' + clean(row.id);
      const fp = fingerprint(row);
      const n = (seen.get(fp) || 0) + 1;
      seen.set(fp, n);
      return ledger + ':h' + hash(fp) + '#' + n;
    });
  }

  function garmentEntry(m, id) {
    const style = clean(m.style), qty = Number(m.qty);
    if (!style) return { error: 'missing style' };
    if (!Number.isFinite(qty) || qty <= 0) return { error: 'quantity must be a positive number' };
    let delta, bucket = 'saleable';
    if (GARMENT_OUT.has(m.type)) delta = -qty;
    else if (m.type === 'Customer return') { delta = qty; bucket = m.status === 'released' ? 'saleable' : 'quarantine'; }
    else if (GARMENT_IN.has(m.type)) delta = qty;
    else return { error: 'unknown movement type: ' + clean(m.type) };
    return {
      entry: {
        id, domain: 'garment', style, colour: clean(m.colour), size: clean(m.size),
        bucket, delta, unit: 'Pcs', date: clean(m.date), ref: clean(m.reference || m.ref),
        source: { ledger: 'garment', legacyType: m.type }
      }
    };
  }

  function materialEntry(m, id) {
    const item = clean(m.item), unit = clean(m.unit), qty = Number(m.qty);
    if (!item) return { error: 'missing item' };
    if (!unit) return { error: 'missing unit' };
    if (!Number.isFinite(qty) || qty <= 0) return { error: 'quantity must be a positive number' };
    if (m.direction !== 'IN' && m.direction !== 'OUT') return { error: 'direction must be IN or OUT' };
    return {
      entry: {
        id, domain: 'material', item, itemKey: lower(item), unit, bucket: 'saleable',
        delta: m.direction === 'IN' ? qty : -qty, date: clean(m.date), ref: clean(m.reference),
        source: { ledger: 'material', legacyPurpose: clean(m.purpose) }
      }
    };
  }

  /* existing: entries already migrated earlier. Their ids are kept; only new legacy rows are added. */
  function migrate(input) {
    const garment = Array.isArray(input && input.garmentMoves) ? input.garmentMoves : [];
    const material = Array.isArray(input && input.materialMoves) ? input.materialMoves : [];
    const existing = Array.isArray(input && input.existing) ? input.existing : [];
    const have = new Set(existing.map(e => e.id));
    const entries = existing.slice(), rejected = [];
    let added = 0, skipped = 0;

    const gIds = makeIds(garment, 'garment', m => [m.style, m.colour, m.size, m.type, m.qty, m.date, m.reference, m.status].map(clean).join('|'));
    const mIds = makeIds(material, 'material', m => [m.item, m.unit, m.direction, m.qty, m.date, m.reference, m.purpose].map(clean).join('|'));

    garment.forEach((m, i) => take(garmentEntry(m || {}, gIds[i]), 'garment', i, m, gIds[i]));
    material.forEach((m, i) => take(materialEntry(m || {}, mIds[i]), 'material', i, m, mIds[i]));

    function take(res, ledger, index, row, id) {
      if (res.error) { rejected.push({ ledger, index, reason: res.error, row }); return; }
      if (have.has(id)) { skipped++; return; }
      have.add(id); entries.push(res.entry); added++;
    }
    return { entries, rejected, added, skipped };
  }

  /* Balances from canonical entries. Garment: one row per style/colour/size. Material: per item (case-insensitive) and unit. */
  function balances(entries) {
    const garment = new Map(), material = new Map();
    (entries || []).forEach(e => {
      if (e.domain === 'garment') {
        const k = [e.style, e.colour, e.size].join('¦');
        if (!garment.has(k)) garment.set(k, { style: e.style, colour: e.colour, size: e.size, available: 0, quarantined: 0 });
        garment.get(k)[e.bucket === 'quarantine' ? 'quarantined' : 'available'] += e.delta;
      } else if (e.domain === 'material') {
        const k = e.itemKey + '¦' + e.unit;
        if (!material.has(k)) material.set(k, { item: e.item, itemKey: e.itemKey, unit: e.unit, balance: 0 });
        material.get(k).balance += e.delta;
      }
    });
    return { garment: [...garment.values()], material: [...material.values()] };
  }

  const api = { migrate, balances };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.prasadInventoryMigration = api;
})(typeof window !== 'undefined' ? window : globalThis);
