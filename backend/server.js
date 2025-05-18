const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();
const cors = require('cors');
const session = require('express-session');
const passport = require('passport');
require('./config/passport');

// 💡 Routes
const authRoutes = require('./routes/auth.routes');
const adminRoutes = require('./routes/admin.routes');
const workspaceRoutes = require('./routes/workspace.routes');
const userRoutes = require('./routes/user.routes'); // ✅ nouvelle route

const app = express();

app.use((req, res, next) => {
  console.log(`➡️ ${req.method} ${req.originalUrl}`);
  next();
});

// 🌍 CORS : autorise le frontend
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
}));

// 🧠 JSON parser
app.use(express.json());

// 🔐 Session pour Passport (non nécessaire si full JWT, mais gardé si mixte)
app.use(session({
  secret: process.env.SESSION_SECRET || 'supersecret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // false car on est en HTTP local
}));

// 🔑 Init Passport
app.use(passport.initialize());
app.use(passport.session());

// 📦 Routes
app.use('/auth', authRoutes);
app.use('/admin', adminRoutes);
app.use('/api/workspaces', workspaceRoutes);
app.use('/users', userRoutes); // ✅ utilisateurs pour affichage membres

// 🚀 Connexion à MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('✅ MongoDB connected');
  app.listen(process.env.PORT || 5050, () => {
    console.log(`🚀 Server running on http://localhost:${process.env.PORT || 5050}`);
  });
}).catch(err => console.error('❌ MongoDB error:', err));