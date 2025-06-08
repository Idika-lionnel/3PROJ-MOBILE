const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const DirectMessage = require('../models/DirectMessage');
const Channel = require('../models/Channel');
const ChannelMessage = require('../models/ChannelMessage');

const requireAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token manquant' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('_id prenom nom email');

    if (!user) return res.status(401).json({ error: 'Utilisateur introuvable' });

    req.user = user;
    req.userId = user._id;
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
// ✅ Tous les fichiers accessibles à un utilisateur
router.get('/documents', requireAuth, async (req, res) => {
  try {
    const userId = req.user._id.toString();

    // 🔹 1. Fichiers des messages directs où l’utilisateur est sender ou receiver
    const directFiles = await DirectMessage.find({
      attachmentUrl: { $ne: '' },
      $or: [
        { senderId: userId },
        { receiverId: userId }
      ]
    }).select('attachmentUrl createdAt senderId receiverId');

    // 🔹 2. Fichiers des canaux où l’utilisateur est membre
    const channels = await Channel.find({ members: userId }).select('_id name');
    const channelIds = channels.map(c => c._id);

    const channelFiles = await ChannelMessage.find({
      attachmentUrl: { $ne: '' },
      channel: { $in: channelIds }
    }).select('attachmentUrl createdAt senderId channel').populate('channel', 'name');

    // 🧩 Formatage unique
    const formatted = [
      ...directFiles.map(f => ({
        type: 'direct',
        attachmentUrl: f.attachmentUrl,
        from: f.senderId.toString() === userId ? 'moi' : 'autre',
        contactId: f.senderId.toString() === userId ? f.receiverId : f.senderId,
        createdAt: f.createdAt
      })),
      ...channelFiles.map(f => ({
        type: 'channel',
        attachmentUrl: f.attachmentUrl,
        channelId: f.channel._id,
        channelName: f.channel.name,
        createdAt: f.createdAt
      }))
    ];

    // ✅ Tri par date décroissante
    formatted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.status(200).json(formatted);
  } catch (err) {
    console.error('❌ Erreur documents utilisateur :', err);
    res.status(500).json({ error: 'Erreur serveur documents' });
  }
});


module.exports = router;