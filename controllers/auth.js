const bcrypt = require("bcryptjs");
const Joi = require("joi");
const { dbOperations } = require("../models/database");
const { generateToken } = require("../config/jwt");

// Validation schemas
const loginSchema = Joi.object({
  username: Joi.string().required().min(3).max(50),
  password: Joi.string().required().min(6),
});

// Login controller
const login = async (req, res) => {
  try {
    // Validate request body
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.details.map((detail) => detail.message),
      });
    }

    const { username, password } = value;

    // Find user with profile data by username
    const user = await dbOperations.getUserWithProfile(username);

    if (!user || !user.is_active) {
      return res.status(401).json({
        success: false,
        message: "Invalid username or password",
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid username or password",
      });
    }

    // Generate JWT token
    const token = generateToken({
      id: user.id,
      username: user.username,
    });

    // Return success response with complete BJB profile structure
    res.json({
      success: true,
      message: "Login successful",
      data: {
        token,
        profile: {
          nrp: user.nrp || user.id.toString().padStart(5, "0"),
          nama: user.nama || user.full_name,
          nip: user.nip || "24.00.0125",
          userId: user.username,
          kodeCabang: user.kode_cabang || "0000",
          namaCabang: user.nama_cabang || "DIVISI INFORMATION TECHNOLOGY",
          kodeInduk: user.kode_induk || "D440",
          namaInduk: user.nama_induk || "DIVISI INFORMATION TECHNOLOGY",
          kodeKanwil: user.kode_kanwil || "0000",
          namaKanwil: user.nama_kanwil || "Kantor Pusat",
          jabatan: user.jabatan || "Staff",
          email: user.email,
          idFungsi: user.id_fungsi || "4861",
          namaFungsi: user.nama_fungsi || "Admin IT",
          kodePenempatan: user.kode_penempatan || "D440",
          namaPenempatan:
            user.nama_penempatan || "DIVISI INFORMATION TECHNOLOGY",
          id: user.id.toString(),
          costCentre: user.cost_centre || "01300",
          isApproval: user.is_approval || false,
          kodeUnitKerja: user.kode_unit_kerja || "D440",
          namaUnitKerja:
            user.nama_unit_kerja || "DIVISI INFORMATION TECHNOLOGY",
          kodeJabatan: user.kode_jabatan || "J2337",
        },
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
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
        kodeJabatan: user.kodeJabatan,
      },
    },
  });
};

// Auth Me - Get current user profile from token
const authMe = async (req, res) => {
  try {
    const userId = req.user.id; // From decoded token in middleware

    // Get complete user with profile from database
    const user = await dbOperations.getUserWithProfileById(userId);

    if (!user || !user.is_active) {
      return res.status(404).json({
        success: false,
        message: "User not found or inactive",
      });
    }

    // Return complete profile (same format as login response)
    res.json({
      success: true,
      message: "Profile retrieved successfully",
      data: {
        profile: {
          nrp: user.nrp || user.id.toString().padStart(5, "0"),
          nama: user.nama || user.full_name,
          nip: user.nip || "24.00.0125",
          userId: user.username,
          kodeCabang: user.kode_cabang || "0000",
          namaCabang: user.nama_cabang || "DIVISI INFORMATION TECHNOLOGY",
          kodeInduk: user.kode_induk || "D440",
          namaInduk: user.nama_induk || "DIVISI INFORMATION TECHNOLOGY",
          kodeKanwil: user.kode_kanwil || "0000",
          namaKanwil: user.nama_kanwil || "Kantor Pusat",
          jabatan: user.jabatan || "Staff",
          email: user.email,
          idFungsi: user.id_fungsi || "4861",
          namaFungsi: user.nama_fungsi || "Admin IT",
          kodePenempatan: user.kode_penempatan || "D440",
          namaPenempatan:
            user.nama_penempatan || "DIVISI INFORMATION TECHNOLOGY",
          id: user.id.toString(),
          costCentre: user.cost_centre || "01300",
          isApproval: user.is_approval || false,
          kodeUnitKerja: user.kode_unit_kerja || "D440",
          namaUnitKerja:
            user.nama_unit_kerja || "DIVISI INFORMATION TECHNOLOGY",
          kodeJabatan: user.kode_jabatan || "J2337",
        },
      },
    });
  } catch (error) {
    console.error("AuthMe error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Logout (for future use - client-side token removal)
const logout = (req, res) => {
  res.json({
    success: true,
    message: "Logout successful",
  });
};

module.exports = {
  login,
  getProfile,
  authMe,
  logout,
};
