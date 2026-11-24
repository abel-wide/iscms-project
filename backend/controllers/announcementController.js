const Announcement = require('../models/Announcement');
const Notification = require('../models/Notification');
const User = require('../models/User');

// ==========================================
// 1. CREATE ANNOUNCEMENT
// POST /api/announcements
// Roles: admin, registrar, teacher
// ==========================================
exports.createAnnouncement = async (req, res) => {
  try {
    const { title, message, audience, priority, category, expiresAt } = req.body;

    if (!title || !message) {
      return res.status(400).json({
        message: 'title and message are required'
      });
    }

    const announcement = await Announcement.create({
      title,
      message,
      audience: audience || 'all',
      priority: priority || 'normal',
      category: category || 'general',
      publishedBy: req.user._id,
      expiresAt: expiresAt ? new Date(expiresAt) : null
    });

    // 👇 Send in-app notification to target audience (parents, students, etc.)
    try {
      const recipientFilter = { isActive: true };
      if (audience === 'students') recipientFilter.role = 'student';
      else if (audience === 'teachers') recipientFilter.role = 'teacher';
      else if (audience === 'parents') recipientFilter.role = 'parent';
      else if (audience === 'staff') recipientFilter.role = { $in: ['admin', 'registrar', 'teacher', 'head'] };

      const recipients = await User.find(recipientFilter, '_id');
      if (recipients.length > 0) {
        const notifDocs = recipients.map(u => ({
          recipient: u._id,
          sender: req.user._id,
          title: `Announcement: ${title}`,
          message: message.length > 150 ? message.slice(0, 150) + '...' : message,
          type: 'announcement',
          priority: priority || 'normal'
        }));
        await Notification.insertMany(notifDocs);
      }
    } catch (notifErr) {
      console.warn('Failed to dispatch announcement notifications:', notifErr.message);
    }

    res.status(201).json({
      message: 'Announcement published successfully',
      announcement
    });
  } catch (error) {
    console.error('=== createAnnouncement ERROR ===');
    console.error(error.stack);
    res.status(500).json({
      message: 'Error creating announcement',
      error: error.message
    });
  }
};

// ==========================================
// 2. GET ALL ANNOUNCEMENTS
// GET /api/announcements
// Roles: admin, registrar, teacher
// ==========================================
exports.getAllAnnouncements = async (req, res) => {
  try {
    const { audience, priority, category, isActive } = req.query;

    const filter = {};
    if (audience) filter.audience = audience;
    if (priority) filter.priority = priority;
    if (category) filter.category = category;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const announcements = await Announcement.find(filter)
      .populate('publishedBy', 'fullName email role')
      .sort({ createdAt: -1 });

    res.json({
      message: 'Announcements fetched',
      count: announcements.length,
      announcements
    });
  } catch (error) {
    console.error('=== getAllAnnouncements ERROR ===');
    console.error(error.stack);
    res.status(500).json({
      message: 'Error fetching announcements',
      error: error.message
    });
  }
};

// ==========================================
// 3. GET ACTIVE ANNOUNCEMENTS FOR A USER
// GET /api/announcements/active
// Roles: any logged-in user
// ==========================================
exports.getActiveAnnouncements = async (req, res) => {
  try {
    const now = new Date();

    const announcements = await Announcement.find({
      isActive: true,
      $and: [
        {
          $or: [
            { expiresAt: null },
            { expiresAt: { $gt: now } }
          ]
        },
        {
          $or: [
            { audience: 'all' },
            { audience: req.user.role + 's' }
          ]
        }
      ]
    })
      .populate('publishedBy', 'fullName')
      .sort({ priority: -1, createdAt: -1 })
      .limit(20);

    res.json({
      message: 'Active announcements fetched',
      count: announcements.length,
      announcements
    });
  } catch (error) {
    console.error('=== getActiveAnnouncements ERROR ===');
    console.error(error.stack);
    res.status(500).json({
      message: 'Error fetching announcements',
      error: error.message
    });
  }
};

// ==========================================
// 4. UPDATE ANNOUNCEMENT
// PUT /api/announcements/:id
// Roles: admin, registrar, or the teacher who created it
// ==========================================
exports.updateAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);

    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }

    // Teacher can only edit their own announcements
    if (
      req.user.role === 'teacher' &&
      announcement.publishedBy.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        message: 'You can only edit your own announcements'
      });
    }

    const fields = [
      'title',
      'message',
      'audience',
      'priority',
      'category',
      'expiresAt',
      'isActive'
    ];

    fields.forEach((f) => {
      if (req.body[f] !== undefined) {
        announcement[f] =
          f === 'expiresAt' && req.body[f]
            ? new Date(req.body[f])
            : req.body[f];
      }
    });

    await announcement.save();

    res.json({
      message: 'Announcement updated',
      announcement
    });
  } catch (error) {
    console.error('=== updateAnnouncement ERROR ===');
    console.error(error.stack);
    res.status(500).json({
      message: 'Error updating announcement',
      error: error.message
    });
  }
};

// ==========================================
// 5. DELETE ANNOUNCEMENT
// DELETE /api/announcements/:id
// Roles: admin, registrar, or the teacher who created it
// ==========================================
exports.deleteAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);

    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }

    // Teacher can only delete their own announcements
    if (
      req.user.role === 'teacher' &&
      announcement.publishedBy.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        message: 'You can only delete your own announcements'
      });
    }

    await announcement.deleteOne();

    res.json({ message: 'Announcement deleted successfully' });
  } catch (error) {
    console.error('=== deleteAnnouncement ERROR ===');
    console.error(error.stack);
    res.status(500).json({
      message: 'Error deleting announcement',
      error: error.message
    });
  }
};