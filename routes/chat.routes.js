const express = require('express');
const router = express.Router();
const multer = require('multer');
const { authenticate, requireSubscription } = require('../middleware/auth');
const Chat = require('../models/chat.model');
const geminiService = require('../utilities/gemini');

// Configure multer for memory storage (no file saving)
const memoryStorage = multer.memoryStorage();
const upload = multer({ 
  storage: memoryStorage,
  fileFilter: (req, file, cb) => {
    // Accept only images and PDFs
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images and PDFs are allowed.'));
    }
  }
}).fields([
  { name: 'image', maxCount: 1 },
  { name: 'pdf', maxCount: 1 }
]);

// Error handling middleware for multer
const handleUpload = (req, res, next) => {
  upload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ 
        error: 'File upload error',
        details: err.message 
      });
    } else if (err) {
      return res.status(400).json({ 
        error: 'Invalid file type',
        details: err.message 
      });
    }
    next();
  });
};

// 1. Start a new chat (supports text, image, and PDF)
router.post('/api/chat/start', authenticate, requireSubscription, handleUpload, async (req, res) => {
  try {
    const { message } = req.body;
    const userId = req.user.id;
    const imageFile = req.files?.image?.[0];
    const pdfFile = req.files?.pdf?.[0];

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: 'Message is required' });
    }

    let contentType = 'text';
    let aiResponse;

    if (imageFile) {
      contentType = 'image';
      aiResponse = await geminiService.generateImageResponse(message, imageFile.buffer);
    } else if (pdfFile) {
      contentType = 'pdf';
      aiResponse = await geminiService.generateTextResponse(message + "\n\nAnalyze this PDF content: " + pdfFile.buffer.toString());
    } else {
      aiResponse = await geminiService.generateTextResponse(message);
    }

    // Create new chat - store only text
    const chatTitle = await geminiService.generateChatTitle(message);
    const newChat = new Chat({
      userId,
      title: chatTitle,
      messages: [
        {
          role: 'user',
          content: message,
          contentType: contentType
        },
        {
          role: 'assistant',
          content: aiResponse,
          contentType: 'text'
        }
      ]
    });

    await newChat.save();

    res.status(201).json({
      message: 'Chat started successfully',
      chat: {
        id: newChat._id,
        title: newChat.title,
        messages: newChat.messages
      }
    });

  } catch (error) {
    console.error('Start chat error:', error);
    res.status(500).json({ error: 'Failed to start chat' });
  }
});

// 2. Continue existing chat (supports text, image, and PDF)
router.post('/api/chat/:chatId/message', authenticate, requireSubscription, handleUpload, async (req, res) => {
  try {
    const { message } = req.body;
    const { chatId } = req.params;
    const userId = req.user.id;
    const imageFile = req.files?.image?.[0];
    const pdfFile = req.files?.pdf?.[0];

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Find the chat
    const chat = await Chat.findOne({ _id: chatId, userId });
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    // Get recent chat history (last 5 messages)
    const recentMessages = chat.getRecentMessages(5);

    let contentType = 'text';
    let aiResponse;

    if (imageFile) {
      contentType = 'image';
      aiResponse = await geminiService.generateImageResponse(message, imageFile.buffer, recentMessages);
    } else if (pdfFile) {
      contentType = 'pdf';
      aiResponse = await geminiService.generateTextResponse(
        message + "\n\nAnalyze this PDF content: " + pdfFile.buffer.toString(),
        recentMessages
      );
    } else {
      aiResponse = await geminiService.generateTextResponse(message, recentMessages);
    }

    // Add messages to chat - store only text content
    await chat.addMessage('user', message, contentType);
    await chat.addMessage('assistant', aiResponse, 'text');

    res.json({
      message: 'Message sent successfully',
      response: aiResponse,
      chatId: chat._id
    });

  } catch (error) {
    console.error('Continue chat error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Get chat history with pagination
router.get('/api/chat/history', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    // Get total count
    const totalChats = await Chat.countDocuments({ userId });

    // Get paginated chats with basic info
    const chats = await Chat.find({ userId })
      .select('title createdAt updatedAt messages')
      .sort({ updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    // Format the response
    const formattedChats = chats.map(chat => ({
      id: chat._id,
      title: chat.title,
      createdAt: chat.createdAt,
      updatedAt: chat.updatedAt,
      lastMessage: chat.messages.length > 0 ? {
        content: chat.messages[chat.messages.length - 1].content,
        role: chat.messages[chat.messages.length - 1].role,
        timestamp: chat.messages[chat.messages.length - 1].timestamp
      } : null,
      messageCount: chat.messages.length
    }));

    res.json({
      chats: formattedChats,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalChats / limit),
        totalChats: totalChats,
        hasMore: page * limit < totalChats
      }
    });

  } catch (error) {
    console.error('Get chat history error:', error);
    res.status(500).json({ error: 'Failed to fetch chat history' });
  }
});

// Get specific chat with messages
router.get('/api/chat/:chatId', authenticate, async (req, res) => {
  try {
    const chat = await Chat.findOne({ 
      _id: req.params.chatId, 
      userId: req.user.id 
    });

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    res.json({
      id: chat._id,
      title: chat.title,
      messages: chat.messages,
      createdAt: chat.createdAt,
      updatedAt: chat.updatedAt
    });
  } catch (error) {
    console.error('Get chat error:', error);
    res.status(500).json({ error: 'Failed to fetch chat' });
  }
});

// Get all chats for user (simplified list)
router.get('/api/chats', authenticate, async (req, res) => {
  try {
    const chats = await Chat.find({ userId: req.user.id })
      .select('title createdAt updatedAt')
      .sort('-updatedAt');
    
    const formattedChats = chats.map(chat => ({
      id: chat._id,
      title: chat.title,
      createdAt: chat.createdAt,
      updatedAt: chat.updatedAt
    }));

    res.json(formattedChats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch chats' });
  }
});

module.exports = router; 