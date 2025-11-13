const TelegramBot = require('node-telegram-bot-api');
const ViberBot = require('viber-bot').Bot;
const ViberMessage = require('viber-bot').Message;
require('dotenv').config();

// Telegram Bot Configuration
const telegramBot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: false });

// Viber Bot Configuration
const viberBot = new ViberBot({
  authToken: process.env.VIBER_BOT_TOKEN,
  name: process.env.VIBER_BOT_NAME || 'Myanmar POS Bot',
  avatar: 'https://via.placeholder.com/150'
});

module.exports = {
  telegramBot,
  viberBot,
  ViberMessage
};
