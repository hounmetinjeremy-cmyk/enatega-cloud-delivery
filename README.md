# enatega-cloud-delivery

Plateforme multi-vendeurs de livraison (catalogue restaurants/produits, prise de commande client, statut des livreurs, panneau d'administration) en un seul Worker Cloudflare, sans dependance.

Application en ligne : https://enatega-cloud-delivery.hounmetinjeremy.workers.dev

## Endpoints

| Methode | Route | Role |
| --- | --- | --- |
| GET | /api/health | sante du service |
| GET | /api/vendors | liste des vendeurs (?city=) |
| GET | /api/vendors/:id | fiche vendeur |
| GET | /api/vendors/:id/products | catalogue du vendeur |
| POST | /api/orders | creation de commande (total calcule serveur) |
| GET | /api/orders | liste des commandes (?status=) |
| GET | /api/orders/:id | detail commande |
| PATCH | /api/orders/:id | statut / affectation livreur |
| GET | /api/riders | liste des livreurs |
| PATCH | /api/riders/:id | statut livreur (available/busy/offline) |
| POST | /api/admin/vendors | ajout vendeur (header x-admin-token) |
| PATCH | /api/admin/vendors/:id | ouverture/fermeture vendeur (admin) |
| GET | /api/admin/stats | indicateurs admin (admin) |

## Exemple

    curl -X POST https://enatega-cloud-delivery.hounmetinjeremy.workers.dev/api/orders \
      -H 'content-type: application/json' \
      -d '{"vendorId":"v1","items":[{"productId":"p101","qty":2}],"customer":{"name":"Ada","phone":"+229...","address":"Fidjrosse"}}'

## Limites connues

- Aucune page HTML : / renvoie l'index JSON des routes.
- Sans binding KV `STATE`, les commandes sont stockees en memoire de l'isolat (perdues au redemarrage).
- `ADMIN_TOKEN` de demonstration a remplacer via `wrangler secret put ADMIN_TOKEN`.
