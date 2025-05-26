const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const passport = require('passport');
const session = require('express-session');
const http = require('http');
const { Server } = require('socket.io');
const os = require('os'); // ✅ Ajouté
require('dotenv').config();

// 📦 Import des routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const conversationRoutes = require('./routes/conversation.routes');
const messageRoutes = require('./routes/message.routes');
const workspaceRoutes = require('./routes/workspace.routes'); // ✅ contient les routes channels

// 🚀 App init
const app = express();

// 🌍 Middlewares globaux
app.use(cors());
app.use(express.json());

// 🛡️ Session & Passport (OAuth2)
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'defaultsecret',
    resave: false,
    saveUninitialized: true,
  })
);
app.use(passport.initialize());
app.use(passport.session());

// 🧭 Routes API
app.use('/api/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/workspaces', workspaceRoutes);

// 🛢️ Connexion MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connecté');
  })
  .catch((err) => {
    console.error('❌ Erreur MongoDB :', err);
  });

// 🔌 Serveur HTTP + Socket.io
const PORT = process.env.PORT || 5050;
const IP = '0.0.0.0'; // ✅ écoute toutes les interfaces réseau

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// 💬 Socket.io
io.on('connection', (socket) => {
  console.log('✅ Client connecté via Socket.io');

  socket.on('join', (userId) => {
    socket.join(userId);
    console.log(`🟢 L'utilisateur ${userId} a rejoint sa room`);
  });

  socket.on('direct_message', (msg) => {
    io.to(msg.receiverId).emit('new_direct_message', msg);
    console.log(`📩 Message direct de ${msg.senderId} à ${msg.receiverId}`);
  });

  socket.on('disconnect', () => {
    console.log('❌ Client déconnecté');
  });
});

// 🧠 Fonction pour récupérer l'IP locale
function getLocalIPAddress() {
  const interfaces = os.networkInterfaces();
  for (const name in interfaces) {
    for (const net of interfaces[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return 'localhost';
}

const localIP = getLocalIPAddress();

server.listen(PORT, IP, () => {
  console.log(`🌐 Serveur accessible sur http://${localIP}:${PORT}`);
});