# NXChain Backend API Documentation

**Version:** 1.0  
**Platform:** Node.js + Express + MongoDB  
**Authentication:** JWT  
**Security:** bcrypt, Rate Limiting, CORS

---

## 🏗️ Base URL & Configuration

```
Development: http://localhost:5000/api/v1
Production: https://api.nxchain.com/api/v1
```

### Headers
```
Content-Type: application/json
Authorization: Bearer <JWT_TOKEN>
```

---

## 🔐 Authentication Endpoints

### 1. User Registration
```http
POST /auth/register
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "confirmPassword": "password123",
  "referralCode": "USMAN-982410" // Optional, auto-filled from URL
}
```

**Response:**
```json
{
  "success": true,
  "message": "Registration successful. Please verify your email.",
  "data": {
    "userId": "64f1a2b3c4d5e6f7g8h9i0j1",
    "email": "user@example.com",
    "referralCode": "USER-123456",
    "isVerified": false
  }
}
```

### 2. Email Verification (OTP)
```http
POST /auth/verify-email
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Email verified successfully",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "64f1a2b3c4d5e6f7g8h9i0j1",
      "email": "user@example.com",
      "referralCode": "USER-123456",
      "isVerified": true
    }
  }
}
```

### 3. Login
```http
POST /auth/login
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "64f1a2b3c4d5e6f7g8h9i0j1",
      "email": "user@example.com",
      "referralCode": "USER-123456"
    }
  }
}
```

### 4. Resend OTP
```http
POST /auth/resend-otp
```

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

### 5. Logout
```http
POST /auth/logout
```

**Headers:** Authorization required

---

## 👤 User Management Endpoints

### 1. Get Profile
```http
GET /user/profile
```

**Headers:** Authorization required

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "64f1a2b3c4d5e6f7g8h9i0j1",
    "email": "user@example.com",
    "referralCode": "USER-123456",
    "referredBy": "USMAN-982410",
    "isVerified": true,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "walletBalance": 1250.50,
    "totalEarnings": 320.75,
    "activeStakes": 2
  }
}
```

### 2. Update Profile
```http
PUT /user/profile
```

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890"
}
```

### 3. Change Password
```http
PUT /user/change-password
```

**Request Body:**
```json
{
  "currentPassword": "oldpassword123",
  "newPassword": "newpassword123"
}
```

---

## 🤝 Referral System Endpoints

### 1. Get Referral Info
```http
GET /referral/info
```

**Response:**
```json
{
  "success": true,
  "data": {
    "referralCode": "USER-123456",
    "referralLink": "https://nxchain.com/register?ref=USER-123456",
    "totalReferrals": 15,
    "activeReferrals": 12,
    "totalCommission": 320.75,
    "pendingCommission": 45.20,
    "withdrawableCommission": 275.55,
    "levelBreakdown": {
      "level1": { "count": 8, "commission": 240.50 },
      "level2": { "count": 4, "commission": 60.25 },
      "level3": { "count": 3, "commission": 20.00 }
    }
  }
}
```

### 2. Get Referred Users List
```http
GET /referral/users?page=1&limit=10&status=all
```

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `status`: Filter by status (all, verified, pending)

**Response:**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "64f1a2b3c4d5e6f7g8h9i0j2",
        "email": "referred1@example.com",
        "joinedDate": "2024-01-20T14:30:00.000Z",
        "commissionFromUser": 25.50,
        "status": "verified",
        "level": 1
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalUsers": 25,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

### 3. Get Referral Analytics
```http
GET /referral/analytics?period=30d
```

**Query Parameters:**
- `period`: Time period (7d, 30d, 90d, 1y)

**Response:**
```json
{
  "success": true,
  "data": {
    "dailyReferrals": [
      { "date": "2024-01-15", "count": 3 },
      { "date": "2024-01-16", "count": 5 }
    ],
    "earningsChart": [
      { "date": "2024-01-15", "amount": 45.50 },
      { "date": "2024-01-16", "amount": 62.25 }
    ],
    "growthMetrics": {
      "totalGrowth": 150.5,
      "monthlyGrowth": 25.3,
      "weeklyGrowth": 5.2
    }
  }
}
```

---

## 💰 Deposit Endpoints

### 1. Generate Deposit Address
```http
POST /deposit/generate-address
```

**Request Body:**
```json
{
  "currency": "USDT",
  "network": "BEP20"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "depositAddress": "0x1234567890abcdef1234567890abcdef12345678",
    "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
    "minimumDeposit": 10.0,
    "network": "BEP20",
    "currency": "USDT"
  }
}
```

### 2. Get Deposit History
```http
GET /deposit/history?page=1&limit=10
```

**Response:**
```json
{
  "success": true,
  "data": {
    "deposits": [
      {
        "id": "dep_64f1a2b3c4d5e6f7",
        "amount": 100.0,
        "currency": "USDT",
        "network": "BEP20",
        "status": "confirmed",
        "createdAt": "2024-01-15T10:30:00.000Z",
        "confirmedAt": "2024-01-15T11:45:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalDeposits": 48
    }
  }
}
```

---

## 🎯 Staking Endpoints

### 1. Get Staking Packages
```http
GET /staking/packages
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "bronze",
      "name": "Bronze Package",
      "duration": 30,
      "dailyReturn": 1.0,
      "totalROI": 30.0,
      "minimumAmount": 50.0,
      "maximumAmount": 1000.0
    },
    {
      "id": "silver",
      "name": "Silver Package",
      "duration": 90,
      "dailyReturn": 1.5,
      "totalROI": 135.0,
      "minimumAmount": 1000.0,
      "maximumAmount": 10000.0
    },
    {
      "id": "gold",
      "name": "Gold Package",
      "duration": 365,
      "dailyReturn": 2.0,
      "totalROI": 730.0,
      "minimumAmount": 10000.0,
      "maximumAmount": 100000.0
    }
  ]
}
```

### 2. Create Stake
```http
POST /staking/create
```

**Request Body:**
```json
{
  "packageId": "bronze",
  "amount": 500.0
}
```

**Response:**
```json
{
  "success": true,
  "message": "Stake created successfully",
  "data": {
    "stakeId": "stake_64f1a2b3c4d5e6f7",
    "packageId": "bronze",
    "amount": 500.0,
    "dailyEarning": 5.0,
    "totalROI": 150.0,
    "startDate": "2024-01-15T10:30:00.000Z",
    "endDate": "2024-02-14T10:30:00.000Z",
    "status": "active"
  }
}
```

### 3. Get Active Stakes
```http
GET /staking/active
```

**Response:**
```json
{
  "success": true,
  "data": {
    "stakes": [
      {
        "id": "stake_64f1a2b3c4d5e6f7",
        "packageId": "bronze",
        "packageName": "Bronze Package",
        "amount": 500.0,
        "dailyEarning": 5.0,
        "totalEarned": 25.0,
        "remainingDays": 25,
        "startDate": "2024-01-15T10:30:00.000Z",
        "endDate": "2024-02-14T10:30:00.000Z",
        "status": "active"
      }
    ],
    "totalStaked": 1500.0,
    "totalDailyEarnings": 15.0
  }
}
```

### 4. Get Staking History
```http
GET /staking/history?page=1&limit=10
```

---

## 💸 Withdrawal Endpoints

### 1. Create Withdrawal Request
```http
POST /withdrawal/create
```

**Request Body:**
```json
{
  "amount": 250.0,
  "walletAddress": "0x1234567890abcdef1234567890abcdef12345678",
  "network": "BEP20",
  "note": "Monthly profit withdrawal"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Withdrawal request submitted successfully",
  "data": {
    "withdrawalId": "with_64f1a2b3c4d5e6f7",
    "amount": 250.0,
    "fee": 2.5,
    "netAmount": 247.5,
    "status": "pending",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### 2. Get Withdrawal History
```http
GET /withdrawal/history?page=1&limit=10
```

**Response:**
```json
{
  "success": true,
  "data": {
    "withdrawals": [
      {
        "id": "with_64f1a2b3c4d5e6f7",
        "amount": 250.0,
        "fee": 2.5,
        "netAmount": 247.5,
        "walletAddress": "0x1234567890abcdef1234567890abcdef12345678",
        "network": "BEP20",
        "status": "approved",
        "createdAt": "2024-01-15T10:30:00.000Z",
        "processedAt": "2024-01-15T14:20:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalWithdrawals": 28
    }
  }
}
```

### 3. Get Withdrawable Balance
```http
GET /withdrawal/balance
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalBalance": 1250.50,
    "withdrawableBalance": 875.30,
    "pendingWithdrawals": 250.0,
    "stakedAmount": 125.20,
    "minimumWithdrawal": 10.0,
    "withdrawalFee": 1.0
  }
}
```

---

## 🎯 Dashboard Endpoints

### 1. Get Dashboard Data
```http
GET /dashboard
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "name": "John Doe",
      "email": "user@example.com"
    },
    "wallet": {
      "totalBalance": 1250.50,
      "availableBalance": 875.30,
      "stakedAmount": 125.20,
      "totalEarnings": 320.75
    },
    "staking": {
      "activeStakes": 2,
      "totalDailyEarnings": 15.0,
      "totalStaked": 1500.0
    },
    "referral": {
      "totalReferrals": 15,
      "totalCommission": 320.75,
      "pendingCommission": 45.20
    },
    "recentTransactions": [
      {
        "id": "txn_64f1a2b3c4d5e6f7",
        "type": "deposit",
        "amount": 100.0,
        "status": "confirmed",
        "createdAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "notifications": [
      {
        "id": "not_64f1a2b3c4d5e6f7",
        "title": "Stake Completed",
        "message": "Your Bronze Package stake has been completed",
        "type": "success",
        "createdAt": "2024-01-15T10:30:00.000Z",
        "read": false
      }
    ]
  }
}
```

---

## 📞 Support Endpoints

### 1. Create Support Ticket
```http
POST /support/tickets
```

**Request Body:**
```json
{
  "subject": "Issue with withdrawal",
  "message": "My withdrawal request is pending for more than 24 hours",
  "category": "withdrawal",
  "priority": "high"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Support ticket created successfully",
  "data": {
    "ticketId": "ticket_64f1a2b3c4d5e6f7",
    "subject": "Issue with withdrawal",
    "status": "open",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### 2. Get Support Tickets
```http
GET /support/tickets?page=1&limit=10&status=all
```

**Response:**
```json
{
  "success": true,
  "data": {
    "tickets": [
      {
        "id": "ticket_64f1a2b3c4d5e6f7",
        "subject": "Issue with withdrawal",
        "message": "My withdrawal request is pending for more than 24 hours",
        "category": "withdrawal",
        "status": "open",
        "priority": "high",
        "createdAt": "2024-01-15T10:30:00.000Z",
        "lastReply": "2024-01-15T14:20:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 2,
      "totalTickets": 15
    }
  }
}
```

### 3. Get Ticket Details
```http
GET /support/tickets/:ticketId
```

### 4. Reply to Ticket
```http
POST /support/tickets/:ticketId/reply
```

**Request Body:**
```json
{
  "message": "Thank you for looking into this issue"
}
```

---

## 🔔 Notification Endpoints

### 1. Get Notifications
```http
GET /notifications?page=1&limit=20&unread=false
```

**Response:**
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": "not_64f1a2b3c4d5e6f7",
        "title": "Stake Completed",
        "message": "Your Bronze Package stake has been completed",
        "type": "success",
        "createdAt": "2024-01-15T10:30:00.000Z",
        "read": false
      }
    ],
    "unreadCount": 3,
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalNotifications": 48
    }
  }
}
```

### 2. Mark Notification as Read
```http
PUT /notifications/:notificationId/read
```

### 3. Mark All Notifications as Read
```http
PUT /notifications/read-all
```

---

## 📊 Analytics Endpoints

### 1. Get General Analytics
```http
GET /analytics/overview?period=30d
```

**Response:**
```json
{
  "success": true,
  "data": {
    "period": "30d",
    "totalDeposits": 5000.0,
    "totalWithdrawals": 2000.0,
    "netProfit": 1500.0,
    "activeStakes": 5,
    "referralGrowth": 25.5,
    "chartData": {
      "dailyProfits": [
        { "date": "2024-01-15", "amount": 50.0 },
        { "date": "2024-01-16", "amount": 75.0 }
      ],
      "referralGrowth": [
        { "date": "2024-01-15", "count": 3 },
        { "date": "2024-01-16", "count": 5 }
      ]
    }
  }
}
```

---

## 🛡️ Error Response Format

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "email",
        "message": "Email is required"
      }
    ]
  }
}
```

### Common Error Codes:
- `VALIDATION_ERROR`: Invalid input data
- `AUTHENTICATION_ERROR`: Invalid or missing token
- `AUTHORIZATION_ERROR`: Insufficient permissions
- `NOT_FOUND`: Resource not found
- `DUPLICATE_ERROR`: Resource already exists
- `RATE_LIMIT_ERROR`: Too many requests
- `SERVER_ERROR`: Internal server error

---

## 🔒 Security Implementation

### JWT Token Structure
```json
{
  "userId": "64f1a2b3c4d5e6f7g8h9i0j1",
  "email": "user@example.com",
  "role": "user",
  "iat": 1642248600,
  "exp": 1642335000
}
```

### Rate Limiting
- **Authentication endpoints:** 5 requests per minute
- **General endpoints:** 100 requests per minute
- **Withdrawal endpoints:** 10 requests per hour

### Security Headers
```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000
```

---

## 📝 Database Schema

### Users Collection
```javascript
{
  _id: ObjectId,
  email: String (unique),
  password: String (hashed),
  referralCode: String (unique, auto-generated),
  referredBy: String (referral code),
  isVerified: Boolean,
  profile: {
    firstName: String,
    lastName: String,
    phone: String
  },
  wallet: {
    balance: Number,
    totalEarnings: Number,
    withdrawableBalance: Number
  },
  createdAt: Date,
  updatedAt: Date
}
```

### Referrals Collection
```javascript
{
  _id: ObjectId,
  referrerId: ObjectId,
  referredUserId: ObjectId,
  level: Number,
  commission: Number,
  status: String (pending, verified),
  createdAt: Date
}
```

### Stakes Collection
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  packageId: String,
  amount: Number,
  dailyEarning: Number,
  totalROI: Number,
  startDate: Date,
  endDate: Date,
  status: String (active, completed, cancelled),
  totalEarned: Number,
  createdAt: Date
}
```

### Deposits Collection
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  amount: Number,
  currency: String,
  network: String,
  depositAddress: String,
  transactionHash: String,
  status: String (pending, confirmed, failed),
  createdAt: Date,
  confirmedAt: Date
}
```

### Withdrawals Collection
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  amount: Number,
  fee: Number,
  netAmount: Number,
  walletAddress: String,
  network: String,
  status: String (pending, approved, rejected),
  note: String,
  createdAt: Date,
  processedAt: Date
}
```

---

## 🚀 Deployment Environment Variables

```bash
# Server Configuration
PORT=5000
NODE_ENV=production

# Database
MONGODB_URI=mongodb://localhost:27017/nxchain

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d

# Email Service
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Blockchain/Crypto
USDT_CONTRACT_ADDRESS=0x55d398326f99059ff775485246999027b3197955
BSC_RPC_URL=https://bsc-dataseed1.binance.org
PRIVATE_KEY=your-private-key

# Security
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=100

# External Services
QR_CODE_API_URL=https://api.qrserver.com/v1/create-qr-code
```

---

## 📋 API Testing Examples

### Using curl
```bash
# Register User
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","confirmPassword":"password123"}'

# Login
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Get Dashboard (with token)
curl -X GET http://localhost:5000/api/v1/dashboard \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Using JavaScript/Fetch
```javascript
// Login
const login = async (email, password) => {
  const response = await fetch('/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await response.json();
  if (data.success) {
    localStorage.setItem('token', data.data.token);
  }
  return data;
};

// Get Dashboard
const getDashboard = async () => {
  const token = localStorage.getItem('token');
  const response = await fetch('/api/v1/dashboard', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return await response.json();
};
```

---

## 🔄 Webhook Implementation

### Deposit Webhook
```http
POST /webhook/deposit
```

**Headers:**
```
X-Signature: sha256=hash_signature
```

**Request Body:**
```json
{
  "transactionHash": "0x1234567890abcdef...",
  "amount": 100.0,
  "currency": "USDT",
  "network": "BEP20",
  "toAddress": "0x1234567890abcdef1234567890abcdef12345678",
  "status": "confirmed",
  "blockNumber": 12345678
}
```

---

## 📱 Mobile API Considerations

### Mobile-Specific Endpoints
```http
GET /mobile/app-version
GET /mobile/maintenance-status
POST /mobile/device-token
```

### Push Notification Support
```javascript
{
  "expoPushToken": "ExponentPushToken[xxxxxxxxxxxx]",
  "userId": "64f1a2b3c4d5e6f7g8h9i0j1"
}
```

---

## 🎯 Performance Optimization

### Caching Strategy
- Redis for session management
- Redis for frequently accessed data (user profile, dashboard data)
- CDN for static assets

### Database Indexing
```javascript
// Users Collection
db.users.createIndex({ email: 1 }, { unique: true })
db.users.createIndex({ referralCode: 1 }, { unique: true })

// Referrals Collection
db.referrals.createIndex({ referrerId: 1 })
db.referrals.createIndex({ referredUserId: 1 })

// Transactions
db.deposits.createIndex({ userId: 1, createdAt: -1 })
db.withdrawals.createIndex({ userId: 1, createdAt: -1 })
db.stakes.createIndex({ userId: 1, status: 1 })
```

---

## 📊 Monitoring & Logging

### Log Levels
- `error`: System errors
- `warn`: Warning messages
- `info`: General information
- `debug`: Debug information

### Monitoring Metrics
- API response times
- Error rates
- User activity
- Transaction volumes
- Database performance

---

**API Documentation Version: 1.0**  
**Last Updated: January 2024**  
**Contact: api-support@nxchain.com**
