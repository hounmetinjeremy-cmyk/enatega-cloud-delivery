# Enatega Cloud Delivery — refonte UI mobile

## Objectif
Interface mobile moderne (style Uber Eats / Enatega) pour le Worker `enatega-cloud-delivery` :
onglets 🏠 Restaurants / 🛍️ Panier / 📦 Commandes, dark mode soigné, cartes restaurants,
badges OUVERT/FERMÉ, prix en FCFA, tunnel de commande guidé + toast de confirmation.

## Contexte vérifié
- Dépôt : hounmetinjeremy-cmyk/enatega-cloud-delivery, branche main. Fichier principal = `index.js` (racine).
  (`src/index.js` n'existe pas : 404.)
- Compte Cloudflare : 26a324f0e475aeaace451e11617c1109 (un seul).
- Worker : enatega-cloud-delivery, main = index.js, workers_dev = true.
- KV `STATE` commenté dans wrangler.toml -> état en mémoire (MEM) par isolate.
- Routes API à préserver : /api/health, /api/vendors(+/:id,/:id/products),
  /api/orders (POST/GET, /:id GET/PATCH), /api/riders, /api/admin/*.

## Étapes
1. [fait] Lire index.js, wrangler.toml, comptes Cloudflare.
2. [en cours] Réécrire index.js : API identique + nouvelle PAGE (UI mobile).
3. [ ] Déployer via PUT workers/scripts/enatega-cloud-delivery (multipart, main_module).
4. [ ] Activer l'URL workers.dev et vérifier HTTP 200 + /api/vendors.
5. [ ] Relire le fichier déployé et valider.

## Points de sécurité
- ADMIN_TOKEN en clair dans wrangler.toml (valeur par défaut) : à remplacer par un secret `wrangler secret put`.
- Le Worker accepte CORS `*` : à restreindre avant production.
