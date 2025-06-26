import { NhanVien } from "../models/index.js";
import { successResponse, errorResponse } from "../utils/response.util.js";
import { COLUMNS } from "../constants/database.constants.js";
import { Op } from "sequelize";
import { passwordUtils } from "../utils/password.util.js";

export const nhanVienController = {
  // Lấy danh sách nhân viên
  getAll: async (req, res) => {
    try {
      const { page = 1, limit = 10, search, role, trang_thai } = req.query;
      const offset = (page - 1) * limit;
      const where = { [COLUMNS.COMMON.DANG_HIEN]: true };

      if (search) {
        where[COLUMNS.NHAN_VIEN.TEN] = { [Op.iLike]: `%${search}%` };
      }
      if (role) {
        where[COLUMNS.NHAN_VIEN.ROLE] = role;
      }
      if (trang_thai) {
        where[COLUMNS.NHAN_VIEN.TRANG_THAI] = trang_thai;
      }

      const { count, rows } = await NhanVien.findAndCountAll({
        where,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [[COLUMNS.COMMON.ID, "DESC"]],
      });

      return successResponse(res, {
        staff: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / limit),
        },
      });
    } catch (error) {
      return errorResponse(res, 500, "Failed to get staff", error.message);
    }
  },

  // Lấy chi tiết nhân viên
  getById: async (req, res) => {
    try {
      const { id } = req.params;
      const staff = await NhanVien.findByPk(id);
      if (!staff) return errorResponse(res, 404, "Staff not found");
      return successResponse(res, staff);
    } catch (error) {
      return errorResponse(res, 500, "Failed to get staff", error.message);
    }
  },

  // Thêm nhân viên mới
  create: async (req, res) => {
    try {
      const data = req.body;
      // Kiểm tra trùng mã NV hoặc email
      const exists = await NhanVien.findOne({
        where: {
          [Op.or]: [
            { [COLUMNS.NHAN_VIEN.MA_NV]: data.ma_nv },
            { [COLUMNS.NHAN_VIEN.EMAIL]: data.email },
          ],
        },
      });
      if (exists) return errorResponse(res, 409, "Mã NV hoặc Email đã tồn tại");

      // Hash password nếu có
      let hashedPassword = null;
      if (data.mat_khau) {
        hashedPassword = await passwordUtils.hashPassword(data.mat_khau);
      }

      const staff = await NhanVien.create({
        ...data,
        [COLUMNS.NHAN_VIEN.MAT_KHAU]: hashedPassword,
        [COLUMNS.COMMON.NGUOI_TAO]: req.user?.id || null,
      });
      return successResponse(res, staff, null, 201);
    } catch (error) {
      return errorResponse(res, 500, "Failed to create staff", error.message);
    }
  },

  // Cập nhật nhân viên
  update: async (req, res) => {
    try {
      const { id } = req.params;
      const data = req.body;
      const staff = await NhanVien.findByPk(id);
      if (!staff) return errorResponse(res, 404, "Staff not found");

      // Kiểm tra trùng email nếu đổi
      if (data.email && data.email !== staff[COLUMNS.NHAN_VIEN.EMAIL]) {
        const exists = await NhanVien.findOne({
          where: {
            [COLUMNS.NHAN_VIEN.EMAIL]: data.email,
            [COLUMNS.COMMON.ID]: { [Op.ne]: id },
          },
        });
        if (exists) return errorResponse(res, 409, "Email đã tồn tại");
      }

      await staff.update({
        ...data,
        [COLUMNS.COMMON.NGUOI_CAP_NHAT]: req.user?.id || null,
      });
      return successResponse(res, staff);
    } catch (error) {
      return errorResponse(res, 500, "Failed to update staff", error.message);
    }
  },

  // Xóa mềm nhân viên
  delete: async (req, res) => {
    try {
      const { id } = req.params;
      const staff = await NhanVien.findByPk(id);
      if (!staff) return errorResponse(res, 404, "Staff not found");
      staff[COLUMNS.COMMON.DANG_HIEN] = false;
      await staff.save();
      return successResponse(res, { message: "Staff deleted (soft)" });
    } catch (error) {
      return errorResponse(res, 500, "Failed to delete staff", error.message);
    }
  },
};