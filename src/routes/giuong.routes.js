const express = require('express');
const router = express.Router();
const giuongController = require('../controllers/giuong.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { validateRequest } = require('../middleware/validation.middleware');
const { body, param, query } = require('express-validator');

// Validation schemas
const createGiuongValidation = [
  body('id_phong')
    .notEmpty()
    .withMessage('ID phòng là bắt buộc')
    .isInt({ min: 1 })
    .withMessage('ID phòng phải là số nguyên dương'),
  body('so_giuong')
    .notEmpty()
    .withMessage('Số giường là bắt buộc')
    .trim()
    .isLength({ min: 1, max: 10 })
    .withMessage('Số giường phải có độ dài từ 1-10 ký tự'),
  body('trang_thai')
    .optional()
    .isIn(['available', 'occupied', 'maintenance'])
    .withMessage('Trạng thái không hợp lệ'),
  body('ghi_chu')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Ghi chú không được vượt quá 500 ký tự')
];

const updateGiuongValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID giường phải là số nguyên dương'),
  body('so_giuong')
    .optional()
    .trim()
    .isLength({ min: 1, max: 10 })
    .withMessage('Số giường phải có độ dài từ 1-10 ký tự'),
  body('trang_thai')
    .optional()
    .isIn(['available', 'occupied', 'maintenance'])
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

const roomIdValidation = [
  param('id_phong')
    .isInt({ min: 1 })
    .withMessage('ID phòng phải là số nguyên dương')
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
  query('id_phong')
    .optional()
    .isInt({ min: 1 })
    .withMessage('ID phòng phải là số nguyên dương'),
  query('trang_thai')
    .optional()
    .isIn(['available', 'occupied', 'maintenance'])
    .withMessage('Trạng thái không hợp lệ'),
  query('sort_order')
    .optional()
    .isIn(['ASC', 'DESC', 'asc', 'desc'])
    .withMessage('Thứ tự sắp xếp phải là ASC hoặc DESC')
];

// Routes

/**
 * @route   GET /api/giuong
 * @desc    Get all beds with pagination and filtering
 * @access  Private
 */
router.get('/', 
  authMiddleware, 
  queryValidation,
  validateRequest, 
  giuongController.getAllGiuong
);

/**
 * @route   GET /api/giuong/:id
 * @desc    Get bed by ID
 * @access  Private
 */
router.get('/:id', 
  authMiddleware, 
  idValidation,
  validateRequest, 
  giuongController.getGiuongById
);

/**
 * @route   POST /api/giuong
 * @desc    Create new bed
 * @access  Private (Admin only)
 */
router.post('/', 
  authMiddleware, 
  createGiuongValidation,
  validateRequest, 
  giuongController.createGiuong
);

/**
 * @route   PUT /api/giuong/:id
 * @desc    Update bed
 * @access  Private (Admin only)
 */
router.put('/:id', 
  authMiddleware, 
  updateGiuongValidation,
  validateRequest, 
  giuongController.updateGiuong
);

/**
 * @route   DELETE /api/giuong/:id
 * @desc    Delete bed (soft delete)
 * @access  Private (Admin only)
 */
router.delete('/:id', 
  authMiddleware, 
  idValidation,
  validateRequest, 
  giuongController.deleteGiuong
);

/**
 * @route   GET /api/giuong/phong/:id_phong/available
 * @desc    Get available beds in a room
 * @access  Private
 */
router.get('/phong/:id_phong/available', 
  authMiddleware, 
  roomIdValidation,
  validateRequest, 
  giuongController.getAvailableGiuongByRoom
);

module.exports = router;
