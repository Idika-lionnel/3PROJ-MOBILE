// server.js
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const passport = require('passport');
const session = require('express-session');
require('dotenv').config();

// Routes
const authRoutes = require('./routes/auth.routes');

// App init
const app = express();

// Middleware global
app.use(cors());
app.use(express.json());

// Session & Passport (si tu utilises OAuth2 Google/GitHub)
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'defaultsecret',
    resave: false,
    saveUninitialized: true,
  })
);
app.use(passport.initialize());
app.use(passport.session());

// Routes API
app.use('/api/auth', authRoutes); // ← très important !

// Connexion MongoDB
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('✅ MongoDB connecté');
  })
  .catch((err) => {
    console.error('❌ Erreur MongoDB :', err);
  });

// Démarrage du serveur
const PORT = process.env.PORT || 5050;
app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
});