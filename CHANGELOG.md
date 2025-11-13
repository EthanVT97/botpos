# Changelog

All notable changes to the Myanmar POS System will be documented in this file.

## [1.1.0] - 2024-11-13

### Added
- **Auto Bot Configuration** - New bot management interface in Settings page
  - Configure Telegram, Viber, and Messenger bots from the UI
  - Automatic webhook setup with one click
  - Token validation before applying changes
  - Real-time bot connection status monitoring
  - Remove/update bot configurations without server restart

- **New API Endpoints**
  - `GET /api/bots/config` - Get bot configurations
  - `POST /api/bots/telegram/setup` - Setup Telegram webhook
  - `POST /api/bots/viber/setup` - Setup Viber webhook
  - `POST /api/bots/messenger/setup` - Setup Messenger webhook
  - `POST /api/bots/test/:platform` - Test bot token validity
  - `GET /api/bots/webhook/status` - Get webhook status for all bots
  - `DELETE /api/bots/:platform/webhook` - Remove bot webhook

- **Database Changes**
  - Added bot configuration settings to `settings` table
  - New settings keys: `viber_bot_token`, `telegram_bot_token`, `messenger_page_access_token`, `messenger_verify_token`, `webhook_domain`

- **Documentation**
  - [BOT_SETUP_GUIDE.md](BOT_SETUP_GUIDE.md) - Comprehensive bot setup guide
  - [MIGRATION_BOT_SETTINGS.md](MIGRATION_BOT_SETTINGS.md) - Migration guide for existing users

### Changed
- Enhanced Settings page with bot configuration section
- Updated seed data to include bot settings
- Improved bot status checking with real-time updates

### Improved
- Bot configuration now stored in database instead of only environment variables
- No server restart required for bot configuration changes
- Better error messages for bot setup failures
- User-friendly interface for non-technical users

## [1.0.0] - 2024-11-13

### Initial Release

#### Core Features
- Full-featured Point of Sale system
- Product management with bilingual support (English/Myanmar)
- Customer management with multi-channel integration
- Order processing with automatic stock updates
- Inventory tracking with low stock alerts
- Sales analytics and reporting
- Settings management

#### Bot Integrations
- Viber bot webhook
- Telegram bot webhook
- Facebook Messenger bot webhook
- Customer auto-registration via bots
- Product browsing through bots
- Order viewing through bots
- Myanmar language support in bot responses

#### Technical Stack
- Backend: Node.js + Express
- Frontend: React 18
- Database: Supabase (PostgreSQL)
- Bot APIs: Telegram Bot API, Viber Bot API, Messenger Platform

#### Documentation
- Complete setup guide
- Deployment guides (Heroku, DigitalOcean, AWS, Docker)
- API testing guide
- Quick reference guide
- Architecture documentation
- Contributing guidelines

#### DevOps
- Docker support with docker-compose
- Automated setup scripts
- Database seeding script
- Health check endpoint
- Error handling middleware

---

## Version Format

This project follows [Semantic Versioning](https://semver.org/):
- **MAJOR** version for incompatible API changes
- **MINOR** version for new functionality in a backward compatible manner
- **PATCH** version for backward compatible bug fixes

## Categories

- **Added** - New features
- **Changed** - Changes in existing functionality
- **Deprecated** - Soon-to-be removed features
- **Removed** - Removed features
- **Fixed** - Bug fixes
- **Security** - Security improvements
- **Improved** - Performance or usability improvements
