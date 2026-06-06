const axios = require('axios');
require('dotenv').config();

const adminNumber = process.env.WHATSAPP_ADMIN_NUMBER;
const apiKey = process.env.CALLMEBOT_API_KEY;

/**
 * Sends a WhatsApp message using the CallMeBot API.
 * @param {string} message - The message text to send.
 */
async function sendWhatsAppMessage(message) {
  if (!adminNumber || !apiKey) {
    console.warn('⚠️ WhatsApp credentials missing. Message not sent:', message);
    return;
  }

  try {
    const url = `https://api.callmebot.com/whatsapp.php?phone=${adminNumber}&text=${encodeURIComponent(message)}&apikey=${apiKey}`;
    const response = await axios.get(url);
    if (response.data.includes('Message to')) {
      console.log('✅ WhatsApp message sent successfully.');
    } else {
      console.error('⚠️ CallMeBot API responded with:', response.data);
    }
  } catch (error) {
    console.error('❌ Failed to send WhatsApp message:', error.message);
  }
}

module.exports = {
  sendWhatsAppMessage
};
