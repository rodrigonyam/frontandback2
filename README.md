# Travel Booking Platform

A comprehensive full-stack travel booking platform that allows users to search and book flights, hotels, car rentals, and discover local restaurants.

## Features

### 🎯 Core Features
- **User Authentication**: Register, login, and guest access
- **Flight Booking**: Search and book flights with multiple airlines
- **Hotel Reservations**: Find and book accommodations
- **Car Rentals**: Rent vehicles for travel
- **Restaurant Recommendations**: Discover local dining options
- **Booking Management**: View and manage all bookings
- **User Profiles**: Manage personal information and preferences

### 🛠 Tech Stack

**Frontend**
- React 18 with TypeScript
- Material-UI for component library
- React Router for navigation
- Axios for API calls
- Context API for state management

**Backend**
- Node.js with Express
- TypeScript
- MongoDB with Mongoose
- JWT Authentication
- bcryptjs for password hashing
- Express middleware for security

**Development Tools**
- ESLint and Prettier
- Concurrently for running multiple services
- Nodemon for development

## Project Structure

```
travel-booking-platform/
├── frontend/                 # React frontend application
│   ├── public/              # Public assets
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Page components
│   │   ├── contexts/        # React contexts for state management
│   │   ├── services/        # API service functions
│   │   ├── types/           # TypeScript type definitions
│   │   ├── utils/           # Utility functions
│   │   └── App.tsx          # Main App component
│   ├── package.json
│   └── tsconfig.json
├── backend/                  # Node.js backend API
│   ├── src/
│   │   ├── controllers/     # Route controllers
│   │   ├── models/          # Database models
│   │   ├── routes/          # API routes
│   │   ├── middleware/      # Express middleware
│   │   ├── services/        # Business logic services
│   │   ├── types/           # TypeScript interfaces
│   │   ├── utils/           # Utility functions
│   │   └── server.ts        # Server entry point
│   ├── package.json
│   └── tsconfig.json
├── package.json              # Root package.json
└── README.md                # This file
```

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or MongoDB Atlas)
- npm or yarn package manager

### Installation

1. **Clone and install dependencies**
   ```bash
   npm run install:all
   ```

2. **Environment Setup**
   
   Create `.env` file in the backend directory:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/travel-booking
   JWT_SECRET=your-super-secret-jwt-key-here
   JWT_EXPIRE=30d
   
   # External API Keys (Optional - for production integration)
   AMADEUS_API_KEY=your-amadeus-api-key
   AMADEUS_API_SECRET=your-amadeus-api-secret
   BOOKING_COM_API_KEY=your-booking-com-api-key
   ```

3. **Start Development Servers**
   ```bash
   npm run dev
   ```
   
   This will start:
   - Backend server on `http://localhost:5000`
   - Frontend development server on `http://localhost:3000`

### API Documentation

The backend provides the following API endpoints:

#### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user profile

#### Flights
- `GET /api/flights/search` - Search flights
- `POST /api/flights/book` - Book a flight

#### Hotels
- `GET /api/hotels/search` - Search hotels
- `POST /api/hotels/book` - Book a hotel

#### Car Rentals
- `GET /api/cars/search` - Search car rentals
- `POST /api/cars/book` - Book a car rental

#### Restaurants
- `GET /api/restaurants/search` - Search restaurants
- `GET /api/restaurants/nearby` - Get nearby restaurants

#### Bookings
- `GET /api/bookings` - Get user's bookings
- `DELETE /api/bookings/:id` - Cancel a booking

## Development

### Running Individual Services

**Backend only:**
```bash
npm run dev:backend
```

**Frontend only:**
```bash
npm run dev:frontend
```

### Building for Production

```bash
npm run build
```

### Code Quality
- ESLint for code linting
- Prettier for code formatting
- TypeScript for type safety

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

This project is licensed under the MIT License.