const express = require('express');
const router = express.Router();
const Conversation = require('../models/Conversation');
const requireAuth = require('../middleware/requireAuth'); // crée ce fichier si besoin

// 🔄 Obtenir toutes les conversations d'un utilisateur
router.get('/:userId', requireAuth, async (req, res) => {
  try {
    const userId = req.params.userId;

    const conversations = await Conversation.find({ 'participants._id': userId })
      .sort({ updatedAt: -1 })
      .lean();

    // Ajouter lastMessage et lastHour dans la réponse (simplifiée)
    const formatted = conversations.map(conv => {
      const last = conv.messages?.[conv.messages.length - 1];
      return {
        ...conv,
        lastMessage: last?.content || '',
        lastHour: last?.timestamp ? new Date(last.timestamp).toLocaleTimeString() : '',
      };
    });

    res.json(formatted);
  } catch (err) {
    console.error('Erreur chargement conversations :', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;