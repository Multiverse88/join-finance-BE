const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');
const { getDB } = require('../config/database');

// Upload Excel file controller
const uploadExcel = (req, res) => {
  try {
    const file = req.file;
    const user = req.currentUser;
    const db = getDB();
    
    console.log('📁 File uploaded:', file.originalname);
    console.log('👤 Uploaded by:', user.username);
    
    // Read and parse Excel file
    let workbook;
    let worksheetData;
    
    try {
      workbook = XLSX.readFile(file.path);
      const sheetName = workbook.SheetNames[0]; // Use first sheet
      const worksheet = workbook.Sheets[sheetName];
      worksheetData = XLSX.utils.sheet_to_json(worksheet);
      
      console.log(`📊 Excel parsed: ${worksheetData.length} rows found`);
      
    } catch (parseError) {
      console.error('Excel parsing error:', parseError);
      
      // Delete uploaded file
      fs.unlinkSync(file.path);
      
      return res.status(400).json({
        success: false,
        message: 'Failed to parse Excel file',
        error: parseError.message
      });
    }
    
    // Validate Excel structure (basic validation)
    if (worksheetData.length === 0) {
      fs.unlinkSync(file.path);
      return res.status(400).json({
        success: false,
        message: 'Excel file is empty'
      });
    }
    
    // Expected columns (flexible - will map available columns)
    const expectedColumns = [
      'account_number', 'rekening', 'no_rekening',
      'account_name', 'nama_rekening', 'nama',
      'amount', 'nominal', 'jumlah',
      'bank_code', 'kode_bank',
      'bank_name', 'nama_bank',
      'reference', 'referensi', 'keterangan',
      'description', 'deskripsi'
    ];
    
    // Save file info to database
    db.run(
      `INSERT INTO disbursements (file_name, file_path, file_size, uploaded_by, total_records, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [file.originalname, file.path, file.size, user.id, worksheetData.length, 'processing'],
      function(err) {
        if (err) {
          console.error('Database error:', err);
          fs.unlinkSync(file.path);
          return res.status(500).json({
            success: false,
            message: 'Database error'
          });
        }
        
        const disbursementId = this.lastID;
        console.log(`💾 Disbursement record created: ID ${disbursementId}`);
        
        // Process Excel data and save to disbursement_records
        let processedRecords = 0;
        let errorRecords = 0;
        
        const processRecord = (index) => {
          if (index >= worksheetData.length) {
            // All records processed, update disbursement status
            db.run(
              'UPDATE disbursements SET status = ?, processed_records = ?, error_records = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
              ['completed', processedRecords, errorRecords, disbursementId],
              (err) => {
                if (err) {
                  console.error('Error updating disbursement status:', err);
                }
                
                console.log(`✅ Processing completed: ${processedRecords} success, ${errorRecords} errors`);
              }
            );
            
            return;
          }
          
          const row = worksheetData[index];
          
          // Map columns flexibly
          const findColumnValue = (possibleNames) => {
            for (const name of possibleNames) {
              if (row[name] !== undefined) {
                return row[name];
              }
            }
            return null;
          };
          
          const recordData = {
            account_number: findColumnValue(['account_number', 'rekening', 'no_rekening', 'Account Number', 'Rekening']),
            account_name: findColumnValue(['account_name', 'nama_rekening', 'nama', 'Account Name', 'Nama']),
            amount: findColumnValue(['amount', 'nominal', 'jumlah', 'Amount', 'Nominal']),
            bank_code: findColumnValue(['bank_code', 'kode_bank', 'Bank Code', 'Kode Bank']),
            bank_name: findColumnValue(['bank_name', 'nama_bank', 'Bank Name', 'Nama Bank']),
            reference_number: findColumnValue(['reference', 'referensi', 'Reference', 'Referensi']),
            description: findColumnValue(['description', 'deskripsi', 'keterangan', 'Description', 'Keterangan'])
          };
          
          // Basic validation
          let errorMessage = null;
          if (!recordData.account_number) errorMessage = 'Account number is required';
          else if (!recordData.account_name) errorMessage = 'Account name is required';
          else if (!recordData.amount || isNaN(parseFloat(recordData.amount))) errorMessage = 'Valid amount is required';
          
          const status = errorMessage ? 'error' : 'pending';
          
          // Insert record
          db.run(
            `INSERT INTO disbursement_records 
             (disbursement_id, account_number, account_name, amount, bank_code, bank_name, reference_number, description, status, error_message)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              disbursementId,
              recordData.account_number,
              recordData.account_name,
              recordData.amount ? parseFloat(recordData.amount) : null,
              recordData.bank_code,
              recordData.bank_name,
              recordData.reference_number,
              recordData.description,
              status,
              errorMessage
            ],
            (err) => {
              if (err) {
                console.error('Error inserting record:', err);
                errorRecords++;
              } else {
                if (status === 'error') {
                  errorRecords++;
                } else {
                  processedRecords++;
                }
              }
              
              // Process next record
              processRecord(index + 1);
            }
          );
        };
        
        // Start processing records
        processRecord(0);
        
        // Return immediate response
        res.json({
          success: true,
          message: 'File uploaded and processing started',
          data: {
            disbursement_id: disbursementId,
            file_name: file.originalname,
            file_size: file.size,
            total_records: worksheetData.length,
            status: 'processing',
            uploaded_at: new Date().toISOString(),
            preview: worksheetData.slice(0, 5) // First 5 rows for preview
          }
        });
      }
    );
    
  } catch (error) {
    console.error('Upload error:', error);
    
    // Clean up file if error occurs
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get disbursement list
const getDisbursements = (req, res) => {
  const db = getDB();
  const user = req.currentUser;
  
  // If not admin, only show user's own disbursements
  const whereClause = user.role === 'admin' ? '' : 'WHERE d.uploaded_by = ?';
  const params = user.role === 'admin' ? [] : [user.id];
  
  db.all(
    `SELECT 
       d.id, d.file_name, d.file_size, d.total_records, d.processed_records, 
       d.error_records, d.status, d.created_at, d.updated_at,
       u.username as uploaded_by_username, u.full_name as uploaded_by_name
     FROM disbursements d
     LEFT JOIN users u ON d.uploaded_by = u.id
     ${whereClause}
     ORDER BY d.created_at DESC
     LIMIT 50`,
    params,
    (err, rows) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({
          success: false,
          message: 'Database error'
        });
      }
      
      res.json({
        success: true,
        data: rows
      });
    }
  );
};

// Get disbursement details
const getDisbursementDetails = (req, res) => {
  const disbursementId = req.params.id;
  const user = req.currentUser;
  const db = getDB();
  
  // Check if user can access this disbursement
  const whereClause = user.role === 'admin' ? 
    'WHERE d.id = ?' : 
    'WHERE d.id = ? AND d.uploaded_by = ?';
  const params = user.role === 'admin' ? 
    [disbursementId] : 
    [disbursementId, user.id];
  
  db.get(
    `SELECT 
       d.id, d.file_name, d.file_size, d.total_records, d.processed_records, 
       d.error_records, d.status, d.created_at, d.updated_at,
       u.username as uploaded_by_username, u.full_name as uploaded_by_name
     FROM disbursements d
     LEFT JOIN users u ON d.uploaded_by = u.id
     ${whereClause}`,
    params,
    (err, disbursement) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({
          success: false,
          message: 'Database error'
        });
      }
      
      if (!disbursement) {
        return res.status(404).json({
          success: false,
          message: 'Disbursement not found'
        });
      }
      
      // Get records for this disbursement
      db.all(
        'SELECT * FROM disbursement_records WHERE disbursement_id = ? ORDER BY id',
        [disbursementId],
        (err, records) => {
          if (err) {
            console.error('Database error:', err);
            return res.status(500).json({
              success: false,
              message: 'Database error'
            });
          }
          
          res.json({
            success: true,
            data: {
              ...disbursement,
              records
            }
          });
        }
      );
    }
  );
};

module.exports = {
  uploadExcel,
  getDisbursements,
  getDisbursementDetails
};