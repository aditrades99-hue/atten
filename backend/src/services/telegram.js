const axios = require('axios');
require('dotenv').config();

const botToken = process.env.TELEGRAM_BOT_TOKEN;
const chatId = process.env.TELEGRAM_CHAT_ID;

/**
 * Sends a Telegram message to the configured admin chat.
 * Free, reliable, no registration ban risk.
 * @param {string} message - Supports Markdown formatting
 */
async function sendNotification(message) {
  if (!botToken || !chatId) {
    console.warn('⚠️  Telegram credentials missing. Set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID in .env');
    console.log('📢 [NOTIFICATION]:', message);
    return;
  }

  try {
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    await axios.post(url, {
      chat_id: chatId,
      text: message,
      parse_mode: 'Markdown',
    });
    console.log('✅ Telegram notification sent.');
  } catch (error) {
    // Don't let notification failure crash the main flow
    console.error('❌ Failed to send Telegram notification:', error.response?.data?.description || error.message);
  }
}

module.exports = { sendNotification };
