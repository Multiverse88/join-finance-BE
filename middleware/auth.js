const { verifyToken, getTokenFromHeader } = require('../config/jwt');
const { dbOperations } = require('../models/database');

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
const authorizeUser = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    const user = await dbOperations.getUserById(userId);
    
    if (!user || !user.is_active) {
      return res.status(403).json({
        success: false,
        message: 'User not found or inactive'
      });
    }
    
    req.currentUser = user;
    next();
  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({
      success: false,
      message: 'Database error'
    });
  }
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