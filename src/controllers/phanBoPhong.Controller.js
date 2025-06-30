// src/controllers/phanBoPhongController.js

import { successResponse, errorResponse } from "../utils/response.util.js";
import { SinhVien, Giuong, Phong, PhanBoPhong } from "../models/index.js";
import { COLUMNS, ENUM_PHAN_BO_PHONG_TRANG_THAI } from "../constants/database.constants.js";
import { Op } from "sequelize";
import sequelize from "../config/database.config.js";

export const phanBoPhongController = {
  /**
   * Get all room allocations with pagination and filtering
   */
  getAll: async (req, res) => {
    try {
      const { page = 1, limit = 20 } = req.query;
      const offset = (page - 1) * limit;

      const { count, rows } = await PhanBoPhong.findAndCountAll({
        where: { dang_hien: true },
        include: [
          { model: SinhVien, as: "Student" },
          {
            model: Giuong,
            as: "Bed",
            include: [{ model: Phong, as: "Room" }]
          }
        ],
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [["ngay_tao", "DESC"]],
      });

      return successResponse(res, {
        allocations: rows,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(count / limit),
          total_items: count,
          items_per_page: parseInt(limit),
        },
      });
    } catch (error) {
      return errorResponse(res, 500, "Lỗi server khi lấy danh sách phân bổ phòng", error.message);
    }
  },

  /**
   * Get room allocation by ID
   */
  getById: async (req, res) => {
    try {
      const { id } = req.params;
      const allocation = await PhanBoPhong.findByPk(id, {
        include: [
          { model: SinhVien, as: "Student" },
          {
            model: Giuong,
            as: "Bed",
            include: [{ model: Phong, as: "Room" }]
          }
        ]
      });
      if (!allocation) return errorResponse(res, 404, "Không tìm thấy phân bổ phòng");
      return successResponse(res, allocation);
    } catch (error) {
      return errorResponse(res, 500, "Lỗi server khi lấy thông tin phân bổ phòng", error.message);
    }
  },

  /**
   * Create new room allocation
   */
  create: async (req, res) => {
    const t = await sequelize.transaction();
    try {
      const { id_sv, id_giuong, ngay_bat_dau, ngay_ket_thuc, trang_thai, ly_do_ket_thuc } = req.body;

      if (!id_sv || !id_giuong || !ngay_bat_dau) {
        await t.rollback();
        return errorResponse(res, 400, "Thiếu thông tin bắt buộc: ID sinh viên, ID giường, Ngày bắt đầu.");
      }

      // Kiểm tra sinh viên đã có phân bổ phòng đang hoạt động chưa
      const existingActiveAllocationForStudent = await PhanBoPhong.findOne({
        where: {
          id_sv,
          dang_hien: true,
          ngay_ket_thuc: null,
        },
        transaction: t,
      });
      if (existingActiveAllocationForStudent) {
        await t.rollback();
        return errorResponse(res, 409, "Sinh viên đã có phân bổ phòng đang hoạt động.");
      }

      // Kiểm tra giường đã có sinh viên ở chưa
      const bedCurrentlyOccupied = await PhanBoPhong.findOne({
        where: {
          id_giuong,
          dang_hien: true,
          ngay_ket_thuc: null,
        },
        transaction: t,
      });
      if (bedCurrentlyOccupied) {
        await t.rollback();
        return errorResponse(res, 409, "Giường này hiện đang có sinh viên khác ở.");
      }

      // Tạo phân bổ phòng mới
      const allocation = await PhanBoPhong.create({
        id_sv,
        id_giuong,
        ngay_bat_dau,
        ngay_ket_thuc: ngay_ket_thuc || null,
        trang_thai: trang_thai || ENUM_PHAN_BO_PHONG_TRANG_THAI.ACTIVE,
        ly_do_ket_thuc: ly_do_ket_thuc || null,
        dang_hien: true,
        nguoi_tao: req.user?.id,
        nguoi_cap_nhat: req.user?.id,
      }, { transaction: t });

      await t.commit();
      return successResponse(res, allocation, "Tạo phân bổ phòng mới thành công", 201);
    } catch (error) {
      await t.rollback();
      if (error.name === 'SequelizeUniqueConstraintError') {
        return errorResponse(res, 409, "Thông tin phân bổ phòng bị trùng lặp.");
      }
      return errorResponse(res, 500, "Lỗi server khi tạo phân bổ phòng mới", error.message);
    }
  },

  /**
   * Update room allocation
   */
  update: async (req, res) => {
    const t = await sequelize.transaction();
    try {
      const { id } = req.params;
      const { id_sv, id_giuong, ngay_bat_dau, ngay_ket_thuc, trang_thai, ly_do_ket_thuc } = req.body;

      const allocation = await PhanBoPhong.findByPk(id, { transaction: t });
      if (!allocation) {
        await t.rollback();
        return errorResponse(res, 404, "Không tìm thấy phân bổ phòng");
      }

      // Kiểm tra sinh viên đã có phân bổ phòng đang hoạt động khác chưa (trừ chính bản ghi này)
      const existingActiveAllocationForStudent = await PhanBoPhong.findOne({
        where: {
          id_sv,
          id: { [Op.ne]: id },
          dang_hien: true,
          ngay_ket_thuc: null,
        },
        transaction: t,
      });
      if (existingActiveAllocationForStudent) {
        await t.rollback();
        return errorResponse(res, 409, "Sinh viên đã có phân bổ phòng đang hoạt động khác.");
      }

      // Kiểm tra giường đã có sinh viên khác ở chưa (trừ chính bản ghi này)
      const bedCurrentlyOccupied = await PhanBoPhong.findOne({
        where: {
          id_giuong,
          id: { [Op.ne]: id },
          dang_hien: true,
          ngay_ket_thuc: null,
        },
        transaction: t,
      });
      if (bedCurrentlyOccupied) {
        await t.rollback();
        return errorResponse(res, 409, "Giường này hiện đang có sinh viên khác ở.");
      }

      await allocation.update({
        id_sv,
        id_giuong,
        ngay_bat_dau,
        ngay_ket_thuc: ngay_ket_thuc || null,
        trang_thai,
        ly_do_ket_thuc: ly_do_ket_thuc || null,
        nguoi_cap_nhat: req.user?.id,
      }, { transaction: t });

      await t.commit();
      return successResponse(res, allocation, "Cập nhật phân bổ phòng thành công");
    } catch (error) {
      await t.rollback();
      if (error.name === 'SequelizeUniqueConstraintError') {
        return errorResponse(res, 409, "Cập nhật thất bại do thông tin trùng lặp.");
      }
      return errorResponse(res, 500, "Lỗi server khi cập nhật phân bổ phòng", error.message);
    }
  },

  /**
   * Soft delete room allocation
   */
  delete: async (req, res) => {
    const t = await sequelize.transaction();
    try {
      const { id } = req.params;
      const allocation = await PhanBoPhong.findByPk(id, { transaction: t });
      if (!allocation) {
        await t.rollback();
        return errorResponse(res, 404, "Không tìm thấy phân bổ phòng");
      }

      allocation.dang_hien = false;
      allocation.nguoi_cap_nhat = req.user?.id;
      await allocation.save({ transaction: t });

      await t.commit();
      return successResponse(res, null, "Xóa mềm phân bổ phòng thành công");
    } catch (error) {
      await t.rollback();
      return errorResponse(res, 500, "Lỗi server khi xóa phân bổ phòng", error.message);
    }
  },
};