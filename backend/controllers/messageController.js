const Message = require('../models/Message');
const User = require('../models/User');
const Class = require('../models/Class');
const Notification = require('../models/Notification');

// @desc    Send a message to a recipient
// @route   POST /api/messages
// @access  Private (Teacher, Parent, Admin)
exports.sendMessage = async (req, res) => {
  try {
    const { recipientId, text } = req.body;

    if (!recipientId || !text || !text.trim()) {
      return res.status(400).json({ success: false, message: 'Recipient and message text are required' });
    }

    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ success: false, message: 'Recipient not found' });
    }

    const message = await Message.create({
      sender: req.user._id,
      recipient: recipientId,
      text: text.trim()
    });

    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'fullName email role')
      .populate('recipient', 'fullName email role');

    // Send in-app notification to recipient
    try {
      await Notification.create({
        recipient: recipientId,
        sender: req.user._id,
        title: `Message from ${req.user.fullName}`,
        message: text.length > 80 ? text.substring(0, 77) + '...' : text,
        type: 'general',
        priority: 'normal'
      });
    } catch (notifErr) {
      // Don't fail the message if notification creation encounters an issue
      console.warn('Could not create notification for message:', notifErr.message);
    }

    res.status(201).json({
      success: true,
      data: populatedMessage
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ success: false, message: 'Failed to send message', error: error.message });
  }
};

// @desc    Get all messages between logged-in user and another user
// @route   GET /api/messages/history/:otherUserId
// @access  Private
exports.getMessages = async (req, res) => {
  try {
    const { otherUserId } = req.params;

    const messages = await Message.find({
      $or: [
        { sender: req.user._id, recipient: otherUserId },
        { sender: otherUserId, recipient: req.user._id }
      ]
    })
      .sort({ createdAt: 1 })
      .populate('sender', 'fullName email role')
      .populate('recipient', 'fullName email role');

    // Mark unread messages sent by otherUser as read
    await Message.updateMany(
      { sender: otherUserId, recipient: req.user._id, read: false },
      { $set: { read: true, readAt: new Date() } }
    );

    res.json({
      success: true,
      count: messages.length,
      data: messages
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch messages', error: error.message });
  }
};

// @desc    Get recent conversation threads for the user
// @route   GET /api/messages/conversations
// @access  Private
exports.getConversations = async (req, res) => {
  try {
    const userId = req.user._id;

    // Find all messages involving this user
    const messages = await Message.find({
      $or: [{ sender: userId }, { recipient: userId }]
    })
      .sort({ createdAt: -1 })
      .populate('sender', 'fullName email role')
      .populate('recipient', 'fullName email role');

    const conversationMap = new Map();

    for (const msg of messages) {
      const otherUser = msg.sender._id.toString() === userId.toString()
        ? msg.recipient
        : msg.sender;

      if (!otherUser || !otherUser._id) continue;

      const otherUserIdStr = otherUser._id.toString();

      if (!conversationMap.has(otherUserIdStr)) {
        conversationMap.set(otherUserIdStr, {
          user: otherUser,
          lastMessage: msg,
          unreadCount: 0
        });
      }

      // If message was sent TO current user and is unread
      if (msg.recipient._id.toString() === userId.toString() && !msg.read) {
        const conv = conversationMap.get(otherUserIdStr);
        conv.unreadCount += 1;
      }
    }

    res.json({
      success: true,
      data: Array.from(conversationMap.values())
    });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch conversations', error: error.message });
  }
};

// @desc    Get available contacts to start chatting with
// @route   GET /api/messages/contacts
// @access  Private
exports.getContacts = async (req, res) => {
  try {
    const userRole = req.user.role;
    let contacts = [];

    if (userRole === 'parent') {
      // Parents can chat with teachers
      contacts = await User.find({ role: 'teacher', isActive: true })
        .select('fullName email role')
        .sort({ fullName: 1 });
    } else if (userRole === 'teacher') {
      // Teachers can chat with parents
      contacts = await User.find({ role: 'parent', isActive: true })
        .select('fullName email role')
        .sort({ fullName: 1 });
    } else {
      // Admins/Registrars/Heads can chat with both teachers and parents
      contacts = await User.find({ role: { $in: ['teacher', 'parent'] }, isActive: true })
        .select('fullName email role')
        .sort({ fullName: 1 });
    }

    res.json({
      success: true,
      count: contacts.length,
      data: contacts
    });
  } catch (error) {
    console.error('Error fetching contacts:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch contacts', error: error.message });
  }
};
