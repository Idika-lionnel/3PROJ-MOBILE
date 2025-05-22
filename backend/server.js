const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const passport = require('passport');
const session = require('express-session');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

// 📦 Import des routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const conversationRoutes = require('./routes/conversation.routes');
const messageRoutes = require('./routes/message.routes');
const workspaceRoutes = require('./routes/workspace.routes'); // ✅ Ajouté

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
app.use('/api/workspaces', workspaceRoutes); // ✅ Ajouté ici

// 🛢️ Connexion MongoDB
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('✅ MongoDB connecté');
  })
  .catch((err) => {
    console.error('❌ Erreur MongoDB :', err);
  });

// 🔌 Serveur HTTP + Socket.io
const PORT = process.env.PORT || 5050;
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

// 🚀 Démarrage du serveur
server.listen(PORT, () => {
  console.log(`🌐 Serveur démarré sur http://localhost:${PORT}`);
});