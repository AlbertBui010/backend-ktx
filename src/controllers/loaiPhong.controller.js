import { LoaiPhong } from "../models/index.js";
import { successResponse, errorResponse } from "../utils/response.util.js";
import { COLUMNS } from "../constants/database.constants.js";

export const loaiPhongController = {
  // Get all room types
  getAll: async (req, res) => {
    try {
      const { page = 1, limit = 10 } = req.query;
      const offset = (page - 1) * limit;

      const { count, rows } = await LoaiPhong.findAndCountAll({
        where: {
          [COLUMNS.COMMON.DANG_HIEN]: true,
        },
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [[COLUMNS.COMMON.NGAY_TAO, "DESC"]],
      });

      const meta = {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit),
      };

      return successResponse(res, rows, meta);
    } catch (error) {
      return errorResponse(res, 500, "Failed to get room types", error.message);
    }
  },

  // Get room type by ID
  getById: async (req, res) => {
    try {
      const { id } = req.params;

      const loaiPhong = await LoaiPhong.findOne({
        where: {
          [COLUMNS.COMMON.ID]: id,
          [COLUMNS.COMMON.DANG_HIEN]: true,
        },
      });

      if (!loaiPhong) {
        return errorResponse(res, 404, "Room type not found");
      }

      return successResponse(res, loaiPhong);
    } catch (error) {
      return errorResponse(res, 500, "Failed to get room type", error.message);
    }
  },

  // Create new room type
  create: async (req, res) => {
    try {
      const { ten, gia, mo_ta } = req.body;

      const newLoaiPhong = await LoaiPhong.create({
        [COLUMNS.LOAI_PHONG.TEN]: ten,
        [COLUMNS.LOAI_PHONG.GIA]: gia,
        [COLUMNS.LOAI_PHONG.MO_TA]: mo_ta,
        [COLUMNS.COMMON.NGUOI_TAO]: req.user?.id,
      });

      return successResponse(res, newLoaiPhong, null, 201);
    } catch (error) {
      return errorResponse(res, 500, "Failed to create room type", error.message);
    }
  },

  // Update room type
  update: async (req, res) => {
    try {
      const { id } = req.params;
      const { ten, gia, mo_ta } = req.body;

      const loaiPhong = await LoaiPhong.findOne({
        where: {
          [COLUMNS.COMMON.ID]: id,
          [COLUMNS.COMMON.DANG_HIEN]: true,
        },
      });

      if (!loaiPhong) {
        return errorResponse(res, 404, "Room type not found");
      }

      await loaiPhong.update({
        [COLUMNS.LOAI_PHONG.TEN]: ten || loaiPhong[COLUMNS.LOAI_PHONG.TEN],
        [COLUMNS.LOAI_PHONG.GIA]: gia || loaiPhong[COLUMNS.LOAI_PHONG.GIA],
        [COLUMNS.LOAI_PHONG.MO_TA]: mo_ta !== undefined ? mo_ta : loaiPhong[COLUMNS.LOAI_PHONG.MO_TA],
        [COLUMNS.COMMON.NGUOI_CAP_NHAT]: req.user?.id,
      });

      return successResponse(res, loaiPhong);
    } catch (error) {
      return errorResponse(res, 500, "Failed to update room type", error.message);
    }
  },

  // Delete room type (soft delete)
  delete: async (req, res) => {
    try {
      const { id } = req.params;

      const loaiPhong = await LoaiPhong.findOne({
        where: {
          [COLUMNS.COMMON.ID]: id,
          [COLUMNS.COMMON.DANG_HIEN]: true,
        },
      });

      if (!loaiPhong) {
        return errorResponse(res, 404, "Room type not found");
      }

      await loaiPhong.update({
        [COLUMNS.COMMON.DANG_HIEN]: false,
        [COLUMNS.COMMON.NGUOI_CAP_NHAT]: req.user?.id,
      });

      return successResponse(res, { message: "Room type deleted successfully" });
    } catch (error) {
      return errorResponse(res, 500, "Failed to delete room type", error.message);
    }
  },
};
