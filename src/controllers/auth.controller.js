import { NhanVien, SinhVien, PhieuDangKy } from "../models/index.js";
import { successResponse, errorResponse } from "../utils/response.util.js";
import { passwordUtils } from "../utils/password.util.js";
import { jwtUtils } from "../utils/jwt.util.js";
import { redisUtils } from "../config/redis.config.js";
import {
  ENUM_NHAN_VIEN_TRANG_THAI,
  ENUM_SINH_VIEN_TRANG_THAI,
  COLUMNS,
  ENUM_PHIEU_DANG_KY_TRANG_THAI,
} from "../constants/database.constants.js";
import sequelize from "../config/database.config.js";

export const authController = {
  // Staff/Admin login
  loginStaff: async (req, res) => {
    try {
      const { ma_nv, mat_khau } = req.body;

      if (!ma_nv || !mat_khau) {
        return errorResponse(res, 400, "Employee ID and password are required");
      }

      // Find staff member
      const nhanVien = await NhanVien.findOne({
        where: {
          [COLUMNS.NHAN_VIEN.MA_NV]: ma_nv,
          [COLUMNS.COMMON.DANG_HIEN]: true,
        },
      });

      if (!nhanVien) {
        return errorResponse(res, 401, "Invalid credentials");
      }

      // Check if account is active
      if (nhanVien[COLUMNS.NHAN_VIEN.TRANG_THAI] !== ENUM_NHAN_VIEN_TRANG_THAI.ACTIVE) {
        return errorResponse(res, 401, "Account is inactive");
      }

      // Verify password
      const isPasswordValid = await passwordUtils.comparePassword(mat_khau, nhanVien[COLUMNS.NHAN_VIEN.MAT_KHAU]);
      if (!isPasswordValid) {
        return errorResponse(res, 401, "Invalid credentials");
      }

      // Generate tokens
      const tokenPayload = {
        userId: nhanVien[COLUMNS.COMMON.ID],
        userType: "nhan_vien",
        role: nhanVien[COLUMNS.NHAN_VIEN.ROLE],
      };

      const accessToken = jwtUtils.generateAccessToken(tokenPayload);
      const refreshToken = jwtUtils.generateRefreshToken(tokenPayload);

      // Store refresh token in Redis
      await redisUtils.setRefreshToken(
        nhanVien[COLUMNS.COMMON.ID],
        refreshToken,
        jwtUtils.getTokenExpirationTime("refresh"),
      );

      return successResponse(res, {
        user: nhanVien.toJSON(),
        tokens: {
          accessToken,
          refreshToken,
        },
      });
    } catch (error) {
      return errorResponse(res, 500, "Login failed", error.message);
    }
  },

  // Student login
  loginStudent: async (req, res) => {
    try {
      const { mssv, mat_khau } = req.body;

      if (!mssv || !mat_khau) {
        return errorResponse(res, 400, "Student ID and password are required");
      }

      // Find student
      const sinhVien = await SinhVien.findOne({
        where: {
          [COLUMNS.SINH_VIEN.MSSV]: mssv,
          [COLUMNS.COMMON.DANG_HIEN]: true,
        },
      });

      if (!sinhVien) {
        return errorResponse(res, 401, "Invalid credentials");
      }

      // Check if student has set up password
      if (!sinhVien[COLUMNS.SINH_VIEN.MAT_KHAU]) {
        return errorResponse(res, 400, "Password not set up. Please contact administration.");
      }

      // Check if account is active
      if (
        ![ENUM_SINH_VIEN_TRANG_THAI.ACTIVE_RESIDENT, ENUM_SINH_VIEN_TRANG_THAI.APPLICANT].includes(
          sinhVien[COLUMNS.SINH_VIEN.TRANG_THAI],
        )
      ) {
        return errorResponse(res, 401, "Account is inactive");
      }

      // Verify password
      const isPasswordValid = await passwordUtils.comparePassword(mat_khau, sinhVien[COLUMNS.SINH_VIEN.MAT_KHAU]);
      if (!isPasswordValid) {
        return errorResponse(res, 401, "Invalid credentials");
      }

      // Generate tokens
      const tokenPayload = {
        userId: sinhVien[COLUMNS.COMMON.ID],
        userType: "sinh_vien",
        role: "student",
      };

      const accessToken = jwtUtils.generateAccessToken(tokenPayload);
      const refreshToken = jwtUtils.generateRefreshToken(tokenPayload);

      // Store refresh token in Redis
      await redisUtils.setRefreshToken(
        sinhVien[COLUMNS.COMMON.ID],
        refreshToken,
        jwtUtils.getTokenExpirationTime("refresh"),
      );

      return successResponse(res, {
        user: sinhVien.toJSON(),
        tokens: {
          accessToken,
          refreshToken,
        },
      });
    } catch (error) {
      return errorResponse(res, 500, "Login failed", error.message);
    }
  },

  // Register new staff (admin only)
  registerStaff: async (req, res) => {
    try {
      const { ma_nv, ten, mat_khau, role, sdt, email, cmnd, phai, phong_ban, ngay_sinh } = req.body;

      if (!ma_nv || !ten || !mat_khau) {
        return errorResponse(res, 400, "Employee ID, name, and password are required");
      }

      // Validate password strength
      const passwordValidation = passwordUtils.validatePasswordStrength(mat_khau);
      if (!passwordValidation.isValid) {
        return errorResponse(res, 400, "Password does not meet requirements", passwordValidation.errors);
      }

      // Check if employee ID already exists
      const existingNhanVien = await NhanVien.findOne({
        where: { [COLUMNS.NHAN_VIEN.MA_NV]: ma_nv },
      });

      if (existingNhanVien) {
        return errorResponse(res, 409, "Employee ID already exists");
      }

      // Check if email already exists (if provided)
      if (email) {
        const existingEmail = await NhanVien.findOne({
          where: { [COLUMNS.NHAN_VIEN.EMAIL]: email },
        });

        if (existingEmail) {
          return errorResponse(res, 409, "Email already exists");
        }
      }

      // Hash password
      const hashedPassword = await passwordUtils.hashPassword(mat_khau);

      // Create new staff
      const newNhanVien = await NhanVien.create({
        [COLUMNS.NHAN_VIEN.MA_NV]: ma_nv,
        [COLUMNS.NHAN_VIEN.TEN]: ten,
        [COLUMNS.NHAN_VIEN.MAT_KHAU]: hashedPassword,
        [COLUMNS.NHAN_VIEN.ROLE]: role || "staff",
        [COLUMNS.NHAN_VIEN.SDT]: sdt,
        [COLUMNS.NHAN_VIEN.EMAIL]: email,
        [COLUMNS.NHAN_VIEN.CMND]: cmnd,
        [COLUMNS.NHAN_VIEN.PHAI]: phai,
        [COLUMNS.NHAN_VIEN.PHONG_BAN]: phong_ban,
        [COLUMNS.NHAN_VIEN.NGAY_SINH]: ngay_sinh,
        [COLUMNS.NHAN_VIEN.NGAY_VAO_LAM]: new Date(),
        [COLUMNS.COMMON.NGUOI_TAO]: req.user?.id,
      });

      return successResponse(
        res,
        {
          user: newNhanVien.toJSON(),
          message: "Staff registered successfully",
        },
        null,
        201,
      );
    } catch (error) {
      return errorResponse(res, 500, "Registration failed", error.message);
    }
  },

  // Register new student (staff/admin only)
  registerStudent: async (req, res) => {
    // Bắt đầu transaction
    const transaction = await sequelize.transaction();

    try {
      const {
        mssv,
        ten,
        dia_chi,
        phai,
        ngay_sinh,
        noi_sinh,
        dan_toc,
        ton_giao,
        khoa,
        sdt,
        cmnd,
        ngay_cap_cmnd,
        noi_cap_cmnd,
        ho_khau,
        dia_chi_lien_he,
        email,
        lop,
        ngay_bat_dau_o,
        ly_do_dang_ky,
        ghi_chu,
      } = req.body;

      if (!mssv || !ten) {
        await transaction.rollback();
        return errorResponse(res, 400, "Student ID and name are required");
      }

      if (!ngay_bat_dau_o) {
        await transaction.rollback();
        return errorResponse(res, 400, "Start date for accommodation is required");
      }

      // Validate start date
      const startDate = new Date(ngay_bat_dau_o);
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Reset time để so sánh chỉ ngày

      // Tính ngày tối đa cho phép (20 ngày từ hôm nay)
      const maxAllowedDate = new Date(today);
      maxAllowedDate.setDate(today.getDate() + 20);

      if (startDate <= today || startDate > maxAllowedDate) {
        await transaction.rollback();
        return errorResponse(res, 400, "Start date must be between tomorrow and within 20 days from today");
      }

      // Check if student ID already exists
      const existingSinhVien = await SinhVien.findOne({
        where: { [COLUMNS.SINH_VIEN.MSSV]: mssv },
        transaction,
      });

      if (existingSinhVien) {
        await transaction.rollback();
        return errorResponse(res, 409, "Student ID already exists");
      }

      // Check if email already exists (if provided)
      if (email) {
        const existingEmail = await SinhVien.findOne({
          where: { [COLUMNS.SINH_VIEN.EMAIL]: email },
          transaction,
        });

        if (existingEmail) {
          await transaction.rollback();
          return errorResponse(res, 409, "Email already exists");
        }
      }

      // Check if CMND already exists (if provided)
      if (cmnd) {
        if (cmnd.length !== 9 && cmnd.length !== 12) {
          await transaction.rollback();
          return errorResponse(res, 400, "CMND must be 9 or 12 digits long");
        }
        const existingCMND = await SinhVien.findOne({
          where: { [COLUMNS.SINH_VIEN.CMND]: cmnd },
          transaction,
        });

        if (existingCMND) {
          await transaction.rollback();
          return errorResponse(res, 409, "CMND already exists");
        }
      }

      // Create new student (password will be set up later)
      const newSinhVien = await SinhVien.create(
        {
          [COLUMNS.SINH_VIEN.MSSV]: mssv,
          [COLUMNS.SINH_VIEN.TEN]: ten,
          [COLUMNS.SINH_VIEN.DIA_CHI]: dia_chi,
          [COLUMNS.SINH_VIEN.PHAI]: phai,
          [COLUMNS.SINH_VIEN.NGAY_SINH]: ngay_sinh,
          [COLUMNS.SINH_VIEN.NOI_SINH]: noi_sinh,
          [COLUMNS.SINH_VIEN.DAN_TOC]: dan_toc,
          [COLUMNS.SINH_VIEN.TON_GIAO]: ton_giao,
          [COLUMNS.SINH_VIEN.KHOA]: khoa,
          [COLUMNS.SINH_VIEN.SDT]: sdt,
          [COLUMNS.SINH_VIEN.CMND]: cmnd,
          [COLUMNS.SINH_VIEN.NGAY_CAP_CMND]: ngay_cap_cmnd,
          [COLUMNS.SINH_VIEN.NOI_CAP_CMND]: noi_cap_cmnd,
          [COLUMNS.SINH_VIEN.HO_KHAU]: ho_khau,
          [COLUMNS.SINH_VIEN.DIA_CHI_LIEN_HE]: dia_chi_lien_he,
          [COLUMNS.SINH_VIEN.EMAIL]: email,
          [COLUMNS.SINH_VIEN.LOP]: lop,
          [COLUMNS.SINH_VIEN.TRANG_THAI]: ENUM_SINH_VIEN_TRANG_THAI.APPLICANT,
          [COLUMNS.COMMON.NGUOI_TAO]: req.user?.id,
        },
        { transaction },
      );

      // Tạo phiếu đăng ký KTX cho sinh viên mới
      const newRegistration = await PhieuDangKy.create(
        {
          [COLUMNS.PHIEU_DANG_KY_KTX.ID_SINH_VIEN]: newSinhVien[COLUMNS.COMMON.ID],
          [COLUMNS.PHIEU_DANG_KY_KTX.NGAY_DANG_KY]: new Date(),
          [COLUMNS.PHIEU_DANG_KY_KTX.NGAY_BAT_DAU]: ngay_bat_dau_o,
          [COLUMNS.PHIEU_DANG_KY_KTX.NGAY_KET_THUC]: null,
          [COLUMNS.PHIEU_DANG_KY_KTX.TRANG_THAI]: ENUM_PHIEU_DANG_KY_TRANG_THAI.PENDING,
          [COLUMNS.PHIEU_DANG_KY_KTX.LY_DO_DANG_KY]: ly_do_dang_ky,
          [COLUMNS.PHIEU_DANG_KY_KTX.GHI_CHU]: ghi_chu || "",
          [COLUMNS.COMMON.NGUOI_TAO]: req.user?.id,
        },
        { transaction },
      );

      // Commit transaction nếu tất cả thành công
      await transaction.commit();

      // Trả về thông tin sinh viên và phiếu đăng ký
      return successResponse(
        res,
        {
          student: newSinhVien.toJSON(),
          registration: newRegistration.toJSON(),
          message: "Student registered and accommodation application created successfully",
        },
        null,
        201,
      );
    } catch (error) {
      // Rollback transaction nếu có lỗi
      await transaction.rollback();
      return errorResponse(res, 500, "Registration failed", error.message);
    }
  },

  // Refresh token
  refreshToken: async (req, res) => {
    try {
      const { user } = req; // Set by verifyRefreshToken middleware

      // Generate new access token
      const tokenPayload = {
        userId: user.id,
        userType: user.type,
        role: user.role,
      };

      const newAccessToken = jwtUtils.generateAccessToken(tokenPayload);

      return successResponse(res, {
        accessToken: newAccessToken,
      });
    } catch (error) {
      return errorResponse(res, 500, "Token refresh failed", error.message);
    }
  },

  // Logout
  logout: async (req, res) => {
    try {
      const { user } = req;

      // Remove refresh token from Redis
      await redisUtils.deleteRefreshToken(user.id);

      return successResponse(res, { message: "Logged out successfully" });
    } catch (error) {
      return errorResponse(res, 500, "Logout failed", error.message);
    }
  },

  // Get current user profile
  getProfile: async (req, res) => {
    try {
      const { user } = req;

      return successResponse(res, {
        user: user.user.toJSON(),
      });
    } catch (error) {
      return errorResponse(res, 500, "Failed to get profile", error.message);
    }
  },

  // Change password
  changePassword: async (req, res) => {
    try {
      const { current_password, new_password } = req.body;
      const { user } = req;

      if (!current_password || !new_password) {
        return errorResponse(res, 400, "Current password and new password are required");
      }

      // Validate new password strength
      const passwordValidation = passwordUtils.validatePasswordStrength(new_password);
      if (!passwordValidation.isValid) {
        return errorResponse(res, 400, "New password does not meet requirements", passwordValidation.errors);
      }

      // Get current user data
      let currentUser;
      if (user.type === "nhan_vien") {
        currentUser = await NhanVien.findByPk(user.id);
      } else {
        currentUser = await SinhVien.findByPk(user.id);
      }

      // Verify current password
      const isCurrentPasswordValid = await passwordUtils.comparePassword(
        current_password,
        currentUser[user.type === "nhan_vien" ? COLUMNS.NHAN_VIEN.MAT_KHAU : COLUMNS.SINH_VIEN.MAT_KHAU],
      );
      if (!isCurrentPasswordValid) {
        return errorResponse(res, 401, "Current password is incorrect");
      }

      // Hash new password
      const hashedNewPassword = await passwordUtils.hashPassword(new_password);

      // Update password
      if (user.type === "nhan_vien") {
        await currentUser.update({
          [COLUMNS.NHAN_VIEN.MAT_KHAU]: hashedNewPassword,
          [COLUMNS.COMMON.NGUOI_CAP_NHAT]: user.id,
        });
      } else {
        await currentUser.update({
          [COLUMNS.SINH_VIEN.MAT_KHAU]: hashedNewPassword,
          [COLUMNS.COMMON.NGUOI_CAP_NHAT]: user.id,
        });
      }

      // Invalidate all refresh tokens for this user
      await redisUtils.deleteRefreshToken(user.id);

      return successResponse(res, {
        message: "Password changed successfully. Please login again with your new password.",
      });
    } catch (error) {
      return errorResponse(res, 500, "Failed to change password", error.message);
    }
  },
};
