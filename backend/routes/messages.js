const express = require('express');
const { Message } = require('../models/index');
const { protect } = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();

// Get conversations list
router.get('/conversations', protect, async (req, res) => {
  try {
    const messages = await Message.find({ $or: [{ sender: req.user._id }, { receiver: req.user._id }] }).sort('-createdAt');
    const seen = new Set();
    const conversations = [];
    for (const m of messages) {
      const otherId = m.sender.toString() === req.user._id.toString() ? m.receiver.toString() : m.sender.toString();
      if (!seen.has(otherId)) {
        seen.add(otherId);
        const other = await User.findById(otherId).select('name role');
        if (other) conversations.push({ userId: otherId, name: other.name, lastMessage: m.content });
      }
    }
    res.json({ conversations });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// Get messages with a user
router.get('/:userId', protect, async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [
        { sender: req.user._id, receiver: req.params.userId },
        { sender: req.params.userId, receiver: req.user._id },
      ]
    }).sort('createdAt');
    res.json({ messages });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// Send message
router.post('/', protect, async (req, res) => {
  try {
    const { receiverId, content } = req.body;
    if (!content?.trim()) return res.status(400).json({ message: 'Content required' });
    const message = await Message.create({ sender: req.user._id, receiver: receiverId, content });
    res.status(201).json({ message });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

module.exports = router;