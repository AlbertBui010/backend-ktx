const express = require('express');
const router = express.Router();
const phongController = require('../controllers/phong.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { validateRequest } = require('../middleware/validation.middleware');
const { body, param, query } = require('express-validator');

// Validation schemas
const createPhongValidation = [
  body('ten_phong')
    .notEmpty()
    .withMessage('Tên phòng là bắt buộc')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Tên phòng phải có độ dài từ 1-50 ký tự'),
  body('id_loai_phong')
    .notEmpty()
    .withMessage('ID loại phòng là bắt buộc')
    .isInt({ min: 1 })
    .withMessage('ID loại phòng phải là số nguyên dương'),
  body('tang')
    .notEmpty()
    .withMessage('Tầng là bắt buộc')
    .isInt({ min: 1, max: 50 })
    .withMessage('Tầng phải là số nguyên từ 1-50'),
  body('sl_max')
    .notEmpty()
    .withMessage('Số lượng tối đa là bắt buộc')
    .isInt({ min: 1, max: 20 })
    .withMessage('Số lượng tối đa phải là số nguyên từ 1-20'),
  body('gioi_tinh')
    .optional()
    .isIn(['male', 'female'])
    .withMessage('Giới tính phải là male hoặc female'),
  body('trang_thai')
    .optional()
    .isIn(['available', 'partially_occupied', 'full', 'maintenance', 'unavailable'])
    .withMessage('Trạng thái không hợp lệ'),
  body('ghi_chu')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Ghi chú không được vượt quá 500 ký tự')
];

const updatePhongValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID phòng phải là số nguyên dương'),
  body('ten_phong')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Tên phòng phải có độ dài từ 1-50 ký tự'),
  body('tang')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Tầng phải là số nguyên từ 1-50'),
  body('sl_max')
    .optional()
    .isInt({ min: 1, max: 20 })
    .withMessage('Số lượng tối đa phải là số nguyên từ 1-20'),
  body('gioi_tinh')
    .optional()
    .isIn(['male', 'female'])
    .withMessage('Giới tính phải là male hoặc female'),
  body('trang_thai')
    .optional()
    .isIn(['available', 'partially_occupied', 'full', 'maintenance', 'unavailable'])
    .withMessage('Trạng thái không hợp lệ'),
  body('ghi_chu')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Ghi chú không được vượt quá 500 ký tự')
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
  query('id_loai_phong')
    .optional()
    .isInt({ min: 1 })
    .withMessage('ID loại phòng phải là số nguyên dương'),
  query('tang')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Tầng phải là số nguyên dương'),
  query('gioi_tinh')
    .optional()
    .isIn(['male', 'female'])
    .withMessage('Giới tính phải là male hoặc female'),
  query('trang_thai')
    .optional()
    .isIn(['available', 'partially_occupied', 'full', 'maintenance', 'unavailable'])
    .withMessage('Trạng thái không hợp lệ'),
  query('sort_order')
    .optional()
    .isIn(['ASC', 'DESC', 'asc', 'desc'])
    .withMessage('Thứ tự sắp xếp phải là ASC hoặc DESC')
];

const availabilityValidation = [
  query('id_loai_phong')
    .optional()
    .isInt({ min: 1 })
    .withMessage('ID loại phòng phải là số nguyên dương'),
  query('gioi_tinh')
    .optional()
    .isIn(['male', 'female'])
    .withMessage('Giới tính phải là male hoặc female')
];

// Routes

/**
 * @route   GET /api/phong
 * @desc    Get all rooms with pagination and filtering
 * @access  Private
 */
router.get('/', 
  authMiddleware, 
  queryValidation,
  validateRequest, 
  phongController.getAllPhong
);

/**
 * @route   GET /api/phong/:id
 * @desc    Get room by ID
 * @access  Private
 */
router.get('/:id', 
  authMiddleware, 
  idValidation,
  validateRequest, 
  phongController.getPhongById
);

/**
 * @route   POST /api/phong
 * @desc    Create new room
 * @access  Private (Admin only)
 */
router.post('/', 
  authMiddleware, 
  createPhongValidation,
  validateRequest, 
  phongController.createPhong
);

/**
 * @route   PUT /api/phong/:id
 * @desc    Update room
 * @access  Private (Admin only)
 */
router.put('/:id', 
  authMiddleware, 
  updatePhongValidation,
  validateRequest, 
  phongController.updatePhong
);

/**
 * @route   DELETE /api/phong/:id
 * @desc    Delete room (soft delete)
 * @access  Private (Admin only)
 */
router.delete('/:id', 
  authMiddleware, 
  idValidation,
  validateRequest, 
  phongController.deletePhong
);

/**
 * @route   GET /api/phong/available
 * @desc    Get available rooms
 * @access  Private
 */
router.get('/available', 
  authMiddleware, 
  availabilityValidation,
  validateRequest, 
  phongController.getAvailablePhong
);

/**
 * @route   GET /api/phong/:id/availability
 * @desc    Check room availability
 * @access  Private
 */
router.get('/:id/availability', 
  authMiddleware, 
  idValidation,
  validateRequest, 
  phongController.checkPhongAvailability
);

module.exports = router;
