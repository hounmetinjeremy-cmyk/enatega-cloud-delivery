# PROGRESS

## Objectif
Rendre accessible le projet Enatega porté sur Cloudflare (`enatega-cloud-delivery`) :
API + page HTML servies par le Worker, vérifiées en HTTP 200.

## État des preuves (relevé)
- Worker `enatega-cloud-delivery` déployé, 2 déploiements, dernier 24/10 21:17.
- `settings` : bindings `ADMIN_TOKEN` (plain_text) + `STATE` (kv_namespace) ; compat 2024-11-01 ; AUCUN binding `assets`/`ASSETS`, AUCUN binding D1 `DB`.
- `subdomain` : `enabled: true`, `previews_enabled: true` (compte `hounmetinjeremy`).
- URL testée : `https://enatega-cloud-delivery.hounmetinjeremy.workers.dev/` → **HTTP 403**
  corps : `Forbidden: requests to enatega-cloud-delivery.hounmetinjeremy.workers.dev are not allowed`
- Idem `/`, `/api/health`, `/api/vendors`, `/index.html` : 403 identique, 89 octets `text/plain`.
  => bloqué AVANT le Worker : ce n'est pas le code qui répond.
- `index.js` (23 313 o) contient bien une route HTML (`const HTML = ...`) et du seed JSON :
  la page existe dans le code, elle n'est simplement jamais atteinte.

## Diagnostic
1. Blocage de la route `workers.dev` au niveau compte/edge (403 texte, pas de JSON applicatif).
2. Aucune page servie par assets : si on veut un vrai front statique, il faut un binding ASSETS.
3. `ADMIN_TOKEN` en clair dans `wrangler.toml` + CORS `*` : à corriger avant prod.

## Étapes
1. [x] Lire le dépôt et le Worker (bindings, déploiements, subdomain).
2. [x] Tester l'URL : 403 edge sur 4 chemins.
3. [ ] Utilisateur : ouvrir `/api/health` dans SON navigateur et rapporter le code.
4. [ ] Si 403 aussi chez lui : Lever la restriction `workers.dev` (Dashboard → Workers & Pages
       → subdomain) OU ajouter une route custom domain au Worker.
5. [ ] Ajouter le front : dossier `public/index.html` + binding assets `ASSETS`
       (wrangler : `assets = { directory = "./public", binding = "ASSETS" }`) puis redéployer.
6. [ ] Lier la D1 `enatega-db` (0fd2dd30-c7ec-48ed-af46-7bac37ffb5a8) en binding `DB`.
7. [ ] Sortir `ADMIN_TOKEN` en secret (`wrangler secret put`), restreindre le CORS.
8. [ ] Re-tester : `/` → 200 text/html, `/api/health` → 200 JSON.

## Erreurs rencontrées
- Tool `bash_tool` : « Code execution is not authorized » (un tour perdu, aucune donnée écrite).
- `execute_mcp_cloudflare` ne permet pas de tester l'URL depuis le navigateur de l'utilisateur :
  le 403 doit être confirmé côté client pour trancher compte vs sandbox.

## Prochaine action
Attendre le code HTTP vu par l'utilisateur sur `/api/health`, puis étape 4 ou 5.
