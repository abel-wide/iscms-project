// routes/resourceRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Resource = require('../models/Resource');
const {
  uploadResource,
  getResourcesByClass,
  getResourceById,
  downloadResource,
  getMyResources,
  updateResource,
  deleteResource
} = require('../controllers/resourceController');
const { protect, allow } = require('../middleware/auth');

// ==========================================
// 1. የፋይል ማስቀመጫ ቦታ ማዘጋጀት (uploads ፎልደር)
// ==========================================
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// ==========================================
// 2. RESOURCE ROUTES
// ==========================================

// መምህር ፋይል ከኮምፒውተሩ ሲጭን (Upload File)
router.post(
  '/upload-file',
  protect,
  allow('teacher', 'admin'),
  upload.single('file'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

      const newResource = new Resource({
        title: req.body.title,
        description: req.body.description,
        type: req.body.type,
        url: fileUrl,
        classroomId: req.body.classroomId,
        subject: req.body.subject,
        teacher: req.user.id
      });

      await newResource.save();
      res.status(201).json({ message: 'File uploaded successfully', resource: newResource });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// መምህር በ URL ሲጭን (ከዚህ በፊት የነበረው)
router.post(
  '/upload',
  protect,
  allow('teacher', 'admin'),
  uploadResource
);

// መምህር የራሱን ሀብቶች ማየት
router.get(
  '/teacher/mine',
  protect,
  allow('teacher', 'admin'),
  getMyResources
);

// የክፍል ሀብቶችን ማየት (ለተማሪዎች፣ ወላጆች፣ መምህራን)
router.get(
  '/class/:classroomId',
  protect,
  allow('student', 'parent', 'teacher', 'admin', 'registrar'),
  getResourcesByClass
);

// ሀብት ማውረድ (Download)
router.get(
  '/:id/download',
  protect,
  allow('student', 'parent', 'teacher', 'admin', 'registrar'),
  downloadResource
);

// አንድን ሀብት ማየት
router.get(
  '/:id',
  protect,
  allow('student', 'parent', 'teacher', 'admin', 'registrar'),
  getResourceById
);

// ሀብት ማስተካከል
router.put(
  '/:id',
  protect,
  allow('teacher', 'admin'),
  updateResource
);

// ሀብት መሰረዝ
router.delete(
  '/:id',
  protect,
  allow('teacher', 'admin'),
  deleteResource
);

module.exports = router;