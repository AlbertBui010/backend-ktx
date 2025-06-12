import { LoaiPhong, Phong, Giuong, NhanVien, SinhVien } from "../models/index.js";
import { successResponse, errorResponse } from "../utils/response.util.js";
import { COLUMNS, ENUM_PHONG_TRANG_THAI } from "../constants/database.constants.js";
import sequelize from "../config/database.config.js";

export const roomController = {
  // Get all room types
  getRoomTypes: async (req, res) => {
    try {
      const { page = 1, limit = 10, search } = req.query;
      const offset = (page - 1) * limit;

      const whereClause = {
        [COLUMNS.COMMON.DANG_HIEN]: true,
      };

      if (search) {
        whereClause[COLUMNS.LOAI_PHONG.TEN_LOAI] = {
          [sequelize.Op.iLike]: `%${search}%`,
        };
      }

      const { count, rows } = await LoaiPhong.findAndCountAll({
        where: whereClause,
        limit: parseInt(limit),
        offset: parseInt(offset),
        include: [
          {
            model: NhanVien,
            as: "Creator",
            attributes: [COLUMNS.COMMON.ID, COLUMNS.NHAN_VIEN.TEN],
          },
        ],
        order: [[COLUMNS.COMMON.NGAY_TAO, "DESC"]],
      });

      return successResponse(res, {
        roomTypes: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / limit),
        },
      });
    } catch (error) {
      return errorResponse(res, 500, "Failed to get room types", error.message);
    }
  },

  // Create room type (Staff+ only)
  createRoomType: async (req, res) => {
    try {
      const { ten_loai, so_giuong, dien_tich, mo_ta, gia_thue } = req.body;

      if (!ten_loai || !so_giuong || !gia_thue) {
        return errorResponse(res, 400, "Room type name, bed count, and price are required");
      }

      // Check if room type already exists
      const existingRoomType = await LoaiPhong.findOne({
        where: {
          [COLUMNS.LOAI_PHONG.TEN_LOAI]: ten_loai,
          [COLUMNS.COMMON.DANG_HIEN]: true,
        },
      });

      if (existingRoomType) {
        return errorResponse(res, 409, "Room type already exists");
      }

      const newRoomType = await LoaiPhong.create({
        [COLUMNS.LOAI_PHONG.TEN_LOAI]: ten_loai,
        [COLUMNS.LOAI_PHONG.SO_GIUONG]: so_giuong,
        [COLUMNS.LOAI_PHONG.DIEN_TICH]: dien_tich,
        [COLUMNS.LOAI_PHONG.MO_TA]: mo_ta,
        [COLUMNS.LOAI_PHONG.GIA_THUE]: gia_thue,
        [COLUMNS.COMMON.NGUOI_TAO]: req.user.id,
      });

      return successResponse(
        res,
        {
          roomType: newRoomType.toJSON(),
          message: "Room type created successfully",
        },
        null,
        201,
      );
    } catch (error) {
      return errorResponse(res, 500, "Failed to create room type", error.message);
    }
  },

  // Update room type (Staff+ only)
  updateRoomType: async (req, res) => {
    try {
      const { id } = req.params;
      const { ten_loai, so_giuong, dien_tich, mo_ta, gia_thue } = req.body;

      const roomType = await LoaiPhong.findByPk(id);
      if (!roomType) {
        return errorResponse(res, 404, "Room type not found");
      }

      // Update fields
      roomType[COLUMNS.LOAI_PHONG.TEN_LOAI] = ten_loai || roomType[COLUMNS.LOAI_PHONG.TEN_LOAI];
      roomType[COLUMNS.LOAI_PHONG.SO_GIUONG] = so_giuong || roomType[COLUMNS.LOAI_PHONG.SO_GIUONG];
      roomType[COLUMNS.LOAI_PHONG.DIEN_TICH] = dien_tich || roomType[COLUMNS.LOAI_PHONG.DIEN_TICH];
      roomType[COLUMNS.LOAI_PHONG.MO_TA] = mo_ta || roomType[COLUMNS.LOAI_PHONG.MO_TA];
      roomType[COLUMNS.LOAI_PHONG.GIA_THUE] = gia_thue || roomType[COLUMNS.LOAI_PHONG.GIA_THUE];
      roomType[COLUMNS.COMMON.NGUOI_CAP_NHAT] = req.user.id;

      await roomType.save();

      return successResponse(res, {
        roomType: roomType.toJSON(),
        message: "Room type updated successfully",
      });
    } catch (error) {
      return errorResponse(res, 500, "Failed to update room type", error.message);
    }
  },

  // Delete room type (Staff+ only)
  deleteRoomType: async (req, res) => {
    try {
      const { id } = req.params;

      const roomType = await LoaiPhong.findByPk(id);
      if (!roomType) {
        return errorResponse(res, 404, "Room type not found");
      }

      // Soft delete the room type
      roomType[COLUMNS.COMMON.DANG_HIEN] = false;
      await roomType.save();

      return successResponse(res, {
        message: "Room type deleted successfully",
      });
    } catch (error) {
      return errorResponse(res, 500, "Failed to delete room type", error.message);
    }
  },

  // Get all rooms
  getRooms: async (req, res) => {
    try {
      const { page = 1, limit = 10, search, trang_thai, id_loai_phong, so_tang } = req.query;
      const offset = (page - 1) * limit;

      const whereClause = {
        [COLUMNS.COMMON.DANG_HIEN]: true,
      };

      if (search) {
        whereClause[COLUMNS.PHONG.TEN_PHONG] = {
          [sequelize.Op.iLike]: `%${search}%`,
        };
      }

      if (trang_thai) {
        whereClause[COLUMNS.PHONG.TRANG_THAI] = trang_thai;
      }

      if (id_loai_phong) {
        whereClause[COLUMNS.PHONG.ID_LOAI_PHONG] = id_loai_phong;
      }

      if (so_tang) {
        whereClause[COLUMNS.PHONG.SO_TANG] = so_tang;
      }

      const { count, rows } = await Phong.findAndCountAll({
        where: whereClause,
        limit: parseInt(limit),
        offset: parseInt(offset),
        include: [
          {
            model: LoaiPhong,
            as: "RoomType",
            attributes: [
              COLUMNS.COMMON.ID,
              COLUMNS.LOAI_PHONG.TEN_LOAI,
              COLUMNS.LOAI_PHONG.SO_GIUONG,
              COLUMNS.LOAI_PHONG.GIA_THUE,
            ],
          },
          {
            model: Giuong,
            as: "Beds",
            attributes: [
              COLUMNS.COMMON.ID,
              COLUMNS.GIUONG.TEN_GIUONG,
              COLUMNS.GIUONG.TRANG_THAI,
              COLUMNS.GIUONG.ID_SINH_VIEN,
            ],
          },
          {
            model: NhanVien,
            as: "Creator",
            attributes: [COLUMNS.COMMON.ID, COLUMNS.NHAN_VIEN.TEN],
          },
        ],
        order: [[COLUMNS.PHONG.TEN_PHONG, "ASC"]],
      });

      return successResponse(res, {
        rooms: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / limit),
        },
      });
    } catch (error) {
      return errorResponse(res, 500, "Failed to get rooms", error.message);
    }
  },

  // Get available rooms
  getAvailableRooms: async (req, res) => {
    try {
      const { gioi_tinh } = req.query;

      const whereClause = {
        [COLUMNS.COMMON.DANG_HIEN]: true,
        [COLUMNS.PHONG.TRANG_THAI]: ENUM_PHONG_TRANG_THAI.AVAILABLE,
      };

      if (gioi_tinh && gioi_tinh !== "Hỗn hợp") {
        whereClause[COLUMNS.PHONG.GIOI_TINH] = {
          [sequelize.Op.in]: [gioi_tinh, "Hỗn hợp"],
        };
      }

      const rooms = await Phong.findAll({
        where: whereClause,
        include: [
          {
            model: LoaiPhong,
            as: "RoomType",
            attributes: [COLUMNS.LOAI_PHONG.TEN_LOAI, COLUMNS.LOAI_PHONG.SO_GIUONG, COLUMNS.LOAI_PHONG.GIA_THUE],
          },
          {
            model: Giuong,
            as: "Beds",
            where: {
              [COLUMNS.GIUONG.TRANG_THAI]: "available",
              [COLUMNS.COMMON.DANG_HIEN]: true,
            },
            required: true,
            attributes: [COLUMNS.COMMON.ID, COLUMNS.GIUONG.TEN_GIUONG],
          },
        ],
        order: [[COLUMNS.PHONG.TEN_PHONG, "ASC"]],
      });

      return successResponse(res, {
        available_rooms: rooms,
        total: rooms.length,
      });
    } catch (error) {
      return errorResponse(res, 500, "Failed to get available rooms", error.message);
    }
  },

  // Create room (Staff+ only)
  createRoom: async (req, res) => {
    try {
      const { ten_phong, id_loai_phong, so_tang, gioi_tinh, ghi_chu } = req.body;

      if (!ten_phong || !id_loai_phong || !so_tang) {
        return errorResponse(res, 400, "Room name, room type ID, and floor are required");
      }

      // Check if room already exists
      const existingRoom = await Phong.findOne({
        where: {
          [COLUMNS.PHONG.TEN_PHONG]: ten_phong,
          [COLUMNS.COMMON.DANG_HIEN]: true,
        },
      });

      if (existingRoom) {
        return errorResponse(res, 409, "Room already exists");
      }

      // Check if room type exists
      const roomType = await LoaiPhong.findByPk(id_loai_phong);
      if (!roomType) {
        return errorResponse(res, 404, "Room type not found");
      }

      const newRoom = await Phong.create({
        [COLUMNS.PHONG.TEN_PHONG]: ten_phong,
        [COLUMNS.PHONG.ID_LOAI_PHONG]: id_loai_phong,
        [COLUMNS.PHONG.SO_TANG]: so_tang,
        [COLUMNS.PHONG.GIOI_TINH]: gioi_tinh,
        [COLUMNS.PHONG.GHI_CHU]: ghi_chu,
        [COLUMNS.COMMON.NGUOI_TAO]: req.user.id,
      });

      // Create beds for the room based on room type
      const beds = [];
      for (let i = 1; i <= roomType[COLUMNS.LOAI_PHONG.SO_GIUONG]; i++) {
        beds.push({
          [COLUMNS.GIUONG.TEN_GIUONG]: `${ten_phong}-G${i}`,
          [COLUMNS.GIUONG.ID_PHONG]: newRoom[COLUMNS.COMMON.ID],
          [COLUMNS.COMMON.NGUOI_TAO]: req.user.id,
        });
      }

      await Giuong.bulkCreate(beds);

      return successResponse(
        res,
        {
          room: newRoom.toJSON(),
          message: `Room created successfully with ${roomType[COLUMNS.LOAI_PHONG.SO_GIUONG]} beds`,
        },
        null,
        201,
      );
    } catch (error) {
      return errorResponse(res, 500, "Failed to create room", error.message);
    }
  },

  // Update room (Staff+ only)
  updateRoom: async (req, res) => {
    try {
      const { id } = req.params;
      const { ten_phong, id_loai_phong, so_tang, gioi_tinh, ghi_chu } = req.body;

      const room = await Phong.findByPk(id);
      if (!room) {
        return errorResponse(res, 404, "Room not found");
      }

      // Validate room gender constraint with existing students in the room before updating
      if (gioi_tinh) {
        const beds = await Giuong.findAll({
          where: {
            [COLUMNS.GIUONG.ID_PHONG]: id,
            [COLUMNS.COMMON.DANG_HIEN]: true,
          },
          include: [
            {
              model: SinhVien,
              as: "Student",
              attributes: [COLUMNS.COMMON.ID, COLUMNS.SINH_VIEN.PHAI],
            },
          ],
        });
        const invalidGender = beds.some((bed) => bed.Student && bed.Student[COLUMNS.SINH_VIEN.PHAI] !== gioi_tinh);
        if (invalidGender) {
          return errorResponse(
            res,
            400,
            "Cannot update room because it invalid gender constraint with existing students",
          );
        }
      }

      // Update fields
      room[COLUMNS.PHONG.TEN_PHONG] = ten_phong || room[COLUMNS.PHONG.TEN_PHONG];
      room[COLUMNS.PHONG.ID_LOAI_PHONG] = id_loai_phong || room[COLUMNS.PHONG.ID_LOAI_PHONG];
      room[COLUMNS.PHONG.SO_TANG] = so_tang || room[COLUMNS.PHONG.SO_TANG];
      room[COLUMNS.PHONG.GIOI_TINH] = gioi_tinh || room[COLUMNS.PHONG.GIOI_TINH];
      room[COLUMNS.PHONG.GHI_CHU] = ghi_chu || room[COLUMNS.PHONG.GHI_CHU];
      room[COLUMNS.COMMON.NGUOI_CAP_NHAT] = req.user.id;

      await room.save();

      return successResponse(res, {
        room: room.toJSON(),
        message: "Room updated successfully",
      });
    } catch (error) {
      return errorResponse(res, 500, "Failed to update room", error.message);
    }
  },

  // Delete room (Staff+ only)
  deleteRoom: async (req, res) => {
    try {
      const { id } = req.params;

      const room = await Phong.findByPk(id);
      if (!room) {
        return errorResponse(res, 404, "Room not found");
      }

      // Check if the room has any beds that are currently occupied
      const beds = await Giuong.findAll({
        where: {
          [COLUMNS.GIUONG.ID_PHONG]: id,
          [COLUMNS.GIUONG.TRANG_THAI]: "occupied",
          [COLUMNS.COMMON.DANG_HIEN]: true,
        },
        include: [
          {
            model: SinhVien,
            as: "Student",
            attributes: [COLUMNS.COMMON.ID, COLUMNS.SINH_VIEN.TEN],
          },
        ],
      });
      if (beds.length > 0) {
        return errorResponse(res, 400, "Cannot delete room because it has students currently occupying it");
      }

      // Soft delete the room
      room[COLUMNS.COMMON.DANG_HIEN] = false;
      await room.save();

      // Soft delete all beds in the room
      await Giuong.update({ [COLUMNS.COMMON.DANG_HIEN]: false }, { where: { [COLUMNS.GIUONG.ID_PHONG]: id } });

      return successResponse(res, {
        message: "Room deleted successfully",
      });
    } catch (error) {
      return errorResponse(res, 500, "Failed to delete room", error.message);
    }
  },

  // Get beds by room
  getBedsByRoom: async (req, res) => {
    try {
      const { roomId } = req.params;
      const { trang_thai } = req.query;

      const whereClause = {
        [COLUMNS.GIUONG.ID_PHONG]: roomId,
        [COLUMNS.COMMON.DANG_HIEN]: true,
      };

      if (trang_thai) {
        whereClause[COLUMNS.GIUONG.TRANG_THAI] = trang_thai;
      }

      const beds = await Giuong.findAll({
        where: whereClause,
        include: [
          {
            model: Phong,
            as: "Room",
            attributes: [COLUMNS.COMMON.ID, COLUMNS.PHONG.TEN_PHONG],
            include: [
              {
                model: LoaiPhong,
                as: "RoomType",
                attributes: [COLUMNS.LOAI_PHONG.TEN_LOAI, COLUMNS.LOAI_PHONG.GIA_THUE],
              },
            ],
          },
          {
            model: SinhVien,
            as: "Student",
            attributes: [COLUMNS.COMMON.ID, COLUMNS.SINH_VIEN.TEN, COLUMNS.SINH_VIEN.MSSV],
            required: false,
          },
        ],
        order: [[COLUMNS.GIUONG.TEN_GIUONG, "ASC"]],
      });

      return successResponse(res, {
        beds,
        room_info: beds.length > 0 ? beds[0].Room : null,
      });
    } catch (error) {
      return errorResponse(res, 500, "Failed to get beds", error.message);
    }
  },

  // Create bed in room (Staff+ only)
  createBed: async (req, res) => {
    try {
      const { roomId } = req.params;
      const { ten_giuong } = req.body;

      if (!ten_giuong) {
        return errorResponse(res, 400, "Bed name is required");
      }

      // Check if room exists
      const room = await Phong.findByPk(roomId);
      if (!room) {
        return errorResponse(res, 404, "Room not found");
      }

      // Check if bed already exists in the room
      const existingBed = await Giuong.findOne({
        where: {
          [COLUMNS.GIUONG.TEN_GIUONG]: ten_giuong,
          [COLUMNS.GIUONG.ID_PHONG]: roomId,
          [COLUMNS.COMMON.DANG_HIEN]: true,
        },
      });

      if (existingBed) {
        return errorResponse(res, 409, "Bed already exists in this room");
      }

      const newBed = await Giuong.create({
        [COLUMNS.GIUONG.TEN_GIUONG]: ten_giuong,
        [COLUMNS.GIUONG.ID_PHONG]: roomId,
        [COLUMNS.COMMON.NGUOI_TAO]: req.user.id,
      });

      return successResponse(
        res,
        {
          bed: newBed.toJSON(),
          message: "Bed created successfully",
        },
        null,
        201,
      );
    } catch (error) {
      return errorResponse(res, 500, "Failed to create bed", error.message);
    }
  },
  // Update bed in room (Staff+ only)
  updateBed: async (req, res) => {
    try {
      const { roomId, bedId } = req.params;
      const { ten_giuong } = req.body;

      // Check if room exists
      const room = await Phong.findByPk(roomId);
      if (!room) {
        return errorResponse(res, 404, "Room not found");
      }

      // Check if bed exists in the room
      const bed = await Giuong.findOne({
        where: {
          [COLUMNS.GIUONG.ID]: bedId,
          [COLUMNS.GIUONG.ID_PHONG]: roomId,
          [COLUMNS.COMMON.DANG_HIEN]: true,
        },
      });

      if (!bed) {
        return errorResponse(res, 404, "Bed not found in this room");
      }

      // Update bed name
      bed[COLUMNS.GIUONG.TEN_GIUONG] = ten_giuong || bed[COLUMNS.GIUONG.TEN_GIUONG];
      bed[COLUMNS.COMMON.NGUOI_CAP_NHAT] = req.user.id;

      await bed.save();

      return successResponse(res, {
        bed: bed.toJSON(),
        message: "Bed updated successfully",
      });
    } catch (error) {
      return errorResponse(res, 500, "Failed to update bed", error.message);
    }
  },
  // Delete bed in room (Staff+ only)
  deleteBed: async (req, res) => {
    try {
      const { roomId, bedId } = req.params;

      // Check if room exists
      const room = await Phong.findByPk(roomId);
      if (!room) {
        return errorResponse(res, 404, "Room not found");
      }

      // Check if bed exists in the room
      const bed = await Giuong.findOne({
        where: {
          [COLUMNS.GIUONG.ID]: bedId,
          [COLUMNS.GIUONG.ID_PHONG]: roomId,
          [COLUMNS.COMMON.DANG_HIEN]: true,
        },
      });

      if (!bed) {
        return errorResponse(res, 404, "Bed not found in this room");
      }

      // If bed is occupied, cannot delete
      if (bed[COLUMNS.GIUONG.TRANG_THAI] === "occupied") {
        return errorResponse(res, 400, "Cannot delete bed because it is currently occupied");
      }

      // Soft delete the bed
      bed[COLUMNS.COMMON.DANG_HIEN] = false;
      await bed.save();

      return successResponse(res, {
        message: "Bed deleted successfully",
      });
    } catch (error) {
      return errorResponse(res, 500, "Failed to delete bed", error.message);
    }
  },
};
