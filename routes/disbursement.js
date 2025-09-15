const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const { authenticateToken } = require("../middleware/auth");
const {
  uploadExcel,
  getDisbursements,
  getDisbursementDetails,
} = require("../controllers/disbursementController");

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, "..", "uploads");
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "disbursement-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  // Accept only Excel files
  if (
    file.mimetype === "application/vnd.ms-excel" ||
    file.mimetype ===
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  ) {
    cb(null, true);
  } else {
    cb(new Error("Only Excel files are allowed"), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// All disbursement routes require authentication
router.use(authenticateToken);

// Upload Excel file
router.post("/upload", upload.single("excel"), uploadExcel);

// Get disbursement list
router.get("/", getDisbursements);

// Get disbursement details by batch number
router.get("/details/:batchNumber", getDisbursementDetails);

module.exports = router;
