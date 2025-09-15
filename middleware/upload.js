const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Ensure upload directory exists
// Use /tmp in production (Vercel) for temporary file storage
// Check for Vercel environment or production
const isProduction = process.env.NODE_ENV === "production" || process.env.VERCEL || process.env.VERCEL_ENV;
const uploadDir = isProduction ? "/tmp" : (process.env.UPLOAD_PATH || "./uploads");

// Only create directory in development
if (!isProduction && !fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let fullPath;

    if (isProduction) {
      // In production (Vercel), use /tmp directory directly
      fullPath = uploadDir;
    } else {
      // In development, create subdirectory based on current date
      const dateDir = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
      fullPath = path.join(uploadDir, "disbursements", dateDir);

      // Ensure directory exists in development
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
      }
    }

    cb(null, fullPath);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const extension = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, extension);

    cb(null, `${baseName}_${uniqueSuffix}${extension}`);
  },
});

// File filter for Excel files only
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "application/vnd.ms-excel", // .xls
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
    "application/excel",
    "application/x-excel",
    "application/x-msexcel",
  ];

  const allowedExtensions = [".xls", ".xlsx"];
  const fileExtension = path.extname(file.originalname).toLowerCase();

  if (
    allowedTypes.includes(file.mimetype) ||
    allowedExtensions.includes(fileExtension)
  ) {
    cb(null, true);
  } else {
    cb(new Error("Only Excel files (.xls, .xlsx) are allowed"), false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB default
    files: 1, // Only one file at a time
  },
});

// Middleware for single file upload
const uploadExcel = upload.single("excel");

// Error handling wrapper
const handleUploadErrors = (req, res, next) => {
  uploadExcel(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
          success: false,
          message: "File too large. Maximum size is 10MB",
        });
      }
      if (err.code === "LIMIT_FILE_COUNT") {
        return res.status(400).json({
          success: false,
          message: "Too many files. Only one file allowed",
        });
      }
      return res.status(400).json({
        success: false,
        message: `Upload error: ${err.message}`,
      });
    } else if (err) {
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }

    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    next();
  });
};

module.exports = {
  upload,
  uploadExcel: handleUploadErrors,
};
