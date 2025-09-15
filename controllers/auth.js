const bcrypt = require('bcryptjs');
const Joi = require('joi');
const { getDB } = require('../config/database');
const { generateToken } = require('../config/jwt');

// Validation schemas
const loginSchema = Joi.object({
  username: Joi.string().required().min(3).max(50),
  password: Joi.string().required().min(6)
});

// Login controller
const login = async (req, res) => {
  try {
    // Validate request body
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.details.map(detail => detail.message)
      });
    }
    
    const { username, password } = value;
    const db = getDB();
    
    // Find user by userId (username field)
    db.get(
      'SELECT * FROM users WHERE userId = ?',
      [username],
      async (err, user) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({
            success: false,
            message: 'Database error'
          });
        }
        
        if (!user) {
          return res.status(401).json({
            success: false,
            message: 'Invalid username or password'
          });
        }
        
        if (!user.is_active) {
          return res.status(401).json({
            success: false,
            message: 'Account is inactive'
          });
        }
        
        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        if (!isPasswordValid) {
          return res.status(401).json({
            success: false,
            message: 'Invalid username or password'
          });
        }
        
        // Generate JWT token
        const token = generateToken({
          id: user.id,
          userId: user.userId,
          role: user.role
        });
        
        // Update last login (optional)
        db.run(
          'UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          [user.id],
          (err) => {
            if (err) {
              console.error('Error updating last login:', err);
            }
          }
        );
        
        // Return success response with complete profile
        res.json({
          success: true,
          message: 'Login successful',
          data: {
            token,
            profile: {
              nrp: user.nrp,
              nama: user.nama,
              nip: user.nip,
              userId: user.userId,
              kodeCabang: user.kodeCabang,
              namaCabang: user.namaCabang,
              kodeInduk: user.kodeInduk,
              namaInduk: user.namaInduk,
              kodeKanwil: user.kodeKanwil,
              namaKanwil: user.namaKanwil,
              jabatan: user.jabatan,
              email: user.email,
              idFungsi: user.idFungsi,
              namaFungsi: user.namaFungsi,
              kodePenempatan: user.kodePenempatan,
              namaPenempatan: user.namaPenempatan,
              id: user.id.toString(),
              costCentre: user.costCentre,
              isApproval: user.isApproval === 1,
              kodeUnitKerja: user.kodeUnitKerja,
              namaUnitKerja: user.namaUnitKerja,
              kodeJabatan: user.kodeJabatan
            }
          }
        });
      }
    );
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get profile (protected route)
const getProfile = (req, res) => {
  const user = req.currentUser;
  
  res.json({
    success: true,
    data: {
      profile: {
        nrp: user.nrp,
        nama: user.nama,
        nip: user.nip,
        userId: user.userId,
        kodeCabang: user.kodeCabang,
        namaCabang: user.namaCabang,
        kodeInduk: user.kodeInduk,
        namaInduk: user.namaInduk,
        kodeKanwil: user.kodeKanwil,
        namaKanwil: user.namaKanwil,
        jabatan: user.jabatan,
        email: user.email,
        idFungsi: user.idFungsi,
        namaFungsi: user.namaFungsi,
        kodePenempatan: user.kodePenempatan,
        namaPenempatan: user.namaPenempatan,
        id: user.id.toString(),
        costCentre: user.costCentre,
        isApproval: user.isApproval === 1,
        kodeUnitKerja: user.kodeUnitKerja,
        namaUnitKerja: user.namaUnitKerja,
        kodeJabatan: user.kodeJabatan
      }
    }
  });
};

// Auth Me - Get current user profile from token
const authMe = async (req, res) => {
  try {
    const db = getDB();
    const userId = req.user.id; // Dari token yang di-decode di middleware
    
    // Get complete user profile from database
    db.get(
      'SELECT * FROM users WHERE id = ?',
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
          return res.status(404).json({
            success: false,
            message: 'User not found'
          });
        }
        
        if (!user.is_active) {
          return res.status(401).json({
            success: false,
            message: 'Account is inactive'
          });
        }
        
        // Return complete profile (same format as login response)
        res.json({
          success: true,
          message: 'Profile retrieved successfully',
          data: {
            profile: {
              nrp: user.nrp,
              nama: user.nama,
              nip: user.nip,
              userId: user.userId,
              kodeCabang: user.kodeCabang,
              namaCabang: user.namaCabang,
              kodeInduk: user.kodeInduk,
              namaInduk: user.namaInduk,
              kodeKanwil: user.kodeKanwil,
              namaKanwil: user.namaKanwil,
              jabatan: user.jabatan,
              email: user.email,
              idFungsi: user.idFungsi,
              namaFungsi: user.namaFungsi,
              kodePenempatan: user.kodePenempatan,
              namaPenempatan: user.namaPenempatan,
              id: user.id.toString(),
              costCentre: user.costCentre,
              isApproval: user.isApproval === 1,
              kodeUnitKerja: user.kodeUnitKerja,
              namaUnitKerja: user.namaUnitKerja,
              kodeJabatan: user.kodeJabatan
            }
          }
        });
      }
    );
    
  } catch (error) {
    console.error('AuthMe error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Logout (for future use - client-side token removal)
const logout = (req, res) => {
  res.json({
    success: true,
    message: 'Logout successful'
  });
};

module.exports = {
  login,
  getProfile,
  authMe,
  logout
};