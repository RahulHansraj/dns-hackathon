# Farm-to-Market Intelligence Platform

A high-performance, mobile-first web application designed to help farmers make smart decisions about where to sell their produce.

## Features

### 🔐 Authentication
- Email/Password login and signup
- Google OAuth integration
- JWT-based session management

### 📊 Dashboard
- Profit summary with time filters (1 day, 1 month, 5 months, 1 year, Max, Custom)
- Top 10 performing markets ranking
- Interactive price history charts
- Quick crop addition

### 📈 Market Analysis
- Distance-based transport cost calculation
- Spoilage risk assessment
- Profit estimation for each market
- Ranked market recommendations

### 🗺️ Map Integration (OpenStreetMap)
- Interactive maps with Leaflet.js
- Route visualization
- Open in external maps navigation

### 🔔 Notifications
- Price rise alerts
- High demand notifications
- Real-time updates

### 🎨 Themes
- Light mode
- AMOLED Dark mode (pure black)
- Per-user theme preferences

## Tech Stack

### Backend
- **Node.js** with Express.js
- **PostgreSQL** database
- **JWT** authentication
- **Google OAuth 2.0**

### Frontend
- **React 18** with Vite
- **React Router** for navigation
- **Tailwind CSS** for styling
- **Recharts** for charts
- **Leaflet** for maps
- **Axios** for API calls

## Project Structure

```
PROJECT/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── database/
│   │   ├── middleware/
│   │   ├── routes/
│   │   └── server.js
│   ├── package.json
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
└── README.md
```

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
# Edit .env file with your database credentials
DB_HOST=localhost
DB_PORT=5432
DB_NAME=farm_market
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=your-secret-key
```

4. Initialize database:
```bash
npm run db:init
```

5. Seed with demo data:
```bash
npm run db:seed
```

6. Start the server:
```bash
npm run dev
```

The API will be available at `http://localhost:5000`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:3000`

## Demo Credentials

- **Email:** demo@farm.com
- **Password:** demo123

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login with email/password
- `POST /api/auth/google` - Google OAuth login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/theme` - Update theme preference

### Farmer
- `GET /api/farmer/profile` - Get farmer profile
- `PUT /api/farmer/location` - Update farm location
- `POST /api/farmer/crops` - Add crop
- `GET /api/farmer/crops` - Get farmer's crops
- `DELETE /api/farmer/crops/:id` - Delete crop
- `GET /api/farmer/profit` - Get profit summary

### Markets
- `GET /api/markets` - Get all markets
- `GET /api/markets/top` - Get top 10 markets
- `GET /api/markets/:id` - Get market details
- `GET /api/markets/:id/prices` - Get price history
- `GET /api/markets/demands` - Get market demands

### Analysis
- `POST /api/analyze` - Analyze markets
- `POST /api/analyze/confirm` - Confirm market selection
- `GET /api/analyze/confirmed` - Get confirmed markets
- `PUT /api/analyze/confirmed/:id/complete` - Complete transaction
- `DELETE /api/analyze/confirmed/:id` - Cancel confirmation

### Crops
- `GET /api/crops` - Get all crops
- `GET /api/crops/categories` - Get crop categories
- `GET /api/crops/search` - Search crops

### Notifications
- `GET /api/notifications` - Get notifications
- `GET /api/notifications/unread-count` - Get unread count
- `PUT /api/notifications/:id/read` - Mark as read
- `PUT /api/notifications/read-all` - Mark all as read

## Key Features Explained

### Profit Calculation
```
Expected Profit = (Price per kg × Weight) - Transport Cost - Spoilage Adjustment
```

### Transport Cost
```
Transport Cost = (Base Rate + Weight Factor × Weight) × Distance
- Base Rate: ₹5/km
- Weight Factor: ₹0.1/kg/km
```

### Spoilage Risk
- **Low**: Travel time < 10% of shelf life
- **Medium**: Travel time 10-30% of shelf life  
- **High**: Travel time > 30% of shelf life

### Market Ranking
1. If farmer has history: Rank by average profit from past transactions
2. If new farmer: Rank by highest current selling price

## Mobile-First Design

The application is designed mobile-first with:
- Responsive layout
- Touch-friendly buttons
- Bottom navigation on mobile
- Swipe-friendly cards
- Fast loading times

## License

MIT License
