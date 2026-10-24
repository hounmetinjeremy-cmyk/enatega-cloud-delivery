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

const CSS = [
  '*{box-sizing:border-box;-webkit-tap-highlight-color:transparent}',
  ':root{--bg:#0b0f14;--card:#141b24;--card2:#1b2530;--line:#243040;--txt:#eaf0f7;--mut:#8fa1b6;--grad:linear-gradient(135deg,#ff8a00,#ff3d68)}',
  'body{margin:0;background:radial-gradient(1100px 560px at 20% -10%,#1b2a3a 0%,#0b0f14 60%) no-repeat,#0b0f14;color:var(--txt);font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,system-ui,sans-serif;padding:74px 0 104px}',
  '.topbar{position:fixed;top:0;left:0;right:0;height:64px;display:flex;align-items:center;justify-content:space-between;padding:0 16px;background:rgba(11,15,20,.84);backdrop-filter:blur(14px);border-bottom:1px solid var(--line);z-index:20}',
  '.brand{display:flex;gap:10px;align-items:center;font-weight:800;font-size:16px;line-height:1.1}',
  '.brand small{display:block;font-weight:500;color:var(--mut);font-size:11px;margin-top:2px}',
  '.logo{width:38px;height:38px;border-radius:12px;display:grid;place-items:center;background:var(--grad);font-size:19px;box-shadow:0 8px 20px rgba(255,90,60,.3)}',
  '.cartbtn{position:relative;background:var(--card);border:1px solid var(--line);color:var(--txt);width:44px;height:44px;border-radius:14px;font-size:18px}',
  '.count{position:absolute;top:-6px;right:-6px;min-width:20px;height:20px;border-radius:10px;background:var(--grad);color:#fff;font-size:11px;font-weight:700;display:grid;place-items:center;padding:0 5px}',
  'main{max-width:720px;margin:0 auto;padding:14px}',
  '.view{animation:fade .25s ease}',
  '@keyframes fade{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}',
  '.hidden{display:none}',
  '.hero{padding:18px;border-radius:20px;background:linear-gradient(140deg,#1c2836,#131a23);border:1px solid var(--line);margin-bottom:14px}',
  '.hero h1{margin:0 0 6px;font-size:22px}',
  '.hero p{margin:0;color:var(--mut);font-size:13px;line-height:1.5}',
  '.h2{font-size:18px;margin:6px 0 12px}',
  '.grid{display:grid;gap:14px}',
  '.vcard{background:linear-gradient(160deg,#151d27,#111721);border:1px solid var(--line);border-radius:20px;padding:14px;box-shadow:0 12px 30px rgba(0,0,0,.3);margin-bottom:12px}',
  '.vhead{display:flex;justify-content:space-between;gap:10px;align-items:flex-start}',
  '.vhead h3{margin:0;font-size:16px}',
  '.meta{margin:4px 0 0;font-size:12px;color:var(--mut);line-height:1.45}',
  '.badge{font-size:10px;font-weight:800;letter-spacing:.6px;padding:5px 9px;border-radius:999px;white-space:nowrap}',
  '.badge.open{background:rgba(34,197,94,.14);color:#4ade80;border:1px solid rgba(34,197,94,.35)}',
  '.badge.closed{background:rgba(239,68,68,.14);color:#f87171;border:1px solid rgba(239,68,68,.35)}',
  '.plats{display:grid;gap:8px;margin-top:12px}',
  '.plat{display:flex;justify-content:space-between;align-items:center;gap:10px;background:var(--card2);border:1px solid var(--line);border-radius:14px;padding:10px 12px}',
  '.plat b{font-size:14px;font-weight:600;display:block}',
  '.plat small{color:#ffb347;font-weight:700;font-size:13px}',
  '.add{width:36px;height:36px;border-radius:12px;border:0;background:var(--grad);color:#fff;font-size:20px;font-weight:700;box-shadow:0 6px 16px rgba(255,90,60,.3);transition:transform .12s}',
  '.add:active{transform:scale(.9)}',
  '.add:disabled{opacity:.32;box-shadow:none}',
  '.card{background:linear-gradient(160deg,#151d27,#111721);border:1px solid var(--line);border-radius:20px;padding:14px;margin-bottom:12px}',
  '.row{display:flex;justify-content:space-between;font-size:14px;color:var(--mut);padding:6px 0}',
  '.row b{color:var(--txt)}',
  '.row.total{border-top:1px dashed var(--line);margin-top:6px;padding-top:10px;font-size:16px;color:var(--txt)}',
  '.row.total b{color:#ffb347;font-size:18px}',
  '.form h3{margin:0 0 10px;font-size:15px}',
  'input,textarea{width:100%;font:inherit;padding:14px;border-radius:14px;border:1px solid var(--line);background:#0e141c;color:var(--txt);margin-bottom:10px;outline:none}',
  'input:focus,textarea:focus{border-color:#ff8a00;box-shadow:0 0 0 3px rgba(255,138,0,.15)}',
  'textarea{min-height:78px;resize:vertical}',
  '.btn-primary{width:100%;padding:16px;border:0;border-radius:16px;background:var(--grad);color:#fff;font-size:16px;font-weight:800;letter-spacing:.3px;box-shadow:0 14px 30px rgba(255,90,60,.32);transition:transform .1s,filter .2s}',
  '.btn-primary:active{transform:scale(.97);filter:brightness(.9)}',
  '.btn-primary[disabled]{opacity:.6}',
  '.tabbar{position:fixed;bottom:0;left:0;right:0;display:flex;background:rgba(13,18,24,.94);backdrop-filter:blur(16px);border-top:1px solid var(--line);padding:8px 8px calc(8px + env(safe-area-inset-bottom));z-index:30}',
  '.tab{flex:1;background:none;border:0;color:var(--mut);font-size:11px;font-weight:600;display:grid;gap:3px;justify-items:center;padding:8px 4px;border-radius:14px;font-family:inherit}',
  '.tab span{font-size:20px;line-height:1}',
  '.tab.active{color:#ffb347;background:rgba(255,138,0,.1)}',
  '.toast{position:fixed;left:50%;transform:translate(-50%,140%);bottom:108px;background:linear-gradient(135deg,#16a34a,#22c55e);color:#fff;padding:14px 18px;border-radius:16px;font-size:14px;font-weight:700;box-shadow:0 16px 40px rgba(34,197,94,.35);transition:transform .35s cubic-bezier(.2,.9,.2,1);z-index:40;max-width:88vw;text-align:center}',
  '.toast.show{transform:translate(-50%,0)}',
  '.toast.err{background:linear-gradient(135deg,#dc2626,#ef4444);box-shadow:0 16px 40px rgba(239,68,68,.35)}',
  '.empty{color:var(--mut);font-size:13px;text-align:center;padding:22px 6px;line-height:1.5}',
  '.line{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--line)}',
  '.line:last-child{border-bottom:0}',
  '.qty{display:flex;align-items:center;gap:8px}',
  '.qty button{width:30px;height:30px;border-radius:10px;border:1px solid var(--line);background:var(--card2);color:var(--txt);font-size:15px;font-family:inherit}',
  '.qty button:active{transform:scale(.92)}'
].join('');

const JS = [
  'var cart={vendorId:null,items:[]};var vendors=[];var FEE=__FEE__;var _tt;',
  'function $(i){return document.getElementById(i)}',
  'function fcfa(n){var s=(n||0).toLocaleString("fr-FR");s=s.split("\u202f").join(" ").split("\u00a0").join(" ");return s+" FCFA"}',
  'function api(u,o){return fetch(u,o).then(function(r){return r.json()})}',
  'function toast(m,err){var t=$("toast");t.textContent=m;t.className="toast show"+(err?" err":"");clearTimeout(_tt);_tt=setTimeout(function(){t.className="toast"+(err?" err":"")},3400)}',
  'function go(t){["home","cart","orders"].forEach(function(k){$("v-"+k).className="view"+(k===t?"":" hidden")});var b=document.querySelectorAll(".tab");for(var i=0;i<b.length;i++){b[i].className="tab"+(b[i].getAttribute("data-tab")===t?" active":"")}window.scrollTo(0,0);if(t==="cart")renderCart();if(t==="orders")loadOrders()}',
  'function loadVendors(){api("/api/vendors").then(function(r){vendors=r.vendors||[];renderVendors()}).catch(function(){toast("Reseau indisponible",true)})}',
  'function renderVendors(){var h="";vendors.forEach(function(v){h+="<article class=\\"vcard\\"><div class=\\"vhead\\"><div><h3>"+v.name+"</h3><p class=\\"meta\\">"+v.category+" &bull; "+v.city+" &bull; &starf; "+v.rating+"</p></div><span class=\\"badge "+(v.open?"open":"closed")+"\\">"+(v.open?"OUVERT":"FERME")+"</span></div><div class=\\"plats\\">";v.products.forEach(function(p){h+="<div class=\\"plat\\"><div><b>"+p.name+"</b><small>"+fcfa(p.price)+"</small></div><button class=\\"add\\" data-v=\\""+v.id+"\\" data-p=\\""+p.id+"\\" "+(v.open?"":"disabled")+">+</button></div>"});h+="</div></article>"});$("vendors").innerHTML=h||"<p class=\\"empty\\">Aucun restaurant disponible.</p>"}',
  'function add(vid,pid){var v=null,pr=null;vendors.forEach(function(x){if(x.id===vid){v=x;x.products.forEach(function(p){if(p.id===pid)pr=p})}});if(!v||!pr)return;if(cart.vendorId&&cart.vendorId!==vid){cart={vendorId:null,items:[]};toast("Panier vide : un seul restaurant par commande")}cart.vendorId=vid;var it=null;cart.items.forEach(function(x){if(x.productId===pid)it=x});if(it){it.qty++}else{cart.items.push({productId:pid,name:pr.name,price:pr.price,qty:1})}badge();renderCart();toast(pr.name+" ajoute au panier")}',
  'function badge(){var n=0;cart.items.forEach(function(x){n+=x.qty});$("cartCount").textContent=n}',
  'function renderCart(){var box=$("cartList"),h="",sub=0;if(!cart.items.length){box.innerHTML="<p class=\\"empty\\">Votre panier est vide.<br>Ajoutez un plat dans l onglet Restaurants.</p>";$("sub").textContent=fcfa(0);$("fee").textContent=fcfa(FEE);$("tot").textContent=fcfa(FEE);return}h+="<div class=\\"card\\">";cart.items.forEach(function(x,i){sub+=x.price*x.qty;h+="<div class=\\"line\\"><div><b>"+x.name+"</b><br><small style=\\"color:#ffb347;font-weight:700\\">"+fcfa(x.price)+"</small></div><div class=\\"qty\\"><button data-i=\\""+i+"\\" data-a=\\"dec\\">&minus;</button><b>"+x.qty+"</b><button data-i=\\""+i+"\\" data-a=\\"inc\\">+</button><button data-i=\\""+i+"\\" data-a=\\"del\\" style=\\"color:#f87171\\">&#128465;</button></div></div>"});h+="</div>";box.innerHTML=h;$("sub").textContent=fcfa(sub);$("fee").textContent=fcfa(FEE);$("tot").textContent=fcfa(sub+FEE)}',
  'function submitOrder(e){e.preventDefault();if(!cart.items.length){toast("Panier vide : ajoutez un plat",true);return false}var n=$("f-name").value.trim(),p=$("f-phone").value.trim(),a=$("f-addr").value.trim();if(!n||!p||!a){toast("Renseignez nom, telephone et adresse",true);return false}var b=$("submitBtn");b.disabled=true;b.textContent="Envoi en cours...";var body={vendorId:cart.vendorId,items:cart.items.map(function(x){return{productId:x.productId,qty:x.qty}}),customer:{name:n,phone:p,address:a}};api("/api/orders",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(body)}).then(function(r){b.disabled=false;b.textContent="Valider la commande";if(r.error){toast("Erreur : "+r.error,true);return}toast("Commande "+r.id+" confirmee ! Total "+fcfa(r.total));cart={vendorId:null,items:[]};badge();renderCart();$("form").reset();go("orders")}).catch(function(){b.disabled=false;b.textContent="Valider la commande";toast("Reseau indisponible",true)});return false}',
  'var ST={pending:["En attente","#f59e0b"],accepted:["Acceptee","#38bdf8"],preparing:["En preparation","#a78bfa"],picked_up:["En livraison","#22d3ee"],delivered:["Livree","#22c55e"],cancelled:["Annulee","#ef4444"]};',
  'function loadOrders(){api("/api/orders?limit=20").then(function(r){var list=r.orders||[];if(!list.length){$("orders").innerHTML="<p class=\\"empty\\">Aucune commande pour le moment.</p>";return}var h="";list.slice().reverse().forEach(function(o){var st=ST[o.status]||[o.status,"#8fa1b6"];var it=(o.items||[]).map(function(x){return x.qty+" x "+x.name}).join(", ");var dt=new Date(o.createdAt).toLocaleString("fr-FR");h+="<article class=\\"vcard\\"><div class=\\"vhead\\"><div><h3>"+o.id+"</h3><p class=\\"meta\\">"+o.vendorName+" &bull; "+dt+"</p></div><span class=\\"badge\\" style=\\"color:"+st[1]+";border:1px solid "+st[1]+";background:"+st[1]+"22\\">"+st[0]+"</span></div><p class=\\"meta\\" style=\\"margin-top:10px\\">"+it+"</p><div class=\\"row total\\"><span>Total</span><b>"+fcfa(o.total)+"</b></div></article>"});$("orders").innerHTML=h}).catch(function(){toast("Reseau indisponible",true)})}',
  '$("vendors").addEventListener("click",function(e){var b=e.target.closest(".add");if(!b)return;add(b.getAttribute("data-v"),b.getAttribute("data-p"))});',
  '$("cartList").addEventListener("click",function(e){var b=e.target.closest("button[data-a]");if(!b)return;var i=+b.getAttribute("data-i"),a=b.getAttribute("data-a");if(!cart.items[i])return;if(a==="inc")cart.items[i].qty++;if(a==="dec"){cart.items[i].qty--;if(cart.items[i].qty<1)cart.items.splice(i,1)}if(a==="del")cart.items.splice(i,1);if(!cart.items.length)cart.vendorId=null;badge();renderCart()});',
  'loadVendors();badge();renderCart();'
].join('');

const PAGE = [
  '<!doctype html><html lang="fr"><head><meta charset="utf-8">',
  '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">',
  '<meta name="theme-color" content="#0b0f14"><title>Enatega - Livraison</title>',
  '<style>', CSS, '</style></head><body>',
  '<header class="topbar"><div class="brand"><div class="logo">&#128757;</div><div>Enatega<small>Cotonou &bull; livraison</small></div></div>',
  '<button class="cartbtn" onclick="go(&quot;cart&quot;)">&#128717;<span class="count" id="cartCount">0</span></button></header>',
  '<main>',
  '<section id="v-home" class="view"><div class="hero"><h1>Bienvenue &#128075;</h1><p>Choisissez un restaurant, ajoutez vos plats : nous gerons la livraison.</p></div><div id="vendors" class="grid"></div></section>',
  '<section id="v-cart" class="view hidden"><h2 class="h2">Votre panier</h2><div id="cartList"></div>',
  '<div class="card"><div class="row"><span>Sous-total</span><b id="sub">0 FCFA</b></div><div class="row"><span>Frais de livraison</span><b id="fee">0 FCFA</b></div><div class="row total"><span>Total</span><b id="tot">0 FCFA</b></div></div>',
  '<form id="form" class="card form" onsubmit="return submitOrder(event)"><h3>Infos de livraison</h3>',
  '<input id="f-name" name="name" autocomplete="name" placeholder="Nom complet (ex : Koffi Dossou)" required>',
  '<input id="f-phone" name="phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="Telephone (ex : +229 90 00 00 00)" required>',
  '<textarea id="f-addr" name="address" autocomplete="street-address" placeholder="Adresse de livraison (ex : Rue 12, Akpakpa, Cotonou)" required></textarea>',
  '<button type="submit" class="btn-primary" id="submitBtn">Valider la commande</button></form></section>',
  '<section id="v-orders" class="view hidden"><h2 class="h2">Mes commandes</h2><div id="orders"></div></section>',
  '</main>',
  '<nav class="tabbar"><button class="tab active" data-tab="home" onclick="go(&quot;home&quot;)"><span>&#127968;</span>Restaurants</button>',
  '<button class="tab" data-tab="cart" onclick="go(&quot;cart&quot;)"><span>&#128717;</span>Panier</button>',
  '<button class="tab" data-tab="orders" onclick="go(&quot;orders&quot;)"><span>&#128230;</span>Commandes</button></nav>',
  '<div id="toast" class="toast"></div>',
  '<script>', JS, '</script></body></html>'
].join('');

async function api(req, env) {
  const url = new URL(req.url);
  const p = url.pathname.replace(/\/+$/, '') || '/';
  const m = req.method;
  const s = await load(env);
  const d = s.d, vendors = d.vendors, orders = d.orders, riders = d.riders;
  const vfind = (id) => vendors.filter((v) => v.id === id)[0];
  const ofind = (id) => orders.filter((o) => o.id === id)[0];

  if (p === '/') return HTML(PAGE.replace('__FEE__', String(FEE)));
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
