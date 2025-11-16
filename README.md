# Road Safety Estimator Tool

A comprehensive web application for estimating costs of road safety interventions using AI-powered recommendations, real-time price scraping, and data-driven insights.

## Description

The Road Safety Estimator Tool is a full-stack application that helps users estimate the costs of implementing various road safety interventions. It leverages AI (Google Gemini) for intelligent recommendations, scrapes current market prices from government portals, and provides a user-friendly dashboard for managing estimates and viewing analytics.

## Features

- **AI-Powered Recommendations**: Uses Google Gemini AI to suggest appropriate road safety interventions based on user inputs
- **Real-Time Price Scraping**: Automatically fetches current prices from CPWD (Central Public Works Department) and GeM (Government e-Marketplace) portals
- **Cost Estimation**: Calculates comprehensive costs including materials, labor, and equipment
- **Dashboard Analytics**: Visual dashboard with metrics, charts, and intervention statistics
- **Price Management**: Manual override and management of scraped prices
- **Estimate History**: Track and manage all generated estimates
- **File Upload Support**: Upload documents for analysis and cost estimation
- **Responsive Design**: Modern UI built with Material-UI and React

## Tech Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **Google Generative AI (Gemini)** for AI recommendations
- **Puppeteer** and **Cheerio** for web scraping

### Frontend
- **React 18** with Vite build tool
- **Material-UI (MUI)** for UI components
- **React Router** for navigation
- **Recharts** for data visualization
- **Axios** for API calls

## Prerequisites

Before running this application, make sure you have the following installed:

- **Node.js** (version 16 or higher)
- **npm** (comes with Node.js)
- **MongoDB** (local installation or cloud instance like MongoDB Atlas)
- **Git** for cloning the repository

## Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yashveer132/Road-Safety-Estimator-Tool.git
   cd Road-Safety-Estimator-Tool
   ```

2. **Install backend dependencies:**
   ```bash
   cd backend
   npm install
   ```

3. **Install frontend dependencies:**
   ```bash
   cd ../frontend
   npm install
   ```

## Environment Setup

Create environment files for both backend and frontend:

### Backend (.env file in backend/ directory)
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/road-safety-estimator
GEMINI_API_KEY=your_gemini_api_key_here
FRONTEND_URL=http://localhost:5173
CPWD_SOR_URL=https://cpwd.gov.in/
GEM_PORTAL_URL=https://mkp.gem.gov.in/market
SCRAPER_TIMEOUT=10000
MAX_RETRY_ATTEMPTS=3
RETRY_DELAY_MS=2000
```

### Frontend (.env file in frontend/ directory)
```env
VITE_API_BASE_URL=http://localhost:5000/api
```

**Note:** Get your Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey).

## Database Setup

1. **Start MongoDB** (if running locally):
   ```bash
   # On Windows with MongoDB installed
   mongod
   ```

2. **Seed initial data:**
   ```bash
   cd backend
   npm run seed-interventions
   npm run populate
   ```

## Running Locally

1. **Start the backend server:**
   ```bash
   cd backend
   npm run dev
   ```
   The backend will run on `http://localhost:5000`

2. **Start the frontend development server:**
   ```bash
   cd frontend
   npm run dev
   ```
   The frontend will run on `http://localhost:5173`

3. **Access the application:**
   Open your browser and navigate to `http://localhost:5173`

## API Endpoints

The backend provides the following main API endpoints:

- `GET /api/health` - Health check
- `POST /api/estimator/estimate` - Generate cost estimates
- `GET /api/prices` - Get current prices
- `GET /api/dashboard/metrics` - Get dashboard metrics
- `GET /api/interventions` - Get available interventions

## Available Scripts

### Backend Scripts
- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm run scrape` - Run price scraping script
- `npm run populate` - Populate price database
- `npm run seed-interventions` - Seed intervention data

### Frontend Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Project Structure

```
road-safety-estimator-tool/
├── backend/
│   ├── config/          # Database and AI configuration
│   ├── controllers/     # Route controllers
│   ├── models/          # MongoDB models
│   ├── routes/          # API routes
│   ├── services/        # Business logic services
│   ├── scripts/         # Data seeding and scraping scripts
│   ├── utils/           # Utility functions
│   └── data/            # Static data files
├── frontend/
│   ├── public/          # Static assets
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── pages/       # Main application pages
│   │   ├── services/    # API service functions
│   │   ├── theme/       # UI theme configuration
│   │   └── utils/       # Frontend utilities
│   └── ...
└── README.md
```
