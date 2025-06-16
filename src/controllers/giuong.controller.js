const { Giuong, Phong, LoaiPhong, PhanBoPhong, SinhVien } = require('../models');
const { responseFormatter } = require('../utils/response.util');
const { Op } = require('sequelize');

/**
 * Get all beds with pagination and filtering
 */
const getAllGiuong = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      id_phong,
      trang_thai,
      so_giuong,
      search,
      sort_by = 'so_giuong',
      sort_order = 'ASC'
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    // Build where condition
    const whereCondition = {};
    
    if (id_phong) {
      whereCondition.id_phong = id_phong;
    }
    
    if (trang_thai) {
      whereCondition.trang_thai = trang_thai;
    }
    
    if (so_giuong) {
      whereCondition.so_giuong = so_giuong;
    }
    
    if (search) {
      whereCondition[Op.or] = [
        { so_giuong: { [Op.iLike]: `%${search}%` } },
        { ghi_chu: { [Op.iLike]: `%${search}%` } }
      ];
    }

    // Include related data
    const include = [
      {
        model: Phong,
        as: 'phong',
        attributes: ['id', 'ten_phong', 'tang', 'trang_thai', 'gioi_tinh'],
        include: [
          {
            model: LoaiPhong,
            as: 'loai_phong',
            attributes: ['id', 'ten_loai', 'gia_thue']
          }
        ]
      },
      {
        model: PhanBoPhong,
        as: 'phan_bo_phong',
        required: false,
        where: { trang_thai: 'active' },
        include: [
          {
            model: SinhVien,
            as: 'sinh_vien',
            attributes: ['id', 'ho_ten', 'mssv', 'email', 'sdt']
          }
        ]
      }
    ];

    const { count, rows } = await Giuong.findAndCountAll({
      where: whereCondition,
      include,
      limit: parseInt(limit),
      offset,
      order: [[sort_by, sort_order.toUpperCase()]],
      distinct: true
    });

    const totalPages = Math.ceil(count / parseInt(limit));

    return responseFormatter(res, 200, 'Lấy danh sách giường thành công', {
      giuong: rows,
      pagination: {
        current_page: parseInt(page),
        total_pages: totalPages,
        total_items: count,
        items_per_page: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error in getAllGiuong:', error);
    return responseFormatter(res, 500, 'Lỗi server khi lấy danh sách giường', null, error.message);
  }
};

/**
 * Get bed by ID
 */
const getGiuongById = async (req, res) => {
  try {
    const { id } = req.params;

    const giuong = await Giuong.findByPk(id, {
      include: [
        {
          model: Phong,
          as: 'phong',
          attributes: ['id', 'ten_phong', 'tang', 'trang_thai', 'gioi_tinh', 'sl_max', 'sl_hien_tai'],
          include: [
            {
              model: LoaiPhong,
              as: 'loai_phong',
              attributes: ['id', 'ten_loai', 'gia_thue', 'mo_ta']
            }
          ]
        },
        {
          model: PhanBoPhong,
          as: 'phan_bo_phong',
          required: false,
          where: { trang_thai: 'active' },
          include: [
            {
              model: SinhVien,
              as: 'sinh_vien',
              attributes: ['id', 'ho_ten', 'mssv', 'email', 'sdt', 'gioi_tinh']
            }
          ]
        }
      ]
    });

    if (!giuong) {
      return responseFormatter(res, 404, 'Không tìm thấy giường');
    }

    return responseFormatter(res, 200, 'Lấy thông tin giường thành công', giuong);
  } catch (error) {
    console.error('Error in getGiuongById:', error);
    return responseFormatter(res, 500, 'Lỗi server khi lấy thông tin giường', null, error.message);
  }
};

/**
 * Create new bed
 */
const createGiuong = async (req, res) => {
  try {
    const { id_phong, so_giuong, trang_thai = 'available', ghi_chu } = req.body;
    const nguoi_tao = req.user.id;

    // Validate required fields
    if (!id_phong || !so_giuong) {
      return responseFormatter(res, 400, 'Thiếu thông tin bắt buộc (id_phong, so_giuong)');
    }

    // Check if room exists
    const phong = await Phong.findByPk(id_phong);
    if (!phong) {
      return responseFormatter(res, 404, 'Không tìm thấy phòng');
    }

    // Check if bed number already exists in the room
    const existingGiuong = await Giuong.findOne({
      where: { id_phong, so_giuong }
    });

    if (existingGiuong) {
      return responseFormatter(res, 409, 'Số giường đã tồn tại trong phòng này');
    }

    // Check room capacity
    const currentBedCount = await Giuong.count({
      where: { id_phong }
    });

    if (currentBedCount >= phong.sl_max) {
      return responseFormatter(res, 400, 'Phòng đã đạt số lượng giường tối đa');
    }

    const newGiuong = await Giuong.create({
      id_phong,
      so_giuong,
      trang_thai,
      ghi_chu,
      nguoi_tao
    });

    // Get the created bed with related data
    const createdGiuong = await Giuong.findByPk(newGiuong.id, {
      include: [
        {
          model: Phong,
          as: 'phong',
          attributes: ['id', 'ten_phong', 'tang', 'trang_thai'],
          include: [
            {
              model: LoaiPhong,
              as: 'loai_phong',
              attributes: ['id', 'ten_loai', 'gia_thue']
            }
          ]
        }
      ]
    });

    return responseFormatter(res, 201, 'Tạo giường mới thành công', createdGiuong);
  } catch (error) {
    console.error('Error in createGiuong:', error);
    return responseFormatter(res, 500, 'Lỗi server khi tạo giường mới', null, error.message);
  }
};

/**
 * Update bed
 */
const updateGiuong = async (req, res) => {
  try {
    const { id } = req.params;
    const { so_giuong, trang_thai, ghi_chu } = req.body;
    const nguoi_cap_nhat = req.user.id;

    const giuong = await Giuong.findByPk(id);
    if (!giuong) {
      return responseFormatter(res, 404, 'Không tìm thấy giường');
    }

    // If updating bed number, check for conflicts
    if (so_giuong && so_giuong !== giuong.so_giuong) {
      const existingGiuong = await Giuong.findOne({
        where: { 
          id_phong: giuong.id_phong, 
          so_giuong,
          id: { [Op.ne]: id }
        }
      });

      if (existingGiuong) {
        return responseFormatter(res, 409, 'Số giường đã tồn tại trong phòng này');
      }
    }

    // If changing status to maintenance, check if bed is occupied
    if (trang_thai === 'maintenance') {
      const activePhanBo = await PhanBoPhong.findOne({
        where: { 
          id_giuong: id,
          trang_thai: 'active'
        }
      });

      if (activePhanBo) {
        return responseFormatter(res, 400, 'Không thể chuyển giường đang có người ở sang trạng thái bảo trì');
      }
    }

    await giuong.update({
      ...(so_giuong && { so_giuong }),
      ...(trang_thai && { trang_thai }),
      ...(ghi_chu !== undefined && { ghi_chu }),
      nguoi_cap_nhat
    });

    // Get updated bed with related data
    const updatedGiuong = await Giuong.findByPk(id, {
      include: [
        {
          model: Phong,
          as: 'phong',
          attributes: ['id', 'ten_phong', 'tang', 'trang_thai'],
          include: [
            {
              model: LoaiPhong,
              as: 'loai_phong',
              attributes: ['id', 'ten_loai', 'gia_thue']
            }
          ]
        },
        {
          model: PhanBoPhong,
          as: 'phan_bo_phong',
          required: false,
          where: { trang_thai: 'active' },
          include: [
            {
              model: SinhVien,
              as: 'sinh_vien',
              attributes: ['id', 'ho_ten', 'mssv']
            }
          ]
        }
      ]
    });

    return responseFormatter(res, 200, 'Cập nhật giường thành công', updatedGiuong);
  } catch (error) {
    console.error('Error in updateGiuong:', error);
    return responseFormatter(res, 500, 'Lỗi server khi cập nhật giường', null, error.message);
  }
};

/**
 * Delete bed (soft delete)
 */
const deleteGiuong = async (req, res) => {
  try {
    const { id } = req.params;

    const giuong = await Giuong.findByPk(id);
    if (!giuong) {
      return responseFormatter(res, 404, 'Không tìm thấy giường');
    }

    // Check if bed is occupied
    const activePhanBo = await PhanBoPhong.findOne({
      where: { 
        id_giuong: id,
        trang_thai: 'active'
      }
    });

    if (activePhanBo) {
      return responseFormatter(res, 400, 'Không thể xóa giường đang có người ở');
    }

    await giuong.destroy();

    return responseFormatter(res, 200, 'Xóa giường thành công');
  } catch (error) {
    console.error('Error in deleteGiuong:', error);
    return responseFormatter(res, 500, 'Lỗi server khi xóa giường', null, error.message);
  }
};

/**
 * Get available beds in a room
 */
const getAvailableGiuongByRoom = async (req, res) => {
  try {
    const { id_phong } = req.params;

    // Check if room exists
    const phong = await Phong.findByPk(id_phong);
    if (!phong) {
      return responseFormatter(res, 404, 'Không tìm thấy phòng');
    }

    const availableGiuong = await Giuong.findAll({
      where: {
        id_phong,
        trang_thai: 'available'
      },
      include: [
        {
          model: Phong,
          as: 'phong',
          attributes: ['id', 'ten_phong', 'tang', 'gioi_tinh']
        }
      ],
      order: [['so_giuong', 'ASC']]
    });

    return responseFormatter(res, 200, 'Lấy danh sách giường trống thành công', availableGiuong);
  } catch (error) {
    console.error('Error in getAvailableGiuongByRoom:', error);
    return responseFormatter(res, 500, 'Lỗi server khi lấy danh sách giường trống', null, error.message);
  }
};

module.exports = {
  getAllGiuong,
  getGiuongById,
  createGiuong,
  updateGiuong,
  deleteGiuong,
  getAvailableGiuongByRoom
};
