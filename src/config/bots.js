const TelegramBot = require('node-telegram-bot-api');
const ViberBot = require('viber-bot').Bot;
const ViberMessage = require('viber-bot').Message;
require('dotenv').config();

// Telegram Bot Configuration with error handling
let telegramBot = null;
try {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (token && token !== 'your_telegram_bot_token' && token.length > 10) {
    telegramBot = new TelegramBot(token, { polling: false });
    console.log('✅ Telegram bot initialized');
  } else {
    console.warn('⚠️  Telegram bot token not configured');
  }
} catch (error) {
  console.error('❌ Failed to initialize Telegram bot:', error.message);
}

// Viber Bot Configuration with error handling
let viberBot = null;
try {
  const token = process.env.VIBER_BOT_TOKEN;
  if (token && token !== 'your_viber_bot_token' && token.length > 10) {
    viberBot = new ViberBot({
      authToken: token,
      name: process.env.VIBER_BOT_NAME || 'Myanmar POS Bot',
      avatar: 'https://via.placeholder.com/150'
    });
    console.log('✅ Viber bot initialized');
  } else {
    console.warn('⚠️  Viber bot token not configured');
  }
} catch (error) {
  console.error('❌ Failed to initialize Viber bot:', error.message);
}

// Helper function to check if bot is available
const isTelegramAvailable = () => telegramBot !== null;
const isViberAvailable = () => viberBot !== null;

module.exports = {
  telegramBot,
  viberBot,
  ViberMessage,
  isTelegramAvailable,
  isViberAvailable
};
