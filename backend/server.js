// server.js
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const passport = require('passport');
const session = require('express-session');
const http = require('http');
const { Server } = require('socket.io');
const DirectMessage = require('./models/DirectMessage');
const Conversation = require('./models/Conversation');
require('dotenv').config();

// 📦 Import des routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const conversationRoutes = require('./routes/conversation.routes');
const messageRoutes = require('./routes/message.routes');
const workspaceRoutes = require('./routes/workspace.routes');

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

// 📁 Fichiers statiques
app.use('/uploads', express.static('uploads'));

// 🧭 Routes API
app.use('/api/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/workspaces', workspaceRoutes);

// 🛢️ MongoDB
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('✅ MongoDB connecté'))
  .catch((err) => console.error('❌ Erreur MongoDB :', err));

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
    if (userId) {
      socket.join(userId);
      console.log(`🟢 L'utilisateur ${userId} a rejoint sa room`);
    } else {
      console.warn('⚠️ userId non fourni dans "join"');
    }
  });

 socket.on('direct_message', async (msg) => {
   try {
     if (!msg.senderId || !msg.receiverId) {
       return console.warn('❌ senderId ou receiverId manquant dans le message');
     }

     // 🔁 Cas 1 : Fichier (déjà créé)
     if (msg.attachmentUrl && msg.type === 'file') {
       let conv = await Conversation.findOne({
         participants: { $all: [msg.senderId, msg.receiverId], $size: 2 }
       });

       if (!conv) {
         conv = await Conversation.create({
           participants: [msg.senderId, msg.receiverId],
           lastMessage: msg.attachmentUrl.split('/').pop() || '[Fichier]',
           lastHour: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
         });
       } else {
         await Conversation.updateOne(
           { _id: conv._id },
           {
             $set: {
               lastMessage: msg.attachmentUrl.split('/').pop() || '[Fichier]',
               lastHour: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
               updatedAt: new Date()
             }
           }
         );
       }

       return io.to(msg.receiverId).emit('new_direct_message', msg);
     }

     // 🔁 Cas 2 : Texte
     const savedMessage = await DirectMessage.create({
       senderId: msg.senderId,
       receiverId: msg.receiverId,
       message: msg.message || '',
       attachmentUrl: '',
       type: 'text',
       timestamp: new Date(),
     });

     let conv = await Conversation.findOne({
       participants: { $all: [msg.senderId, msg.receiverId], $size: 2 }
     });

     if (!conv) {
       conv = await Conversation.create({
         participants: [msg.senderId, msg.receiverId],
         lastMessage: msg.message,
         lastHour: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
       });
     } else {
       await Conversation.updateOne(
         { _id: conv._id },
         {
           $set: {
             lastMessage: msg.message,
             lastHour: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
             updatedAt: new Date()
           }
         }
       );
     }

     io.to(msg.receiverId).emit('new_direct_message', savedMessage);
     io.to(msg.senderId).emit('new_direct_message', savedMessage);
     console.log(`📤 Message ${savedMessage.type} envoyé à ${msg.receiverId}`);
   } catch (err) {
     console.error('❌ Erreur enregistrement message direct :', err);
   }
 });

  socket.on('disconnect', () => {
    console.log('❌ Client déconnecté');
  });
});

app.set('io', io);

// 🚀 Lancement
server.listen(PORT, () => {
  console.log(`🌐 Serveur démarré sur http://localhost:${PORT}`);
});
