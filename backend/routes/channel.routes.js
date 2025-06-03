const express = require('express');
const router = express.Router({ mergeParams: true });
const Channel = require('../models/Channel');
const Workspace = require('../models/Workspace');
const ChannelMessage = require('../models/ChannelMessage');
const jwt = require('jsonwebtoken');
const User = require('../models/User');


// 📦 Pour upload de fichiers
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 📁 Configuration multer
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
      members: [req.user._id], // Le créateur est membre automatiquement
    });

    res.status(201).json(channel);
  } catch (err) {
    console.error('❌ ERREUR SERVER CRÉATION CANAL :', err);
    res.status(500).json({ error: 'Erreur création canal' });
  }
});

// ✅ Récupérer les canaux du workspace où l'utilisateur est membre
router.get('/', requireAuth, async (req, res) => {
  const { workspaceId } = req.params;

  if (!workspaceId) {
    return res.status(400).json({ error: 'Workspace ID manquant' });
  }

  try {
    const channels = await Channel.find({
      workspace: workspaceId,
      members: req.user._id,
    });

    res.status(200).json(channels);
  } catch (err) {
    console.error('❌ ERREUR RÉCUPÉRATION CANAUX :', err);
    res.status(500).json({ error: 'Erreur récupération canaux' });
  }
});

// ✅ Créer un message texte dans un canal
router.post('/:id/messages', requireAuth, async (req, res) => {
    console.log('message envoyé ');
  try {
    const message = await ChannelMessage.create({
      content: req.body.content || '',
      channel: req.params.id,
      senderId: req.user._id,
    });

    const fullMessage = await message.populate('senderId', 'prenom nom');

    const io = req.app.get('io');
    io.to(req.params.id).emit('new_channel_message', fullMessage);

    res.status(201).json(fullMessage);
  } catch (err) {
    console.error('❌ ERREUR ENVOI MESSAGE CANAL :', err);
    res.status(500).json({ error: 'Erreur envoi message' });
  }
});

// ✅ Récupérer tous les messages d’un canal
router.get('/:id/messages', requireAuth, async (req, res) => {
  try {
    const messages = await ChannelMessage.find({ channel: req.params.id })
      .sort({ createdAt: 1 })
      .populate('senderId', 'prenom nom')
      .populate('reactions.userId', 'prenom nom');

    res.json(messages);
  } catch (err) {
    console.error('❌ ERREUR RÉCUP MESSAGES CANAL :', err);
    res.status(500).json({ error: 'Erreur récupération messages' });
  }
});

// 📤 Envoi de fichier dans un canal
router.post(
  '/upload/channel/:channelId',
  requireAuth, //  Auth obligatoire
  upload.single('file'),
  async (req, res) => {
    console.log('📥 Requête upload reçue');

    if (!req.file) {
      console.log('❌ Aucun fichier reçu');
      return res.status(400).json({ error: 'Aucun fichier reçu' });
    }

    const senderId = req.user._id;

    console.log('✅ Fichier reçu :', req.file.originalname);
    console.log('👤 Utilisateur :', senderId);

    const message = await ChannelMessage.create({
      senderId,
      channel: req.params.channelId,
      attachmentUrl: `http://${req.hostname}:5050/uploads/${req.file.filename}`,
      type: 'file',
      content: '',
    });

    const fullMessage = await message.populate('senderId', 'prenom nom');

    const io = req.app.get('io');
    io.to(req.params.channelId).emit('new_channel_message', fullMessage);

    res.status(200).json(fullMessage);
  }
);

// ✅ Récupérer un canal par son ID
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const channel = await Channel.findById(req.params.id).populate('members', 'prenom nom email');
    if (!channel) {
      return res.status(404).json({ error: 'Canal introuvable' });
    }
    res.status(200).json(channel);
  } catch (err) {
    console.error('❌ ERREUR RÉCUPÉRATION CANAL PAR ID :', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});
// ✅ Ajouter ou retirer une réaction sur un message de canal
router.post('/reaction/:messageId', requireAuth, async (req, res) => {
  const { messageId } = req.params;
  const { emoji } = req.body;
  const userId = req.user._id;

  if (!emoji) return res.status(400).json({ error: 'Emoji requis' });

  try {
    const message = await ChannelMessage.findById(messageId);
    if (!message) return res.status(404).json({ error: 'Message non trouvé' });

    const existing = message.reactions.find(r => r.userId.toString() === userId.toString());

    if (existing) {
      if (existing.emoji === emoji) {
        // 🧽 Supprimer la réaction si c’est le même emoji
        message.reactions = message.reactions.filter(r => r.userId.toString() !== userId.toString());
        await message.save();

        const io = req.app.get('io');
        io.to(message.channel.toString()).emit('channel_reaction_removed', {
          messageId,
          userId,
          channelId: message.channel.toString()
        });

        return res.status(200).json({ message: 'Réaction supprimée' });
      } else {
        // 🔄 Modifier l’emoji
        existing.emoji = emoji;
        await message.save();

        const io = req.app.get('io');
        io.to(message.channel.toString()).emit('channel_reaction_updated', {
          messageId,
          userId,
          emoji,
          channelId: message.channel.toString()
        });

        return res.status(200).json({ message: 'Réaction modifiée' });
      }
    } else {
      // ➕ Ajouter une nouvelle réaction
      message.reactions.push({ userId, emoji });
      await message.save();

      const io = req.app.get('io');
      io.to(message.channel.toString()).emit('channel_reaction_updated', {
        messageId,
        userId,
        emoji,
        channelId: message.channel.toString()
      });

      return res.status(200).json({ message: 'Réaction ajoutée' });
    }
  } catch (err) {
    console.error('❌ Erreur ajout/rétractation réaction canal :', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

//route invitation channels
router.post('/:id/invite', requireAuth, async (req, res) => {
  const { id } = req.params;
  const { email } = req.body;
  const userId = req.user._id;

  try {
    console.log('🔔 Invitation reçue pour', email);

    const channel = await Channel.findById(id);
    if (!channel) return res.status(404).json({ error: 'Canal non trouvé' });

    // Vérifie bien que channel.createdBy existe
    if (!channel.createdBy || channel.createdBy.toString() !== userId.toString()) {
      return res.status(403).json({ error: 'Non autorisé' });
    }

    const invitedUser = await User.findOne({ email: email.trim().toLowerCase() });
    if (!invitedUser) return res.status(404).json({ error: 'Utilisateur introuvable' });

    if (channel.members.includes(invitedUser._id)) {
      return res.status(400).json({ error: 'Déjà membre' });
    }

    channel.members.push(invitedUser._id);
    await channel.save();

    res.status(200).json(invitedUser);
  } catch (err) {
    console.error('❌ ERREUR DANS INVITE CHANNEL :', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});
router.delete('/:channelId/members/:userId', requireAuth, async (req, res) => {
  const { channelId, userId } = req.params;
  const currentUserId = req.user._id;

  try {
    const channel = await Channel.findById(channelId);
    if (!channel) return res.status(404).json({ error: 'Canal non trouvé' });

    // Vérifie que seul le créateur peut supprimer
    if (channel.createdBy.toString() !== currentUserId.toString()) {
      return res.status(403).json({ error: 'Action non autorisée' });
    }

    // Ne pas retirer le créateur lui-même
    if (userId === currentUserId.toString()) {
      return res.status(400).json({ error: 'Le créateur ne peut pas se retirer lui-même' });
    }

    channel.members = channel.members.filter(id => id.toString() !== userId);
    await channel.save();
    const io = req.app.get('io');
    io.to(channel._id.toString()).emit('channel_member_removed', {
      channelId: channel._id.toString(),
      userId, // identifiant du membre retiré
    });
    // Notifie uniquement l'utilisateur retiré
    io.to(userId).emit('removed_from_channel', {
      channelId: channel._id.toString(),
    });

    res.status(200).json({ message: 'Membre supprimé avec succès' });
  } catch (err) {
    console.error('❌ Erreur suppression membre :', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});



// ❌ Supprimer une réaction dans un canal
router.delete('/reaction/:messageId', requireAuth, async (req, res) => {
  const { messageId } = req.params;
  const userId = req.user._id;

  try {
    const message = await ChannelMessage.findById(messageId);
    if (!message) return res.status(404).json({ error: 'Message non trouvé' });

    message.reactions = message.reactions.filter(r => r.userId.toString() !== userId.toString());
    await message.save();


    const io = req.app.get('io');
    io.to(message.channel.toString()).emit('channel_reaction_removed', {
      messageId,
      userId,
      channelId: message.channel.toString()
    });

    io.to(userId).emit('removed_from_channel', { channelId });
    res.status(200).json({ message: 'Réaction supprimée' });
  } catch (err) {
    console.error('❌ Erreur suppression réaction canal :', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});



module.exports = router;
