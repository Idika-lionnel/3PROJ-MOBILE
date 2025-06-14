const User = require('../models/User');
const DirectMessage = require('../models/DirectMessage'); // à adapter si tu as d'autres modèles
const ChannelMessage = require('../models/ChannelMessage');
const fs = require('fs');
const path = require('path');

// 👤 Récupérer l'utilisateur connecté
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json({ user });
  } catch (err) {
    console.error('Erreur getMe :', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// 📄 Récupérer tous les fichiers reçus par l'utilisateur
exports.getDocuments = async (req, res) => {
  try {
    const userId = req.user.id;

    const directFiles = await DirectMessage.find({
      receiver: userId,
      attachmentUrl: { $exists: true, $ne: '' }
    });

    const channelFiles = await ChannelMessage.find({
      attachmentUrl: { $exists: true, $ne: '' },
      // tu peux aussi filtrer par appartenance au canal ici
    });

    const allFiles = [...directFiles, ...channelFiles];

    res.json({ files: allFiles });
  } catch (err) {
    console.error('Erreur getDocuments :', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// ✏️ Modifier le profil utilisateur
exports.updateProfile = async (req, res) => {
  try {
    const { prenom, nom } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { prenom, nom },
      { new: true }
    ).select('-password');
    res.json({ user });
  } catch (err) {
    console.error('Erreur updateProfile :', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// ❌ Supprimer le compte utilisateur
exports.deleteAccount = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.user.id);
    res.json({ message: 'Compte supprimé' });
  } catch (err) {
    console.error('Erreur deleteAccount :', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// 📤 Exporter les données utilisateur
exports.exportData = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    const messages = await DirectMessage.find({
      $or: [{ sender: user.id }, { receiver: user.id }]
    });

    const data = {
      user,
      messages
    };

    res.json({ data });
  } catch (err) {
    console.error('Erreur exportData :', err);
    res.status(500).json({ error: 'Erreur export' });
  }
};

// 👥 Récupérer tous les utilisateurs (optionnel)
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json({ users });
  } catch (err) {
    console.error('Erreur getAllUsers :', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};