const { createHash, timingSafeEqual, randomUUID } = require('node:crypto');

const commit = `
 local old = redis.call('GET', KEYS[1])
 local revision = old and cjson.decode(old).revision or ''
 if revision ~= ARGV[1] then return 0 end
 redis.call('SET', KEYS[1], ARGV[2])
 return 1
`;

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
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  const password = process.env.AGENDA_CLAVE;
  if (!url || !token || !password) return res.status(503).end();
  const digest = s => createHash('sha256').update(s).digest();
  if (!timingSafeEqual(digest(req.headers.authorization || ''), digest('Bearer ' + password))) return res.status(401).end();
  const key = 'organizacion-lara:agenda:v1';
  try {
    let command;
    let snapshot;
    if (req.method === 'GET') command = ['GET', key];
    else if (req.method === 'PUT') {
      const { revision, agenda } = req.body || {};
      if (typeof revision !== 'string' || !validAgenda(agenda)) return res.status(400).end();
      snapshot = { revision: randomUUID(), agenda };
      const encoded = JSON.stringify(snapshot);
      if (Buffer.byteLength(encoded) > 900000) return res.status(413).end();
      command = ['EVAL', commit, 1, key, revision, encoded];
    } else return res.status(405).end();
    const response = await fetch(url, {method:'POST', headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify(command)});
    const result = await response.json();
    if (!response.ok || result.error) return res.status(503).end();
    if (req.method === 'GET') return res.status(200).json(result.result ? JSON.parse(result.result) : {revision:'',agenda:null});
    if (!result.result) return res.status(409).end();
    return res.status(200).json({revision:snapshot.revision});
  } catch { return res.status(503).end(); }
};
