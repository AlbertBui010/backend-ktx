const { SinhVien, PhuHuynh, PhieuDangKyKTX, PhanBoPhong, Giuong, Phong, LoaiPhong } = require('../models');
const { responseFormatter } = require('../utils/response.util');
const { Op } = require('sequelize');

/**
 * Get all students with pagination and filtering
 */
const getAllSinhVien = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      mssv,
      ten,
      dia_chi,
      phai, // đổi từ gioi_tinh thành phai
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
      trang_thai,
      email,
      lop,
      dang_hien,
      ghi_chu,
      phu_huynh = []
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Build where condition
    const whereCondition = {};

    if (mssv) {
      whereCondition.mssv = { [Op.iLike]: `%${mssv}%` };
    }

    if (ten) {
      whereCondition.ten = { [Op.iLike]: `%${ten}%` };
    }

    if (email) {
      whereCondition.email = { [Op.iLike]: `%${email}%` };
    }

    if (khoa) {
      whereCondition.khoa = { [Op.iLike]: `%${khoa}%` };
    }

    if (nganh) {
      whereCondition.nganh = { [Op.iLike]: `%${nganh}%` };
    }

    if (khoa_hoc) {
      whereCondition.khoa_hoc = khoa_hoc;
    }

    if (phai) {
      whereCondition.phai = phai;
    }

    if (trang_thai) {
      whereCondition.trang_thai = trang_thai;
    }

    if (search) {
      whereCondition[Op.or] = [
        { ten: { [Op.iLike]: `%${search}%` } },
        { mssv: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
        { khoa: { [Op.iLike]: `%${search}%` } },
        { nganh: { [Op.iLike]: `%${search}%` } }
      ];
    }

    // Include related data
    const include = [
      {
        model: PhuHuynh,
        as: 'phu_huynh',
        attributes: ['id', 'ten', 'sdt', 'email', 'dia_chi', 'moi_quan_he']
      },
      {
        model: PhanBoPhong,
        as: 'phan_bo_phong',
        required: false,
        where: { trang_thai: 'active' },
        include: [
          {
            model: Giuong,
            as: 'giuong',
            attributes: ['id', 'so_giuong'],
            include: [
              {
                model: Phong,
                as: 'phong',
                attributes: ['id', 'ten_phong', 'tang'],
                include: [
                  {
                    model: LoaiPhong,
                    as: 'loai_phong',
                    attributes: ['id', 'ten_loai', 'gia_thue']
                  }
                ]
              }
            ]
          }
        ]
      }
    ];

    const { count, rows } = await SinhVien.findAndCountAll({
      where: whereCondition,
      include,
      limit: parseInt(limit),
      offset,
      order: [[sort_by, sort_order.toUpperCase()]],
      distinct: true
    });

    const totalPages = Math.ceil(count / parseInt(limit));

    return responseFormatter(res, 200, 'Lấy danh sách sinh viên thành công', {
      sinh_vien: rows,
      pagination: {
        current_page: parseInt(page),
        total_pages: totalPages,
        total_items: count,
        items_per_page: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error in getAllSinhVien:', error);
    return responseFormatter(res, 500, 'Lỗi server khi lấy danh sách sinh viên', null, error.message);
  }
};

/**
 * Get student by ID
 */
const getSinhVienById = async (req, res) => {
  try {
    const { id } = req.params;

    const sinhVien = await SinhVien.findByPk(id, {
      include: [
        {
          model: PhuHuynh,
          as: 'phu_huynh',
          attributes: { exclude: ['createdAt', 'updatedAt', 'deletedAt'] }
        },
        {
          model: PhieuDangKyKTX,
          as: 'phieu_dang_ky',
          attributes: { exclude: ['deletedAt'] },
          order: [['createdAt', 'DESC']],
          limit: 5
        },
        {
          model: PhanBoPhong,
          as: 'phan_bo_phong',
          required: false,
          where: { trang_thai: 'active' },
          include: [
            {
              model: Giuong,
              as: 'giuong',
              include: [
                {
                  model: Phong,
                  as: 'phong',
                  include: [
                    {
                      model: LoaiPhong,
                      as: 'loai_phong'
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    });

    if (!sinhVien) {
      return responseFormatter(res, 404, 'Không tìm thấy sinh viên');
    }

    return responseFormatter(res, 200, 'Lấy thông tin sinh viên thành công', sinhVien);
  } catch (error) {
    console.error('Error in getSinhVienById:', error);
    return responseFormatter(res, 500, 'Lỗi server khi lấy thông tin sinh viên', null, error.message);
  }
};

/**
 * Get student by MSSV
 */
const getSinhVienByMSSV = async (req, res) => {
  try {
    const { mssv } = req.params;

    const sinhVien = await SinhVien.findOne({
      where: { mssv },
      include: [
        {
          model: PhuHuynh,
          as: 'phu_huynh',
          attributes: { exclude: ['createdAt', 'updatedAt', 'deletedAt'] }
        },
        {
          model: PhanBoPhong,
          as: 'phan_bo_phong',
          required: false,
          where: { trang_thai: 'active' },
          include: [
            {
              model: Giuong,
              as: 'giuong',
              include: [
                {
                  model: Phong,
                  as: 'phong',
                  include: [
                    {
                      model: LoaiPhong,
                      as: 'loai_phong'
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    });

    if (!sinhVien) {
      return responseFormatter(res, 404, 'Không tìm thấy sinh viên với MSSV này');
    }

    return responseFormatter(res, 200, 'Lấy thông tin sinh viên thành công', sinhVien);
  } catch (error) {
    console.error('Error in getSinhVienByMSSV:', error);
    return responseFormatter(res, 500, 'Lỗi server khi lấy thông tin sinh viên', null, error.message);
  }
};

/**
 * Create new student
 */
const createSinhVien = async (req, res) => {
  try {
    const {
      mssv,
      ten,
      dia_chi,
      phai, // đổi từ gioi_tinh thành phai
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
      trang_thai,
      email,
      lop,
      dang_hien,
      ghi_chu,
      phu_huynh = []
    } = req.body;

    const nguoi_tao = req.user.id;

    // Validate required fields
    if (!mssv || !ten || !email || !phai || !khoa) {
      return responseFormatter(res, 400, 'Thiếu thông tin bắt buộc');
    }

    // Check if MSSV already exists
    const existingMSSV = await SinhVien.findOne({ where: { mssv } });
    if (existingMSSV) {
      return responseFormatter(res, 409, 'MSSV đã tồn tại trong hệ thống');
    }

    // Check if email already exists
    const existingEmail = await SinhVien.findOne({ where: { email } });
    if (existingEmail) {
      return responseFormatter(res, 409, 'Email đã tồn tại trong hệ thống');
    }

    // Create student
    const newSinhVien = await SinhVien.create({
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
      trang_thai,
      email,
      lop,
      dang_hien,
      ghi_chu,
      nguoi_tao
    });

    // Create parent/guardian records if provided
    if (phu_huynh && phu_huynh.length > 0) {
      const phuHuynhData = phu_huynh.map(ph => ({
        ...ph,
        id_sinh_vien: newSinhVien.id,
        nguoi_tao
      }));

      await PhuHuynh.bulkCreate(phuHuynhData);
    }

    // Get the created student with related data
    const createdSinhVien = await SinhVien.findByPk(newSinhVien.id, {
      include: [
        {
          model: PhuHuynh,
          as: 'phu_huynh',
          attributes: { exclude: ['createdAt', 'updatedAt', 'deletedAt'] }
        }
      ]
    });

    return responseFormatter(res, 201, 'Tạo sinh viên mới thành công', createdSinhVien);
  } catch (error) {
    console.error('Error in createSinhVien:', error);
    return responseFormatter(res, 500, 'Lỗi server khi tạo sinh viên mới', null, error.message);
  }
};

/**
 * Update student
 */
const updateSinhVien = async (req, res) => {
  try {
    const { id } = req.params;
    const {
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
      trang_thai,
      email,
      lop,
      dang_hien,
      ghi_chu
    } = req.body;

    const nguoi_cap_nhat = req.user.id;

    const sinhVien = await SinhVien.findByPk(id);
    if (!sinhVien) {
      return responseFormatter(res, 404, 'Không tìm thấy sinh viên');
    }

    // Check email uniqueness if email is being updated
    if (email && email !== sinhVien.email) {
      const existingEmail = await SinhVien.findOne({
        where: {
          email,
          id: { [Op.ne]: id }
        }
      });

      if (existingEmail) {
        return responseFormatter(res, 409, 'Email đã tồn tại trong hệ thống');
      }
    }

    await sinhVien.update({
      ...(ten && { ten }),
      ...(dia_chi && { dia_chi }),
      ...(phai && { phai }),
      ...(ngay_sinh && { ngay_sinh }),
      ...(noi_sinh && { noi_sinh }),
      ...(dan_toc && { dan_toc }),
      ...(ton_giao && { ton_giao }),
      ...(khoa && { khoa }),
      ...(sdt && { sdt }),
      ...(cmnd && { cmnd }),
      ...(ngay_cap_cmnd && { ngay_cap_cmnd }),
      ...(noi_cap_cmnd && { noi_cap_cmnd }),
      ...(ho_khau && { ho_khau }),
      ...(dia_chi_lien_he && { dia_chi_lien_he }),
      ...(trang_thai && { trang_thai }),
      ...(email && { email }),
      ...(lop && { lop }),
      ...(dang_hien !== undefined && { dang_hien }),
      ...(ghi_chu !== undefined && { ghi_chu }),
      nguoi_cap_nhat
    });

    // Get updated student with related data
    const updatedSinhVien = await SinhVien.findByPk(id, {
      include: [
        {
          model: PhuHuynh,
          as: 'phu_huynh',
          attributes: { exclude: ['createdAt', 'updatedAt', 'deletedAt'] }
        },
        {
          model: PhanBoPhong,
          as: 'phan_bo_phong',
          required: false,
          where: { trang_thai: 'active' },
          include: [
            {
              model: Giuong,
              as: 'giuong',
              include: [
                {
                  model: Phong,
                  as: 'phong',
                  attributes: ['id', 'ten_phong', 'tang']
                }
              ]
            }
          ]
        }
      ]
    });

    return responseFormatter(res, 200, 'Cập nhật sinh viên thành công', updatedSinhVien);
  } catch (error) {
    console.error('Error in updateSinhVien:', error);
    return responseFormatter(res, 500, 'Lỗi server khi cập nhật sinh viên', null, error.message);
  }
};

/**
 * Delete student (soft delete)
 */
const deleteSinhVien = async (req, res) => {
  try {
    const { id } = req.params;

    const sinhVien = await SinhVien.findByPk(id);
    if (!sinhVien) {
      return responseFormatter(res, 404, 'Không tìm thấy sinh viên');
    }

    // Check if student has active room assignment
    const activePhanBo = await PhanBoPhong.findOne({
      where: {
        id_sinh_vien: id,
        trang_thai: 'active'
      }
    });

    if (activePhanBo) {
      return responseFormatter(res, 400, 'Không thể xóa sinh viên đang ở KTX');
    }

    // Check if student has pending applications
    const pendingApplications = await PhieuDangKyKTX.findOne({
      where: {
        id_sinh_vien: id,
        trang_thai: 'pending'
      }
    });

    if (pendingApplications) {
      return responseFormatter(res, 400, 'Không thể xóa sinh viên có đơn đăng ký đang chờ duyệt');
    }

    await sinhVien.destroy();

    return responseFormatter(res, 200, 'Xóa sinh viên thành công');
  } catch (error) {
    console.error('Error in deleteSinhVien:', error);
    return responseFormatter(res, 500, 'Lỗi server khi xóa sinh viên', null, error.message);
  }
};

/**
 * Get student's room assignment history
 */
const getSinhVienRoomHistory = async (req, res) => {
  try {
    const { id } = req.params;

    const sinhVien = await SinhVien.findByPk(id);
    if (!sinhVien) {
      return responseFormatter(res, 404, 'Không tìm thấy sinh viên');
    }

    const roomHistory = await PhanBoPhong.findAll({
      where: { id_sinh_vien: id },
      include: [
        {
          model: Giuong,
          as: 'giuong',
          include: [
            {
              model: Phong,
              as: 'phong',
              include: [
                {
                  model: LoaiPhong,
                  as: 'loai_phong',
                  attributes: ['id', 'ten_loai', 'gia_thue']
                }
              ]
            }
          ]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    return responseFormatter(res, 200, 'Lấy lịch sử phân bổ phòng thành công', roomHistory);
  } catch (error) {
    console.error('Error in getSinhVienRoomHistory:', error);
    return responseFormatter(res, 500, 'Lỗi server khi lấy lịch sử phân bổ phòng', null, error.message);
  }
};

module.exports = {
  getAllSinhVien,
  getSinhVienById,
  getSinhVienByMSSV,
  createSinhVien,
  updateSinhVien,
  deleteSinhVien,
  getSinhVienRoomHistory
};
