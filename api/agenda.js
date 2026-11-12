const { createHash, timingSafeEqual } = require('node:crypto');
const { get, put, BlobPreconditionFailedError } = require('@vercel/blob');
const path = 'agenda/datos.json';

function validAgenda(a) {
  const subject = n => Number.isInteger(n) && n >= 0 && n < 8;
  const string = v => typeof v === 'string';
  return a && Array.isArray(a.colors) && a.colors.length === 8 &&
    a.colors.every(c => /^#[0-9a-f]{6}$/i.test(c)) &&
    Array.isArray(a.order) && a.order.length === 8 && new Set(a.order).size === 8 &&
    a.order.every(subject) && Array.isArray(a.events) && Array.isArray(a.grades) && Array.isArray(a.tasks) &&
    a.events.every(e => e && subject(e.s) && string(e.title) && string(e.day) &&
      Number.isInteger(e.type) && e.type >= 0 && e.type <= 3 && (!e.customType || string(e.customType))) &&
    a.grades.every(g => g && subject(g.s) && string(g.label) && Number.isFinite(g.weight) &&
      g.weight > 0 && g.weight <= 100 && Number.isFinite(g.score) && g.score >= 0 && g.score <= 10) &&
    a.tasks.every(t => t && subject(t.s) && Number.isSafeInteger(t.id) && string(t.title) && typeof t.done === 'boolean') &&
    Object.keys(a).every(k => ['colors','order','events','grades','tasks'].includes(k));
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'private, no-store');
  const password = process.env.AGENDA_CLAVE;
  if (!password || !process.env.BLOB_READ_WRITE_TOKEN) return res.status(503).end();
  const digest = value => createHash('sha256').update(value).digest();
  if (!timingSafeEqual(digest(req.headers.authorization || ''), digest('Bearer ' + password))) return res.status(401).end();
  try {
    if (req.method === 'GET') {
      const file = await get(path, { access: 'private', useCache: false });
      if (!file) return res.status(200).json({revision: '', agenda: null});
      return res.status(200).json({revision: file.blob.etag, agenda: await new Response(file.stream).json()});
    }
    if (req.method !== 'PUT') return res.status(405).end();
    const { revision, agenda } = req.body || {};
    if (typeof revision !== 'string' || !validAgenda(agenda)) return res.status(400).end();
    const data = JSON.stringify(agenda);
    if (Buffer.byteLength(data) > 900000) return res.status(413).end();
    const file = await put(path, data, {
      access: 'private', contentType: 'application/json', addRandomSuffix: false,
      allowOverwrite: Boolean(revision), ...(revision && {ifMatch: revision})
    });
    return res.status(200).json({revision: file.etag});
  } catch (error) {
    if (error instanceof BlobPreconditionFailedError || /already exists/i.test(error.message)) return res.status(409).end();
    return res.status(503).end();
  }
};
