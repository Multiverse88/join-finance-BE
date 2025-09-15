# 🧪 API Testing Guide

## 🎯 Backend Status: ✅ RUNNING on http://localhost:3002

### 📱 Default Login Credentials:
- **Username:** `admin`
- **Password:** `admin123`

## 🔗 Available API Endpoints

### 1. **Health Check**
```http
GET http://localhost:3002/api/health
```

### 2. **Login** 
```http
POST http://localhost:3002/api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}
```

### 3. **Get Profile** (Protected)
```http
GET http://localhost:3002/api/auth/profile
Authorization: Bearer YOUR_JWT_TOKEN
```

### 4. **Upload Excel** (Protected)
```http
POST http://localhost:3002/api/disbursement/upload
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: multipart/form-data

file: [YOUR_EXCEL_FILE.xlsx]
```

### 5. **Get Disbursements** (Protected)
```http
GET http://localhost:3002/api/disbursement
Authorization: Bearer YOUR_JWT_TOKEN
```

### 6. **Get Disbursement Details** (Protected)
```http
GET http://localhost:3002/api/disbursement/{id}
Authorization: Bearer YOUR_JWT_TOKEN
```

## 🧪 Testing Steps

### **Step 1: Test Login**
1. Use POST request to `/api/auth/login`
2. Save the returned JWT token
3. Use token for subsequent requests

### **Step 2: Test Excel Upload**
1. Create simple Excel file with columns:
   - `account_number` or `rekening`
   - `account_name` or `nama`
   - `amount` or `nominal`
   - `bank_name` or `nama_bank` (optional)
   - `description` or `keterangan` (optional)

2. Upload via `/api/disbursement/upload` with Authorization header

### **Step 3: Check Results**
1. Get disbursement list via `/api/disbursement`
2. Get detailed records via `/api/disbursement/{id}`

## 📊 Sample Excel Data

Create Excel file with these headers and data:

| account_number | account_name | amount | bank_name | description |
|----------------|--------------|--------|-----------|-------------|
| 1234567890 | John Doe | 100000 | BCA | Salary Payment |
| 0987654321 | Jane Smith | 50000 | Mandiri | Bonus Payment |
| 1122334455 | Bob Johnson | 75000 | BRI | Commission |

## 🛠️ Tools for Testing

### **Option 1: VS Code REST Client**
Install "REST Client" extension and use `.http` files

### **Option 2: Thunder Client** (Recommended)
Install "Thunder Client" extension in VS Code

### **Option 3: Postman**
Import collection or create manual requests

### **Option 4: PowerShell** (Windows)
```powershell
# Test login
$response = Invoke-RestMethod -Uri "http://localhost:3002/api/auth/login" -Method Post -ContentType "application/json" -Body '{"username":"admin","password":"admin123"}'
$token = $response.data.token

# Test profile
Invoke-RestMethod -Uri "http://localhost:3002/api/auth/profile" -Method Get -Headers @{Authorization="Bearer $token"}
```

## 🔧 Frontend Integration

Update frontend `.env.local` to connect to backend:

```env
# Uncomment this line in .env.local
NEXT_PUBLIC_API_URL=http://localhost:3002/api
```

---
*Backend API ready for testing and integration* 🚀