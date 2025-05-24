const express = require('express');
const router = express.Router({ mergeParams: true });
const Channel = require('../models/Channel');
const Workspace = require('../models/Workspace');
const jwt = require('jsonwebtoken');

// ✅ Middleware d’authentification
const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token manquant' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { _id: decoded.id };
    next();
  } catch {
    return res.status(401).json({ error: 'Token invalide' });
  }
};

// ✅ Créer un canal dans un workspace
router.post('/', requireAuth, async (req, res) => {
  const { name, description } = req.body;
  const { workspaceId } = req.params;

  if (!name || !workspaceId) {
    return res.status(400).json({ error: 'Nom ou workspace manquant' });
  }

  try {
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return res.status(404).json({ error: 'Workspace introuvable' });
    }

    const channel = await Channel.create({
      name,
      description,
      workspace: workspaceId,
      createdBy: req.user._id,
      members: [req.user._id],
    });

    res.status(201).json(channel);
  } catch (err) {
    console.error('❌ ERREUR SERVER CRÉATION CANAL :', err);
    res.status(500).json({ error: 'Erreur création canal' });
  }
});

// ✅ Récupérer tous les canaux d’un workspace
router.get('/', requireAuth, async (req, res) => {
  const { workspaceId } = req.params;

  if (!workspaceId) {
    return res.status(400).json({ error: 'Workspace ID manquant' });
  }

  try {
    const channels = await Channel.find({ workspace: workspaceId });
    res.status(200).json(channels);
  } catch (err) {
    console.error('❌ ERREUR RÉCUPÉRATION CANAUX :', err);
    res.status(500).json({ error: 'Erreur récupération canaux' });
  }
});

module.exports = router;