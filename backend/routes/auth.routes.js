const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware.js'); 
const { OAuth2Client } = require('google-auth-library');
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// 🔧 Générer un token JWT
const generateToken = (user) => {
  return jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
};

// 📥 Inscription
router.post('/register', async (req, res) => {
  const { email, prenom, nom, password } = req.body;
  if (!email || !prenom || !nom || !password) {
    return res.status(400).json({ error: 'Champs requis manquants' });
  }
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: 'Email déjà utilisé' });

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({
      email,
      prenom,
      nom,
      password: hashed,
      role: 'membre'
    });

    res.status(201).json({
      message: 'Utilisateur créé',
      user: {
        id: user._id,
        email: user.email,
        prenom: user.prenom,
        nom: user.nom,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Erreur inscription :', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// 🔑 Connexion classique
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'Identifiants invalides' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ error: 'Identifiants invalides' });

    const token = generateToken(user);

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        prenom: user.prenom,
        nom: user.nom,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Erreur login :', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// 🌐 Google OAuth2 (web)
router.get('/google', (req, res, next) => {
  const redirect_uri = req.query.redirect_uri;
  const state = Buffer.from(JSON.stringify({ redirect_uri })).toString('base64');
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    state,
  })(req, res, next);
});

router.get('/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/' }),
  (req, res) => {
    const user = req.user;
    const token = generateToken(user);
    const state = req.query.state
      ? JSON.parse(Buffer.from(req.query.state, 'base64').toString())
      : {};
    const redirect_uri = state.redirect_uri || 'http://localhost:3000/login';
    res.redirect(`${redirect_uri}?token=${token}`);
  }
);

// 🐙 GitHub OAuth2 (web)
router.get('/github', (req, res, next) => {
  const redirect_uri = req.query.redirect_uri;
  const state = Buffer.from(JSON.stringify({ redirect_uri })).toString('base64');
  passport.authenticate('github', {
    scope: ['user:email'],
    state,
  })(req, res, next);
});

router.get('/github/callback',
  passport.authenticate('github', { session: false, failureRedirect: '/' }),
  (req, res) => {
    const user = req.user;
    const token = generateToken(user);
    const state = req.query.state
      ? JSON.parse(Buffer.from(req.query.state, 'base64').toString())
      : {};
    const redirect_uri = state.redirect_uri || 'http://localhost:3000/login';
    res.redirect(`${redirect_uri}?token=${token}`);
  }
);

// 👤 Récupération de l'utilisateur connecté (sécurisé)
router.get('/me', authMiddleware, async (req, res) => {
  res.json({ user: req.user });
});

// 📱 Connexion mobile via Google
router.get('/google/mobile', async (req, res) => {
  const accessToken = req.query.access_token;
  if (!accessToken) {
    return res.status(400).json({ error: 'Access token manquant' });
  }

  try {
    const ticket = await googleClient.getTokenInfo(accessToken);
    const email = ticket.email;

    if (!email) {
      return res.status(400).json({ error: 'Email non trouvé dans le token' });
    }

    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        email,
        prenom: 'Google',
        nom: 'User',
        password: '',
        role: 'membre',
      });
    }

    const token = generateToken(user);
    res.json({ token });

  } catch (err) {
    console.error('Erreur Google mobile login :', err);
    res.status(500).json({ error: 'Erreur authentification Google' });
  }
});

module.exports = router;