// Fetches the ClickUp "Mandate Inventory" list and returns ONLY public property fields.
// The ClickUp token lives in the Netlify environment variable CLICKUP_API_TOKEN (never in the page).
const LIST = process.env.CLICKUP_LIST_ID || '901614857624';
const OK = (process.env.VISIBLE_STATUSES || 'available').toLowerCase().split(',').map(s => s.trim());
// Field IDs verified from your ClickUp list. Edit here if you ever rename/replace a field.
const F = {
  purpose: '468efe37-02a4-47d9-b70b-3738e21b10a0',
  kind: 'c7528c6c-3d64-410a-a802-e86aaa3b255e',
  grade: '2c3903d4-43d9-4629-bc28-38b40ac26035',
  rent: 'c33b796b-a718-4c0c-8871-bd6961a765a3',
  project: 'f0b2a227-9a62-4602-af10-64e9483a0b76',
  size: '963d5fbd-0960-40cf-a911-5eae01608a53',
  bhk: 'd5fdb6d0-1592-440a-b332-d13069c5a980'
};
const dd = f => {
  if (!f || f.value == null || f.value === '') return '';
  const o = (f.type_config && f.type_config.options || []).find(o => o.id === f.value || o.orderindex === f.value);
  return o ? o.name : '';
};
const num = f => { const n = parseFloat(f && f.value); return isFinite(n) ? n : null; };
const out = (code, body, extra = {}) => ({ statusCode: code, headers: { 'Content-Type': 'application/json', ...extra }, body: JSON.stringify(body) });

exports.handler = async () => {
  const token = process.env.CLICKUP_API_TOKEN;
  if (!token) return out(500, { error: 'CLICKUP_API_TOKEN is not set in Netlify environment variables.' });
  try {
    const tasks = new Map();
    for (let p = 0; p < 50; p++) {
      const r = await fetch(`https://api.clickup.com/api/v2/list/${LIST}/task?page=${p}&archived=false&include_closed=false`, { headers: { Authorization: token } });
      if (!r.ok) throw new Error('ClickUp API error ' + r.status);
      const j = await r.json();
      j.tasks.forEach(t => tasks.set(t.id, t));
      if (j.last_page || !j.tasks.length) break;
    }
    const items = [];
    for (const t of tasks.values()) {
      const cf = {};
      (t.custom_fields || []).forEach(f => cf[f.id] = f);
      if (!OK.includes(((t.status && t.status.status) || '').toLowerCase())) continue;
      const missing = Object.entries(F).filter(([k, id]) => !cf[id]).map(e => e[0]);
      if (missing.length) throw new Error('Field mapping missing in ClickUp: ' + missing.join(', '));
      const purpose = dd(cf[F.purpose]).toLowerCase(), grade = num(cf[F.grade]), rent = num(cf[F.rent]);
      const base = {
        project: (cf[F.project].value || '').toString().trim() || t.name,
        kind: dd(cf[F.kind]), bhk: dd(cf[F.bhk]).replace(/^NA$/i, ''), size: num(cf[F.size]) || 0
      };
      if ((purpose === 'sale' || purpose === 'both') && grade > 0) items.push({ ...base, sec: 'sale', price: grade });
      if ((purpose === 'rent' || purpose === 'both') && rent > 0) items.push({ ...base, sec: 'rent', price: rent });
    }
    return out(200, { updated: Date.now(), items }, {
      'Cache-Control': 'public, max-age=60',
      'Netlify-CDN-Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600'
    });
  } catch (e) {
    return out(502, { error: e.message });
  }
};
