import { Phong, LoaiPhong, Giuong } from "../models/index.js";
import { successResponse, errorResponse } from "../utils/response.util.js";
import { COLUMNS, ENUM_PHONG_TRANG_THAI } from "../constants/database.constants.js";

export const phongController = {
  // Get all rooms
  getAll: async (req, res) => {
    try {
      const { page = 1, limit = 10, loai_phong_id, trang_thai, gender } = req.query;
      const offset = (page - 1) * limit;

      const whereClause = {
        [COLUMNS.COMMON.DANG_HIEN]: true,
      };

      if (loai_phong_id) {
        whereClause[COLUMNS.PHONG.ID_LOAI_PHONG] = loai_phong_id;
      }

      if (trang_thai) {
        whereClause[COLUMNS.PHONG.TRANG_THAI] = trang_thai;
      }

      if (gender) {
        whereClause[COLUMNS.PHONG.GENDER] = gender;
      }

      const { count, rows } = await Phong.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: LoaiPhong,
            as: "loaiPhong",
            attributes: ["id", "ten", "gia", "mo_ta"],
          },
          {
            model: Giuong,
            as: "giuongs",
            where: { [COLUMNS.COMMON.DANG_HIEN]: true },
            required: false,
          },
        ],
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [[COLUMNS.PHONG.TEN, "ASC"]],
      });

      const meta = {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit),
      };

      return successResponse(res, rows, meta);
    } catch (error) {
      return errorResponse(res, 500, "Failed to get rooms", error.message);
    }
  },

  // Get room by ID
  getById: async (req, res) => {
    try {
      const { id } = req.params;

      const phong = await Phong.findOne({
        where: {
          [COLUMNS.COMMON.ID]: id,
          [COLUMNS.COMMON.DANG_HIEN]: true,
        },
        include: [
          {
            model: LoaiPhong,
            as: "loaiPhong",
          },
          {
            model: Giuong,
            as: "giuongs",
            where: { [COLUMNS.COMMON.DANG_HIEN]: true },
            required: false,
          },
        ],
      });

      if (!phong) {
        return errorResponse(res, 404, "Room not found");
      }

      return successResponse(res, phong);
    } catch (error) {
      return errorResponse(res, 500, "Failed to get room", error.message);
    }
  },

  // Create new room
  create: async (req, res) => {
    try {
      const { id_loai_phong, ten, sl_max, mo_ta, gender } = req.body;

      // Check if room type exists
      const loaiPhong = await LoaiPhong.findByPk(id_loai_phong);
      if (!loaiPhong) {
        return errorResponse(res, 404, "Room type not found");
      }

      // Check if room name already exists
      const existingPhong = await Phong.findOne({
        where: { [COLUMNS.PHONG.TEN]: ten },
      });

      if (existingPhong) {
        return errorResponse(res, 409, "Room name already exists");
      }

      const newPhong = await Phong.create({
        [COLUMNS.PHONG.ID_LOAI_PHONG]: id_loai_phong,
        [COLUMNS.PHONG.TEN]: ten,
        [COLUMNS.PHONG.SL_MAX]: sl_max,
        [COLUMNS.PHONG.MO_TA]: mo_ta,
        [COLUMNS.PHONG.GENDER]: gender,
        [COLUMNS.COMMON.NGUOI_TAO]: req.user?.id,
      });

      // Automatically create beds for the room
      const bedPromises = [];
      for (let i = 1; i <= sl_max; i++) {
        bedPromises.push(
          Giuong.create({
            [COLUMNS.GIUONG.ID_PHONG]: newPhong.id,
            [COLUMNS.GIUONG.TEN]: `Giường ${i}`,
            [COLUMNS.COMMON.NGUOI_TAO]: req.user?.id,
          })
        );
      }
      
      await Promise.all(bedPromises);

      // Fetch the room with its relationships
      const phongWithRelations = await Phong.findByPk(newPhong.id, {
        include: [
          {
            model: LoaiPhong,
            as: "loaiPhong",
          },
          {
            model: Giuong,
            as: "giuongs",
          },
        ],
      });

      return successResponse(res, phongWithRelations, null, 201);
    } catch (error) {
      return errorResponse(res, 500, "Failed to create room", error.message);
    }
  },

  // Update room
  update: async (req, res) => {
    try {
      const { id } = req.params;
      const { id_loai_phong, ten, sl_max, mo_ta, gender, trang_thai } = req.body;

      const phong = await Phong.findOne({
        where: {
          [COLUMNS.COMMON.ID]: id,
          [COLUMNS.COMMON.DANG_HIEN]: true,
        },
      });

      if (!phong) {
        return errorResponse(res, 404, "Room not found");
      }

      // If room type is being changed, check if it exists
      if (id_loai_phong && id_loai_phong !== phong[COLUMNS.PHONG.ID_LOAI_PHONG]) {
        const loaiPhong = await LoaiPhong.findByPk(id_loai_phong);
        if (!loaiPhong) {
          return errorResponse(res, 404, "Room type not found");
        }
      }

      // If room name is being changed, check if it's unique
      if (ten && ten !== phong[COLUMNS.PHONG.TEN]) {
        const existingPhong = await Phong.findOne({
          where: { [COLUMNS.PHONG.TEN]: ten },
        });

        if (existingPhong) {
          return errorResponse(res, 409, "Room name already exists");
        }
      }

      await phong.update({
        [COLUMNS.PHONG.ID_LOAI_PHONG]: id_loai_phong || phong[COLUMNS.PHONG.ID_LOAI_PHONG],
        [COLUMNS.PHONG.TEN]: ten || phong[COLUMNS.PHONG.TEN],
        [COLUMNS.PHONG.SL_MAX]: sl_max || phong[COLUMNS.PHONG.SL_MAX],
        [COLUMNS.PHONG.MO_TA]: mo_ta !== undefined ? mo_ta : phong[COLUMNS.PHONG.MO_TA],
        [COLUMNS.PHONG.GENDER]: gender || phong[COLUMNS.PHONG.GENDER],
        [COLUMNS.PHONG.TRANG_THAI]: trang_thai || phong[COLUMNS.PHONG.TRANG_THAI],
        [COLUMNS.COMMON.NGUOI_CAP_NHAT]: req.user?.id,
      });

      return successResponse(res, phong);
    } catch (error) {
      return errorResponse(res, 500, "Failed to update room", error.message);
    }
  },

  // Delete room (soft delete)
  delete: async (req, res) => {
    try {
      const { id } = req.params;

      const phong = await Phong.findOne({
        where: {
          [COLUMNS.COMMON.ID]: id,
          [COLUMNS.COMMON.DANG_HIEN]: true,
        },
      });

      if (!phong) {
        return errorResponse(res, 404, "Room not found");
      }

      // Check if room has occupied beds
      if (phong[COLUMNS.PHONG.SL_HIEN_TAI] > 0) {
        return errorResponse(res, 400, "Cannot delete room with occupied beds");
      }

      await phong.update({
        [COLUMNS.COMMON.DANG_HIEN]: false,
        [COLUMNS.COMMON.NGUOI_CAP_NHAT]: req.user?.id,
      });

      return successResponse(res, { message: "Room deleted successfully" });
    } catch (error) {
      return errorResponse(res, 500, "Failed to delete room", error.message);
    }
  },

  // Get available rooms
  getAvailable: async (req, res) => {
    try {
      const { gender } = req.query;

      const whereClause = {
        [COLUMNS.COMMON.DANG_HIEN]: true,
        [COLUMNS.PHONG.TRANG_THAI]: [
          ENUM_PHONG_TRANG_THAI.AVAILABLE,
          ENUM_PHONG_TRANG_THAI.PARTIALLY_OCCUPIED,
        ],
      };

      if (gender) {
        whereClause[COLUMNS.PHONG.GENDER] = [gender, "Unisex"];
      }

      const availableRooms = await Phong.findAll({
        where: whereClause,
        include: [
          {
            model: LoaiPhong,
            as: "loaiPhong",
            attributes: ["id", "ten", "gia"],
          },
          {
            model: Giuong,
            as: "giuongs",
            where: { [COLUMNS.COMMON.DANG_HIEN]: true },
            required: false,
          },
        ],
        order: [[COLUMNS.PHONG.TEN, "ASC"]],
      });

      // Filter rooms that have available beds
      const roomsWithAvailableBeds = availableRooms.filter(
        (room) => room[COLUMNS.PHONG.SL_HIEN_TAI] < room[COLUMNS.PHONG.SL_MAX]
      );

      return successResponse(res, roomsWithAvailableBeds);
    } catch (error) {
      return errorResponse(res, 500, "Failed to get available rooms", error.message);
    }
  },
};
