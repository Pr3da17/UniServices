# 🚀 Quick Start : Backend Web Scraping

## 5 Minutes pour Démarrer

### Étape 1 : Installation (2 min)

```bash
cd backend
npm install
```

### Étape 2 : Configuration (1 min)

```bash
# Créer .env
cat > .env << EOF
MOODLE_BASE_URL=https://moodle.universite.edu
PORT=3001
NODE_ENV=development
EOF
```

**Remplacer l'URL par ta vraie instance Moodle !**

### Étape 3 : Lancer (30 sec)

```bash
npm run dev
```

Devrait afficher :

```
🎓 Moodle Scraper Backend running on http://localhost:3001
📚 Scraping from: https://moodle.universite.edu
```

### Étape 4 : Test (1.5 min)

```bash
# Test login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"ton_login","password":"ton_mot_de_passe"}'
```

Réponse attendue :

```json
{
  "success": true,
  "sessionId": "session_1234567890_abc123",
  "userId": "12345",
  "username": "ton_login"
}
```

### Étape 5 : Récupérer Devoirs (1 min)

Remplacer `SESSION_ID` par le sessionId de l'étape 4 :

```bash
curl 'http://localhost:3001/api/assignments?sessionId=SESSION_ID'
```

Si ça fonctionne, tu devrais voir :

```json
{
  "success": true,
  "data": [
    {
      "title": "Devoir Mathématiques",
      "course": "MAT101",
      "dueDate": "2026-03-25T23:59:00Z",
      "priority": "high"
    }
  ]
}
```

### Étape 6 : Connecter React

Dans `src/moodleService.ts` :

```typescript
const BACKEND_URL = "http://localhost:3001";

export async function loginMoodle(username: string, password: string) {
  const response = await axios.post(`${BACKEND_URL}/api/auth/login`, {
    username,
    password,
  });
  return response.data.sessionId;
}
```

---

## Résumé de l'Architecture

```
React (localhost:5173)
    ↓
Express Backend (localhost:3001)
    ↓
Moodle (université)
```

1. **Frontend** : Envoie login au backend
2. **Backend** : Scrape Moodle, retourne sessionId
3. **Frontend** : Utilise sessionId pour récupérer devoirs
4. **Backend** : Parse HTML Moodle, retourne JSON

---

## Commandes Clés

```bash
npm run dev         # Lancer dev (hot reload)
npm run build       # Compiler TypeScript
npm start           # Run production
curl localhost:3001/health  # Health check
```

---

## Si Ça N'Marche Pas

### "Login failed"

- Vérifier URL Moodle dans `.env`
- Vérifier identifiants
- Vérifier que Moodle est accessible

### "Cannot find assignments"

- HTML parsing broken
- Vérifier sélecteurs Cheerio dans `moodleScraper.ts`
- Utiliser Browser DevTools pour inspecter `/my/index.php`

### CORS errors

- Frontend sur `https://localhost:5173`?
- Backend doit avoir CORS enabled (déjà fait)

---

## Prochaine Étape

Lire `IMPLEMENTATION_PLAN.md` pour détails complets.
