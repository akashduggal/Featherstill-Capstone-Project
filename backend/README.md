# Featherstill Backend API

Production-ready Express.js backend for the Featherstill battery monitoring system.

## 📋 Project Structure

```
backend/
├── config/                    # Configuration files
│   ├── database.js           # Sequelize database connection
│   └── index.js              # Centralized config
├── middleware/               # Express middleware
│   ├── validation.js         # Input validation
│   ├── errorHandler.js       # Error handling
│   └── logging.js            # Request logging
├── models/                   # Sequelize ORM models
│   ├── User.js              # User model
│   ├── Battery.js           # Battery model
│   ├── BatteryReading.js    # Battery reading model
│   └── index.js             # Model associations
├── routes/                  # API routes
│   ├── batteryController.js # Business logic
│   ├── batteryRoutes.js     # Battery endpoints
│   ├── healthRoutes.js      # Health check
│   └── index.js             # Route aggregation
├── src/
│   └── server.js            # Express server entry point
├── .env                     # Environment variables
└── package.json             # Dependencies
```

## 🚀 Getting Started

### Prerequisites

- Node.js 16+ (we use 20 LTS)
- PostgreSQL 12+
- npm

### Local Development

1. **Install dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Set up environment variables** (`.env`)
   ```bash
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=featherstill_db
   DB_USER=postgres
   DB_PASSWORD=postgres
   NODE_ENV=development
   PORT=3000
   ```

3. **Create PostgreSQL database** (optional - Sequelize will auto-create)
   ```bash
   createdb featherstill_db
   ```

4. **Start the server**
   ```bash
   npm run dev
   ```

   Server runs at: `http://localhost:3000`

## 📡 API Endpoints

### Health Check
```
GET /health
Response: { status: "OK", timestamp, environment, uptime }
```

### Post Battery Reading
```
POST /api/battery-readings
Content-Type: application/json

{
  "email": "user@example.com",
  "batteryId": "primary-battery",
  "totalBatteryVoltage": 57.44,
  "cellTemperature": 37.0,
  "currentAmps": -19.83,
  "stateOfCharge": 100,
  "chargingStatus": "INACTIVE",
  "cellVoltages": [3.58, 3.6, 3.59, ...]
}

Response: {
  "success": true,
  "message": "Battery reading recorded successfully",
  "data": {
    "id": "uuid",
    "batteryId": "uuid",
    "createdAt": "2026-03-03T..."
  }
}
```

### Get User's Battery Readings
```
GET /api/battery-readings/:email?limit=100&offset=0

Response: {
  "success": true,
  "data": [
    {
      "id": "uuid",
      "batteryId": "uuid",
      "totalBatteryVoltage": 57.44,
      "cellTemperature": 37.0,
      "currentAmps": -19.83,
      "stateOfCharge": 100,
      "chargingStatus": "INACTIVE",
      "cellVoltages": [...],
      "createdAt": "2026-03-03T..."
    }
  ],
  "pagination": {
    "limit": 100,
    "offset": 0,
    "total": 250
  }
}
```

### Get Latest Battery Reading
```
GET /api/battery-readings/:email/latest

Response: {
  "success": true,
  "data": { /* same structure as above */ }
}
```

## 🗄️ Database Schema

### Users Table
```
- id (UUID, primary key)
- email (string, unique)
- firebaseUID (string, unique, nullable)
- isGuest (boolean, default: false)
- createdAt (timestamp)
- updatedAt (timestamp)
```

### Batteries Table
```
- id (UUID, primary key)
- userId (UUID, foreign key → users.id)
- batteryName (string, default: "Primary Battery")
- serialNumber (string, nullable)
- nominalVoltage (float, default: 51.2)
- capacityWh (float, default: 5222)
- status (enum: ACTIVE, INACTIVE, ERROR)
- createdAt (timestamp)
- updatedAt (timestamp)
```

### Battery Readings Table
```
- id (UUID, primary key)
- batteryId (UUID, foreign key → batteries.id)
- totalBatteryVoltage (float, 0-100)
- cellTemperature (float, -50 to 85)
- currentAmps (float)
- stateOfCharge (float, 0-100)
- chargingStatus (enum: CHARGING, DISCHARGING, INACTIVE)
- cellVoltages (JSON array)
- createdAt (timestamp)

Indexes: batteryId, createdAt
```

## 🧪 Testing

### Using cURL

```bash
# Health check
curl http://localhost:3000/health

# Post a reading
curl -X POST http://localhost:3000/api/battery-readings \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "batteryId": "primary-battery",
    "totalBatteryVoltage": 57.44,
    "cellTemperature": 37.0,
    "currentAmps": -19.83,
    "stateOfCharge": 100,
    "chargingStatus": "INACTIVE",
    "cellVoltages": [3.58, 3.6, 3.59, 3.59, 3.6, 3.60, 3.62, 3.62, 3.59, 3.58, 3.57, 3.58, 3.59, 3.58, 3.58, 3.6]
  }'

# Get readings for a user
curl http://localhost:3000/api/battery-readings/test@example.com

# Get latest reading
curl http://localhost:3000/api/battery-readings/test@example.com/latest
```

## 🚢 Deployment (EC2)

### 1. SSH into EC2 instance
```bash
ssh -i your-key.pem ec2-user@your-ec2-ip
```

### 2. Install dependencies
```bash
cd /var/www/featherstill
npm install
```

### 3. Update .env with RDS credentials
```bash
DB_HOST=your-rds-endpoint.rds.amazonaws.com
DB_PORT=5432
DB_NAME=featherstill
DB_USER=postgres
DB_PASSWORD=your-secure-password
NODE_ENV=production
```

### 4. Start with PM2
```bash
pm2 start ecosystem.config.js
pm2 logs featherstill-api
```

### 5. Configure nginx (proxy on port 80 → 3000)
See AWS EC2 setup guide for full nginx configuration.

## 🔐 Security Notes

- Environment variables stored in `.env` (never commit)
- Input validation on all endpoints
- SQL injection protected by Sequelize ORM
- CORS configured for frontend origin
- Error messages sanitized in production
- Database credentials in AWS Secrets Manager (production)

## 📊 Monitoring

Logs include:
- Request/response with unique request ID
- Database operations
- Error stack traces
- Response times

View logs:
```bash
npm run dev    # See real-time logs
pm2 logs       # EC2 logs
```

## 🔄 Data Flow

```
Frontend (React Native)
  ↓
POST /api/battery-readings (every 60 seconds)
  ↓
Express Server (EC2)
  ├─ Validate input
  ├─ Find/create user
  ├─ Find/create battery
  ├─ Create reading record
  ↓
PostgreSQL (RDS)
  ├─ Insert battery_reading
  ├─ Return record with ID
  ↓
Express Response (201 Created)
  ↓
Frontend logs success
```

## 📦 Dependencies

- **express**: Web framework
- **sequelize**: ORM for PostgreSQL
- **pg**: PostgreSQL client
- **dotenv**: Environment variables
- **cors**: Cross-origin requests
- **uuid**: Unique identifiers

## 🐛 Troubleshooting

### Database connection error
```
Check DB_HOST, DB_PORT, DB_USER, DB_PASSWORD in .env
Verify PostgreSQL is running: psql -U postgres
```

### Port 3000 already in use
```
Kill process: lsof -i :3000
Or use different PORT in .env
```

### Sequelize sync error
```
Check database exists: createdb featherstill_db
Check user permissions
```

## 📝 Next Steps

- [ ] Set up RDS PostgreSQL
- [ ] Update frontend API URL to EC2 public IP
- [ ] Test end-to-end POST from React Native app
- [ ] Add SSL/HTTPS with certbot
- [ ] Set up CloudWatch monitoring
- [ ] Implement database backups

## 📞 Support

For issues, check logs:
```bash
pm2 logs featherstill-api
tail -f /var/log/nginx/error.log
```

---

**Version**: 1.0.0  
**Last Updated**: March 2026
