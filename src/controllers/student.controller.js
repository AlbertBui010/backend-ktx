import { SinhVien, PhuHuynh, Giuong, Phong, LoaiPhong, NhanVien } from "../models/index.js";
import { successResponse, errorResponse } from "../utils/response.util.js";
import { passwordUtils } from "../utils/password.util.js";
import { COLUMNS, ENUM_SINH_VIEN_TRANG_THAI } from "../constants/database.constants.js";
import sequelize from "../config/database.config.js";
import { Op } from "sequelize";
import { emailUtils } from "../utils/email.util.js";

export const studentController = {
  // Get all students
  getStudents: async (req, res) => {
    try {
      const { page = 1, limit = 10, search, trang_thai, khoa } = req.query;
      const offset = (page - 1) * limit;

      const whereClause = {
        [COLUMNS.COMMON.DANG_HIEN]: true,
      };

      if (search) {
        whereClause[Op.or] = [
          {
            [COLUMNS.SINH_VIEN.TEN]: {
              [Op.iLike]: `%${search}%`,
            },
          },
          {
            [COLUMNS.SINH_VIEN.MSSV]: {
              [Op.iLike]: `%${search}%`,
            },
          },
        ];
      }

      if (trang_thai) {
        whereClause[COLUMNS.SINH_VIEN.TRANG_THAI] = trang_thai;
      }

      if (khoa) {
        whereClause[COLUMNS.SINH_VIEN.KHOA] = khoa;
      }

      const { count, rows } = await SinhVien.findAndCountAll({
        where: whereClause,
        limit: parseInt(limit),
        offset: parseInt(offset),
        include: [
          {
            model: PhuHuynh,
            as: "Parents",
            attributes: [COLUMNS.COMMON.ID, COLUMNS.PHU_HUYNH.TEN, COLUMNS.PHU_HUYNH.QUAN_HE, COLUMNS.PHU_HUYNH.SDT],
          },
          {
            model: Giuong,
            as: "Bed",
            attributes: [COLUMNS.COMMON.ID, COLUMNS.GIUONG.TEN_GIUONG],
            include: [
              {
                model: Phong,
                as: "Room",
                attributes: [COLUMNS.PHONG.TEN_PHONG, COLUMNS.PHONG.SO_TANG],
                include: [
                  {
                    model: LoaiPhong,
                    as: "RoomType",
                    attributes: [COLUMNS.LOAI_PHONG.TEN_LOAI],
                  },
                ],
              },
            ],
          },
        ],
        order: [[COLUMNS.SINH_VIEN.TEN, "ASC"]],
      });

      return successResponse(res, {
        students: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / limit),
        },
      });
    } catch (error) {
      return errorResponse(res, 500, "Failed to get students", error.message);
    }
  },

  // Get student by ID
  getStudentById: async (req, res) => {
    try {
      const { id } = req.params;

      const student = await SinhVien.findByPk(id, {
        include: [
          {
            model: PhuHuynh,
            as: "Parents",
          },
          {
            model: Giuong,
            as: "Bed",
            include: [
              {
                model: Phong,
                as: "Room",
                include: [
                  {
                    model: LoaiPhong,
                    as: "RoomType",
                  },
                ],
              },
            ],
          },
        ],
      });

      if (!student) {
        return errorResponse(res, 404, "Student not found");
      }

      return successResponse(res, {
        student: student.toJSON(),
      });
    } catch (error) {
      return errorResponse(res, 500, "Failed to get student", error.message);
    }
  },

  // Update student information
  updateStudent: async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Remove sensitive fields that shouldn't be updated directly
      delete updateData.mat_khau;
      delete updateData.password_setup_token;
      delete updateData.password_setup_expires;

      const student = await SinhVien.findByPk(id);
      if (!student) {
        return errorResponse(res, 404, "Student not found");
      }

      // Update student information
      await student.update({
        ...updateData,
        [COLUMNS.COMMON.NGUOI_CAP_NHAT]: req.user.id,
      });

      return successResponse(res, {
        student: student.toJSON(),
        message: "Student updated successfully",
      });
    } catch (error) {
      return errorResponse(res, 500, "Failed to update student", error.message);
    }
  },

  // Add parent information
  addParent: async (req, res) => {
    try {
      const { id } = req.params;
      const { ten, quan_he, sdt, email, nghe_nghiep, dia_chi } = req.body;

      if (!ten || !quan_he) {
        return errorResponse(res, 400, "Parent name and relationship are required");
      }

      // Check if student exists
      const student = await SinhVien.findByPk(id);
      if (!student) {
        return errorResponse(res, 404, "Student not found");
      }

      const newParent = await PhuHuynh.create({
        [COLUMNS.PHU_HUYNH.ID_SINH_VIEN]: id,
        [COLUMNS.PHU_HUYNH.TEN]: ten,
        [COLUMNS.PHU_HUYNH.QUAN_HE]: quan_he,
        [COLUMNS.PHU_HUYNH.SDT]: sdt,
        [COLUMNS.PHU_HUYNH.EMAIL]: email,
        [COLUMNS.PHU_HUYNH.NGHE_NGHIEP]: nghe_nghiep,
        [COLUMNS.PHU_HUYNH.DIA_CHI]: dia_chi,
        [COLUMNS.COMMON.NGUOI_TAO]: req.user.id,
      });

      return successResponse(
        res,
        {
          parent: newParent.toJSON(),
          message: "Parent information added successfully",
        },
        null,
        201,
      );
    } catch (error) {
      return errorResponse(res, 500, "Failed to add parent information", error.message);
    }
  },

  // Update parent information
  updateParent: async (req, res) => {
    try {
      const { parentId } = req.params;
      const updateData = req.body;

      const parent = await PhuHuynh.findByPk(parentId);
      if (!parent) {
        return errorResponse(res, 404, "Parent not found");
      }

      await parent.update({
        ...updateData,
        [COLUMNS.COMMON.NGUOI_CAP_NHAT]: req.user.id,
      });

      return successResponse(res, {
        parent: parent.toJSON(),
        message: "Parent information updated successfully",
      });
    } catch (error) {
      return errorResponse(res, 500, "Failed to update parent information", error.message);
    }
  },

  // Delete parent information
  deleteParent: async (req, res) => {
    try {
      const { parentId } = req.params;

      const parent = await PhuHuynh.findByPk(parentId);
      if (!parent) {
        return errorResponse(res, 404, "Parent not found");
      }

      await parent.update({
        [COLUMNS.COMMON.DANG_HIEN]: false,
        [COLUMNS.COMMON.NGUOI_CAP_NHAT]: req.user.id,
      });

      return successResponse(res, {
        message: "Parent information deleted successfully",
      });
    } catch (error) {
      return errorResponse(res, 500, "Failed to delete parent information", error.message);
    }
  },

  // Get students without accommodation
  getStudentsWithoutAccommodation: async (req, res) => {
    try {
      const { page = 1, limit = 10 } = req.query;
      const offset = (page - 1) * limit;

      const { count, rows } = await SinhVien.findAndCountAll({
        where: {
          [COLUMNS.COMMON.DANG_HIEN]: true,
          [COLUMNS.SINH_VIEN.TRANG_THAI]: {
            [Op.in]: [ENUM_SINH_VIEN_TRANG_THAI.APPLICANT],
          },
        },
        include: [
          {
            model: Giuong,
            as: "Bed",
            required: false,
            where: {
              [COLUMNS.COMMON.ID]: null,
            },
          },
        ],
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [[COLUMNS.COMMON.NGAY_TAO, "ASC"]],
      });

      return successResponse(res, {
        students: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / limit),
        },
      });
    } catch (error) {
      return errorResponse(res, 500, "Failed to get students without accommodation", error.message);
    }
  },

  // Setup student password (for first time login)
  setupPassword: async (req, res) => {
    try {
      const { token, new_password } = req.body;

      if (!token || !new_password) {
        return errorResponse(res, 400, "Token and new password are required");
      }

      // Validate password strength
      const passwordValidation = passwordUtils.validatePasswordStrength(new_password);
      if (!passwordValidation.isValid) {
        return errorResponse(res, 400, "Password does not meet requirements", passwordValidation.errors);
      }

      // Find student by token
      const student = await SinhVien.findOne({
        where: {
          [COLUMNS.SINH_VIEN.PASSWORD_SETUP_TOKEN]: token,
          [COLUMNS.SINH_VIEN.PASSWORD_SETUP_EXPIRES]: {
            [Op.gt]: new Date(),
          },
        },
      });

      if (!student) {
        return errorResponse(res, 400, "Invalid or expired token");
      }

      // Hash new password
      const hashedPassword = await passwordUtils.hashPassword(new_password);

      // Update student password and clear token
      await student.update({
        [COLUMNS.SINH_VIEN.MAT_KHAU]: hashedPassword,
        [COLUMNS.SINH_VIEN.PASSWORD_SETUP_TOKEN]: null,
        [COLUMNS.SINH_VIEN.PASSWORD_SETUP_EXPIRES]: null,
        [COLUMNS.SINH_VIEN.TRANG_THAI]: ENUM_SINH_VIEN_TRANG_THAI.ACTIVE_RESIDENT,
      });

      //   await emailUtils.sendWelcomeEmail(student.email, student.ten, )

      return successResponse(res, {
        message: "Password setup completed successfully. You can now login.",
      });
    } catch (error) {
      return errorResponse(res, 500, "Failed to setup password", error.message);
    }
  },
};
