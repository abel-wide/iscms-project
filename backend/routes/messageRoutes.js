const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  sendMessage,
  getMessages,
  getConversations,
  getContacts
} = require('../controllers/messageController');

// All chat routes are protected
router.use(protect);

router.post('/', sendMessage);
router.get('/conversations', getConversations);
router.get('/contacts', getContacts);
router.get('/history/:otherUserId', getMessages);

module.exports = router;
