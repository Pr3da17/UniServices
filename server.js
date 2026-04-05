/**
 * Serveur de production pour Infomaniak
 * Permet de servir les fichiers statiques du dossier 'dist'
 */
const express = require('express');
const path = require('path');
const app = express();

const PORT = process.env.PORT || 8080;

// On sert les fichiers statiques du build Vite
app.use(express.static(path.join(__dirname, 'dist')));

// Pour gérer les routes de React (SPAs), on renvoie tout sur index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`UniServices Frontend running on port ${PORT}`);
});
