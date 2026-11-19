# Messi Store — Mise en ligne sur Netlify

Boutique iPhone & Apple (Next.js 16 + PostgreSQL). Les tables et le catalogue
(iPhone, accessoires, prix) se créent **automatiquement** au premier chargement :
vous n'avez besoin que d'une base PostgreSQL vide.

---

## 1. Créer la base de données (gratuit)

**Option A — Netlify DB (le plus simple)**
1. Dans votre site Netlify : *Extensions* → *Neon / Netlify DB* → *Add database*.
2. Netlify crée la base et ajoute la variable `NETLIFY_DATABASE_URL`.
3. Copiez sa valeur dans une variable nommée **`DATABASE_URL`** (étape 3).

**Option B — Neon directement**
1. Créez un compte sur https://neon.tech → *New project* (région Europe).
2. Copiez la *Connection string* (elle finit par `?sslmode=require`).

## 2. Envoyer le code sur Netlify

**Méthode recommandée : GitHub**
1. Décompressez `messi-store-netlify.zip`.
2. Créez un dépôt GitHub et envoyez‑y le dossier (sans `node_modules`).
3. Netlify → *Add new site* → *Import an existing project* → choisissez le dépôt.
4. Netlify détecte Next.js : commande `npm run build`, dossier `.next` (déjà dans `netlify.toml`).

**Méthode sans GitHub : Netlify CLI**
```bash
npm install
npm install -g netlify-cli
netlify login
netlify init        # crée le site
netlify deploy --build --prod
```
> Le glisser‑déposer simple de dossier ne fonctionne pas pour un site Next.js avec
> serveur : utilisez GitHub ou la CLI.

## 3. Variables d'environnement

Netlify → *Site configuration* → *Environment variables* :

| Variable | Valeur | Obligatoire |
|---|---|---|
| `DATABASE_URL` | chaîne PostgreSQL de l'étape 1 | **Oui** |
| `ADMIN_SECRET` | longue chaîne aléatoire (ex. 40 caractères) | Recommandé |
| `ADMIN_EMAIL` | `keitabenzoumana@gmail.com` | Non |
| `ADMIN_PASSWORD` | votre mot de passe admin | Non |

Puis *Deploys* → *Trigger deploy* → *Clear cache and deploy site*.

## 4. Premier lancement

1. Ouvrez l'adresse fournie par Netlify (`https://votre-site.netlify.app`).
   Le premier chargement prend quelques secondes : la base est créée et remplie.
2. Espace admin : `https://votre-site.netlify.app/admin`
   - E‑mail : `keitabenzoumana@gmail.com`
   - Mot de passe : celui de `ADMIN_PASSWORD`, sinon le mot de passe communiqué.
3. **Changez le mot de passe** dans *Paramètres → Compte administrateur*.

## 5. Nom de domaine (optionnel)

Netlify → *Domain management* → *Add a domain* (ex. `messistore.ci`) puis suivez
les instructions DNS. Le certificat HTTPS est automatique.

---

### Lancer en local
```bash
cp .env.example .env     # renseignez DATABASE_URL
npm install
npm run dev              # http://localhost:3000
```

### Structure
- `src/app` — pages (boutique, fiche produit, panier, commande, admin) et API
- `src/db` — schéma, création automatique des tables, catalogue initial
- `src/components` — interface (boutique et admin)
- `netlify.toml` — configuration Netlify
