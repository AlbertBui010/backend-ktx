import express from "express";
import { electricityController } from "../controllers/electricity.controller.js";
import { authenticateToken, requireAdmin } from "../middleware/auth.middleware.js";
import { validationMiddleware } from "../middleware/validation.middleware.js";
import { body, param, query } from "express-validator";
import { Op } from "sequelize";
import { HdTienDien } from "../models/index.js";

const router = express.Router();

// ===== VALIDATION SCHEMAS =====

// Validation cho tạo đơn giá điện
const createElectricityRateValidation = [
  body("don_gia")
    .notEmpty()
    .withMessage("Đơn giá điện là bắt buộc")
    .isNumeric()
    .withMessage("Đơn giá điện phải là số")
    .custom((value) => {
      if (parseFloat(value) <= 0) {
        throw new Error("Đơn giá điện phải lớn hơn 0");
      }
      return true;
    }),
  body("tu_ngay")
    .notEmpty()
    .withMessage("Ngày bắt đầu là bắt buộc")
    .isISO8601()
    .withMessage("Ngày bắt đầu phải có định dạng YYYY-MM-DD"),
  body("den_ngay")
    .optional()
    .isISO8601()
    .withMessage("Ngày kết thúc phải có định dạng YYYY-MM-DD")
    .custom((value, { req }) => {
      if (value && new Date(value) <= new Date(req.body.tu_ngay)) {
        throw new Error("Ngày kết thúc phải sau ngày bắt đầu");
      }
      return true;
    }),
  body("ghi_chu").optional().trim().isLength({ max: 500 }).withMessage("Ghi chú không được vượt quá 500 ký tự"),
];

// Validation cho tạo hóa đơn tiền điện phòng
const createRoomElectricityBillValidation = [
  body("id_phong")
    .notEmpty()
    .withMessage("ID phòng là bắt buộc")
    .isInt({ min: 1 })
    .withMessage("ID phòng phải là số nguyên dương"),
  body("tu_ngay")
    .notEmpty()
    .withMessage("Ngày bắt đầu là bắt buộc")
    .isISO8601()
    .withMessage("Ngày bắt đầu phải có định dạng YYYY-MM-DD"),
  body("den_ngay")
    .notEmpty()
    .withMessage("Ngày kết thúc là bắt buộc")
    .isISO8601()
    .withMessage("Ngày kết thúc phải có định dạng YYYY-MM-DD")
    .custom((value, { req }) => {
      if (new Date(value) <= new Date(req.body.tu_ngay)) {
        throw new Error("Ngày kết thúc phải sau ngày bắt đầu");
      }
      return true;
    }),
  body("so_dien_cu")
    .notEmpty()
    .withMessage("Số điện cũ là bắt buộc")
    .isInt({ min: 0 })
    .withMessage("Số điện cũ phải là số nguyên không âm"),
  body("so_dien_moi")
    .notEmpty()
    .withMessage("Số điện mới là bắt buộc")
    .isInt({ min: 0 })
    .withMessage("Số điện mới phải là số nguyên không âm")
    .custom((value, { req }) => {
      if (parseInt(value) <= parseInt(req.body.so_dien_cu)) {
        throw new Error("Số điện mới phải lớn hơn số điện cũ");
      }
      return true;
    }),
  body("ghi_chu").optional().trim().isLength({ max: 500 }).withMessage("Ghi chú không được vượt quá 500 ký tự"),
];

// Validation cho thanh toán
const paymentValidation = [
  param("id").isInt({ min: 1 }).withMessage("ID hóa đơn phải là số nguyên dương"),
  body("so_tien_thanh_toan")
    .notEmpty()
    .withMessage("Số tiền thanh toán là bắt buộc")
    .isNumeric()
    .withMessage("Số tiền thanh toán phải là số")
    .custom((value) => {
      if (parseFloat(value) <= 0) {
        throw new Error("Số tiền thanh toán phải lớn hơn 0");
      }
      return true;
    }),
  body("phuong_thuc_thanh_toan")
    .notEmpty()
    .withMessage("Phương thức thanh toán là bắt buộc")
    .isIn(["cash", "bank_transfer", "digital_wallet", "credit_card", "other"])
    .withMessage("Phương thức thanh toán không hợp lệ"),
  body("ma_giao_dich")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Mã giao dịch không được vượt quá 100 ký tự"),
  body("ghi_chu").optional().trim().isLength({ max: 500 }).withMessage("Ghi chú không được vượt quá 500 ký tự"),
];

// Validation chung cho ID
const idValidation = [param("id").isInt({ min: 1 }).withMessage("ID phải là số nguyên dương")];

// Validation cho query parameters
const paginationValidation = [
  query("page").optional().isInt({ min: 1 }).withMessage("Trang phải là số nguyên dương"),
  query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("Giới hạn phải là số nguyên từ 1-100"),
];

const statisticsValidation = [
  query("month").optional().isInt({ min: 1, max: 12 }).withMessage("Tháng phải là số từ 1-12"),
  query("year").optional().isInt({ min: 2020, max: 2100 }).withMessage("Năm phải trong khoảng 2020-2100"),
];

// Validation để ngăn tạo trùng hóa đơn phòng trong cùng kỳ
const duplicateRoomBillValidation = [
  body("id_phong").custom(async (value, { req }) => {
    const { tu_ngay, den_ngay } = req.body;

    const existingBill = await HdTienDien.findOne({
      where: {
        id_phong: value,
        dang_hien: true,
        [Op.or]: [
          {
            tu_ngay: { [Op.between]: [tu_ngay, den_ngay] },
          },
          {
            den_ngay: { [Op.between]: [tu_ngay, den_ngay] },
          },
          {
            [Op.and]: [{ tu_ngay: { [Op.lte]: tu_ngay } }, { den_ngay: { [Op.gte]: den_ngay } }],
          },
        ],
      },
    });

    if (existingBill) {
      throw new Error("Đã có hóa đơn điện cho phòng này trong khoảng thời gian trùng lặp");
    }
    return true;
  }),
];

// Validation ngăn chỉnh sửa hóa đơn đã finalized
const preventFinalizedEditValidation = [
  param("id").custom(async (value) => {
    const bill = await HdTienDien.findByPk(value);
    if (bill && bill.trang_thai === "finalized") {
      throw new Error("Không thể chỉnh sửa hóa đơn đã hoàn thiện");
    }
    return true;
  }),
];

// ===== ĐỔN GIÁ ĐIỆN ROUTES =====

/**
 * @route   POST /api/electricity/rates
 * @desc    Tạo đơn giá điện mới
 * @access  Private (Admin only)
 */
router.post(
  "/rates",
  authenticateToken,
  createElectricityRateValidation,
  validationMiddleware,
  electricityController.createElectricityRate,
);

/**
 * @route   GET /api/electricity/rates
 * @desc    Lấy danh sách đơn giá điện
 * @access  Private
 */
router.get(
  "/rates",
  authenticateToken,
  paginationValidation,
  validationMiddleware,
  electricityController.getElectricityRates,
);

// ===== HÓA ĐƠN TIỀN ĐIỆN PHÒNG ROUTES =====

/**
 * @route   POST /api/electricity/room-bills
 * @desc    Tạo hóa đơn tiền điện cho phòng
 * @access  Private (Admin only)
 */
router.post(
  "/room-bills",
  authenticateToken,
  createRoomElectricityBillValidation,
  duplicateRoomBillValidation,
  validationMiddleware,
  electricityController.createRoomElectricityBill,
);

/**
 * @route   GET /api/electricity/room-bills
 * @desc    Lấy danh sách hóa đơn tiền điện phòng
 * @access  Private
 */
router.get(
  "/room-bills",
  authenticateToken,
  paginationValidation,
  [
    query("id_phong").optional().isInt({ min: 1 }).withMessage("ID phòng phải là số nguyên dương"),
    query("trang_thai")
      .optional()
      .isIn(["draft", "calculated", "finalized", "cancelled"])
      .withMessage("Trạng thái không hợp lệ"),
    query("tu_ngay").optional().isISO8601().withMessage("Ngày bắt đầu phải có định dạng YYYY-MM-DD"),
    query("den_ngay").optional().isISO8601().withMessage("Ngày kết thúc phải có định dạng YYYY-MM-DD"),
  ],
  validationMiddleware,
  electricityController.getRoomElectricityBills,
);

/**
 * @route   POST /api/electricity/room-bills/:id/calculate
 * @desc    Tính tiền điện cho sinh viên trong phòng
 * @access  Private (Admin only)
 */
router.post(
  "/room-bills/:id/calculate",
  authenticateToken,
  idValidation,
  validationMiddleware,
  electricityController.calculateStudentBills,
);

/**
 * @route   PUT /api/electricity/room-bills/:id/finalize
 * @desc    Hoàn thiện hóa đơn tiền điện (không thể sửa được nữa)
 * @access  Private (Admin only)
 */
router.put(
  "/room-bills/:id/finalize",
  authenticateToken,
  idValidation,
  validationMiddleware,
  electricityController.finalizeElectricityBill,
);

// ===== HÓA ĐƠN TIỀN ĐIỆN SINH VIÊN ROUTES =====

/**
 * @route   GET /api/electricity/student-bills
 * @desc    Lấy hóa đơn tiền điện của sinh viên
 * @access  Private
 */
router.get(
  "/student-bills",
  authenticateToken,
  paginationValidation,
  [
    query("sinh_vien_id").optional().isInt({ min: 1 }).withMessage("ID sinh viên phải là số nguyên dương"),
    query("trang_thai")
      .optional()
      .isIn(["unpaid", "paid", "partial_paid", "overdue", "cancelled"])
      .withMessage("Trạng thái thanh toán không hợp lệ"),
    query("month").optional().isInt({ min: 1, max: 12 }).withMessage("Tháng phải là số từ 1-12"),
    query("year").optional().isInt({ min: 2020, max: 2100 }).withMessage("Năm phải trong khoảng 2020-2100"),
  ],
  validationMiddleware,
  electricityController.getStudentElectricityBills,
);

/**
 * @route   PUT /api/electricity/student-bills/:id/payment
 * @desc    Thanh toán tiền điện
 * @access  Private
 */
router.put(
  "/student-bills/:id/payment",
  authenticateToken,
  paymentValidation,
  validationMiddleware,
  electricityController.payElectricityBill,
);

// ===== THỐNG KÊ ROUTES =====

/**
 * @route   GET /api/electricity/statistics
 * @desc    Thống kê tiền điện
 * @access  Private (Admin only)
 */
router.get("/statistics", authenticateToken, requireAdmin, electricityController.getElectricityStatistics);

// ===== CÁC ROUTE BỔ SUNG CẦN THIẾT =====

/**
 * @route   PUT /api/electricity/room-bills/:id
 * @desc    Cập nhật hóa đơn tiền điện phòng (chỉ khi draft)
 * @access  Private (Admin only)
 */
router.put(
  "/room-bills/:id",
  authenticateToken,
  requireAdmin,
  preventFinalizedEditValidation,
  createRoomElectricityBillValidation,
  validationMiddleware,
  electricityController.updateRoomElectricityBill,
);

/**
 * @route   DELETE /api/electricity/room-bills/:id
 * @desc    Xóa hóa đơn tiền điện phòng (chỉ khi draft)
 * @access  Private (Admin only)
 */
router.delete(
  "/room-bills/:id",
  authenticateToken,
  requireAdmin,
  preventFinalizedEditValidation,
  idValidation,
  validationMiddleware,
  electricityController.deleteRoomElectricityBill,
);

/**
 * @route   POST /api/electricity/bulk-create
 * @desc    Tạo hóa đơn điện hàng loạt cho nhiều phòng
 * @access  Private (Admin only)
 */
router.post(
  "/bulk-create",
  authenticateToken,
  requireAdmin,
  [
    body("bills").isArray().withMessage("Bills phải là mảng"),
    body("bills.*.id_phong").isInt({ min: 1 }).withMessage("ID phòng phải là số nguyên dương"),
    body("bills.*.tu_ngay").isISO8601().withMessage("Ngày bắt đầu phải có định dạng YYYY-MM-DD"),
    body("bills.*.den_ngay").isISO8601().withMessage("Ngày kết thúc phải có định dạng YYYY-MM-DD"),
    body("bills.*.so_dien_cu").isInt({ min: 0 }).withMessage("Số điện cũ phải là số nguyên không âm"),
    body("bills.*.so_dien_moi").isInt({ min: 0 }).withMessage("Số điện mới phải là số nguyên không âm"),
  ],
  validationMiddleware,
  electricityController.bulkCreateRoomBills,
);

/**
 * @route   GET /api/electricity/room-bills/:id/preview
 * @desc    Preview tính toán tiền điện sinh viên (không lưu vào DB)
 * @access  Private (Admin only)
 */
router.get(
  "/room-bills/:id/preview",
  authenticateToken,
  requireAdmin,
  idValidation,
  validationMiddleware,
  electricityController.previewStudentCalculation,
);

/**
 * @route   PUT /api/electricity/student-bills/:id/cancel
 * @desc    Hủy hóa đơn sinh viên
 * @access  Private (Admin only)
 */
router.put(
  "/student-bills/:id/cancel",
  authenticateToken,
  requireAdmin,
  idValidation,
  validationMiddleware,
  electricityController.cancelStudentBill,
);

/**
 * @route   GET /api/electricity/export/excel
 * @desc    Xuất báo cáo Excel
 * @access  Private (Admin only)
 */
router.get(
  "/export/excel",
  authenticateToken,
  requireAdmin,
  [
    query("month").optional().isInt({ min: 1, max: 12 }).withMessage("Tháng phải là số từ 1-12"),
    query("year").optional().isInt({ min: 2020, max: 2100 }).withMessage("Năm phải trong khoảng 2020-2100"),
    query("id_phong").optional().isInt({ min: 1 }).withMessage("ID phòng phải là số nguyên dương"),
  ],
  validationMiddleware,
  electricityController.exportExcel,
);

export default router;
