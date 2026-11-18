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

// Helper to enrich user with child & homeroom teacher details
async function enrichUserWithChildDetails(targetUser, viewerUser) {
  const targetObj = targetUser?.toObject ? targetUser.toObject() : { ...targetUser };

  // If target is a PARENT: find their enrolled children and classes
  if (targetObj.role === 'parent') {
    const children = await User.find({ parent: targetObj._id, role: 'student' })
      .select('fullName gradeLevel')
      .lean();

    const childDetails = await Promise.all(
      children.map(async (child) => {
        const cls = await Class.findOne({ students: child._id })
          .select('className gradeLevel section homeroomTeacher')
          .lean();
        const isMyHomeroom =
          viewerUser?.role === 'teacher' &&
          cls?.homeroomTeacher &&
          cls.homeroomTeacher.toString() === viewerUser._id.toString();

        return {
          studentId: child._id,
          studentName: child.fullName,
          gradeLevel: child.gradeLevel || cls?.gradeLevel || '',
          className: cls?.className || 'Unassigned',
          section: cls?.section || '',
          isMyHomeroomStudent: Boolean(isMyHomeroom)
        };
      })
    );

    targetObj.children = childDetails;
    targetObj.hasHomeroomChildWithMe = childDetails.some((c) => c.isMyHomeroomStudent);
  }

  // If target is a TEACHER and viewer is a PARENT: check if teacher is child's homeroom teacher
  if (targetObj.role === 'teacher' && viewerUser?.role === 'parent') {
    const myChildren = await User.find({ parent: viewerUser._id, role: 'student' })
      .select('fullName')
      .lean();
    const childIds = myChildren.map((c) => c._id);

    const homeroomClasses = await Class.find({
      students: { $in: childIds },
      homeroomTeacher: targetObj._id
    })
      .select('className gradeLevel section students')
      .lean();

    const homeroomFor = [];
    for (const cls of homeroomClasses) {
      for (const child of myChildren) {
        if (cls.students && cls.students.some((sId) => sId.toString() === child._id.toString())) {
          homeroomFor.push({
            studentName: child.fullName,
            className: cls.className
          });
        }
      }
    }

    targetObj.isChildHomeroomTeacher = homeroomFor.length > 0;
    targetObj.homeroomFor = homeroomFor;
  }

  return targetObj;
}

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

    const conversationList = Array.from(conversationMap.values());
    const enrichedConversations = await Promise.all(
      conversationList.map(async (conv) => ({
        ...conv,
        user: await enrichUserWithChildDetails(conv.user, req.user)
      }))
    );

    res.json({
      success: true,
      data: enrichedConversations
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
    const viewerUser = req.user;
    let rawContacts = [];

    if (viewerUser.role === 'parent') {
      // Parents can chat with teachers
      rawContacts = await User.find({ role: 'teacher', isActive: true })
        .select('fullName email role')
        .sort({ fullName: 1 });
    } else if (viewerUser.role === 'teacher') {
      // Teachers can chat with parents
      rawContacts = await User.find({ role: 'parent', isActive: true })
        .select('fullName email role')
        .sort({ fullName: 1 });
    } else {
      // Admins/Registrars/Heads can chat with both teachers and parents
      rawContacts = await User.find({ role: { $in: ['teacher', 'parent'] }, isActive: true })
        .select('fullName email role')
        .sort({ fullName: 1 });
    }

    const contacts = await Promise.all(
      rawContacts.map((c) => enrichUserWithChildDetails(c, viewerUser))
    );

    // Sort: if parent, prioritize homeroom teacher! If teacher, prioritize homeroom parent!
    contacts.sort((a, b) => {
      if (viewerUser.role === 'parent') {
        return (b.isChildHomeroomTeacher ? 1 : 0) - (a.isChildHomeroomTeacher ? 1 : 0);
      }
      if (viewerUser.role === 'teacher') {
        return (b.hasHomeroomChildWithMe ? 1 : 0) - (a.hasHomeroomChildWithMe ? 1 : 0);
      }
      return 0;
    });

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
