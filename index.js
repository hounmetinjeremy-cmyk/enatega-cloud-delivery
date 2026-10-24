const CORS = { 'access-control-allow-origin': '*', 'access-control-allow-headers': 'content-type,x-admin-token', 'access-control-allow-methods': 'GET,POST,PATCH,DELETE,OPTIONS' };
const json = (o, s) => new Response(JSON.stringify(o, null, 1), { status: s || 200, headers: Object.assign({ 'content-type': 'application/json;charset=utf-8' }, CORS) });
const fail = (m, s) => json({ error: m }, s || 400);
const HTML = (s) => new Response(s, { headers: { 'content-type': 'text/html;charset=utf-8' } });
const STATUSES = ['pending', 'accepted', 'preparing', 'picked_up', 'delivered', 'cancelled'];
const FEE = 500;
const SEED_JSON = JSON.stringify({
  seq: 1003,
  vendors: [
    { id: 'v1', name: 'Pizza Napoli', category: 'Pizzeria', city: 'Cotonou', open: true, rating: 4.6, products: [{ id: 'p101', name: 'Margherita', price: 4500 }, { id: 'p102', name: 'Reine', price: 5500 }] },
    { id: 'v2', name: 'Burger House', category: 'Fast-food', city: 'Cotonou', open: true, rating: 4.2, products: [{ id: 'p201', name: 'Cheese Burger', price: 3500 }, { id: 'p202', name: 'Frites', price: 1200 }] },
    { id: 'v3', name: 'Chez Maman', category: 'Africain', city: 'Porto-Novo', open: false, rating: 4.8, products: [{ id: 'p301', name: 'Poulet braise', price: 5000 }, { id: 'p302', name: 'Riz sauce', price: 2500 }] }
  ],
  riders: [
    { id: 'r1', name: 'Koffi', phone: '+22990000001', status: 'available' },
    { id: 'r2', name: 'Awa', phone: '+22990000002', status: 'busy' }
  ],
  orders: []
});
const MEM = JSON.parse(SEED_JSON);

async function load(env) {
  if (!env.STATE) return { d: MEM, kv: null };
  const raw = await env.STATE.get('db');
  return { d: raw ? JSON.parse(raw) : JSON.parse(SEED_JSON), kv: env.STATE };
}
const save = async (s) => { if (s.kv) await s.kv.put('db', JSON.stringify(s.d)); };
const isAdmin = (req, env) => !!(env.ADMIN_TOKEN && req.headers.get('x-admin-token') === env.ADMIN_TOKEN);

const PAGE = [
  '<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Enatega Cloud Delivery</title>',
  '<style>body{font-family:system-ui,sans-serif;margin:0;background:#0f172a;color:#e2e8f0}header{padding:16px;background:#1e293b}main{padding:16px;display:grid;gap:14px;max-width:960px}.card{background:#1e293b;padding:14px;border-radius:10px}h1{margin:0;font-size:20px}h2{font-size:15px;margin:0 0 8px}input,select,button{font:inherit;padding:6px;border-radius:6px;border:1px solid #475569;background:#0f172a;color:#e2e8f0}button{background:#38bdf8;color:#082f49;border:0;cursor:pointer;font-weight:600}ul{padding-left:18px;margin:0;font-size:14px}li{margin:3px 0}</style></head><body>',
  '<header><h1>Enatega Cloud Delivery</h1><small id="stat">chargement...</small></header><main>',
  '<div class="card"><h2>Vendeurs</h2><ul id="vendors"></ul></div>',
  '<div class="card"><h2>Commander</h2><select id="v"></select> <input id="pid" placeholder="produit (p101)" size="12"> <input id="qty" type="number" min="1" value="1" style="width:64px"> <input id="name" placeholder="nom"> <input id="phone" placeholder="telephone"> <input id="adr" placeholder="adresse"> <button onclick="order()">Commander</button><p id="msg"></p></div>',
  '<div class="card"><h2>Commandes</h2><ul id="orders"></ul></div>',
  '<script>var $=function(i){return document.getElementById(i)};function j(u,o){return fetch(u,o).then(function(r){return r.json()})}',
  'function refresh(){j("/api/vendors").then(function(v){var h="";v.vendors.forEach(function(x){h+="<li>"+(x.open?"OUVERT":"FERME")+" <b>"+x.name+"</b> - "+x.category+", "+x.city+" : "+x.products.map(function(p){return p.id+" "+p.name+" "+p.price+"F"}).join(" / ")+"</li>"});$("vendors").innerHTML=h;var o="";v.vendors.forEach(function(x){o+="<option value="+x.id+">"+x.name+"</option>"});$("v").innerHTML=o;j("/api/orders").then(function(r){var l="";if(!r.orders.length){l="<li>aucune</li>"}r.orders.forEach(function(x){l+="<li>"+x.id+" - "+x.vendorName+" - "+x.total+"F - "+x.status+(x.riderId?" - "+x.riderId:"")+"</li>"});$("orders").innerHTML=l;$("stat").textContent=v.count+" vendeurs / "+r.total+" commandes"})})}',
  'function order(){var b={vendorId:$("v").value,items:[{productId:$("pid").value||"p101",qty:+$("qty").value||1}],customer:{name:$("name").value||"Client",phone:$("phone").value||"+22900000000",address:$("adr").value||"Cotonou"}};j("/api/orders",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(b)}).then(function(r){$("msg").textContent=r.error?"Erreur: "+r.error:"Commande "+r.id+" creee, total "+r.total+"F";refresh()})}',
  'refresh();</script></main></body></html>'
].join('');

async function api(req, env) {
  const url = new URL(req.url);
  const p = url.pathname.replace(/\/+$/, '') || '/';
  const m = req.method;
  const s = await load(env);
  const d = s.d, vendors = d.vendors, orders = d.orders, riders = d.riders;
  const vfind = (id) => vendors.filter((v) => v.id === id)[0];
  const ofind = (id) => orders.filter((o) => o.id === id)[0];

  if (p === '/') return HTML(PAGE);
  if (p === '/api/health') return json({ ok: true, ts: Date.now(), kv: !!s.kv, statuses: STATUSES });
  if (p === '/api/vendors' && m === 'GET') {
    const city = url.searchParams.get('city');
    const list = city ? vendors.filter((v) => v.city === city) : vendors;
    return json({ count: list.length, vendors: list });
  }
  let mm = p.match(/^\/api\/vendors\/([^/]+)$/);
  if (mm && m === 'GET') { const v = vfind(mm[1]); return v ? json(v) : fail('vendor introuvable', 404); }
  mm = p.match(/^\/api\/vendors\/([^/]+)\/products$/);
  if (mm && m === 'GET') { const v = vfind(mm[1]); return v ? json({ vendorId: v.id, products: v.products }) : fail('vendor introuvable', 404); }
  if (p === '/api/orders' && m === 'POST') {
    const b = await req.json().catch(() => null);
    if (!b || !b.vendorId || !Array.isArray(b.items) || !b.items.length) return fail('vendorId et items requis');
    const c = b.customer || {};
    if (!c.name || !c.phone || !c.address) return fail('customer.name, customer.phone et customer.address requis');
    const v = vfind(b.vendorId);
    if (!v) return fail('vendor introuvable', 404);
    if (!v.open) return fail('vendor ferme', 409);
    let total = 0;
    const items = [];
    for (const it of b.items) {
      const pr = v.products.filter((x) => x.id === it.productId)[0];
      if (!pr) return fail('produit inconnu: ' + it.productId, 404);
      const qty = Math.max(1, parseInt(it.qty || 1, 10) || 1);
      total += pr.price * qty;
      items.push({ productId: pr.id, name: pr.name, price: pr.price, qty: qty });
    }
    const order = { id: 'ORD-' + (d.seq++), vendorId: v.id, vendorName: v.name, items: items, subtotal: total, deliveryFee: FEE, total: total + FEE, status: 'pending', riderId: null, customer: { name: c.name, phone: c.phone, address: c.address }, createdAt: new Date().toISOString() };
    orders.push(order);
    await save(s);
    return json(order, 201);
  }
  if (p === '/api/orders' && m === 'GET') {
    let list = orders.slice();
    const st = url.searchParams.get('status'), vid = url.searchParams.get('vendorId'), rid = url.searchParams.get('riderId');
    if (st) list = list.filter((o) => o.status === st);
    if (vid) list = list.filter((o) => o.vendorId === vid);
    if (rid) list = list.filter((o) => o.riderId === rid);
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '50', 10) || 50));
    const offset = Math.max(0, parseInt(url.searchParams.get('offset') || '0', 10) || 0);
    const pg = list.slice(offset, offset + limit);
    return json({ total: list.length, limit: limit, offset: offset, count: pg.length, orders: pg });
  }
  mm = p.match(/^\/api\/orders\/([^/]+)$/);
  if (mm) {
    const o = ofind(mm[1]);
    if (!o) return fail('commande introuvable', 404);
    if (m === 'GET') return json(o);
    if (m === 'PATCH') {
      const b = await req.json().catch(() => ({}));
      if (b.status !== undefined) {
        if (STATUSES.indexOf(b.status) < 0) return fail('statut invalide, attendu: ' + STATUSES.join(', '));
        o.status = b.status;
      }
      if (b.riderId !== undefined && b.riderId !== null) {
        const r = riders.filter((x) => x.id === b.riderId)[0];
        if (!r) return fail('livreur introuvable', 404);
        o.riderId = r.id;
        r.status = 'busy';
      }
      if (o.status === 'delivered' && o.riderId) {
        const r = riders.filter((x) => x.id === o.riderId)[0];
        if (r) r.status = 'available';
      }
      o.updatedAt = new Date().toISOString();
      await save(s);
      return json(o);
    }
  }
  if (p === '/api/riders' && m === 'GET') return json({ count: riders.length, riders: riders });
  mm = p.match(/^\/api\/riders\/([^/]+)$/);
  if (mm && m === 'PATCH') {
    const r = riders.filter((x) => x.id === mm[1])[0];
    if (!r) return fail('livreur introuvable', 404);
    const b = await req.json().catch(() => ({}));
    if (b.status !== undefined) {
      if (['available', 'busy', 'offline'].indexOf(b.status) < 0) return fail('statut invalide, attendu: available, busy, offline');
      r.status = b.status;
    }
    await save(s);
    return json(r);
  }
  if (p === '/api/admin/vendors' && m === 'POST') {
    if (!isAdmin(req, env)) return fail('non autorise: header x-admin-token requis', 401);
    const b = await req.json().catch(() => ({}));
    if (!b.name) return fail('name requis');
    const v = { id: 'v' + (vendors.length + 1) + '-' + Date.now().toString(36), name: b.name, category: b.category || 'divers', city: b.city || 'Cotonou', open: b.open !== false, rating: 0, products: [] };
    vendors.push(v);
    await save(s);
    return json(v, 201);
  }
  mm = p.match(/^\/api\/admin\/vendors\/([^/]+)\/products$/);
  if (mm && m === 'POST') {
    if (!isAdmin(req, env)) return fail('non autorise', 401);
    const v = vfind(mm[1]);
    if (!v) return fail('vendor introuvable', 404);
    const b = await req.json().catch(() => ({}));
    if (!b.name || !(b.price > 0)) return fail('name et price (>0) requis');
    const pr = { id: b.id || 'p' + (v.products.length + 1) + '-' + Date.now().toString(36), name: b.name, price: Math.round(b.price) };
    v.products.push(pr);
    await save(s);
    return json(pr, 201);
  }
  mm = p.match(/^\/api\/admin\/vendors\/([^/]+)$/);
  if (mm && m === 'PATCH') {
    if (!isAdmin(req, env)) return fail('non autorise', 401);
    const v = vfind(mm[1]);
    if (!v) return fail('vendor introuvable', 404);
    const b = await req.json().catch(() => ({}));
    if (b.open !== undefined) v.open = !!b.open;
    if (b.name) v.name = b.name;
    if (b.city) v.city = b.city;
    await save(s);
    return json(v);
  }
  if (p === '/api/admin/stats' && m === 'GET') {
    if (!isAdmin(req, env)) return fail('non autorise', 401);
    const byStatus = {};
    for (const st of STATUSES) byStatus[st] = orders.filter((o) => o.status === st).length;
    const revenue = orders.filter((o) => o.status === 'delivered').reduce((a, o) => a + o.total, 0);
    return json({ vendors: vendors.length, orders: orders.length, byStatus: byStatus, riders: riders.length, ridersAvailable: riders.filter((r) => r.status === 'available').length, revenue: revenue, kv: !!s.kv });
  }
  return fail('route inconnue: ' + m + ' ' + p, 404);
}

export default {
  fetch: async (req, env) => {
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
    try { return await api(req, env); }
    catch (e) { return fail('erreur interne: ' + (e && e.message ? e.message : String(e)), 500); }
  }
};
