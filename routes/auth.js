const express = require("express");
const router = express.Router();
const { authenticateToken, authorizeUser } = require("../middleware/auth");
const { login, getProfile, authMe, logout } = require("../controllers/auth");

// Public routes
router.post("/login", login);

// Protected routes
router.get("/profile", authenticateToken, authorizeUser, getProfile);
router.get("/authme", authenticateToken, authMe);
router.post("/logout", authenticateToken, logout);

module.exports = router;
