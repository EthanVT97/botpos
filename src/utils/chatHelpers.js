const { pool, query } = require('../config/database');
const { emitNewMessage, emitSessionUpdate, emitUnreadCountUpdate } = require('../config/socket');

/**
 * Save incoming message and update chat session atomically
 * This prevents race conditions in unread count
 */
async function saveIncomingMessage(customerId, message, channel, channelMessageId = null) {
  try {
    // Save incoming message to database
    const { data: savedMessage, error: messageError } = await supabase
      .from('chat_messages')
      .insert([{
        customer_id: customerId,
        sender_type: 'customer',
        message: message,
        channel: channel,
        channel_message_id: channelMessageId,
        is_read: false
      }])
      .select()
      .single();

    if (messageError) throw messageError;

    // The database trigger will automatically update the chat session
    // But we need to fetch the updated session for real-time updates
    const { data: session } = await supabase
      .from('chat_sessions')
      .select('*')
      .eq('customer_id', customerId)
      .single();

    // Emit real-time updates
    if (savedMessage) {
      emitNewMessage(savedMessage, customerId);
    }
    
    if (session) {
      emitSessionUpdate(session);
    }

    // Update total unread count
    await updateTotalUnreadCount();

    return { message: savedMessage, session };
  } catch (error) {
    console.error('Error saving incoming message:', error);
    throw error;
  }
}

/**
 * Save outgoing message (from admin/bot)
 */
async function saveOutgoingMessage(customerId, message, channel, channelMessageId = null, metadata = null) {
  try {
    const { data: savedMessage, error } = await supabase
      .from('chat_messages')
      .insert([{
        customer_id: customerId,
        sender_type: 'admin',
        message: message,
        channel: channel,
        channel_message_id: channelMessageId,
        is_read: true,
        metadata: metadata
      }])
      .select()
      .single();

    if (error) throw error;

    // Update session last message time
    await supabase
      .from('chat_sessions')
      .update({ 
        last_message_at: new Date(),
        updated_at: new Date()
      })
      .eq('customer_id', customerId);

    // Emit real-time update
    if (savedMessage) {
      emitNewMessage(savedMessage, customerId);
    }

    return savedMessage;
  } catch (error) {
    console.error('Error saving outgoing message:', error);
    throw error;
  }
}

/**
 * Update total unread count and emit to admin
 */
async function updateTotalUnreadCount() {
  try {
    const { data: sessions } = await supabase
      .from('chat_sessions')
      .select('unread_count')
      .eq('is_active', true);

    const totalUnread = sessions?.reduce((sum, s) => sum + (s.unread_count || 0), 0) || 0;
    emitUnreadCountUpdate(totalUnread);

    return totalUnread;
  } catch (error) {
    console.error('Error updating total unread count:', error);
    return 0;
  }
}

/**
 * Create or get customer from bot user info
 */
async function getOrCreateCustomer(userId, userName, channel) {
  try {
    const channelField = `${channel}_id`;
    
    // Try to find existing customer
    let { data: customer } = await supabase
      .from('customers')
      .select('*')
      .eq(channelField, userId)
      .single();

    // Create new customer if not found
    if (!customer) {
      const { data: newCustomer, error } = await supabase
        .from('customers')
        .insert([{ 
          name: userName || `${channel} User ${userId.substring(0, 8)}`,
          [channelField]: userId 
        }])
        .select()
        .single();

      if (error) throw error;
      customer = newCustomer;
    }

    return customer;
  } catch (error) {
    console.error('Error getting/creating customer:', error);
    throw error;
  }
}

module.exports = {
  saveIncomingMessage,
  saveOutgoingMessage,
  updateTotalUnreadCount,
  getOrCreateCustomer
};
