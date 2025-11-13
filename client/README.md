# Myanmar POS - Frontend

React-based frontend for the Myanmar POS System with bilingual support (English/Myanmar).

## Features

- 📱 Responsive design
- 🌐 Bilingual UI (English/Myanmar)
- 🎨 Clean, modern interface
- 📊 Real-time dashboard
- 🛒 Point of Sale interface
- 📦 Product & inventory management
- 👥 Customer management
- 📈 Sales reports & analytics

## Tech Stack

- React 18
- React Router v6
- Axios for API calls
- Lucide React for icons
- Recharts for data visualization

## Getting Started

### Install Dependencies
```bash
npm install
```

### Development Server
```bash
npm start
```
Runs on `http://localhost:3000`

### Build for Production
```bash
npm run build
```

## Project Structure

```
client/
├── public/
│   └── index.html
├── src/
│   ├── api/
│   │   └── api.js           # API client
│   ├── components/
│   │   ├── Layout.js        # Main layout with sidebar
│   │   ├── Layout.css
│   │   ├── LoadingSpinner.js
│   │   └── ErrorMessage.js
│   ├── hooks/
│   │   └── useApi.js        # Custom API hook
│   ├── pages/
│   │   ├── Dashboard.js
│   │   ├── POS.js
│   │   ├── Products.js
│   │   ├── Categories.js
│   │   ├── Customers.js
│   │   ├── Orders.js
│   │   ├── Inventory.js
│   │   ├── Reports.js
│   │   └── Settings.js
│   ├── App.js
│   ├── App.css
│   └── index.js
└── package.json
```

## Environment Variables

Create `.env` file:
```
REACT_APP_API_URL=http://localhost:3001/api
```

## Available Scripts

- `npm start` - Development server
- `npm run build` - Production build
- `npm test` - Run tests
- `npm run eject` - Eject from Create React App

## API Integration

The app connects to the backend API via the proxy configured in `package.json`:
```json
"proxy": "http://localhost:3001"
```

## Customization

### Colors
Edit `App.css` to change the color scheme:
```css
:root {
  --primary-color: #2563eb;
  --success-color: #10b981;
  --warning-color: #f59e0b;
  --danger-color: #dc2626;
}
```

### Language
All pages support bilingual labels. Add Myanmar translations in the component files.

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
