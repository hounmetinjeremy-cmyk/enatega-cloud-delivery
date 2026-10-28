# PROGRESS — enatega-cloud-delivery

## Objectif
Rendre le projet Enatega (food delivery multivendor) opérationnel sur Cloudflare Workers + D1.

## État vérifié (dernier audit)
- Worker `enatega-cloud-delivery` déployé, 2 déploiements, dernier 24/10 21:17.
- `workers.dev` : enabled=true, previews_enabled=true (réactivé, réponse API OK).
- Code livré : 11 837 o, contient `<!DOCTYPE html>` + routes `/api/health`, `/api/vendors`, `/api/orders`, `/api/riders`, `/api/admin`, CORS `*`.
- Bindings : `ADMIN_TOKEN` (plain_text), `STATE` (kv_namespace). **Aucun binding D1** → données non persistées en base.
- D1 disponibles : `enatega-db` (0fd2dd30-c7ec-48ed-af46-7bac37ffb5a8), `enatega-multivendor-db` (18cc0b8a-addd-429c-bd0c-f6fc21480ff2).
- Autre Worker présent : `food-delivery-multivendor`.

## Limite de vérification
Tous les fetch sortants depuis le sandbox vers `*.workers.dev` ET `*.pages.dev` renvoient
`403 Forbidden: requests to <host> are not allowed` → filtrage d'egress du sandbox,
pas une panne du Worker. La vérification HTTP doit être faite par l'utilisateur.

## Prochaines étapes
1. Lier D1 `enatega-db` avec le binding `DB` (wrangler.toml + API).
2. Passer `ADMIN_TOKEN` en secret (`wrangler secret put ADMIN_TOKEN`), le retirer du fichier.
3. Restreindre CORS `*` à l'origine de prod.
4. Confirmer l'affichage des pages via le navigateur de l'utilisateur.
