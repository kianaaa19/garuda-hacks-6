class Chat {
    constructor(db) {
      this.db = db;
    }
  
    // Send a message
    sendMessage(userId, pairnerId, message, senderType = 'user') {
      return new Promise((resolve, reject) => {
        this.db.run(
          'INSERT INTO chats (user_id, pairner_id, message, sender_type) VALUES (?, ?, ?, ?)',
          [userId, pairnerId, message.trim(), senderType],
          function(err) {
            if (err) {
              reject(err);
            } else {
              // Get the created message with timestamp
              this.db.get(
                'SELECT * FROM chats WHERE id = ?',
                [this.lastID],
                (err, newMessage) => {
                  if (err) {
                    reject(err);
                  } else {
                    resolve(newMessage);
                  }
                }
              );
            }
          }
        );
      });
    }
  
    // Get messages for a conversation
    getMessages(userId, pairnerId, options = {}) {
      const { page = 1, limit = 50, before_id } = options;
      const offset = (page - 1) * limit;
  
      let query = `
        SELECT c.*, 
          CASE 
            WHEN c.sender_type = 'user' THEN u.name
            ELSE p.name
          END as sender_name
        FROM chats c
        LEFT JOIN users u ON c.user_id = u.id
        LEFT JOIN pairners p ON c.pairner_id = p.id
        WHERE c.user_id = ? AND c.pairner_id = ?
      `;
      
      let params = [userId, pairnerId];
  
      // For pagination with before_id (infinite scroll)
      if (before_id) {
        query += ' AND c.id < ?';
        params.push(before_id);
      }
  
      query += ' ORDER BY c.created_at DESC LIMIT ? OFFSET ?';
      params.push(parseInt(limit), offset);
  
      return new Promise((resolve, reject) => {
        this.db.all(query, params, (err, messages) => {
          if (err) {
            reject(err);
          } else {
            // Reverse to get chronological order (oldest first)
            resolve(messages.reverse());
          }
        });
      });
    }
  
    // Get all conversations for a user
    getConversations(userId) {
      return new Promise((resolve, reject) => {
        this.db.all(
          `SELECT DISTINCT 
             p.id as pairner_id,
             p.name as pairner_name,
             p.age as pairner_age,
             p.gender as pairner_gender,
             p.rating as pairner_rating,
             (SELECT message FROM chats 
              WHERE (user_id = ? AND pairner_id = p.id) 
              ORDER BY created_at DESC LIMIT 1) as last_message,
             (SELECT created_at FROM chats 
              WHERE (user_id = ? AND pairner_id = p.id) 
              ORDER BY created_at DESC LIMIT 1) as last_message_time,
             (SELECT sender_type FROM chats 
              WHERE (user_id = ? AND pairner_id = p.id) 
              ORDER BY created_at DESC LIMIT 1) as last_message_sender,
             (SELECT COUNT(*) FROM chats 
              WHERE user_id = ? AND pairner_id = p.id AND sender_type = 'pairner' 
              AND created_at > COALESCE((SELECT MAX(created_at) FROM chats WHERE user_id = ? AND pairner_id = p.id AND sender_type = 'user'), '1970-01-01')) as unread_count
           FROM pairners p
           WHERE EXISTS (
             SELECT 1 FROM chats c 
             WHERE c.pairner_id = p.id AND c.user_id = ?
           )
           ORDER BY last_message_time DESC`,
          [userId, userId, userId, userId, userId, userId],
          (err, conversations) => {
            if (err) {
              reject(err);
            } else {
              resolve(conversations);
            }
          }
        );
      });
    }
  
    // Search messages
    searchMessages(userId, searchQuery, pairnerId = null) {
      const searchPattern = `%${searchQuery}%`;
      
      let query = `
        SELECT c.*, p.name as pairner_name,
          CASE 
            WHEN c.sender_type = 'user' THEN u.name
            ELSE p.name
          END as sender_name
        FROM chats c
        LEFT JOIN users u ON c.user_id = u.id
        LEFT JOIN pairners p ON c.pairner_id = p.id
        WHERE c.user_id = ? AND c.message LIKE ?
      `;
      
      let params = [userId, searchPattern];
  
      if (pairnerId) {
        query += ' AND c.pairner_id = ?';
        params.push(pairnerId);
      }
  
      query += ' ORDER BY c.created_at DESC LIMIT 100';
  
      return new Promise((resolve, reject) => {
        this.db.all(query, params, (err, messages) => {
          if (err) {
            reject(err);
          } else {
            resolve(messages);
          }
        });
      });
    }
  
    // Delete a conversation
    deleteConversation(userId, pairnerId) {
      return new Promise((resolve, reject) => {
        this.db.run(
          'DELETE FROM chats WHERE user_id = ? AND pairner_id = ?',
          [userId, pairnerId],
          function(err) {
            if (err) {
              reject(err);
            } else {
              resolve({
                deleted: this.changes > 0,
                deleted_count: this.changes
              });
            }
          }
        );
      });
    }
  
    // Delete a specific message
    deleteMessage(messageId, userId) {
      return new Promise((resolve, reject) => {
        // Only allow users to delete their own messages
        this.db.run(
          'DELETE FROM chats WHERE id = ? AND user_id = ? AND sender_type = "user"',
          [messageId, userId],
          function(err) {
            if (err) {
              reject(err);
            } else {
              resolve(this.changes > 0);
            }
          }
        );
      });
    }
  
    // Get chat statistics for a user
    getStats(userId) {
      return new Promise((resolve, reject) => {
        this.db.get(
          `SELECT 
             COUNT(DISTINCT pairner_id) as total_conversations,
             COUNT(*) as total_messages,
             COUNT(CASE WHEN sender_type = 'user' THEN 1 END) as sent_messages,
             COUNT(CASE WHEN sender_type = 'pairner' THEN 1 END) as received_messages,
             MIN(created_at) as first_message_date,
             MAX(created_at) as last_message_date
           FROM chats 
           WHERE user_id = ?`,
          [userId],
          (err, stats) => {
            if (err) {
              reject(err);
            } else {
              resolve(stats);
            }
          }
        );
      });
    }
  
    // Get most active conversations
    getMostActive(userId, limit = 5) {
      return new Promise((resolve, reject) => {
        this.db.all(
          `SELECT 
             p.id as pairner_id,
             p.name as pairner_name,
             p.age as pairner_age,
             p.gender as pairner_gender,
             COUNT(c.id) as message_count,
             MAX(c.created_at) as last_message_time
           FROM chats c
           JOIN pairners p ON c.pairner_id = p.id
           WHERE c.user_id = ?
           GROUP BY p.id
           ORDER BY message_count DESC, last_message_time DESC
           LIMIT ?`,
          [userId, parseInt(limit)],
          (err, conversations) => {
            if (err) {
              reject(err);
            } else {
              resolve(conversations);
            }
          }
        );
      });
    }
  
    // Mark messages as read (placeholder for future real-time features)
    markAsRead(userId, pairnerId, messageId = null) {
      // This is a placeholder method
      // In a real app, you'd have a separate table for read receipts
      // or add read/unread status to the chats table
      return Promise.resolve({ message: 'Messages marked as read' });
    }
  
    // Get unread message count
    getUnreadCount(userId, pairnerId = null) {
      let query = `
        SELECT COUNT(*) as unread_count
        FROM chats 
        WHERE user_id = ? AND sender_type = 'pairner'
      `;
      let params = [userId];
  
      if (pairnerId) {
        query += ' AND pairner_id = ?';
        params.push(pairnerId);
      }
  
      // This is simplified - in real app, you'd track read status properly
      query += ` AND created_at > COALESCE((
        SELECT MAX(created_at) FROM chats 
        WHERE user_id = ? AND sender_type = 'user'
        ${pairnerId ? 'AND pairner_id = ?' : ''}
      ), '1970-01-01')`;
      
      params.push(userId);
      if (pairnerId) {
        params.push(pairnerId);
      }
  
      return new Promise((resolve, reject) => {
        this.db.get(query, params, (err, result) => {
          if (err) {
            reject(err);
          } else {
            resolve(result.unread_count);
          }
        });
      });
    }
  
    // Get conversation summary (for admin/monitoring)
    getConversationSummary(userId, pairnerId) {
      return new Promise((resolve, reject) => {
        this.db.get(
          `SELECT 
             COUNT(*) as total_messages,
             COUNT(CASE WHEN sender_type = 'user' THEN 1 END) as user_messages,
             COUNT(CASE WHEN sender_type = 'pairner' THEN 1 END) as pairner_messages,
             MIN(created_at) as first_message,
             MAX(created_at) as last_message,
             p.name as pairner_name,
             u.name as user_name
           FROM chats c
           JOIN users u ON c.user_id = u.id
           JOIN pairners p ON c.pairner_id = p.id
           WHERE c.user_id = ? AND c.pairner_id = ?`,
          [userId, pairnerId],
          (err, summary) => {
            if (err) {
              reject(err);
            } else {
              resolve(summary);
            }
          }
        );
      });
    }
  }
  
  module.exports = Chat;