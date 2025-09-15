# AuthMe API Documentation

## Overview
The AuthMe feature allows users to fetch their complete profile information using their JWT token obtained during login. This provides a way to retrieve current user data without requiring username/password again.

## Endpoint

### GET /api/auth/authme

Retrieves the current user's complete profile information using JWT token authentication.

#### Headers
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

#### Request
No request body required. Authentication is done via JWT token in Authorization header.

#### Response

**Success Response (200)**
```json
{
  "success": true,
  "message": "Profile retrieved successfully",
  "data": {
    "profile": {
      "nrp": "84177",
      "nama": "AMMAR RAMADHAN",
      "nip": "24.00.0125",
      "userId": "ADMINDGB",
      "kodeCabang": "0000",
      "namaCabang": "DIVISI INFORMATION TECHNOLOGY",
      "kodeInduk": "D440",
      "namaInduk": "DIVISI INFORMATION TECHNOLOGY",
      "kodeKanwil": "0000",
      "namaKanwil": "Kantor Pusat",
      "jabatan": "Staf Development Team Digital Business",
      "email": "test@BANKBJB.CO.ID",
      "idFungsi": "4861",
      "namaFungsi": "Admin IT",
      "kodePenempatan": "D440",
      "namaPenempatan": "DIVISI INFORMATION TECHNOLOGY",
      "id": "1",
      "costCentre": "01300",
      "isApproval": false,
      "kodeUnitKerja": "D440",
      "namaUnitKerja": "DIVISI INFORMATION TECHNOLOGY",
      "kodeJabatan": "J2337"
    }
  }
}
```

**Error Responses**

**401 Unauthorized - Missing Token**
```json
{
  "success": false,
  "message": "Access token is required"
}
```

**401 Unauthorized - Invalid Token**
```json
{
  "success": false,
  "message": "Invalid or expired token"
}
```

**401 Unauthorized - Inactive Account**
```json
{
  "success": false,
  "message": "Account is inactive"
}
```

**404 Not Found - User Not Found**
```json
{
  "success": false,
  "message": "User not found"
}
```

**500 Internal Server Error**
```json
{
  "success": false,
  "message": "Internal server error"
}
```

## Usage Examples

### JavaScript/Axios
```javascript
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';

try {
  const response = await axios.get('http://localhost:3002/api/auth/authme', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  const userProfile = response.data.data.profile;
  console.log('User Profile:', userProfile);
} catch (error) {
  console.error('Error:', error.response.data);
}
```

### cURL
```bash
curl -X GET "http://localhost:3002/api/auth/authme" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json"
```

### Fetch API
```javascript
const token = localStorage.getItem('authToken');

fetch('http://localhost:3002/api/auth/authme', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
.then(response => response.json())
.then(data => {
  if (data.success) {
    console.log('Profile:', data.data.profile);
  } else {
    console.error('Error:', data.message);
  }
});
```

## Typical Usage Flow

1. **Login** to get JWT token:
   ```javascript
   const loginResponse = await axios.post('/api/auth/login', {
     username: 'ADMINDGB',
     password: '84177123'
   });
   const token = loginResponse.data.data.token;
   ```

2. **Store token** (localStorage, sessionStorage, or secure cookie):
   ```javascript
   localStorage.setItem('authToken', token);
   ```

3. **Use AuthMe** to get current user profile:
   ```javascript
   const authMeResponse = await axios.get('/api/auth/authme', {
     headers: { 'Authorization': `Bearer ${token}` }
   });
   const profile = authMeResponse.data.data.profile;
   ```

## Security Features

- **JWT Token Validation**: Token is verified for authenticity and expiration
- **User Status Check**: Ensures user account is active
- **Database Validation**: Verifies user still exists in database
- **No Password Required**: Profile access without re-entering credentials

## Profile Data Consistency

The AuthMe endpoint returns the **exact same profile structure** as the login endpoint, ensuring consistency across your application. All profile fields are fetched fresh from the database, guaranteeing up-to-date information.

## Rate Limiting

Currently, no rate limiting is implemented, but it's recommended to implement reasonable limits in production environments.

## Testing

Use the provided test script to verify AuthMe functionality:
```bash
node test_authme.js
```

The test covers:
- Successful profile retrieval
- Profile data consistency with login
- Multiple consecutive calls
- Invalid token rejection
- Missing token rejection