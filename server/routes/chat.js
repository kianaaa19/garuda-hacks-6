const express = require('express');
const router = express.Router();
const Chat = require('../models/Chat');
const { authenticateToken } = require('../middleware/auth');

// Initialize chat model - this will be passed from the main app
let chatModel;
let jwtSecret;

// Middleware to initialize chat model and JWT secret
const initializeChatModel = (db, secret) => {
  chatModel = new Chat(db);
  jwtSecret = secret;
};

// Apply authentication middleware to all routes
// Note: This middleware will be applied when the router is initialized with the JWT secret

// Validation middleware
const validateSendMessage = (req, res, next) => {
  const { pairnerId, message } = req.body;
  
  if (!pairnerId || isNaN(parseInt(pairnerId))) {
    return res.status(400).json({
      error: 'Valid pairner ID is required',
      code: 'INVALID_PAIRNER_ID'
    });
  }
  
  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return res.status(400).json({
      error: 'Message content is required',
      code: 'INVALID_MESSAGE'
    });
  }
  
  if (message.trim().length > 1000) {
    return res.status(400).json({
      error: 'Message is too long (max 1000 characters)',
      code: 'MESSAGE_TOO_LONG'
    });
  }
  
  next();
};

const validatePagination = (req, res, next) => {
  const { page, limit } = req.query;
  
  if (page && (isNaN(parseInt(page)) || parseInt(page) < 1)) {
    return res.status(400).json({
      error: 'Page must be a positive integer',
      code: 'INVALID_PAGE'
    });
  }
  
  if (limit && (isNaN(parseInt(limit)) || parseInt(limit) < 1 || parseInt(limit) > 100)) {
    return res.status(400).json({
      error: 'Limit must be between 1 and 100',
      code: 'INVALID_LIMIT'
    });
  }
  
  next();
};

// Routes

/**
 * @route   POST /api/chat/send
 * @desc    Send a message to a pairner
 * @access  Private
 */
router.post('/send', validateSendMessage, async (req, res) => {
  try {
    const { pairnerId, message } = req.body;
    const userId = req.userId;
    
    const newMessage = await chatModel.sendMessage(userId, parseInt(pairnerId), message, 'user');
    
    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: newMessage
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({
      error: 'Failed to send message',
      code: 'SEND_MESSAGE_FAILED',
      details: error.message
    });
  }
});

/**
 * @route   GET /api/chat/messages/:pairnerId
 * @desc    Get messages for a conversation with a specific pairner
 * @access  Private
 */
router.get('/messages/:pairnerId', validatePagination, async (req, res) => {
  try {
    const { pairnerId } = req.params;
    const userId = req.userId;
    const { page = 1, limit = 50, before_id } = req.query;
    
    if (isNaN(parseInt(pairnerId))) {
      return res.status(400).json({
        error: 'Valid pairner ID is required',
        code: 'INVALID_PAIRNER_ID'
      });
    }
    
    const options = {
      page: parseInt(page),
      limit: parseInt(limit)
    };
    
    if (before_id) {
      options.before_id = parseInt(before_id);
    }
    
    const messages = await chatModel.getMessages(userId, parseInt(pairnerId), options);
    
    res.json({
      success: true,
      data: {
        messages,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          has_more: messages.length === parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({
      error: 'Failed to fetch messages',
      code: 'FETCH_MESSAGES_FAILED',
      details: error.message
    });
  }
});

/**
 * @route   GET /api/chat/conversations
 * @desc    Get all conversations for the authenticated user
 * @access  Private
 */
router.get('/conversations', async (req, res) => {
  try {
    const userId = req.userId;
    
    const conversations = await chatModel.getConversations(userId);
    
    res.json({
      success: true,
      data: conversations
    });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({
      error: 'Failed to fetch conversations',
      code: 'FETCH_CONVERSATIONS_FAILED',
      details: error.message
    });
  }
});

/**
 * @route   GET /api/chat/search
 * @desc    Search messages across conversations
 * @access  Private
 */
router.get('/search', async (req, res) => {
  try {
    const { q: searchQuery, pairner_id: pairnerId } = req.query;
    const userId = req.userId;
    
    if (!searchQuery || searchQuery.trim().length === 0) {
      return res.status(400).json({
        error: 'Search query is required',
        code: 'INVALID_SEARCH_QUERY'
      });
    }
    
    if (searchQuery.trim().length < 2) {
      return res.status(400).json({
        error: 'Search query must be at least 2 characters',
        code: 'SEARCH_QUERY_TOO_SHORT'
      });
    }
    
    const parsedPairnerId = pairnerId ? parseInt(pairnerId) : null;
    
    if (pairnerId && isNaN(parsedPairnerId)) {
      return res.status(400).json({
        error: 'Invalid pairner ID',
        code: 'INVALID_PAIRNER_ID'
      });
    }
    
    const messages = await chatModel.searchMessages(userId, searchQuery.trim(), parsedPairnerId);
    
    res.json({
      success: true,
      data: {
        messages,
        query: searchQuery.trim(),
        pairner_id: parsedPairnerId
      }
    });
  } catch (error) {
    console.error('Error searching messages:', error);
    res.status(500).json({
      error: 'Failed to search messages',
      code: 'SEARCH_MESSAGES_FAILED',
      details: error.message
    });
  }
});

/**
 * @route   DELETE /api/chat/conversation/:pairnerId
 * @desc    Delete an entire conversation with a pairner
 * @access  Private
 */
router.delete('/conversation/:pairnerId', async (req, res) => {
  try {
    const { pairnerId } = req.params;
    const userId = req.userId;
    
    if (isNaN(parseInt(pairnerId))) {
      return res.status(400).json({
        error: 'Valid pairner ID is required',
        code: 'INVALID_PAIRNER_ID'
      });
    }
    
    const result = await chatModel.deleteConversation(userId, parseInt(pairnerId));
    
    if (!result.deleted) {
      return res.status(404).json({
        error: 'Conversation not found',
        code: 'CONVERSATION_NOT_FOUND'
      });
    }
    
    res.json({
      success: true,
      message: `Conversation deleted successfully`,
      data: {
        deleted_messages: result.deleted_count
      }
    });
  } catch (error) {
    console.error('Error deleting conversation:', error);
    res.status(500).json({
      error: 'Failed to delete conversation',
      code: 'DELETE_CONVERSATION_FAILED',
      details: error.message
    });
  }
});

/**
 * @route   DELETE /api/chat/message/:messageId
 * @desc    Delete a specific message (only user's own messages)
 * @access  Private
 */
router.delete('/message/:messageId', async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.userId;
    
    if (isNaN(parseInt(messageId))) {
      return res.status(400).json({
        error: 'Valid message ID is required',
        code: 'INVALID_MESSAGE_ID'
      });
    }
    
    const deleted = await chatModel.deleteMessage(parseInt(messageId), userId);
    
    if (!deleted) {
      return res.status(404).json({
        error: 'Message not found or unauthorized to delete',
        code: 'MESSAGE_NOT_FOUND_OR_UNAUTHORIZED'
      });
    }
    
    res.json({
      success: true,
      message: 'Message deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({
      error: 'Failed to delete message',
      code: 'DELETE_MESSAGE_FAILED',
      details: error.message
    });
  }
});

/**
 * @route   GET /api/chat/stats
 * @desc    Get chat statistics for the authenticated user
 * @access  Private
 */
router.get('/stats', async (req, res) => {
  try {
    const userId = req.userId;
    
    const stats = await chatModel.getStats(userId);
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching chat stats:', error);
    res.status(500).json({
      error: 'Failed to fetch chat statistics',
      code: 'FETCH_STATS_FAILED',
      details: error.message
    });
  }
});

/**
 * @route   GET /api/chat/most-active
 * @desc    Get most active conversations
 * @access  Private
 */
router.get('/most-active', async (req, res) => {
  try {
    const userId = req.userId;
    const { limit = 5 } = req.query;
    
    const parsedLimit = parseInt(limit);
    if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 20) {
      return res.status(400).json({
        error: 'Limit must be between 1 and 20',
        code: 'INVALID_LIMIT'
      });
    }
    
    const conversations = await chatModel.getMostActive(userId, parsedLimit);
    
    res.json({
      success: true,
      data: conversations
    });
  } catch (error) {
    console.error('Error fetching most active conversations:', error);
    res.status(500).json({
      error: 'Failed to fetch most active conversations',
      code: 'FETCH_MOST_ACTIVE_FAILED',
      details: error.message
    });
  }
});

/**
 * @route   GET /api/chat/unread-count
 * @desc    Get unread message count
 * @access  Private
 */
router.get('/unread-count', async (req, res) => {
  try {
    const userId = req.userId;
    const { pairner_id: pairnerId } = req.query;
    
    const parsedPairnerId = pairnerId ? parseInt(pairnerId) : null;
    
    if (pairnerId && isNaN(parsedPairnerId)) {
      return res.status(400).json({
        error: 'Invalid pairner ID',
        code: 'INVALID_PAIRNER_ID'
      });
    }
    
    const unreadCount = await chatModel.getUnreadCount(userId, parsedPairnerId);
    
    res.json({
      success: true,
      data: {
        unread_count: unreadCount,
        pairner_id: parsedPairnerId
      }
    });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({
      error: 'Failed to fetch unread count',
      code: 'FETCH_UNREAD_COUNT_FAILED',
      details: error.message
    });
  }
});

/**
 * @route   POST /api/chat/mark-read/:pairnerId
 * @desc    Mark messages as read for a conversation
 * @access  Private
 */
router.post('/mark-read/:pairnerId', async (req, res) => {
  try {
    const { pairnerId } = req.params;
    const { messageId } = req.body;
    const userId = req.userId;
    
    if (isNaN(parseInt(pairnerId))) {
      return res.status(400).json({
        error: 'Valid pairner ID is required',
        code: 'INVALID_PAIRNER_ID'
      });
    }
    
    const parsedMessageId = messageId ? parseInt(messageId) : null;
    
    if (messageId && isNaN(parsedMessageId)) {
      return res.status(400).json({
        error: 'Invalid message ID',
        code: 'INVALID_MESSAGE_ID'
      });
    }
    
    const result = await chatModel.markAsRead(userId, parseInt(pairnerId), parsedMessageId);
    
    res.json({
      success: true,
      message: 'Messages marked as read',
      data: result
    });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({
      error: 'Failed to mark messages as read',
      code: 'MARK_READ_FAILED',
      details: error.message
    });
  }
});

/**
 * @route   GET /api/chat/conversation-summary/:pairnerId
 * @desc    Get conversation summary (admin/monitoring feature)
 * @access  Private
 */
router.get('/conversation-summary/:pairnerId', async (req, res) => {
  try {
    const { pairnerId } = req.params;
    const userId = req.userId;
    
    if (isNaN(parseInt(pairnerId))) {
      return res.status(400).json({
        error: 'Valid pairner ID is required',
        code: 'INVALID_PAIRNER_ID'
      });
    }
    
    const summary = await chatModel.getConversationSummary(userId, parseInt(pairnerId));
    
    if (!summary || summary.total_messages === 0) {
      return res.status(404).json({
        error: 'Conversation not found',
        code: 'CONVERSATION_NOT_FOUND'
      });
    }
    
    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Error fetching conversation summary:', error);
    res.status(500).json({
      error: 'Failed to fetch conversation summary',
      code: 'FETCH_SUMMARY_FAILED',
      details: error.message
    });
  }
});

// Error handling middleware for this router
router.use((error, req, res, next) => {
  console.error('Chat route error:', error);
  
  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({
      error: 'Invalid JSON in request body',
      code: 'INVALID_JSON'
    });
  }
  
  res.status(500).json({
    error: 'Internal server error',
    code: 'INTERNAL_ERROR',
    details: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
});

// Function to create and configure the chat router
const createChatRouter = (db, jwtSecret) => {
  // Initialize the chat model
  chatModel = new Chat(db);
  
  // Apply authentication middleware to all routes
  router.use(authenticateToken(jwtSecret));
  
  return router;
};

// Export the router creation function and direct router access
module.exports = {
  router, // Direct router access (requires manual initialization)
  createChatRouter, // Preferred way - creates configured router
  initializeChatModel // Legacy initialization function
};