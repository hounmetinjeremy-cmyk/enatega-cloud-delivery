const CORS = { 'access-control-allow-origin': '*', 'access-control-allow-headers': 'content-type,x-admin-token', 'access-control-allow-methods': 'GET,POST,PATCH,DELETE,OPTIONS' };
const json = (o, s) => new Response(JSON.stringify(o, null, 1), { status: s || 200, headers: Object.assign({ 'content-type': 'application/json;charset=utf-8' }, CORS) });
const fail = (m, s) => json({ error: m }, s || 400);

const VENDORS = [
  { id: 'v1', name: 'Pizza Napoli', category: 'Pizzeria', city: 'Cotonou', open: true, rating: 4.6,
    products: [{ id: 'p101', name: 'Margherita', price: 4500 }, { id: 'p102', name: 'Reine', price: 5500 }] },
  { id: 'v2', name: 'Burger House', category: 'Fast-food', city: 'Cotonou', open: true, rating: 4.2,
    products: [{ id: 'p201', name: 'Cheese Burger', price: 3500 }, { id: 'p202', name: 'Frites', price: 1200 }] },
  { id: 'v3', name: 'Chez Maman', category: 'Africain', city: 'Porto-Novo', open: false, rating: 4.8,
    products: [{ id: 'p301', name: 'Poulet braise', price: 5000 }, { id: 'p302', name: 'Riz sauce', price: 2500 }] }
];
const RIDER_SEED = [
  { id: 'r1', name: 'Koffi', phone: '+22990000001', status: 'available' },
  { id: 'r2', name: 'Awa', phone: '+22990000002', status: 'busy' }
];
const STATUSES = ['pending', 'accepted', 'preparing', 'picked_up', 'delivered', 'cancelled'];

let ORDERS = [], RIDERS = [], SEQ = 1003, LOADED = false;

async function boot(env) {
  const k = env.STATE || null;
  if (!LOADED) {
    if (k) {
      const o = await k.get('orders');
      const r = await k.get('riders');
      if (o) ORDERS = JSON.parse(o);
      if (r) RIDERS = JSON.parse(r);
    }
    if (!RIDERS.length) RIDERS = RIDER_SEED.slice();
    LOADED = true;
  }
  return k;
}
async function persist(k) {
  if (k) { await k.put('orders', JSON.stringify(ORDERS)); await k.put('riders', JSON.stringify(RIDERS)); }
}
const find = (id) => VENDORS.filter((v) => v.id === id)[0];
const findProduct = (v, pid) => v.products.filter((p) => p.id === pid)[0];
const isAdmin = (req, env) => req.headers.get('x-admin-token') === (env.ADMIN_TOKEN || 'changeme');

async function api(req, env, url) {
  const p = url.pathname.replace(/\/+$/, '');
  const m = req.method;
  const k = await boot(env);
  if (p === '' || p === '/') return json({ app: 'enatega-cloud-delivery', version: '1.0.0', routes: ['GET /api/health', 'GET /api/vendors', 'GET /api/vendors/:id', 'GET /api/vendors/:id/products', 'POST /api/orders', 'GET /api/orders', 'GET /api/orders/:id', 'PATCH /api/orders/:id', 'GET /api/riders', 'PATCH /api/riders/:id', 'POST /api/admin/vendors', 'PATCH /api/admin/vendors/:id', 'GET /api/admin/stats'] });
  if (p === '/api/health') return json({ ok: true, ts: Date.now() });
  if (p === '/api/vendors' && m === 'GET') {
    const city = url.searchParams.get('city');
    return json({ count: VENDORS.length, vendors: city ? VENDORS.filter((v) => v.city === city) : VENDORS });
  }
  let mm = p.match(/^\/api\/vendors\/([^/]+)$/);
  if (mm && m === 'GET') { const v = find(mm[1]); return v ? json(v) : fail('vendor introuvable', 404); }
  mm = p.match(/^\/api\/vendors\/([^/]+)\/products$/);
  if (mm && m === 'GET') { const v = find(mm[1]); return v ? json({ vendorId: v.id, products: v.products }) : fail('vendor introuvable', 404); }
  if (p === '/api/orders' && m === 'POST') {
    const b = await req.json().catch(() => null);
    if (!b || !b.vendorId || !Array.isArray(b.items) || !b.items.length) return fail('vendorId et items requis');
    const v = find(b.vendorId);
    if (!v) return fail('vendor introuvable', 404);
    if (!v.open) return fail('vendor ferme', 409);
    let total = 0;
    const items = [];
    for (const it of b.items) {
      const pr = findProduct(v, it.productId);
      if (!pr) return fail('produit inconnu: ' + it.productId, 404);
      const qty = Math.max(1, parseInt(it.qty || 1, 10));
      total += pr.price * qty;
      items.push({ productId: pr.id, name: pr.name, price: pr.price, qty: qty });
    }
    const order = { id: 'ORD-' + (SEQ++), vendorId: v.id, vendorName: v.name, items: items, subtotal: total, deliveryFee: 500, total: total + 500, status: 'pending', riderId: null, customer: b.customer || {}, createdAt: new Date().toISOString() };
    ORDERS.push(order);
    await persist(k);
    return json(order, 201);
  }
  if (p === '/api/orders' && m === 'GET') {
    const st = url.searchParams.get('status');
    return json({ count: ORDERS.length, orders: st ? ORDERS.filter((o) => o.status === st) : ORDERS });
  }
  mm = p.match(/^\/api\/orders\/([^/]+)$/);
  if (mm) {
    const o = ORDERS.filter((x) => x.id === mm[1])[0];
    if (!o) return fail('commande introuvable', 404);
    if (m === 'GET') return json(o);
    if (m === 'PATCH') {
      const b = await req.json().catch(() => ({}));
      if (b.status) { if (STATUSES.indexOf(b.status) < 0) return fail('statut invalide'); o.status = b.status; }
      if (b.riderId !== undefined) {
        const r = RIDERS.filter((x) => x.id === b.riderId)[0];
        if (!r) return fail('livreur introuvable', 404);
        o.riderId = r.id;
        r.status = 'busy';
      }
      o.updatedAt = new Date().toISOString();
      await persist(k);
      return json(o);
    }
  }
  if (p === '/api/riders' && m === 'GET') return json({ count: RIDERS.length, riders: RIDERS });
  mm = p.match(/^\/api\/riders\/([^/]+)$/);
  if (mm && m === 'PATCH') {
    const r = RIDERS.filter((x) => x.id === mm[1])[0];
    if (!r) return fail('livreur introuvable', 404);
    const b = await req.json().catch(() => ({}));
    if (b.status) { if (['available', 'busy', 'offline'].indexOf(b.status) < 0) return fail('statut invalide'); r.status = b.status; }
    await persist(k);
    return json(r);
  }
  if (p === '/api/admin/vendors' && m === 'POST') {
    if (!isAdmin(req, env)) return fail('non autorise', 401);
    const b = await req.json().catch(() => ({}));
    if (!b.name) return fail('name requis');
    const v = { id: 'v' + (VENDORS.length + 1), name: b.name, category: b.category || 'divers', city: b.city || 'Cotonou', open: true, rating: 0, products: [] };
    VENDORS.push(v);
    return json(v, 201);
  }
  mm = p.match(/^\/api\/admin\/vendors\/([^/]+)$/);
  if (mm && m === 'PATCH') {
    if (!isAdmin(req, env)) return fail('non autorise', 401);
    const v = find(mm[1]);
    if (!v) return fail('vendor introuvable', 404);
    const b = await req.json().catch(() => ({}));
    if (b.open !== undefined) v.open = !!b.open;
    return json(v);
  }
  if (p === '/api/admin/stats') {
    if (!isAdmin(req, env)) return fail('non autorise', 401);
    const revenue = ORDERS.filter((o) => o.status === 'delivered').reduce((s, o) => s + o.total, 0);
    const byStatus = {};
    for (const s of STATUSES) byStatus[s] = ORDERS.filter((o) => o.status === s).length;
    return json({ vendors: VENDORS.length, orders: ORDERS.length, byStatus: byStatus, riders: RIDERS.length, ridersAvailable: RIDERS.filter((r) => r.status === 'available').length, revenue: revenue });
  }
  return fail('route inconnue: ' + m + ' ' + p, 404);
}

export default {
  fetch: async (req, env) => {
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
    try { return await api(req, env, new URL(req.url)); }
    catch (e) { return fail('erreur interne: ' + e.message, 500); }
  }
};
