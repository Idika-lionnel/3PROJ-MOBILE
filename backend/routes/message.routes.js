const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Message = require('../models/DirectMessage');
const fs = require('fs');

// 📁 Config multer (stockage fichiers)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = './uploads';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, unique + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// 📤 Route POST pour envoyer un fichier
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier reçu' });
    }

    const { senderId, receiverId, type } = req.body;
    if (!senderId || !receiverId) {
      return res.status(400).json({ error: 'Champs senderId ou receiverId manquants' });
    }

    const newMsg = await Message.create({
      senderId,
      receiverId,
      type: type || 'file',
      attachmentUrl: `http://${req.hostname}:5050/uploads/${req.file.filename}`,
      timestamp: new Date().toISOString()
    });

    // ✅ Émettre le message en temps réel via socket.io
    const io = req.app.get('io');
    io.to(receiverId).emit('new_direct_message', newMsg);
    io.to(senderId).emit('new_direct_message', newMsg); // pour affichage immédiat chez l'envoyeur aussi

    // ✅ Répondre au client mobile avec le message complet
    res.status(200).json(newMsg);
  } catch (err) {
    console.error('❌ Erreur upload fichier :', err);
    res.status(500).json({ error: 'Erreur enregistrement fichier' });
  }
});

// 🔁 Récupération des messages entre deux utilisateurs
router.get('/:receiverId', async (req, res) => {
  const { currentUserId } = req.query;
  const { receiverId } = req.params;

  try {
    const messages = await Message.find({
      $or: [
        { senderId: currentUserId, receiverId },
        { senderId: receiverId, receiverId: currentUserId }
      ]
    }).sort('timestamp');

    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: 'Erreur chargement messages' });
  }
});

module.exports = router;