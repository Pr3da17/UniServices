# Plan B : Pivot vers Web Scraping (Architecture Complète)

## 🎯 Situation

**Problème** : L'API Web Services de Moodle est bloquée par le firewall de l'université.
**Solution** : Passer du web scraping via un proxy Express local.

---

## 📊 Architecture Nouvelle (Plan B)

### Au lieu de...

```
React Browser
    ↓ (CORS blocked)
    X
Moodle API
```

### On fait maintenant...

```
React Browser (localhost:5173)
    ↓ (HTTP local, pas de CORS)
Express Proxy (localhost:3001)
    ↓ (HTTPS vers Moodle)
Moodle Server (université)
```

**Avantage** : Le browser ne communique jamais directement avec Moodle !

---

## 🏗️ Fichiers Créés

### Backend (Nouveau)

```
backend/
├── package.json              # Dépendances Express
├── tsconfig.json            # Configuration TypeScript
├── .env.example             # Variables d'environnement
├── README.md                # Documentation backend
└── src/
    ├── server.ts            # Serveur Express principal
    ├── types.ts             # Types TypeScript (Session, Assignment, etc.)
    ├── scrapers/
    │   └── moodleScraper.ts # Classe pour scraper Moodle
    └── routes/
        ├── auth.ts          # POST /api/auth/login, /logout, /verify
        └── assignments.ts   # GET /api/assignments, /courses
```

### Frontend (Modifié)

```
src/
├── App.tsx                  # Mis à jour pour utiliser backend
└── services/
    └── moodleService.ts     # Refactorisé pour appeler /api/*
```

### Documentation

```
docs/
├── ADR-001-*.md             # Original (superseded)
├── ADR-002-web-scraping-with-express-proxy.md  # Nouvelle décision
├── IMPLEMENTATION_PLAN.md   # Plan détaillé 6 phases
├── QUICK_START_BACKEND.md   # Démarrage rapide (5 min)
└── PLAN_B_SUMMARY.md        # Ce document
```

---

## 🔄 Flux de Données Complet

### 1️⃣ Login Flow

```
User Types Credentials in Browser
         ↓
React: POST /api/auth/login
         ↓
Express Proxy:
  1. POST /login/index.php to Moodle with creds
  2. Extract MoodleSession cookie from response
  3. Store cookies in server memory
  4. Return sessionId to frontend
         ↓
React: Store sessionId in state (NOT credentials!)
         ↓
Backend memory:
  {
    "session_xxx123": {
      "cookies": "MoodleSession=...",
      "userId": "12345",
      "username": "student",
      "loginTime": 1234567890
    }
  }
```

### 2️⃣ Assignments Fetch

```
React: GET /api/assignments?sessionId=session_xxx123
         ↓
Express:
  1. Retrieve cookies from session memory
  2. GET /my/index.php from Moodle (with cookies)
  3. Parse HTML response with Cheerio
  4. Extract assignments:
     - Title: .activity-name
     - Course: [data-course-id]
     - Due: .duedate
     - Status: .submitted
  5. Transform to JSON
  6. Cache for 5 minutes
         ↓
React: Display assignments list
```

---

## 🛠️ Dépendances Clés

| Package   | Rôle            | Why                      |
| --------- | --------------- | ------------------------ |
| `express` | Serveur web     | Léger, standard Node.js  |
| `axios`   | Client HTTP     | Cookies + requêtes HTTPS |
| `cheerio` | Parsing HTML    | jQuery-like, rapide      |
| `cookie`  | Gestion cookies | Parse Set-Cookie headers |
| `cors`    | Cross-origin    | Authorise React frontend |

---

## 🔐 Sécurité

### ✅ Credentials Protection

- Username/password **jamais stockés** dans le browser
- Credentials envoyés au proxy, **jamais exposés**
- Proxy stocke juste sessionId + cookies serveur-side
- Browser ne voit que sessionId (jeton dépourvu de sens)

### ⚠️ Current Limitations (Dev Only)

- Sessions en mémoire (perdu au restart)
- Pas de chiffrement
- Log partielle

### 🛡️ Production Checklist

- [ ] HTTPS for local proxy
- [ ] Redis for session persistence
- [ ] Encrypt session data
- [ ] Audit logging
- [ ] Rate limiting enforced

---

## 📚 Comment Ça Marche : HTML Parsing

### HTML Original (Moodle)

```html
<div data-type="assign" data-course-id="101">
  <span class="activity-name">Devoir Mathématiques</span>
  <span class="due">25/03/2026</span>
  <div class="submitted">Soumis</div>
</div>
```

### Cheerio Extraction

```typescript
$('[data-type="assign"]').each((i, el) => {
  const title = $(el).find(".activity-name").text(); // "Devoir Mathématiques"
  const courseId = $(el).attr("data-course-id"); // "101"
  const dueDate = $(el).find(".due").text(); // "25/03/2026"
  const submitted = $(el).find(".submitted").length > 0; // true

  assignments.push({ title, courseId, dueDate, submitted });
});
```

### JSON Retourné

```json
{
  "success": true,
  "data": [
    {
      "id": "101-1",
      "title": "Devoir Mathématiques",
      "course": "MAT101",
      "dueDate": "2026-03-25T23:59:00Z",
      "priority": "high",
      "submissionStatus": "submitted"
    }
  ]
}
```

---

## ✔️ CORS Problem Solved

### Before (Plan A - Blocked)

```
Browser sends GET to moodle.universite.edu
Moodle server returns 403 CORS error
Browser blocks response
❌ Front-end never sees data
```

### After (Plan B - Working)

```
Browser sends GET to localhost:3001
Express proxy returns data immediately (same origin!)
✅ No CORS issues
```

Why? React (port 5173) → Express (port 3001) = **same localhost, different ports = allowed by CORS middleware**

---

## 🚀 Démarrage Immédiate

### Étape 1 : Backend

```bash
cd backend
npm install
echo "MOODLE_BASE_URL=https://moodle.universite.edu" > .env
npm run dev
# Port 3001
```

### Étape 2 : Frontend

```bash
npm run dev
# Port 5173
```

### Étape 3 : Test

```bash
# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test"}'

# Get assignments (remplacer SESSION_ID)
curl 'http://localhost:3001/api/assignments?sessionId=SESSION_ID'
```

---

## 📖 Plans d'Implémentation

| Document                   | Contenu               | Durée      |
| -------------------------- | --------------------- | ---------- |
| **QUICK_START_BACKEND.md** | 5 min setup           | 5 min      |
| **IMPLEMENTATION_PLAN.md** | 6 phases détaillées   | 4-6 heures |
| **ADR-002**                | Décision architecture | 10 min     |

---

## ❓ Q&A

### Q: Et si Moodle change son HTML?

A: HTML parsers cassent. Solution :

- Automated tests on Moodle
- Monitor parsing failures
- Update Cheerio selectors
- Switch to Puppeteer if critical

### Q: Quel est le problère du CORS ?

A: Navigateurs empêchent req cross-domain par défaut. Express l'autorise via middleware CORS.

### Q: Mes credentials sont sûrs?

A: Oui. Jamais envoyés au frontend. Stockés server-side avec sessionId anonymous.

### Q: Et si le serveur backend crash?

A: Sessions perdues (en-mémoire). Production : utiliser Redis.

### Q: Peux utiliser cä sur production?

A: Seulement après :

- HTTPS pour proxy
- Persistent sessions (Redis)
- Audit logging
- Rate limiting serveur-side
- Tests d'intégration avec vrai Moodle

---

## 📊 Résumé des Changements

| Aspect         | Plan A                  | Plan B               |
| -------------- | ----------------------- | -------------------- |
| **Source**     | Moodle Web Services API | Moodle HTML pages    |
| **Auth**       | Token API               | Cookie-based session |
| **Parsing**    | JSON parsing            | HTML + Cheerio       |
| **Storage**    | RxDB local              | In-memory sessions   |
| **CORS**       | Problématique           | Résolu!              |
| **Robustesse** | Officiel API            | Fragile parsing      |
| **Accès**      | Bloqué par université   | Accessible           |

---

## 🎯 Succès = Quand...

✅ Backend lance sans erreur sur port 3001
✅ Curl login retourne sessionId
✅ Curl assignmentsfetch retourne vrais devoirs
✅ React affiche devoirs depuis backend
✅ Pas d'erreurs CORS
✅ Rate limiting fonctionne
✅ Offline fallback marche

---

## 🔗 Next Steps

1. **Lire** QUICK_START_BACKEND.md (5 min)
2. **Installer** dépendances backend (2 min)
3. **Tester** login avec curl (5 min)
4. **Debugger** HTML parsing si needed (30 min)
5. **Intégrer** React frontend (30 min)
6. **Sécuriser** pour production (2h)

---

## 📝 Fichiers Modifiés vs Créés

### ✅ Créés

- `backend/` (dossier entier)
- `docs/ADR-002-*`
- `docs/IMPLEMENTATION_PLAN.md`
- `docs/QUICK_START_BACKEND.md`

### 📝 Modifiés

- `src/services/moodleService.ts` (réécrit pour voix backend)
- `src/App.tsx` (mise à jour useState + hooks)

### 🚫 Supprimés

- RxDB (pas besoin côté frontend)
- Ancien service Moodle API

---

## 🎓 Architecture Pattern

Ce système utilise:

- **Proxy Pattern** : Express agit comme proxy transparent
- **Session-Based Auth** : Cookies côté serveur (stateful)
- **Caching** : In-memory cache 5min (Redis en prod)
- **SSR Partial** : Scraping côté serveur (moins de charge client)

---

Créated: 23 mars 2026
Status: **Ready for Implementation**
