# Plan d'Implémentation : Web Scraping avec Express Proxy

## Stratégie Complète du Système

Ve document détaille **exactement comment** mettre en place l'architecture de web scraping pour contourner le blocage de l'API Moodle par l'université.

---

## 📊 Architecture Complète (Plan B)

```
┌─────────────────────────────────────────────────────────────────┐
│                    NAVIGATEUR ÉTUDIANT                          │
│  ┌──────────────────────────────────────────────────────────────┐
│  │  React App (Vite)                                            │
│  │  http://localhost:5173                                       │
│  │                                                              │
│  │  - Formulaire de connexion                                  │
│  │  - Affichage devoirs urgents                               │
│  │  - Gestion d'état (token de session)                       │
│  │                                                              │
│  │  fetch('http://localhost:3001/api/auth/login')             │
│  └──────────────────────────────────────────────────────────────┘
│                          ↓↑ (HTTP JSON)
│                    Port 3001 local
│
├─────────────────────────────────────────────────────────────────┐
│              SERVEUR LOCAL (Express Proxy)                      │
│              http://localhost:3001                              │
│  ┌──────────────────────────────────────────────────────────────┐
│  │  Route POST /api/auth/login                                  │
│  │  1. Reçoit {username, password}                              │
│  │  2. POST vers Moodle:/login/index.php                        │
│  │  3. Récupère MoodleSession cookie                            │
│  │  4. Stocke cookies en mémoire serveur                        │
│  │  5. Retourne sessionId au navigateur                         │
│  │                                                              │
│  │  Route GET /api/assignments?sessionId=XXX                    │
│  │  1. Récupère cookies depuis mémoire                          │
│  │  2. GET /my/index.php avec cookies                           │
│  │  3. Parse HTML avec Cheerio                                  │
│  │  4. Extrait devoirs + dates de rendu                        │
│  │  5. Cache résultats 5 minutes                                │
│  │  6. Retourne JSON au frontend                                │
│  │                                                              │
│  │  Dépendances:                                                │
│  │  - axios: requêtes HTTPS                                    │
│  │  - cheerio: parsing HTML (jQuery in Node)                  │
│  │  - cookie: gestion des cookies                              │
│  └──────────────────────────────────────────────────────────────┘
│
├─────────────────────────────────────────────────────────────────┐
│           SERVEUR MOODLE (Université)                           │
│           https://moodle.universite.edu                         │
│  (API bloquée, mais formulaire web accessible)
│  ┌──────────────────────────────────────────────────────────────┐
│  │  POST /login/index.php                                       │
│  │  └─ username=...&password=...                                │
│  │     └─ Set-Cookie: MoodleSession=...                         │
│  │                                                              │
│  │  GET /my/index.php                                           │
│  │  └─ Retourne tableau de bord avec devoirs                    │
│  │     (HTML à parser)                                          │
│  └──────────────────────────────────────────────────────────────┘
└─────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Plan d'Action Étape par Étape

### **Phase 1 : Installation et Configuration de Base** (30 min)

#### Étape 1.1 : Initialiser le dossier Backend

```bash
cd /Users/adamaitoulahiane/perso/dev school/moodle
mkdir -p backend/src/routes backend/src/scrapers
cd backend
```

#### Étape 1.2 : Installer les dépendances

```bash
npm install
# Cela installe :
# - express: serveur web
# - axios: client HTTP
# - cheerio: parsing HTML
# - cookie: gestion cookies
# - cors: autoriser requêtes depuis React
# - dotenv: variables d'environnement
```

#### Étape 1.3 : Configurer les variables d'environnement

```bash
# Créer backend/.env
MOODLE_BASE_URL=https://moodle.universite.edu
PORT=3001
NODE_ENV=development
```

#### Étape 1.4 : Lancer le serveur

```bash
npm run dev
# Doit afficher:
# 🎓 Moodle Scraper Backend running on http://localhost:3001
# 📚 Scraping from: https://moodle.universite.edu
```

---

### **Phase 2 : Tester la Connexion Moodle** (60 min)

#### Étape 2.1 : Comprendre le flux de login Moodle

Moodle fonctionne ainsi :

1. Utilisateur accède `/login/index.php` (GET)
2. Serveur retourne formulaire HTML
3. Utilisateur POST {username, password}
4. Serveur crée session, retourne cookie `MoodleSession=xxxxx`
5. Util envoie GET `/my/index.php` avec ce cookie
6. Serveur retourne tableau de bord

**Notre backend doit faire exactement ça.**

#### Étape 2.2 : Tester avec curl

```bash
# 1. Test connexion (manuellement)
curl -X POST https://moodle.universite.edu/login/index.php \
  -d "username=etudiant123&password=secret" \
  -v  # -v pour voir cookies
```

Chercher dans les headers :

```
Set-Cookie: MoodleSession=...
```

#### Étape 2.3 : Vérifier le parsing du formulaire de login

Moodle peut exiger un token CSRF. Checker :

```bash
curl https://moodle.universite.edu/login/index.php | grep logintoken
```

Notre code within `moodleScraper.ts` extrait ça :

```typescript
const csrfToken = $('input[name="logintoken"]').attr("value") || "";
```

#### Étape 2.4 : Tester via notre backend

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"etudiant123","password":"secret"}'
```

Réponse attendue :

```json
{
  "success": true,
  "userId": "12345",
  "username": "etudiant123",
  "sessionId": "session_1234567890_abc123"
}
```

Si ça échoue :

- Vérifier MOODLE_BASE_URL est correct
- Vérifier identifiants
- Peut-être Moodle exige User-Agent spécifique → ajouter dans axios

---

### **Phase 3 : Parser HTML pour Devoirs** (90 min)

#### Étape 3.1 : Inspecter la structure HTML de Moodle

1. Login manuellement sur Moodle
2. Aller à `/my/index.php`
3. Browser DevTools (F12) → Elements
4. Chercher les éléments with assignments

Chercher patterns communs :

- `<div data-type="assign">` - Bloc assignment
- `<span class="activity-name">` - Titre du devoir
- `<span class="duedate">` - Date de rendu
- `<div class="submitted">` - Statut soumis

#### Étape 3.2 : Mettre à jour les sélecteurs Cheerio

Dans `backend/src/scrapers/moodleScraper.ts`, ajuster :

```typescript
// Chercher les assignments
$('[data-type="assign"], .btn-assignment, .assignment').each((i, el) => {
  const title = $(el).find(".activity-name, h3, .title").text();
  const dueDate = $(el).find(".due, .duedate").text();
  // ...
});
```

S'il n'y a rien, utiliser l'inspecteur pour identifier d'autres sélecteurs.

#### Étape 3.3 : Tester le parsing

```bash
curl 'http://localhost:3001/api/assignments?sessionId=SESSION_ID'
```

Devrait retourner :

```json
{
  "success": true,
  "data": [
    {
      "id": "course-123-assign-1",
      "title": "Devoir Mathématiques",
      "course": "MAT101",
      "dueDate": "2026-03-25T23:59:00Z",
      "priority": "high",
      "submissionStatus": "not_submitted",
      "url": "https://moodle.../submit.php?..."
    }
  ],
  "cached": false
}
```

Si vide : les sélecteurs CSS ne correspondent pas

#### Étape 3.4 : Déboguer le parsing

```javascript
// Dans moodleScraper.ts, ajouter logs
console.log("HTML received:", response.data.substring(0, 500));
$('[data-type="assign"]').each((i) => {
  console.log(`Found assignment ${i}:`, $(el).html());
});
```

---

### **Phase 4 : Intégrer React Frontend** (60 min)

#### Étape 4.1 : Mettre à jour src/App.tsx

```typescript
const BACKEND_URL = "http://localhost:3001";

const login = async (event: React.FormEvent) => {
  event.preventDefault();
  try {
    const response = await axios.post(`${BACKEND_URL}/api/auth/login`, {
      username,
      password,
    });

    setSessionId(response.data.sessionId); // ✨ Nouveau
    // ...
  } catch (error) {
    setError(error.message);
  }
};

// Quand connecté, fetch assignments
useEffect(() => {
  if (!sessionId) return;

  axios
    .get(`${BACKEND_URL}/api/assignments`, {
      params: { sessionId },
    })
    .then((res) => setAssignments(res.data.data))
    .catch((err) => setError(err.message));
}, [sessionId]);
```

#### Étape 4.2 : Corriger Type Mismatch

Le service Moodle change : retour de `MoodleToken` au backend, pas au frontend.

```typescript
// frontend: moodleService.ts
export async function loginMoodle(username: string, password: string) {
  const response = await axios.post("http://localhost:3001/api/auth/login", {
    username,
    password,
  });
  return response.data.sessionId; // Retourner juste l'ID
}
```

#### Étape 4.3 : Tester intégration

1. Démarrer frontend : `npm run dev` (port 5173)
2. Démarrer backend : `npm run dev` (port 3001)
3. Login dans React
4. Voir devoirs s'afficher

---

### **Phase 5 : Sécurité et Robustesse** (60 min)

#### Étape 5.1 : Ajouter Rate Limiting

Backend a déjà 5 tentatives par 15 min. Vérifier dans browser DevTools :

```
✅ Après 5 échecs → 429 Too Many Requests
```

#### Étape 5.2 : Ajouter Retry Logic au Frontend

```typescript
async function fetchWithRetry(url, options, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fetch(url, options);
    } catch (error) {
      if (i < maxRetries - 1) {
        await new Promise((r) => setTimeout(r, 1000 * (i + 1))); // Backoff exponentiel
      } else {
        throw error;
      }
    }
  }
}
```

#### Étape 5.3 : Implémenter Offline Fallback

```typescript
// Sauvegarder assignments en localStorage
localStorage.setItem("cachedAssignments", JSON.stringify(assignments));

// Si API échoue, charger depuis cache
const getCachedAssignments = () => {
  const cached = localStorage.getItem("cachedAssignments");
  return cached ? JSON.parse(cached) : [];
};
```

#### Étape 5.4 : Ajouter HTTPS (Production)

Actuellement HTTP local = OK pour dev.

Pour production :

```bash
# Générer certificat self-signed
openssl req -x509 -newkey rsa:4096 -nodes -out cert.pem -keyout key.pem -days 365

# Utiliser dans Express
import https from 'https';
import fs from 'fs';

const options = {
  key: fs.readFileSync('key.pem'),
  cert: fs.readFileSync('cert.pem')
};

https.createServer(options, app).listen(3001);
```

---

### **Phase 6 : Monitoring et Maintenance** (30 min)

#### Étape 6.1 : Ajouter Logging Appliqué

```typescript
// Dans moodleScraper.ts
console.log(`📋 Fetching for ${session.username}`);
console.log(`✅ Found ${assignments.length} assignments`);
console.error(`❌ Parse failed:`, error.message);
```

#### Étape 6.2 : Documenter Changements Moodle

Créer `docs/moodle-selectors.md` :

```markdown
# Moodle HTML Selectors (v4.0+)

## Assignments

- Container: `[data-type="assign"]`
- Title: `.activity-name`
- Due: `.duedate`

## Courses

- Container: `[data-course-id]`
- Title: `.course-name`
```

#### Étape 6.3 : Tests Automatisés

```bash
npm install --save-dev jest @types/jest

# backend/__tests__/parsers.test.ts
describe('HTML Parsers', () => {
  it('should extract assignments from HTML', () => {
    const html = `<div data-type="assign">...</div>`;
    const assignments = parseAssignments(html);
    expect(assignments).toHaveLength(1);
  });
});
```

---

## 🎯 Checklist Complète

### Backend Setup

- [ ] `mkdir backend && cd backend`
- [ ] `npm install` (dépendances)
- [ ] `cp .env.example .env`
- [ ] Configurer `MOODLE_BASE_URL`
- [ ] `npm run dev` (serveur démarre)

### Connexion Moodle

- [ ] Test `curl /api/auth/login` avec vrais identifiants
- [ ] Vérifier réponse avec sessionId
- [ ] Check rate limiting après 5 tentatives

### HTML Parsing

- [ ] Inspecter `/my/index.php` avec DevTools
- [ ] Adapter sélecteurs CSS dans moodleScraper.ts
- [ ] Test `/api/assignments?sessionId=...` retourne devoirs

### Frontend Integration

- [ ] Adapter `src/App.tsx` pour appeler backend
- [ ] Ajouter state pour `sessionId`
- [ ] Affichage assignments depuis backend
- [ ] Gestion erreurs + fallback offline

### Production

- [ ] HTTPS pour local backend
- [ ] Redis pour sessions persistantes
- [ ] Tests automatisés pour parsers
- [ ] Monitoring/Sentry
- [ ] Documentation sélecteurs Moodle

---

## 🆘 Troubleshooting

| Problème          | Solution                                               |
| ----------------- | ------------------------------------------------------ |
| Login fails       | URL Moodle, identifiants, CSRF token                   |
| CORS error        | Vérifier CORS middleware dans server.ts                |
| Assignments vides | Sélecteurs CSS ne correspondent pas, vérifier DevTools |
| Cache stale       | Manuellement `/api/assignments/clear-cache`            |
| Session expirée   | Réimlog automaticly sur erreur 401                     |

---

## 📚 Ressources

- [Cheerio Documentation](https://cheerio.js.org/)
- [Axios Documentation](https://axios-http.com/)
- [Moodle Theming Guide](https://docs.moodle.org/dev/Theme)
- [Express.js Guide](https://expressjs.com/)

---

## ✅ Succès Atteint Quand

1. ✅ Backend lance sans erreur
2. ✅ Login retourne sessionId
3. ✅ `/api/assignments` retourne vrais devoirs
4. ✅ React affiche devoirs du serveur
5. ✅ Rate limiting fonctionne
6. ✅ Pas de CORS errors
7. ✅ Offline fallback marche
