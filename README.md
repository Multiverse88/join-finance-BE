# Join Finance Backend API

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup Environment
```bash
cp .env.example .env
# Edit .env dengan konfigurasi yang sesuai
```

### 3. Start Development Server
```bash
npm run dev
```

### 4. Start Production Server
```bash
npm start
```

## 📋 Available Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout (future)

### Disbursement
- `POST /api/disbursement/upload` - Upload Excel file

## 🛠️ Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** SQLite (development)
- **Authentication:** JWT
- **File Upload:** Multer
- **Excel Processing:** xlsx
- **Validation:** Joi

## 📁 Project Structure

```
join-finance-backend/
├── server.js           # Main server file
├── config/
│   ├── database.js     # Database configuration
│   └── jwt.js          # JWT configuration
├── controllers/
│   ├── auth.js         # Authentication logic
│   └── disbursement.js # Disbursement logic
├── middleware/
│   ├── auth.js         # Auth middleware
│   └── upload.js       # File upload middleware
├── models/
│   ├── User.js         # User model
│   └── Disbursement.js # Disbursement model
├── routes/
│   ├── auth.js         # Auth routes
│   └── disbursement.js # Disbursement routes
├── uploads/            # Uploaded files storage
└── database/
    └── join_finance.db # SQLite database
```

## 🔑 Environment Variables

Create `.env` file:
```
PORT=3001
NODE_ENV=development
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=24h
DB_PATH=./database/join_finance.db
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=10485760
```

## 📝 Usage Examples

### Login Request
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }'
```

### Upload Excel File
```bash
curl -X POST http://localhost:3001/api/disbursement/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@your-file.xlsx"
```

---
*Backend API untuk Join Finance Application* 🚀# join-finance-BE
