const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// 🔐 Middleware d’authentification simple
const requireAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token manquant' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token invalide' });
  }
};

// ✅ Liste de tous les utilisateurs (authentifiés)
router.get('/all', requireAuth, async (req, res) => {
  try {
    const users = await User.find({}, '_id prenom nom email');
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Erreur récupération utilisateurs' });
  }
});

module.exports = router;