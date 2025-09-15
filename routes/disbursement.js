const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/auth");
const { upload } = require("../middleware/upload");
const {
  uploadExcel: uploadController,
  getDisbursements,
  getDisbursementDetails,
} = require("../controllers/disbursementController");

// All disbursement routes require authentication
router.use(authenticateToken);

// Upload Excel file
router.post("/upload", upload.single("excel"), uploadController);

// Get disbursement list
router.get("/", getDisbursements);

// Get disbursement details by batch number
router.get("/details/:batchNumber", getDisbursementDetails);

module.exports = router;
