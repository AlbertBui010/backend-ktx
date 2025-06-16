const express = require("express");
const router = express.Router();
const sinhVienController = require("../controllers/sinhVien.controller");
const authMiddleware = require("../middleware/auth.middleware");
const { validateRequest } = require("../middleware/validation.middleware");
const { body, param, query } = require("express-validator");

// Validation schemas
const createSinhVienValidation = [
  body("mssv")
    .notEmpty()
    .withMessage("MSSV là bắt buộc")
    .trim()
    .isLength({ min: 5, max: 20 })
    .withMessage("MSSV phải có độ dài từ 5-20 ký tự")
    .matches(/^[A-Za-z0-9]+$/)
    .withMessage("MSSV chỉ được chứa chữ cái và số"),
  body("ho_ten")
    .notEmpty()
    .withMessage("Họ tên là bắt buộc")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Họ tên phải có độ dài từ 2-100 ký tự"),
  body("email")
    .notEmpty()
    .withMessage("Email là bắt buộc")
    .isEmail()
    .withMessage("Email không hợp lệ")
    .normalizeEmail(),
  body("sdt")
    .optional()
    .trim()
    .matches(/^[0-9]{10,15}$/)
    .withMessage("Số điện thoại phải có 10-15 chữ số"),
  body("gioi_tinh")
    .notEmpty()
    .withMessage("Giới tính là bắt buộc")
    .isIn(["male", "female"])
    .withMessage("Giới tính phải là male hoặc female"),
  body("ngay_sinh")
    .optional()
    .isISO8601()
    .withMessage("Ngày sinh phải có định dạng YYYY-MM-DD")
    .custom((value) => {
      const birthDate = new Date(value);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      if (age < 16 || age > 50) {
        throw new Error("Tuổi phải từ 16-50");
      }
      return true;
    }),
  body("cccd")
    .optional()
    .trim()
    .matches(/^[0-9]{12}$/)
    .withMessage("CCCD phải có 12 chữ số"),
  body("khoa")
    .notEmpty()
    .withMessage("Khoa là bắt buộc")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Tên khoa phải có độ dài từ 2-100 ký tự"),
  body("nganh")
    .notEmpty()
    .withMessage("Ngành là bắt buộc")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Tên ngành phải có độ dài từ 2-100 ký tự"),
  body("khoa_hoc")
    .notEmpty()
    .withMessage("Khóa học là bắt buộc")
    .trim()
    .matches(/^[0-9]{4}-[0-9]{4}$/)
    .withMessage("Khóa học phải có định dạng YYYY-YYYY"),
  body("phu_huynh").optional().isArray().withMessage("Thông tin phụ huynh phải là mảng"),
  body("phu_huynh.*.ho_ten")
    .if(body("phu_huynh").exists())
    .notEmpty()
    .withMessage("Họ tên phụ huynh là bắt buộc")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Họ tên phụ huynh phải có độ dài từ 2-100 ký tự"),
  body("phu_huynh.*.sdt")
    .if(body("phu_huynh").exists())
    .notEmpty()
    .withMessage("Số điện thoại phụ huynh là bắt buộc")
    .matches(/^[0-9]{10,15}$/)
    .withMessage("Số điện thoại phụ huynh phải có 10-15 chữ số"),
  body("phu_huynh.*.moi_quan_he")
    .if(body("phu_huynh").exists())
    .notEmpty()
    .withMessage("Mối quan hệ là bắt buộc")
    .isIn(["father", "mother", "guardian"])
    .withMessage("Mối quan hệ phải là father, mother hoặc guardian"),
];

const updateSinhVienValidation = [
  param("id").isInt({ min: 1 }).withMessage("ID sinh viên phải là số nguyên dương"),
  body("ho_ten").optional().trim().isLength({ min: 2, max: 100 }).withMessage("Họ tên phải có độ dài từ 2-100 ký tự"),
  body("email").optional().isEmail().withMessage("Email không hợp lệ").normalizeEmail(),
  body("sdt")
    .optional()
    .trim()
    .matches(/^[0-9]{10,15}$/)
    .withMessage("Số điện thoại phải có 10-15 chữ số"),
  body("ngay_sinh").optional().isISO8601().withMessage("Ngày sinh phải có định dạng YYYY-MM-DD"),
  body("cccd")
    .optional()
    .trim()
    .matches(/^[0-9]{12}$/)
    .withMessage("CCCD phải có 12 chữ số"),
  body("khoa").optional().trim().isLength({ min: 2, max: 100 }).withMessage("Tên khoa phải có độ dài từ 2-100 ký tự"),
  body("nganh").optional().trim().isLength({ min: 2, max: 100 }).withMessage("Tên ngành phải có độ dài từ 2-100 ký tự"),
  body("khoa_hoc")
    .optional()
    .trim()
    .matches(/^[0-9]{4}-[0-9]{4}$/)
    .withMessage("Khóa học phải có định dạng YYYY-YYYY"),
  body("trang_thai")
    .optional()
    .isIn(["active", "inactive", "graduated", "suspended"])
    .withMessage("Trạng thái không hợp lệ"),
];

const idValidation = [param("id").isInt({ min: 1 }).withMessage("ID phải là số nguyên dương")];

const mssvValidation = [
  param("mssv")
    .trim()
    .isLength({ min: 5, max: 20 })
    .withMessage("MSSV phải có độ dài từ 5-20 ký tự")
    .matches(/^[A-Za-z0-9]+$/)
    .withMessage("MSSV chỉ được chứa chữ cái và số"),
];

const queryValidation = [
  query("page").optional().isInt({ min: 1 }).withMessage("Trang phải là số nguyên dương"),
  query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("Giới hạn phải là số nguyên từ 1-100"),
  query("gioi_tinh").optional().isIn(["male", "female"]).withMessage("Giới tính phải là male hoặc female"),
  query("trang_thai")
    .optional()
    .isIn(["active", "inactive", "graduated", "suspended"])
    .withMessage("Trạng thái không hợp lệ"),
  query("sort_order")
    .optional()
    .isIn(["ASC", "DESC", "asc", "desc"])
    .withMessage("Thứ tự sắp xếp phải là ASC hoặc DESC"),
];

// Routes

/**
 * @route   GET /api/sinh-vien
 * @desc    Get all students with pagination and filtering
 * @access  Private
 */
router.get("/", authMiddleware, queryValidation, validateRequest, sinhVienController.getAllSinhVien);

/**
 * @route   GET /api/sinh-vien/:id
 * @desc    Get student by ID
 * @access  Private
 */
router.get("/:id", authMiddleware, idValidation, validateRequest, sinhVienController.getSinhVienById);

/**
 * @route   GET /api/sinh-vien/mssv/:mssv
 * @desc    Get student by MSSV
 * @access  Private
 */
router.get("/mssv/:mssv", authMiddleware, mssvValidation, validateRequest, sinhVienController.getSinhVienByMSSV);

/**
 * @route   POST /api/sinh-vien
 * @desc    Create new student
 * @access  Private (Admin only)
 */
router.post("/", authMiddleware, createSinhVienValidation, validateRequest, sinhVienController.createSinhVien);

/**
 * @route   PUT /api/sinh-vien/:id
 * @desc    Update student
 * @access  Private (Admin only)
 */
router.put("/:id", authMiddleware, updateSinhVienValidation, validateRequest, sinhVienController.updateSinhVien);

/**
 * @route   DELETE /api/sinh-vien/:id
 * @desc    Delete student (soft delete)
 * @access  Private (Admin only)
 */
router.delete("/:id", authMiddleware, idValidation, validateRequest, sinhVienController.deleteSinhVien);

/**
 * @route   GET /api/sinh-vien/:id/room-history
 * @desc    Get student's room assignment history
 * @access  Private
 */
router.get(
  "/:id/room-history",
  authMiddleware,
  idValidation,
  validateRequest,
  sinhVienController.getSinhVienRoomHistory,
);

module.exports = router;
