const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const path = require('path'); 
const authRoutes = require('./routes/authRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const classRoutes = require('./routes/classRoutes');
const gradeRoutes = require('./routes/gradeRoutes');
const resourceRoutes = require('./routes/resourceRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const reportRoutes = require('./routes/reportRoutes');
const announcementRoutes = require('./routes/announcementRoutes');
const userRoutes = require('./routes/userRoutes');
const messageRoutes = require('./routes/messageRoutes');
const timetableRoutes = require('./routes/timetableRoutes');
const examRoutes = require('./routes/examRoutes');
const jobRoutes = require('./routes/jobRoutes');
require('dotenv').config();

const app = express();

// ==========================================
// 👇 የደህንነት ማሻሻያዎች (Security Middleware)
// ==========================================
app.use(helmet()); // የ HTTP ራስጌዎችን ይጠብቃል

// CORS ሴቲንግ
const allowedOrigins = [
  'https://iscms-project.vercel.app',
  'https://localhost',
  'capacitor://localhost'
];

app.use(cors({
  origin: function (origin, callback) {
    // Mobile apps, Postman ወይም server-to-server ጥሪዎች origin የላቸውም
    if (!origin) return callback(null, true);
    
    // Allow any localhost or 127.0.0.1 port (5173, 5174, etc.)
    if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
      return callback(null, true);
    }

    // Allow Vercel deployments and listed origins
    if (origin.endsWith('.vercel.app') || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    console.warn(`[CORS Blocked] Origin not allowed: ${origin}`);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

app.use(express.json());

// 👇 Express 5 Safe NoSQL Injection Sanitizer
// req.body, req.params እና req.query ውስጥ ያሉትን የ NoSQL አደገኛ ኦፕሬተሮች ($ እና .) ያጸዳል
app.use((req, res, next) => {
  if (req.body) mongoSanitize.sanitize(req.body);
  if (req.params) mongoSanitize.sanitize(req.params);
  if (req.query) {
    for (const key in req.query) {
      if (key.startsWith('$') || key.includes('.')) {
        delete req.query[key];
      } else if (typeof req.query[key] === 'object' && req.query[key] !== null) {
        mongoSanitize.sanitize(req.query[key]);
      }
    }
  }
  next();
});

// 👇 የ uploads ፎልደርን ለህዝብ ክፍት ማድረግ (ፋይሎች እንዲታዩ)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/grades', gradeRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/timetable', timetableRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/jobs', jobRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'ISCMS Backend is running!' });
});

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.log('❌ DB error:', err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});