<<<<<<< HEAD
# NXChain Dashboard & Referral System

A comprehensive web application for NXChain featuring a complete dashboard, referral system, staking packages, and financial management tools.

## 🚀 Features

### Core Features
- **🔐 Secure Authentication**: JWT-based auth with OTP email verification
- **📊 Comprehensive Dashboard**: Real-time stats, earnings, and referral analytics
- **👥 Referral System**: Auto-generated codes, commission tracking, and multi-level support
- **💰 Staking Packages**: Bronze, Silver, and Gold packages with competitive ROI
- **💳 Deposit System**: USDT BEP-20 support with QR code generation
- **💸 Withdrawal Management**: Balance checking and transaction history
- **🎫 Support System**: Ticket-based customer support with FAQ
- **📱 Responsive Design**: Mobile-optimized UI with hamburger navigation

### Technical Features
- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Backend**: Node.js + Express + MongoDB
- **Authentication**: JWT + bcrypt + OTP verification
- **Charts**: Recharts for analytics visualization
- **QR Codes**: QR code generation for deposits
- **Email**: Nodemailer for OTP and notifications

## 📋 Requirements

- Node.js 16+
- MongoDB 4.4+
- npm or yarn

## 🛠️ Installation

### 1. Clone and Setup
```bash
git clone <repository-url>
cd nxchain-dashboard
```

### 2. Install Dependencies
```bash
# Install all dependencies (both frontend and backend)
npm run install-all

# Or install separately
npm install
cd frontend && npm install
```

### 3. Environment Configuration
```bash
# Copy environment template
cp .env.example .env

# Edit .env with your configuration
```

### 4. Environment Variables
```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/nxchain

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Email Configuration
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Server Port
PORT=5000
```

## 🚀 Running the Application

### Development Mode
```bash
# Start both frontend and backend
npm run dev

# Or start separately
npm run server  # Backend on port 5000
npm run client  # Frontend on port 3000
```

### Production Mode
```bash
# Build frontend
npm run build

# Start production server
npm start
```

## 📁 Project Structure

```
nxchain-dashboard/
├── backend/
│   └── server.js                 # Express server and API routes
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.tsx         # Navigation header
│   │   │   └── DashboardHome.tsx  # Main dashboard component
│   │   ├── pages/
│   │   │   ├── RegisterPage.tsx   # User registration
│   │   │   ├── LoginPage.tsx      # User login
│   │   │   ├── DepositPage.tsx    # Deposit management
│   │   │   ├── StakingPage.tsx    # Staking packages
│   │   │   ├── WithdrawalPage.tsx # Withdrawal management
│   │   │   ├── ProfilePage.tsx    # User profile
│   │   │   └── SupportPage.tsx    # Support tickets
│   │   ├── services/
│   │   │   └── api.ts             # API service layer
│   │   ├── types/
│   │   │   └── index.ts           # TypeScript types
│   │   └── App.tsx                # Main app component
│   └── package.json
├── .env.example                   # Environment template
└── README.md                      # This file
```

## 🎯 Staking Packages

### Bronze Package
- **Duration**: 30 Days
- **Daily Return**: 1%
- **Total ROI**: 30%
- **Minimum**: $50

### Silver Package
- **Duration**: 90 Days
- **Daily Return**: 1.5%
- **Total ROI**: 135%
- **Minimum**: $500

### Gold Package
- **Duration**: 365 Days
- **Daily Return**: 2%
- **Total ROI**: 730%
- **Minimum**: $1,000

## 🔄 API Endpoints

### Authentication
- `POST /api/register` - User registration
- `POST /api/verify-otp` - OTP verification
- `POST /api/login` - User login

### Dashboard
- `GET /api/dashboard` - Get dashboard data

### Deposits
- `POST /api/deposit` - Generate deposit address

### Staking
- `POST /api/stake` - Create new stake

### Withdrawals
- `POST /api/withdraw` - Submit withdrawal request

### Referrals
- `GET /api/referral-stats` - Get referral statistics

### Support
- `POST /api/support` - Create support ticket
- `GET /api/support` - Get user tickets

## 🎨 UI Components

### Design System
- **Colors**: NX Blue (#00d4ff), NX Purple (#7c3aed), NX Green (#00ff88)
- **Effects**: Glass morphism, gradient backgrounds, smooth animations
- **Icons**: Heroicons React
- **Charts**: Recharts for data visualization

### Responsive Features
- Mobile hamburger menu
- Touch-optimized interactions
- Adaptive card layouts
- Mobile-first design approach

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt for secure password storage
- **OTP Verification**: Email-based 2FA for registration
- **Input Validation**: Client and server-side validation
- **CORS Protection**: Cross-origin resource sharing controls

## 📊 Database Schema

### Users Collection
```javascript
{
  email: String (unique),
  password: String (hashed),
  referralCode: String (auto-generated),
  referredBy: String,
  isVerified: Boolean,
  balance: Number,
  totalEarnings: Number,
  referralEarnings: Number,
  withdrawableBalance: Number,
  pendingEarnings: Number,
  createdAt: Date
}
```

### Transactions Collection
```javascript
{
  userId: ObjectId,
  type: String (deposit|withdrawal|staking|referral),
  amount: Number,
  status: String (pending|confirmed|rejected|approved),
  description: String,
  createdAt: Date
}
```

### Staking Collection
```javascript
{
  userId: ObjectId,
  package: String (bronze|silver|gold),
  amount: Number,
  dailyReturn: Number,
  totalDays: Number,
  totalROI: Number,
  startDate: Date,
  endDate: Date,
  isActive: Boolean,
  totalEarned: Number
}
```

## 🚀 Deployment

### Environment Setup
1. Set up MongoDB database
2. Configure environment variables
3. Build frontend: `npm run build`
4. Start server: `npm start`

### Docker Support (Optional)
```dockerfile
# Dockerfile example
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the ISC License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the FAQ section in the app

## 🔄 Updates

### Version 1.0.0
- Initial release with core features
- Complete authentication system
- Referral program implementation
- Staking packages
- Deposit and withdrawal functionality
- Support ticket system
- Responsive mobile design

---

**Built with ❤️ for the NXChain community**
=======
# nxchain-dashboard
NXChain Dashboard with BNB Smart Chain Integration
>>>>>>> 59f5ee8c26193d9a735b0478c3fcb6d8430f7ab9
