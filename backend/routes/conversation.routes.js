const express = require('express');
const router = express.Router();
const Conversation = require('../models/Conversation');
const requireAuth = require('../middleware/requireAuth'); // crée ce fichier si besoin

router.post('/', requireAuth, async (req, res) => {
  try {
    const { senderId, receiverId } = req.body;

    if (!senderId || !receiverId) {
      return res.status(400).json({ error: 'senderId et receiverId requis' });
    }

    const senderObjId = new mongoose.Types.ObjectId(senderId);
    const receiverObjId = new mongoose.Types.ObjectId(receiverId);

    // ✅ Recherche conversation avec ObjectId simples
    let conv = await Conversation.findOne({
      participants: { $all: [senderObjId, receiverObjId], $size: 2 },
    });

    if (!conv) {
      conv = await Conversation.create({
        participants: [senderId, receiverId],
        lastMessage: '',
        lastHour: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        updatedAt: new Date()
      });

    }

    res.status(201).json(conv);
  } catch (err) {
    console.error('Erreur création conversation :', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});
// 🔄 Obtenir toutes les conversations d'un utilisateur
router.get('/:userId', requireAuth, async (req, res) => {
  try {
    const userId = req.params.userId;

    const conversations = await Conversation.find({ participants: userId })
      .sort({ updatedAt: -1 })
      .populate('participants', 'prenom nom email') // Récupère infos utiles
      .lean();

    const formatted = conversations.map(conv => {
      const other = conv.participants.find(p => p._id.toString() !== userId);

      return {
        _id: conv._id,
        lastMessage: conv.lastMessage,
        lastHour: conv.lastHour,
        updatedAt: conv.updatedAt,
        otherUser: other, // Nom + email de l'autre participant
      };
    });

    res.json(formatted);
  } catch (err) {
    console.error('Erreur chargement conversations :', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});
module.exports = router;