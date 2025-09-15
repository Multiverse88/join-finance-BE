const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');
const { dbOperations } = require('../models/database');

const uploadExcel = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const filePath = req.file.path;
    const filename = req.file.filename;

    // Read Excel file
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    // Validate required columns
    const requiredColumns = ['nama', 'ktp', 'jenis_kelamin', 'penghasilan', 'plafond', 'cif'];
    if (data.length > 0) {
      const firstRow = data[0];
      const missingColumns = requiredColumns.filter(col => !(col in firstRow));
      
      if (missingColumns.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Missing required columns: ${missingColumns.join(', ')}`,
          data: null
        });
      }
    }

    // Create disbursement record with batch number
    const disbursement = await dbOperations.createDisbursement(
      req.file.originalname,
      data.length,
      req.user.id
    );

    // Process each row and create disbursement records
    const processedRecords = [];
    for (const row of data) {
      // Validate and clean data
      const record = {
        nama: row.nama || '',
        ktp: row.ktp || '',
        jenis_kelamin: row.jenis_kelamin || '',
        penghasilan: parseFloat(row.penghasilan) || 0,
        plafond: parseFloat(row.plafond) || 0,
        cif: row.cif || ''
      };
      
      const savedRecord = await dbOperations.createDisbursementRecord(
        disbursement.id, 
        disbursement.batch_number,
        record
      );
      processedRecords.push(savedRecord);
    }

    // Update disbursement status to processed
    await dbOperations.updateDisbursementStatus(disbursement.id, 'processed');

    // Clean up uploaded file (important for serverless environments)
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log('Temporary file cleaned up:', filePath);
      }
    } catch (cleanupError) {
      console.warn('Failed to clean up temporary file:', cleanupError.message);
    }

    res.json({
      success: true,
      message: 'File uploaded and processed successfully',
      data: {
        disbursement_id: disbursement.id,
        batch_number: disbursement.batch_number,
        filename: req.file.originalname,
        total_records: data.length,
        status: 'processed',
        records: processedRecords
      }
    });

  } catch (error) {
    console.error('Upload error:', error);
    
    // Clean up uploaded file in case of error
    try {
      if (req.file && req.file.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
        console.log('Temporary file cleaned up after error:', req.file.path);
      }
    } catch (cleanupError) {
      console.warn('Failed to clean up temporary file after error:', cleanupError.message);
    }
    
    res.status(500).json({
      success: false,
      message: 'Error processing file',
      error: error.message
    });
  }
};

const getDisbursements = async (req, res) => {
  try {
    console.log('Getting disbursements for user:', req.user.id);
    const disbursements = await dbOperations.getDisbursements(req.user.id);
    console.log('Found disbursements:', disbursements.length, 'records');
    
    res.json({
      success: true,
      message: 'Disbursements retrieved successfully',
      data: disbursements
    });
  } catch (error) {
    console.error('Get disbursements error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving disbursements',
      error: error.message
    });
  }
};

const getDisbursementDetails = async (req, res) => {
  try {
    const { batchNumber } = req.params;
    
    // Get disbursement info
    const disbursement = await dbOperations.getDisbursementByBatch(batchNumber);
    if (!disbursement) {
      return res.status(404).json({
        success: false,
        message: 'Disbursement not found',
        data: null
      });
    }

    // Get disbursement records
    const records = await dbOperations.getDisbursementRecords(batchNumber);
    
    res.json({
      success: true,
      message: 'Disbursement details retrieved successfully',
      data: {
        disbursement,
        records
      }
    });
  } catch (error) {
    console.error('Get disbursement details error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving disbursement details',
      error: error.message
    });
  }
};

module.exports = {
  uploadExcel,
  getDisbursements,
  getDisbursementDetails
};