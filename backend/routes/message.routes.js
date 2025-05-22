const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Message = require('../models/DirectMessage');
const fs = require('fs');

// Upload config
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

// Upload fichier
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const { senderId, receiverId, type } = req.body;
    const newMsg = await Message.create({
      senderId,
      receiverId,
      type: type || 'file',
      attachmentUrl: `http://localhost:5050/uploads/${req.file.filename}`,
      timestamp: new Date().toISOString()
    });
    res.json(newMsg);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur enregistrement fichier' });
  }
});

// Liste des messages entre 2 utilisateurs
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