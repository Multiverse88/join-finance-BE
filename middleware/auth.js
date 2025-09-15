const { verifyToken, getTokenFromHeader } = require('../config/jwt');
const { getDB } = require('../config/database');

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const token = getTokenFromHeader(req);
  
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access token is required'
    });
  }
  
  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired'
      });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    } else {
      return res.status(401).json({
        success: false,
        message: 'Token verification failed'
      });
    }
  }
};

// Authorization middleware (check if user exists in database)
const authorizeUser = (req, res, next) => {
  const db = getDB();
  const userId = req.user.id;
  
  db.get(
    'SELECT * FROM users WHERE id = ? AND is_active = 1',
    [userId],
    (err, user) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({
          success: false,
          message: 'Database error'
        });
      }
      
      if (!user) {
        return res.status(403).json({
          success: false,
          message: 'User not found or inactive'
        });
      }
      
      req.currentUser = user;
      next();
    }
  );
};

// Role-based authorization
const requireRole = (roles) => {
  return (req, res, next) => {
    const userRole = req.currentUser.role;
    
    if (!roles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }
    
    next();
  };
};

module.exports = {
  authenticateToken,
  authorizeUser,
  requireRole
};