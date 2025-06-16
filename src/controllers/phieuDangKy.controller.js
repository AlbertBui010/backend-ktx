const { PhieuDangKyKTX, SinhVien, PhuHuynh, Phong, LoaiPhong, Giuong, PhanBoPhong } = require('../models');
const { responseFormatter } = require('../utils/response.util');
const { Op } = require('sequelize');
const sequelize = require('../config/database.config');

/**
 * Get all KTX applications with pagination and filtering
 */
const getAllPhieuDangKy = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      trang_thai,
      id_loai_phong,
      ngay_bat_dau,
      ngay_ket_thuc,
      mssv,
      search,
      sort_by = 'createdAt',
      sort_order = 'DESC'
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    // Build where condition
    const whereCondition = {};
    
    if (trang_thai) {
      whereCondition.trang_thai = trang_thai;
    }
    
    if (id_loai_phong) {
      whereCondition.id_loai_phong = id_loai_phong;
    }
    
    if (ngay_bat_dau && ngay_ket_thuc) {
      whereCondition.createdAt = {
        [Op.between]: [new Date(ngay_bat_dau), new Date(ngay_ket_thuc)]
      };
    }

    // Build include for search by MSSV or student name
    const include = [
      {
        model: SinhVien,
        as: 'sinh_vien',
        attributes: ['id', 'ho_ten', 'mssv', 'email', 'sdt', 'khoa', 'nganh', 'khoa_hoc'],
        ...(mssv && { where: { mssv: { [Op.iLike]: `%${mssv}%` } } }),
        ...(search && { 
          where: {
            [Op.or]: [
              { ho_ten: { [Op.iLike]: `%${search}%` } },
              { mssv: { [Op.iLike]: `%${search}%` } }
            ]
          }
        })
      },
      {
        model: LoaiPhong,
        as: 'loai_phong',
        attributes: ['id', 'ten_loai', 'gia_thue', 'mo_ta']
      }
    ];

    const { count, rows } = await PhieuDangKyKTX.findAndCountAll({
      where: whereCondition,
      include,
      limit: parseInt(limit),
      offset,
      order: [[sort_by, sort_order.toUpperCase()]],
      distinct: true
    });

    const totalPages = Math.ceil(count / parseInt(limit));

    return responseFormatter(res, 200, 'Lấy danh sách phiếu đăng ký thành công', {
      phieu_dang_ky: rows,
      pagination: {
        current_page: parseInt(page),
        total_pages: totalPages,
        total_items: count,
        items_per_page: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error in getAllPhieuDangKy:', error);
    return responseFormatter(res, 500, 'Lỗi server khi lấy danh sách phiếu đăng ký', null, error.message);
  }
};

/**
 * Get KTX application by ID
 */
const getPhieuDangKyById = async (req, res) => {
  try {
    const { id } = req.params;

    const phieuDangKy = await PhieuDangKyKTX.findByPk(id, {
      include: [
        {
          model: SinhVien,
          as: 'sinh_vien',
          attributes: { exclude: ['createdAt', 'updatedAt', 'deletedAt'] },
          include: [
            {
              model: PhuHuynh,
              as: 'phu_huynh',
              attributes: { exclude: ['createdAt', 'updatedAt', 'deletedAt'] }
            }
          ]
        },
        {
          model: LoaiPhong,
          as: 'loai_phong',
          attributes: { exclude: ['createdAt', 'updatedAt', 'deletedAt'] }
        }
      ]
    });

    if (!phieuDangKy) {
      return responseFormatter(res, 404, 'Không tìm thấy phiếu đăng ký');
    }

    return responseFormatter(res, 200, 'Lấy thông tin phiếu đăng ký thành công', phieuDangKy);
  } catch (error) {
    console.error('Error in getPhieuDangKyById:', error);
    return responseFormatter(res, 500, 'Lỗi server khi lấy thông tin phiếu đăng ký', null, error.message);
  }
};

/**
 * Create new KTX application
 */
const createPhieuDangKy = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const {
      id_sinh_vien,
      id_loai_phong,
      ngay_bat_dau_mong_muon,
      ly_do_dang_ky,
      ghi_chu
    } = req.body;

    // Validate required fields
    if (!id_sinh_vien || !id_loai_phong || !ngay_bat_dau_mong_muon || !ly_do_dang_ky) {
      return responseFormatter(res, 400, 'Thiếu thông tin bắt buộc');
    }

    // Check if student exists and is active
    const sinhVien = await SinhVien.findByPk(id_sinh_vien, { transaction });
    if (!sinhVien) {
      await transaction.rollback();
      return responseFormatter(res, 404, 'Không tìm thấy sinh viên');
    }

    if (sinhVien.trang_thai !== 'active') {
      await transaction.rollback();
      return responseFormatter(res, 400, 'Sinh viên không ở trạng thái hoạt động');
    }

    // Check if room type exists and is active
    const loaiPhong = await LoaiPhong.findByPk(id_loai_phong, { transaction });
    if (!loaiPhong) {
      await transaction.rollback();
      return responseFormatter(res, 404, 'Không tìm thấy loại phòng');
    }

    if (loaiPhong.trang_thai !== 'active') {
      await transaction.rollback();
      return responseFormatter(res, 400, 'Loại phòng không khả dụng');
    }

    // Check if student already has an active room assignment
    const activeAssignment = await PhanBoPhong.findOne({
      where: {
        id_sinh_vien,
        trang_thai: 'active'
      },
      transaction
    });

    if (activeAssignment) {
      await transaction.rollback();
      return responseFormatter(res, 400, 'Sinh viên đã có phòng ở KTX');
    }

    // Check if student has any pending applications
    const pendingApplication = await PhieuDangKyKTX.findOne({
      where: {
        id_sinh_vien,
        trang_thai: 'pending'
      },
      transaction
    });

    if (pendingApplication) {
      await transaction.rollback();
      return responseFormatter(res, 409, 'Sinh viên đã có đơn đăng ký đang chờ duyệt');
    }

    // Validate start date is not in the past
    const startDate = new Date(ngay_bat_dau_mong_muon);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (startDate < today) {
      await transaction.rollback();
      return responseFormatter(res, 400, 'Ngày bắt đầu mong muốn không thể là ngày quá khứ');
    }

    // Create the application
    const newPhieuDangKy = await PhieuDangKyKTX.create({
      id_sinh_vien,
      id_loai_phong,
      ngay_bat_dau_mong_muon: startDate,
      ly_do_dang_ky,
      ghi_chu,
      trang_thai: 'pending',
      nguoi_tao: req.user?.id || id_sinh_vien
    }, { transaction });

    await transaction.commit();

    // Get the created application with related data
    const createdPhieuDangKy = await PhieuDangKyKTX.findByPk(newPhieuDangKy.id, {
      include: [
        {
          model: SinhVien,
          as: 'sinh_vien',
          attributes: ['id', 'ho_ten', 'mssv', 'email', 'khoa', 'nganh']
        },
        {
          model: LoaiPhong,
          as: 'loai_phong',
          attributes: ['id', 'ten_loai', 'gia_thue', 'mo_ta']
        }
      ]
    });

    return responseFormatter(res, 201, 'Tạo phiếu đăng ký thành công', createdPhieuDangKy);
  } catch (error) {
    await transaction.rollback();
    console.error('Error in createPhieuDangKy:', error);
    return responseFormatter(res, 500, 'Lỗi server khi tạo phiếu đăng ký', null, error.message);
  }
};

/**
 * Update KTX application status (approve/reject)
 */
const updatePhieuDangKyStatus = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    const { trang_thai, ly_do_tu_choi, id_phong, id_giuong } = req.body;
    const nguoi_cap_nhat = req.user.id;

    // Validate status
    if (!['approved', 'rejected'].includes(trang_thai)) {
      return responseFormatter(res, 400, 'Trạng thái không hợp lệ');
    }

    const phieuDangKy = await PhieuDangKyKTX.findByPk(id, {
      include: [
        {
          model: SinhVien,
          as: 'sinh_vien'
        },
        {
          model: LoaiPhong,
          as: 'loai_phong'
        }
      ],
      transaction
    });

    if (!phieuDangKy) {
      await transaction.rollback();
      return responseFormatter(res, 404, 'Không tìm thấy phiếu đăng ký');
    }

    if (phieuDangKy.trang_thai !== 'pending') {
      await transaction.rollback();
      return responseFormatter(res, 400, 'Phiếu đăng ký đã được xử lý');
    }

    if (trang_thai === 'rejected') {
      if (!ly_do_tu_choi) {
        await transaction.rollback();
        return responseFormatter(res, 400, 'Cần cung cấp lý do từ chối');
      }

      await phieuDangKy.update({
        trang_thai: 'rejected',
        ly_do_tu_choi,
        ngay_duyet: new Date(),
        nguoi_duyet: nguoi_cap_nhat,
        nguoi_cap_nhat
      }, { transaction });

      await transaction.commit();
      return responseFormatter(res, 200, 'Từ chối phiếu đăng ký thành công', phieuDangKy);
    }

    // For approval, we need room and bed assignment
    if (trang_thai === 'approved') {
      if (!id_phong || !id_giuong) {
        await transaction.rollback();
        return responseFormatter(res, 400, 'Cần chỉ định phòng và giường khi duyệt đơn');
      }

      // Validate room and bed
      const phong = await Phong.findByPk(id_phong, {
        include: [{ model: LoaiPhong, as: 'loai_phong' }],
        transaction
      });

      if (!phong) {
        await transaction.rollback();
        return responseFormatter(res, 404, 'Không tìm thấy phòng');
      }

      if (phong.id_loai_phong !== phieuDangKy.id_loai_phong) {
        await transaction.rollback();
        return responseFormatter(res, 400, 'Loại phòng không khớp với đơn đăng ký');
      }

      // Check gender compatibility
      if (phong.gioi_tinh && phong.gioi_tinh !== phieuDangKy.sinh_vien.gioi_tinh) {
        await transaction.rollback();
        return responseFormatter(res, 400, 'Giới tính sinh viên không phù hợp với phòng');
      }

      const giuong = await Giuong.findOne({
        where: {
          id: id_giuong,
          id_phong,
          trang_thai: 'available'
        },
        transaction
      });

      if (!giuong) {
        await transaction.rollback();
        return responseFormatter(res, 404, 'Giường không khả dụng');
      }

      // Check if bed is already occupied
      const existingAssignment = await PhanBoPhong.findOne({
        where: {
          id_giuong,
          trang_thai: 'active'
        },
        transaction
      });

      if (existingAssignment) {
        await transaction.rollback();
        return responseFormatter(res, 400, 'Giường đã có người ở');
      }

      // Create room assignment
      await PhanBoPhong.create({
        id_sinh_vien: phieuDangKy.id_sinh_vien,
        id_giuong,
        ngay_bat_dau: phieuDangKy.ngay_bat_dau_mong_muon,
        trang_thai: 'active',
        nguoi_tao: nguoi_cap_nhat
      }, { transaction });

      // Update bed status
      await giuong.update({
        trang_thai: 'occupied',
        nguoi_cap_nhat
      }, { transaction });

      // Update room current occupancy
      await phong.increment('sl_hien_tai', { transaction });

      // Update room status if needed
      const updatedRoom = await Phong.findByPk(id_phong, { transaction });
      let newRoomStatus = 'available';
      
      if (updatedRoom.sl_hien_tai >= updatedRoom.sl_max) {
        newRoomStatus = 'full';
      } else if (updatedRoom.sl_hien_tai > 0) {
        newRoomStatus = 'partially_occupied';
      }

      await updatedRoom.update({
        trang_thai: newRoomStatus,
        nguoi_cap_nhat
      }, { transaction });

      // Update application status
      await phieuDangKy.update({
        trang_thai: 'approved',
        ngay_duyet: new Date(),
        nguoi_duyet: nguoi_cap_nhat,
        nguoi_cap_nhat
      }, { transaction });

      await transaction.commit();

      // Get updated application with all related data
      const updatedPhieuDangKy = await PhieuDangKyKTX.findByPk(id, {
        include: [
          {
            model: SinhVien,
            as: 'sinh_vien',
            attributes: ['id', 'ho_ten', 'mssv', 'email']
          },
          {
            model: LoaiPhong,
            as: 'loai_phong'
          }
        ]
      });

      return responseFormatter(res, 200, 'Duyệt phiếu đăng ký thành công', updatedPhieuDangKy);
    }
  } catch (error) {
    await transaction.rollback();
    console.error('Error in updatePhieuDangKyStatus:', error);
    return responseFormatter(res, 500, 'Lỗi server khi cập nhật trạng thái phiếu đăng ký', null, error.message);
  }
};

/**
 * Cancel KTX application (student can cancel their own pending application)
 */
const cancelPhieuDangKy = async (req, res) => {
  try {
    const { id } = req.params;
    const { ly_do_huy } = req.body;

    const phieuDangKy = await PhieuDangKyKTX.findByPk(id, {
      include: [
        {
          model: SinhVien,
          as: 'sinh_vien',
          attributes: ['id', 'ho_ten', 'mssv']
        }
      ]
    });

    if (!phieuDangKy) {
      return responseFormatter(res, 404, 'Không tìm thấy phiếu đăng ký');
    }

    if (phieuDangKy.trang_thai !== 'pending') {
      return responseFormatter(res, 400, 'Chỉ có thể hủy đơn đang chờ duyệt');
    }

    // Check if user has permission to cancel (student can cancel their own, admin can cancel any)
    if (req.user.role !== 'admin' && phieuDangKy.id_sinh_vien !== req.user.sinh_vien_id) {
      return responseFormatter(res, 403, 'Không có quyền hủy đơn đăng ký này');
    }

    await phieuDangKy.update({
      trang_thai: 'cancelled',
      ly_do_tu_choi: ly_do_huy || 'Sinh viên hủy đơn',
      ngay_duyet: new Date(),
      nguoi_duyet: req.user.id,
      nguoi_cap_nhat: req.user.id
    });

    return responseFormatter(res, 200, 'Hủy phiếu đăng ký thành công', phieuDangKy);
  } catch (error) {
    console.error('Error in cancelPhieuDangKy:', error);
    return responseFormatter(res, 500, 'Lỗi server khi hủy phiếu đăng ký', null, error.message);
  }
};

/**
 * Get available rooms for a room type (for application approval)
 */
const getAvailableRoomsForApproval = async (req, res) => {
  try {
    const { id_loai_phong, gioi_tinh } = req.query;

    if (!id_loai_phong) {
      return responseFormatter(res, 400, 'Cần chỉ định loại phòng');
    }

    const whereCondition = {
      id_loai_phong,
      trang_thai: ['available', 'partially_occupied'],
      sl_hien_tai: { [Op.lt]: sequelize.col('sl_max') }
    };

    if (gioi_tinh) {
      whereCondition[Op.or] = [
        { gioi_tinh: gioi_tinh },
        { gioi_tinh: null }
      ];
    }

    const availableRooms = await Phong.findAll({
      where: whereCondition,
      include: [
        {
          model: LoaiPhong,
          as: 'loai_phong',
          attributes: ['id', 'ten_loai', 'gia_thue']
        },
        {
          model: Giuong,
          as: 'giuong',
          where: { trang_thai: 'available' },
          required: true,
          attributes: ['id', 'so_giuong']
        }
      ],
      order: [['ten_phong', 'ASC'], [{ model: Giuong, as: 'giuong' }, 'so_giuong', 'ASC']]
    });

    return responseFormatter(res, 200, 'Lấy danh sách phòng khả dụng thành công', availableRooms);
  } catch (error) {
    console.error('Error in getAvailableRoomsForApproval:', error);
    return responseFormatter(res, 500, 'Lỗi server khi lấy danh sách phòng khả dụng', null, error.message);
  }
};

module.exports = {
  getAllPhieuDangKy,
  getPhieuDangKyById,
  createPhieuDangKy,
  updatePhieuDangKyStatus,
  cancelPhieuDangKy,
  getAvailableRoomsForApproval
};
