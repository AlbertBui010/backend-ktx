const express = require('express');
const router = express.Router();
const phieuDangKyController = require('../controllers/phieuDangKy.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { validateRequest } = require('../middleware/validation.middleware');
const { body, param, query } = require('express-validator');

// Validation schemas
const createPhieuDangKyValidation = [
  body('id_sinh_vien')
    .notEmpty()
    .withMessage('ID sinh viên là bắt buộc')
    .isInt({ min: 1 })
    .withMessage('ID sinh viên phải là số nguyên dương'),
  body('id_loai_phong')
    .notEmpty()
    .withMessage('ID loại phòng là bắt buộc')
    .isInt({ min: 1 })
    .withMessage('ID loại phòng phải là số nguyên dương'),
  body('ngay_bat_dau_mong_muon')
    .notEmpty()
    .withMessage('Ngày bắt đầu mong muốn là bắt buộc')
    .isISO8601()
    .withMessage('Ngày bắt đầu mong muốn phải có định dạng YYYY-MM-DD')
    .custom((value) => {
      const startDate = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (startDate < today) {
        throw new Error('Ngày bắt đầu mong muốn không thể là ngày quá khứ');
      }
      return true;
    }),
  body('ly_do_dang_ky')
    .notEmpty()
    .withMessage('Lý do đăng ký là bắt buộc')
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Lý do đăng ký phải có độ dài từ 10-500 ký tự'),
  body('ghi_chu')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Ghi chú không được vượt quá 500 ký tự')
];

const updateStatusValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID phiếu đăng ký phải là số nguyên dương'),
  body('trang_thai')
    .notEmpty()
    .withMessage('Trạng thái là bắt buộc')
    .isIn(['approved', 'rejected'])
    .withMessage('Trạng thái phải là approved hoặc rejected'),
  body('ly_do_tu_choi')
    .if(body('trang_thai').equals('rejected'))
    .notEmpty()
    .withMessage('Lý do từ chối là bắt buộc khi từ chối đơn')
    .trim()
    .isLength({ min: 5, max: 500 })
    .withMessage('Lý do từ chối phải có độ dài từ 5-500 ký tự'),
  body('id_phong')
    .if(body('trang_thai').equals('approved'))
    .notEmpty()
    .withMessage('ID phòng là bắt buộc khi duyệt đơn')
    .isInt({ min: 1 })
    .withMessage('ID phòng phải là số nguyên dương'),
  body('id_giuong')
    .if(body('trang_thai').equals('approved'))
    .notEmpty()
    .withMessage('ID giường là bắt buộc khi duyệt đơn')
    .isInt({ min: 1 })
    .withMessage('ID giường phải là số nguyên dương')
];

const cancelValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID phiếu đăng ký phải là số nguyên dương'),
  body('ly_do_huy')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Lý do hủy không được vượt quá 500 ký tự')
];

const idValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID phải là số nguyên dương')
];

const queryValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Trang phải là số nguyên dương'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Giới hạn phải là số nguyên từ 1-100'),
  query('trang_thai')
    .optional()
    .isIn(['pending', 'approved', 'rejected', 'cancelled'])
    .withMessage('Trạng thái không hợp lệ'),
  query('id_loai_phong')
    .optional()
    .isInt({ min: 1 })
    .withMessage('ID loại phòng phải là số nguyên dương'),
  query('ngay_bat_dau')
    .optional()
    .isISO8601()
    .withMessage('Ngày bắt đầu phải có định dạng YYYY-MM-DD'),
  query('ngay_ket_thuc')
    .optional()
    .isISO8601()
    .withMessage('Ngày kết thúc phải có định dạng YYYY-MM-DD'),
  query('sort_order')
    .optional()
    .isIn(['ASC', 'DESC', 'asc', 'desc'])
    .withMessage('Thứ tự sắp xếp phải là ASC hoặc DESC')
];

const availableRoomsValidation = [
  query('id_loai_phong')
    .notEmpty()
    .withMessage('ID loại phòng là bắt buộc')
    .isInt({ min: 1 })
    .withMessage('ID loại phòng phải là số nguyên dương'),
  query('gioi_tinh')
    .optional()
    .isIn(['male', 'female'])
    .withMessage('Giới tính phải là male hoặc female')
];

// Routes

/**
 * @route   GET /api/phieu-dang-ky
 * @desc    Get all KTX applications with pagination and filtering
 * @access  Private
 */
router.get('/', 
  authMiddleware, 
  queryValidation,
  validateRequest, 
  phieuDangKyController.getAllPhieuDangKy
);

/**
 * @route   GET /api/phieu-dang-ky/:id
 * @desc    Get KTX application by ID
 * @access  Private
 */
router.get('/:id', 
  authMiddleware, 
  idValidation,
  validateRequest, 
  phieuDangKyController.getPhieuDangKyById
);

/**
 * @route   POST /api/phieu-dang-ky
 * @desc    Create new KTX application
 * @access  Private
 */
router.post('/', 
  authMiddleware, 
  createPhieuDangKyValidation,
  validateRequest, 
  phieuDangKyController.createPhieuDangKy
);

/**
 * @route   PUT /api/phieu-dang-ky/:id/status
 * @desc    Update KTX application status (approve/reject)
 * @access  Private (Admin only)
 */
router.put('/:id/status', 
  authMiddleware, 
  updateStatusValidation,
  validateRequest, 
  phieuDangKyController.updatePhieuDangKyStatus
);

/**
 * @route   PUT /api/phieu-dang-ky/:id/cancel
 * @desc    Cancel KTX application
 * @access  Private (Student can cancel their own, Admin can cancel any)
 */
router.put('/:id/cancel', 
  authMiddleware, 
  cancelValidation,
  validateRequest, 
  phieuDangKyController.cancelPhieuDangKy
);

/**
 * @route   GET /api/phieu-dang-ky/available-rooms
 * @desc    Get available rooms for application approval
 * @access  Private (Admin only)
 */
router.get('/available-rooms', 
  authMiddleware, 
  availableRoomsValidation,
  validateRequest, 
  phieuDangKyController.getAvailableRoomsForApproval
);

module.exports = router;
