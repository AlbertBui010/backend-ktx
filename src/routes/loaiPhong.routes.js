const express = require('express');
const router = express.Router();
const loaiPhongController = require('../controllers/loaiPhong.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { validateRequest } = require('../middleware/validation.middleware');
const { body, param, query } = require('express-validator');

// Validation schemas
const createLoaiPhongValidation = [
  body('ten_loai')
    .notEmpty()
    .withMessage('Tên loại phòng là bắt buộc')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Tên loại phòng phải có độ dài từ 2-100 ký tự'),
  body('gia_thue')
    .notEmpty()
    .withMessage('Giá thuê là bắt buộc')
    .isFloat({ min: 0 })
    .withMessage('Giá thuê phải là số dương'),
  body('mo_ta')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Mô tả không được vượt quá 500 ký tự'),
  body('trang_thai')
    .optional()
    .isIn(['active', 'inactive'])
    .withMessage('Trạng thái phải là active hoặc inactive')
];

const updateLoaiPhongValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID loại phòng phải là số nguyên dương'),
  body('ten_loai')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Tên loại phòng phải có độ dài từ 2-100 ký tự'),
  body('gia_thue')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Giá thuê phải là số dương'),
  body('mo_ta')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Mô tả không được vượt quá 500 ký tự'),
  body('trang_thai')
    .optional()
    .isIn(['active', 'inactive'])
    .withMessage('Trạng thái phải là active hoặc inactive')
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
    .isIn(['active', 'inactive'])
    .withMessage('Trạng thái phải là active hoặc inactive'),
  query('sort_order')
    .optional()
    .isIn(['ASC', 'DESC', 'asc', 'desc'])
    .withMessage('Thứ tự sắp xếp phải là ASC hoặc DESC')
];

// Routes

/**
 * @route   GET /api/loai-phong
 * @desc    Get all room types with pagination and filtering
 * @access  Private
 */
router.get('/', 
  authMiddleware, 
  queryValidation,
  validateRequest, 
  loaiPhongController.getAllLoaiPhong
);

/**
 * @route   GET /api/loai-phong/:id
 * @desc    Get room type by ID
 * @access  Private
 */
router.get('/:id', 
  authMiddleware, 
  idValidation,
  validateRequest, 
  loaiPhongController.getLoaiPhongById
);

/**
 * @route   POST /api/loai-phong
 * @desc    Create new room type
 * @access  Private (Admin only)
 */
router.post('/', 
  authMiddleware, 
  createLoaiPhongValidation,
  validateRequest, 
  loaiPhongController.createLoaiPhong
);

/**
 * @route   PUT /api/loai-phong/:id
 * @desc    Update room type
 * @access  Private (Admin only)
 */
router.put('/:id', 
  authMiddleware, 
  updateLoaiPhongValidation,
  validateRequest, 
  loaiPhongController.updateLoaiPhong
);

/**
 * @route   DELETE /api/loai-phong/:id
 * @desc    Delete room type (soft delete)
 * @access  Private (Admin only)
 */
router.delete('/:id', 
  authMiddleware, 
  idValidation,
  validateRequest, 
  loaiPhongController.deleteLoaiPhong
);

module.exports = router;
