# EXOS — application d'aide aux exercices (6e → Terminale)

Projet **MERN** : **M**ongoDB • **E**xpress • **R**eact • **N**ode.js
- `server/` : le serveur (API, base de données, chat temps réel, paiements)
- `client/` : l'interface que voient les élèves, professeurs et l'administrateur

Chaque ligne de code est commentée en français. Ce guide te conduit de l'installation jusqu'à la mise en ligne.

---

## PARTIE 1 — Installer les outils (une seule fois)

Il faut un **ordinateur** (Windows, Mac ou Linux).

1. **Node.js (version LTS)** : télécharge-le sur https://nodejs.org et installe-le (bouton « LTS »).
   Vérifie ensuite dans un terminal : `node -v` doit afficher un numéro 18 ou plus.
2. **VS Code** : https://code.visualstudio.com
3. **Git** : https://git-scm.com (utile pour la mise en ligne)
4. **Un compte MongoDB Atlas** (base de données gratuite) : https://www.mongodb.com/atlas
5. **Un compte GitHub** (https://github.com), **Render** (https://render.com) et **Vercel** (https://vercel.com) pour la mise en ligne

---

## PARTIE 2 — Créer la base de données (MongoDB Atlas)

1. Connecte-toi à MongoDB Atlas, puis **Create** → un cluster gratuit (« M0 »).
2. Menu **Database Access** → **Add New Database User** : choisis un nom et un mot de passe (note-les, évite les caractères spéciaux comme `@` ou `:`).
3. Menu **Network Access** → **Add IP Address** → **Allow access from anywhere** (`0.0.0.0/0`). Nécessaire pour que le serveur en ligne puisse se connecter.
4. Menu **Database** → **Connect** → **Drivers** → copie l'adresse qui ressemble à :
   `mongodb+srv://NOM:MOTDEPASSE@cluster0.xxxxx.mongodb.net/exos?retryWrites=true&w=majority`
   (remplace `NOM` et `MOTDEPASSE`, et garde `/exos` avant le `?`). Cette adresse s'appelle **MONGO_URI**.

---

## PARTIE 3 — Lancer le projet sur ton ordinateur avec VS Code

1. Dézippe `exos-mern.zip`. Dans VS Code : **Fichier → Ouvrir un dossier…** → choisis le dossier `exos`.
2. Ouvre un terminal : menu **Terminal → Nouveau terminal**.

### 3.1 Le serveur
```bash
cd server
npm install
```
- Copie `.env.example` en `.env` (dans VS Code : clic droit sur `.env.example` → Copier, puis Coller et renomme en `.env`).
- Ouvre `.env` et remplis au minimum :
  - `MONGO_URI` : l'adresse de la Partie 2
  - `JWT_SECRET` : une longue phrase secrète au hasard
  - `ADMIN_PHONE` et `ADMIN_PASSWORD` : ton numéro et ton mot de passe d'administrateur
- Crée le compte administrateur (une seule fois) puis lance le serveur :
```bash
npm run seed
npm run dev
```
Tu dois voir **« EXOS API prête »**. Laisse ce terminal ouvert.

### 3.2 L'interface (deuxième terminal)
Clique sur **+** dans le panneau du terminal pour en ouvrir un second :
```bash
cd client
npm install
```
- Copie `.env.example` en `.env` (laisse `VITE_API_URL` vide, garde `VITE_SIMULATE=true`).
```bash
npm run dev
```
Ouvre **http://localhost:5173** dans ton navigateur.

### 3.3 Tester tous les parcours
1. **Élève** : « Commencer » → inscription (avec photo) → écran d'abonnement → choisis Airtel/Moov, mets un numéro → **« Démo : simuler la confirmation »** → tableau de bord.
2. **Professeur** : sur l'accueil, « Espace professeur » → « Créer un compte professeur » → écran « en attente ».
3. **Admin** : « Espace admin » → connecte-toi avec `ADMIN_PHONE` / `ADMIN_PASSWORD` → **Valider** le professeur.
4. Reviens en professeur : connexion, puis **ouvre un second navigateur (ou une fenêtre privée)** pour l'élève afin de les voir « en ligne » en même temps, d'envoyer un exercice, de le corriger et de discuter.

Le **mot de passe oublié** affiche pour l'instant le code SMS dans le terminal du serveur (voir Partie 5).

---

## PARTIE 4 — Mettre le projet en ligne

### 4.1 Envoyer le code sur GitHub
Dans le terminal, à la racine du dossier `exos` :
```bash
git init
git add .
git commit -m "EXOS"
```
Crée un dépôt vide sur GitHub, puis suis les deux lignes qu'il affiche (`git remote add origin …` et `git push -u origin main`).
Les fichiers `.env` ne sont **pas** envoyés (ils sont dans `.gitignore`) : c'est voulu, ils contiennent tes secrets.

### 4.2 Le serveur sur Render
1. Render → **New → Web Service** → connecte ton dépôt GitHub.
2. Réglages : **Root Directory** `server` • **Build Command** `npm install` • **Start Command** `npm start`.
3. **Environment** : ajoute toutes les variables de `server/.env` (`MONGO_URI`, `JWT_SECRET`, `ADMIN_*`, `PRICE_FCFA`, `WEBHOOK_SECRET`…).
   - `CLIENT_URL` : l'adresse de ton site Vercel (tu l'auras à l'étape 4.3 : reviens la modifier ensuite).
   - `STORAGE_DRIVER` : `s3` (et les variables `S3_*` de la Partie 6)
   - `SMS_PROVIDER` : `twilio` (et les variables `TWILIO_*` de la Partie 5)
4. **Fichiers** : le disque de Render est effacé à chaque redémarrage. Utilise le stockage en ligne décrit dans la **Partie 6** (`STORAGE_DRIVER=s3`) : c'est la solution prévue dans le projet.
5. Une fois déployé, Render te donne une adresse du type `https://exos-api.onrender.com`. Crée l'admin : onglet **Shell** → `npm run seed`.

### 4.3 L'interface sur Vercel
1. Vercel → **Add New → Project** → choisis le même dépôt.
2. **Root Directory** : `client` (Vercel détecte Vite tout seul).
3. **Environment Variables** :
   - `VITE_API_URL` = l'adresse Render (sans `/` à la fin)
   - `VITE_SIMULATE` = `false`
4. Déploie. Copie l'adresse du site (ex. `https://exos.vercel.app`) et mets-la dans `CLIENT_URL` sur Render, puis redéploie le serveur.

Ton application est en ligne. Tu peux ajouter ton nom de domaine dans Vercel (**Settings → Domains**).

---

## PARTIE 5 — Brancher le vrai SMS (mot de passe oublié)

Le projet envoie les SMS avec **Twilio** (fichier `server/services/sms.js`). Tant que `SMS_PROVIDER=console`, le code s'affiche seulement dans le terminal du serveur.

### 5.1 Configurer Twilio
1. Crée un compte sur https://www.twilio.com et note le **Account SID** et l'**Auth Token** (page d'accueil de la console).
2. Dans la console, ouvre **Messaging → Settings → Geo permissions** et active le **Gabon**. Sans cela, les SMS vers +241 sont refusés.
3. Un compte d'essai (« trial ») n'envoie qu'aux numéros que tu as vérifiés. Pour tous les élèves et professeurs, il faut passer en compte payant. Regarde les tarifs vers le Gabon avant de choisir.
4. **Nom d'expéditeur** : d'après les consignes publiées par Twilio, le Gabon accepte un nom en lettres comme `EXOS`. L'opérateur Airtel peut toutefois le remplacer par un nom générique. Évite les noms comme INFO ou Verify.
5. Dans `server/.env` (et dans les variables Render) :
```
SMS_PROVIDER=twilio
SMS_SENDER=EXOS
SMS_COUNTRY_CODE=241
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
```

### 5.2 Tester
1. Crée un compte avec **ton propre numéro** et lance « Mot de passe oublié ».
2. Le SMS doit arriver en quelques secondes. S'il n'arrive pas, regarde les messages dans le terminal du serveur (ou dans **Monitor → Logs → Messaging** chez Twilio).
3. Si Twilio dit que le numéro est invalide, mets `SMS_STRIP_LEADING_ZERO=true` (retire le 0 au début des numéros locaux), puis redémarre. Fais un test réel, car le format des numéros gabonais doit être confirmé avec ton fournisseur.

### 5.3 Protections incluses
- Maximum 3 demandes de code par numéro et par heure (10 par adresse IP) : évite les abus et les factures inutiles.
- Le code est valable 10 minutes et s'annule après 5 essais ratés.
- Le texte du SMS n'a pas d'accents pour tenir dans un seul SMS (moins cher).
- Ces limites sont gardées en mémoire du serveur. Si tu utilises plusieurs serveurs, il faudra une base commune (ex. Redis).

Pour utiliser un autre fournisseur (Orange, Infobip, un opérateur local…), ajoute une fonction dans `sms.js` sur le modèle de `viaTwilio` et un choix dans `sendSms`.

---

## PARTIE 6 — Stockage des fichiers en ligne (photos, exercices, corrections)

Sur un hébergeur comme Render, le disque est effacé à chaque redémarrage : photos et exercices disparaîtraient. Le projet sait donc ranger les fichiers dans un stockage compatible **S3** (`server/services/storage.js`). Les fichiers restent **privés** : ils passent toujours par ton serveur, qui vérifie qui a le droit de les voir.

Services compatibles : **Cloudflare R2**, **Backblaze B2**, **AWS S3**… Compare leurs tarifs et leurs offres gratuites sur leurs sites avant de choisir.

### 6.1 Exemple avec Cloudflare R2
1. Crée un compte sur https://dash.cloudflare.com → **R2 Object Storage** → **Create bucket** (nom : `exos-fichiers`). Laisse le bucket **privé**.
2. **R2 → Manage API tokens → Create API token** avec la permission « Object Read & Write » sur ce bucket. Note l'**Access Key ID** et la **Secret Access Key** (affichées une seule fois).
3. Note ton **Account ID** (page R2). L'adresse du service est `https://IDENTIFIANT.r2.cloudflarestorage.com`.
4. Dans `server/.env` (et dans Render) :
```
STORAGE_DRIVER=s3
S3_BUCKET=exos-fichiers
S3_REGION=auto
S3_ENDPOINT=https://IDENTIFIANT.r2.cloudflarestorage.com
S3_ACCESS_KEY_ID=...
S3_SECRET_ACCESS_KEY=...
```
5. Redémarre le serveur, inscris-toi avec une photo, envoie un exercice : les fichiers apparaissent dans le bucket (dossiers `photos/` et `docs/`).

Avec AWS S3 : laisse `S3_ENDPOINT` vide et mets ta vraie région (ex. `eu-west-3`).

### 6.2 Bon à savoir
- En développement, garde `STORAGE_DRIVER=local` : tout reste sur ton ordinateur (dossier `server/uploads`).
- Les fichiers déjà envoyés en mode local ne sont **pas** déplacés automatiquement vers S3. Passe en `s3` avant d'ouvrir l'application au public.
- Les photos sont mises en cache 24 h par le navigateur ; les exercices et corrections ne sont jamais mis en cache.
- Limites : photos 3 Mo, exercices et corrections 10 Mo (réglables dans `server/middleware/upload.js`).
- Pense à une **sauvegarde** régulière de MongoDB Atlas et du bucket.

---

## PARTIE 7 — Ce qu'il reste à brancher pour la vraie mise en service

| Sujet | Où | À faire |
|---|---|---|
| **Airtel Money** | `server/services/payments/airtel.js` | Ouvrir un compte marchand, vérifier les adresses et champs avec leur documentation, renseigner `AIRTEL_*` |
| **Moov Money** | `server/services/payments/moov.js` | Fichier modèle : à compléter avec la documentation Moov Africa Gabon (ou un agrégateur), renseigner `MOOV_*` |
| **Confirmation de paiement** | `POST /api/payments/webhook/airtel` (ou `/moov`) | Donner cette adresse à l'opérateur ; ajouter la vérification de sa signature |
| **Mode réel** | variables Render | `PAYMENT_MODE=live` (et `VITE_SIMULATE=false` sur Vercel) |
| **Sécurité** | serveur | Ajouter `helmet` et une limite d'essais sur la connexion (`express-rate-limit`) |
| **Rappels d'abonnement** | serveur | SMS quelques jours avant l'expiration (à ajouter, avec `sendSms`) |

Garde `PAYMENT_MODE=simulated` tant que les opérateurs ne sont pas branchés : aucun vrai argent n'est débité.

---

## Comprendre l'organisation du code

```
exos/
├─ server/
│  ├─ server.js          démarre le serveur et branche toutes les routes
│  ├─ seed.js            crée le compte administrateur
│  ├─ socket.js          chat temps réel et présence « en ligne » (vert)
│  ├─ models/            forme des données : User, Exercise, Message, Payment, Subscription
│  ├─ middleware/        auth.js (connexion, abonnement, rôles) • upload.js (photos/PDF)
│  ├─ routes/            auth • users • exercises • chat • payments • admin
│  └─ services/          chat.js • sms.js • storage.js • rateLimit.js • payments/ (Airtel, Moov)
└─ client/
   ├─ index.html, vite.config.js
   └─ src/
      ├─ main.jsx, App.jsx    point d'entrée et liste des pages
      ├─ AuthContext.jsx      session, abonnement, connexion temps réel
      ├─ api.js               appels au serveur
      ├─ components/          Avatar, Logo, BottomNav, PasswordInput, FileButtons, Guard
      └─ pages/               Welcome, Signup, Login, Reset, Pay, StudentDashboard,
                              CorrectionView, TeacherSignup, Pending, TeacherDashboard, Correct,
                              Chat, Profile, AdminDashboard
```

### Règles du cahier des charges et où elles sont appliquées
- Élève sans abonnement actif bloqué → `middleware/auth.js` (`requireSubscription`) et `components/Guard.jsx`
- +30 jours à chaque paiement confirmé, cumulés → `routes/payments.js` (`activate`)
- Professeur sans abonnement, validé par l'admin → `routes/auth.js` (statut `pending`), `routes/admin.js`
- Présence en ligne en vert → `socket.js` + composant `Avatar`
- Exercice envoyé au professeur choisi, statut « en attente de correction » → `routes/exercises.js`
- Correction en photo ou PDF, voir ou télécharger → `routes/exercises.js`, `components/FileButtons.jsx`
- Chat texte seulement, flèche de retour → `services/chat.js`, `pages/Chat.jsx`
- Profil : nom et photo modifiables → `routes/users.js`, `pages/Profile.jsx`
- Admin : validation, suivi, montants, connectés, chat → `routes/admin.js`, `pages/AdminDashboard.jsx`

### Note sur `package.json`
Ce format n'accepte pas les commentaires. Ses deux rôles : lister les bibliothèques à installer (`dependencies`) et définir les commandes (`scripts` : `npm run dev` lance en développement, `npm start` lance en production, `npm run seed` crée l'admin).

---

## Numéro WhatsApp des réclamations

Le numéro est utilisé par le bouton **« Réclamation WhatsApp »** (accueil, connexion, paiement, tableaux de bord élève et professeur). Il ouvre WhatsApp avec un message déjà écrit (nom, téléphone et rôle de la personne connectée).
- Pour le changer : mets `VITE_WHATSAPP_NUMBER=24174044999` dans `client/.env` (en ligne : dans les variables Vercel) ou modifie `WHATSAPP_NUMBER` dans `client/src/constants.js`.
- Format : indicatif du pays **sans** `+` ni espaces ni 0 initial (Gabon : `241` puis le numéro).
- **Teste le bouton** après l'installation pour vérifier que c'est bien ton WhatsApp qui s'ouvre.

---

## Problèmes fréquents
- **`npm` n'est pas reconnu** : ferme et rouvre VS Code après l'installation de Node.js.
- **Erreur MongoDB « authentication failed »** : vérifie le nom et le mot de passe dans `MONGO_URI`.
- **Erreur MongoDB « timeout »** : ajoute `0.0.0.0/0` dans Network Access (Partie 2, étape 3).
- **La page se charge mais rien ne marche en ligne** : vérifie `VITE_API_URL` (Vercel) et `CLIENT_URL` (Render), sans `/` à la fin.
- **Le chat ne s'actualise pas** : le serveur doit tourner et `CLIENT_URL` doit être exactement l'adresse de ton site.
- **Photos qui disparaissent en ligne** : passe en `STORAGE_DRIVER=s3` (Partie 6).
- **Pas de SMS reçu** : voir 5.2 (Geo permissions Twilio, compte d'essai, `SMS_STRIP_LEADING_ZERO`).
- **Erreur « Cannot find package @aws-sdk/client-s3 »** : relance `npm install` dans `server/`.
username:crocodilemethe_db_user
password:ksnIgLd4byxEnWFG
mongodb://crocodilemethe_db_user:ksnIgLd4byxEnWFG@ac-2xjod0m-shard-00-00.lb8bllh.mongodb.net:27017,ac-2xjod0m-shard-00-01.lb8bllh.mongodb.net:27017,ac-2xjod0m-shard-00-02.lb8bllh.mongodb.net:27017/exos?ssl=true&replicaSet=atlas-brx6zv-shard-0&authSource=admin