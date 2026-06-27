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

/**
 * Sends a Document to the configured admin chat.
 * @param {string} base64Data - Base64 string of the file
 * @param {string} filename - Name of the file
 * @param {string} caption - Optional caption
 */
async function sendDocument(base64Data, filename, caption = '') {
  if (!botToken || !chatId) {
    console.warn('⚠️  Telegram credentials missing.');
    return;
  }
  try {
    const FormData = require('form-data');
    const form = new FormData();
    const base64String = base64Data.split(',')[1] || base64Data;
    const buffer = Buffer.from(base64String, 'base64');
    
    form.append('chat_id', chatId);
    form.append('caption', caption);
    form.append('parse_mode', 'Markdown');
    form.append('document', buffer, { filename });

    const url = `https://api.telegram.org/bot${botToken}/sendDocument`;
    await axios.post(url, form, {
      headers: form.getHeaders(),
    });
    console.log('✅ Telegram document sent.');
  } catch (error) {
    console.error('❌ Failed to send Telegram document:', error.response?.data?.description || error.message);
  }
}

module.exports = { sendNotification, sendDocument };
