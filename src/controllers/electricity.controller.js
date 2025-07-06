import { Op, fn, col, literal } from "sequelize";
import { DonGiaDien, HdTienDien, HdTienDienSinhVien, Phong, SinhVien, PhanBoPhong } from "../models/index.js";
import { successResponse, errorResponse } from "../utils/response.util.js";
import { electricityUtils } from "../utils/electricity.util.js";
import { exportUtils } from "../utils/export.util.js";
import {
  COLUMNS,
  ENUM_HD_TIEN_DIEN_TRANG_THAI,
  ENUM_HD_TIEN_DIEN_SV_TRANG_THAI,
} from "../constants/database.constants.js";

export const electricityController = {
  // ===== ĐỔN GIÁ ĐIỆN MANAGEMENT =====

  /**
   * Tạo đơn giá điện mới
   */
  createElectricityRate: async (req, res) => {
    try {
      const { don_gia, tu_ngay, den_ngay, ghi_chu } = req.body;

      // Kiểm tra trùng lặp thời gian
      const existingRate = await DonGiaDien.findOne({
        where: {
          [COLUMNS.COMMON.DANG_HIEN]: true,
          [Op.or]: [
            {
              [Op.and]: [
                { [COLUMNS.DON_GIA_DIEN.TU_NGAY]: { [Op.lte]: tu_ngay } },
                {
                  [Op.or]: [
                    { [COLUMNS.DON_GIA_DIEN.DEN_NGAY]: { [Op.gte]: tu_ngay } },
                    { [COLUMNS.DON_GIA_DIEN.DEN_NGAY]: null },
                  ],
                },
              ],
            },
            ...(den_ngay
              ? [
                  {
                    [Op.and]: [
                      { [COLUMNS.DON_GIA_DIEN.TU_NGAY]: { [Op.lte]: den_ngay } },
                      {
                        [Op.or]: [
                          { [COLUMNS.DON_GIA_DIEN.DEN_NGAY]: { [Op.gte]: den_ngay } },
                          { [COLUMNS.DON_GIA_DIEN.DEN_NGAY]: null },
                        ],
                      },
                    ],
                  },
                ]
              : []),
          ],
        },
      });

      if (existingRate) {
        return errorResponse(res, 400, "Đã có đơn giá điện trong khoảng thời gian này");
      }

      const newRate = await DonGiaDien.create({
        [COLUMNS.DON_GIA_DIEN.DON_GIA]: don_gia,
        [COLUMNS.DON_GIA_DIEN.TU_NGAY]: tu_ngay,
        [COLUMNS.DON_GIA_DIEN.DEN_NGAY]: den_ngay,
        [COLUMNS.DON_GIA_DIEN.GHI_CHU]: ghi_chu,
        [COLUMNS.COMMON.NGUOI_TAO]: req.user?.id,
      });

      return successResponse(res, newRate, null, 201);
    } catch (error) {
      return errorResponse(res, 500, "Không thể tạo đơn giá điện", error.message);
    }
  },

  /**
   * Lấy danh sách đơn giá điện
   */
  getElectricityRates: async (req, res) => {
    try {
      const { page = 1, limit = 10, active_only = false } = req.query;
      const offset = (page - 1) * limit;

      const whereClause = {
        [COLUMNS.COMMON.DANG_HIEN]: true,
      };

      if (active_only === "true") {
        const today = new Date();
        whereClause[COLUMNS.DON_GIA_DIEN.TU_NGAY] = { [Op.lte]: today };
        whereClause[Op.or] = [
          { [COLUMNS.DON_GIA_DIEN.DEN_NGAY]: { [Op.gte]: today } },
          { [COLUMNS.DON_GIA_DIEN.DEN_NGAY]: null },
        ];
      }

      const { count, rows } = await DonGiaDien.findAndCountAll({
        where: whereClause,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [[COLUMNS.DON_GIA_DIEN.TU_NGAY, "DESC"]],
      });

      const meta = {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit),
      };

      return successResponse(res, rows, meta);
    } catch (error) {
      return errorResponse(res, 500, "Không thể lấy danh sách đơn giá điện", error.message);
    }
  },

  // ===== HÓA ĐƠN TIỀN ĐIỆN PHÒNG =====

  /**
   * Tạo hóa đơn tiền điện cho phòng
   */
  createRoomElectricityBill: async (req, res) => {
    try {
      const { id_phong, tu_ngay, den_ngay, so_dien_cu, so_dien_moi, ghi_chu } = req.body;

      // Kiểm tra phòng tồn tại
      const room = await Phong.findByPk(id_phong);
      if (!room) {
        return errorResponse(res, 404, "Phòng không tồn tại");
      }

      // Kiểm tra hóa đơn trùng lặp
      const existingBill = await HdTienDien.findOne({
        where: {
          [COLUMNS.HD_TIEN_DIEN.ID_PHONG]: id_phong,
          [COLUMNS.HD_TIEN_DIEN.TU_NGAY]: tu_ngay,
          [COLUMNS.HD_TIEN_DIEN.DEN_NGAY]: den_ngay,
          [COLUMNS.COMMON.DANG_HIEN]: true,
        },
      });

      if (existingBill) {
        return errorResponse(res, 400, "Đã có hóa đơn tiền điện cho phòng trong khoảng thời gian này");
      }

      // Validate số điện
      if (so_dien_moi <= so_dien_cu) {
        return errorResponse(res, 400, "Số điện mới phải lớn hơn số điện cũ");
      }

      // Lấy đơn giá điện
      const electricityRate = await electricityUtils.getElectricityRateAtDate(tu_ngay);
      if (!electricityRate) {
        return errorResponse(res, 400, "Không tìm thấy đơn giá điện phù hợp");
      }

      const newBill = await HdTienDien.create({
        [COLUMNS.HD_TIEN_DIEN.ID_PHONG]: id_phong,
        [COLUMNS.HD_TIEN_DIEN.TU_NGAY]: tu_ngay,
        [COLUMNS.HD_TIEN_DIEN.DEN_NGAY]: den_ngay,
        [COLUMNS.HD_TIEN_DIEN.SO_DIEN_CU]: so_dien_cu,
        [COLUMNS.HD_TIEN_DIEN.SO_DIEN_MOI]: so_dien_moi,
        [COLUMNS.HD_TIEN_DIEN.ID_DON_GIA_DIEN]: electricityRate.id,
        [COLUMNS.HD_TIEN_DIEN.GHI_CHU]: ghi_chu,
        [COLUMNS.COMMON.NGUOI_TAO]: req.user?.id,
      });

      // Lấy thông tin chi tiết
      const billWithDetails = await HdTienDien.findByPk(newBill.id, {
        include: [
          {
            model: Phong,
            as: "Room",
            attributes: ["id", "ten_phong"],
          },
          {
            model: DonGiaDien,
            as: "ElectricityRate",
          },
        ],
      });

      return successResponse(res, billWithDetails, null, 201);
    } catch (error) {
      return errorResponse(res, 500, "Không thể tạo hóa đơn tiền điện", error.message);
    }
  },

  /**
   * Tính tiền điện cho sinh viên trong phòng
   */
  calculateStudentBills: async (req, res) => {
    try {
      const { id } = req.params;

      const result = await electricityUtils.calculateRoomElectricityBills(parseInt(id), req.user?.id);

      return successResponse(res, result);
    } catch (error) {
      return errorResponse(res, 500, "Không thể tính tiền điện cho sinh viên", error.message);
    }
  },

  /**
   * Lấy danh sách hóa đơn tiền điện phòng
   */
  getRoomElectricityBills: async (req, res) => {
    try {
      const { page = 1, limit = 10, id_phong, trang_thai, tu_ngay, den_ngay } = req.query;
      const offset = (page - 1) * limit;

      const whereClause = {
        [COLUMNS.COMMON.DANG_HIEN]: true,
      };

      if (id_phong) {
        whereClause[COLUMNS.HD_TIEN_DIEN.ID_PHONG] = id_phong;
      }

      if (trang_thai) {
        whereClause[COLUMNS.HD_TIEN_DIEN.TRANG_THAI] = trang_thai;
      }

      if (tu_ngay) {
        whereClause[COLUMNS.HD_TIEN_DIEN.TU_NGAY] = { [Op.gte]: tu_ngay };
      }

      if (den_ngay) {
        whereClause[COLUMNS.HD_TIEN_DIEN.DEN_NGAY] = { [Op.lte]: den_ngay };
      }

      const { count, rows } = await HdTienDien.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: Phong,
            as: "Room",
            attributes: ["id", "ten_phong"],
          },
          {
            model: DonGiaDien,
            as: "ElectricityRate",
            attributes: ["don_gia"],
          },
        ],
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [[COLUMNS.HD_TIEN_DIEN.TU_NGAY, "DESC"]],
      });

      const meta = {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit),
      };

      return successResponse(res, rows, meta);
    } catch (error) {
      return errorResponse(res, 500, "Không thể lấy danh sách hóa đơn tiền điện", error.message);
    }
  },

  /**
   * Hoàn thiện hóa đơn tiền điện (không thể sửa được nữa)
   */
  finalizeElectricityBill: async (req, res) => {
    try {
      const { id } = req.params;

      const bill = await HdTienDien.findOne({
        where: {
          [COLUMNS.COMMON.ID]: id,
          [COLUMNS.COMMON.DANG_HIEN]: true,
        },
      });

      if (!bill) {
        return errorResponse(res, 404, "Hóa đơn không tồn tại");
      }

      if (bill[COLUMNS.HD_TIEN_DIEN.TRANG_THAI] !== ENUM_HD_TIEN_DIEN_TRANG_THAI.CALCULATED) {
        return errorResponse(res, 400, "Hóa đơn phải được tính toán trước khi hoàn thiện");
      }

      await bill.update({
        [COLUMNS.HD_TIEN_DIEN.TRANG_THAI]: ENUM_HD_TIEN_DIEN_TRANG_THAI.FINALIZED,
        [COLUMNS.COMMON.NGUOI_CAP_NHAT]: req.user?.id,
      });

      return successResponse(res, { message: "Hóa đơn đã được hoàn thiện" });
    } catch (error) {
      return errorResponse(res, 500, "Không thể hoàn thiện hóa đơn", error.message);
    }
  },

  // ===== HÓA ĐƠN TIỀN ĐIỆN SINH VIÊN =====

  /**
   * Lấy hóa đơn tiền điện của sinh viên
   */
  getStudentElectricityBills: async (req, res) => {
    try {
      const { page = 1, limit = 10, sinh_vien_id, trang_thai, month, year } = req.query;
      const offset = (page - 1) * limit;

      const whereClause = {
        [COLUMNS.COMMON.DANG_HIEN]: true,
      };

      if (sinh_vien_id) {
        whereClause[COLUMNS.HD_TIEN_DIEN_SINH_VIEN.ID_SINH_VIEN] = sinh_vien_id;
      }

      if (trang_thai) {
        whereClause[COLUMNS.HD_TIEN_DIEN_SINH_VIEN.TRANG_THAI_THANH_TOAN] = trang_thai;
      }

      const includeClause = [
        {
          model: SinhVien,
          as: "Student",
          attributes: ["id", "mssv", "ten"],
        },
        {
          model: HdTienDien,
          as: "ElectricityBill",
          include: [
            {
              model: Phong,
              as: "Room",
              attributes: ["id", "ten_phong"],
            },
          ],
        },
        {
          model: PhanBoPhong,
          as: "RoomAllocation",
          attributes: ["ngay_bat_dau", "ngay_ket_thuc"],
        },
      ];

      // Lọc theo tháng/năm nếu có
      if (month || year) {
        const billWhere = {};
        if (month && year) {
          const startDate = new Date(year, month - 1, 1);
          const endDate = new Date(year, month, 0);
          billWhere[COLUMNS.HD_TIEN_DIEN.TU_NGAY] = { [Op.gte]: startDate };
          billWhere[COLUMNS.HD_TIEN_DIEN.DEN_NGAY] = { [Op.lte]: endDate };
        } else if (year) {
          const startDate = new Date(year, 0, 1);
          const endDate = new Date(year, 11, 31);
          billWhere[COLUMNS.HD_TIEN_DIEN.TU_NGAY] = { [Op.gte]: startDate };
          billWhere[COLUMNS.HD_TIEN_DIEN.DEN_NGAY] = { [Op.lte]: endDate };
        }

        includeClause[1].where = billWhere;
      }

      const { count, rows } = await HdTienDienSinhVien.findAndCountAll({
        where: whereClause,
        include: includeClause,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [[{ model: HdTienDien, as: "ElectricityBill" }, COLUMNS.HD_TIEN_DIEN.TU_NGAY, "DESC"]],
      });

      const meta = {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit),
      };

      return successResponse(res, rows, meta);
    } catch (error) {
      return errorResponse(res, 500, "Không thể lấy hóa đơn tiền điện sinh viên", error.message);
    }
  },

  /**
   * Thanh toán tiền điện
   */
  payElectricityBill: async (req, res) => {
    try {
      const { id } = req.params;
      const { so_tien_thanh_toan, phuong_thuc_thanh_toan, ma_giao_dich, ghi_chu } = req.body;

      const bill = await HdTienDienSinhVien.findOne({
        where: {
          [COLUMNS.COMMON.ID]: id,
          [COLUMNS.COMMON.DANG_HIEN]: true,
        },
      });

      if (!bill) {
        return errorResponse(res, 404, "Hóa đơn không tồn tại");
      }

      const soTienDaTra = parseFloat(bill[COLUMNS.HD_TIEN_DIEN_SINH_VIEN.SO_TIEN_DA_TRA]) || 0;
      const soTienPhaiTra = parseFloat(bill[COLUMNS.HD_TIEN_DIEN_SINH_VIEN.SO_TIEN_PHAI_TRA]);
      const soTienThanhToan = parseFloat(so_tien_thanh_toan);

      if (soTienDaTra + soTienThanhToan > soTienPhaiTra) {
        return errorResponse(res, 400, "Số tiền thanh toán vượt quá số tiền phải trả");
      }

      const soTienMoi = soTienDaTra + soTienThanhToan;
      let trangThaiMoi = ENUM_HD_TIEN_DIEN_SV_TRANG_THAI.UNPAID;

      if (soTienMoi >= soTienPhaiTra) {
        trangThaiMoi = ENUM_HD_TIEN_DIEN_SV_TRANG_THAI.PAID;
      } else if (soTienMoi > 0) {
        trangThaiMoi = ENUM_HD_TIEN_DIEN_SV_TRANG_THAI.PARTIAL_PAID;
      }

      await bill.update({
        [COLUMNS.HD_TIEN_DIEN_SINH_VIEN.SO_TIEN_DA_TRA]: soTienMoi,
        [COLUMNS.HD_TIEN_DIEN_SINH_VIEN.TRANG_THAI_THANH_TOAN]: trangThaiMoi,
        [COLUMNS.HD_TIEN_DIEN_SINH_VIEN.PHUONG_THUC_THANH_TOAN]: phuong_thuc_thanh_toan,
        [COLUMNS.HD_TIEN_DIEN_SINH_VIEN.MA_GIAO_DICH]: ma_giao_dich,
        [COLUMNS.HD_TIEN_DIEN_SINH_VIEN.NGAY_THANH_TOAN]:
          trangThaiMoi === ENUM_HD_TIEN_DIEN_SV_TRANG_THAI.PAID
            ? new Date()
            : bill[COLUMNS.HD_TIEN_DIEN_SINH_VIEN.NGAY_THANH_TOAN],
        [COLUMNS.HD_TIEN_DIEN_SINH_VIEN.GHI_CHU]: ghi_chu,
        [COLUMNS.COMMON.NGUOI_CAP_NHAT]: req.user?.id,
      });

      // Lấy thông tin chi tiết sau khi cập nhật
      const updatedBill = await HdTienDienSinhVien.findByPk(bill.id, {
        include: [
          {
            model: SinhVien,
            as: "Student",
            attributes: ["id", "mssv", "ten"],
          },
          {
            model: HdTienDien,
            as: "ElectricityBill",
            include: [
              {
                model: Phong,
                as: "Room",
                attributes: ["id", "ten_phong"],
              },
            ],
          },
        ],
      });

      return successResponse(res, updatedBill);
    } catch (error) {
      return errorResponse(res, 500, "Không thể thanh toán hóa đơn", error.message);
    }
  },

  /**
   * Thống kê tiền điện
   */
  getElectricityStatistics: async (req, res) => {
    try {
      console.log("Getting electricity statistics...");

      // Basic counts
      const roomBillCount = await HdTienDien.count();
      const studentBillCount = await HdTienDienSinhVien.count();
      const electricityRateCount = await DonGiaDien.count();

      // Room bill statistics by status
      const roomBillsByStatus = await HdTienDien.findAll({
        attributes: ["trang_thai", [fn("COUNT", col("id")), "count"]],
        group: ["trang_thai"],
        raw: true,
      });

      // Student bill statistics by payment status
      const studentBillsByPaymentStatus = await HdTienDienSinhVien.findAll({
        attributes: [
          "trang_thai_thanh_toan",
          [fn("COUNT", col("id")), "count"],
          [fn("SUM", col("so_tien_phai_tra")), "total_amount"],
          [fn("SUM", col("so_tien_da_tra")), "paid_amount"],
        ],
        group: ["trang_thai_thanh_toan"],
        raw: true,
      });

      // Total amounts
      const totalAmountStats = await HdTienDienSinhVien.findOne({
        attributes: [
          [fn("SUM", col("so_tien_phai_tra")), "total_bill_amount"],
          [fn("SUM", col("so_tien_da_tra")), "total_paid_amount"],
          [fn("COUNT", col("id")), "total_bills"],
        ],
        raw: true,
      });

      // Monthly statistics for current year
      const currentYear = new Date().getFullYear();
      const monthlyStats = await HdTienDien.findAll({
        attributes: [
          [literal(`EXTRACT(MONTH FROM tu_ngay)`), "month"],
          [fn("COUNT", col("id")), "bill_count"],
          [fn("SUM", col("thanh_tien")), "total_amount"],
        ],
        where: literal(`EXTRACT(YEAR FROM tu_ngay) = ${currentYear}`),
        group: [literal("EXTRACT(MONTH FROM tu_ngay)")],
        order: [[literal("EXTRACT(MONTH FROM tu_ngay)"), "ASC"]],
        raw: true,
      });

      const stats = {
        overview: {
          totalElectricityRates: electricityRateCount,
          totalRoomBills: roomBillCount,
          totalStudentBills: studentBillCount,
          totalBillAmount: parseFloat(totalAmountStats?.total_bill_amount || 0),
          totalPaidAmount: parseFloat(totalAmountStats?.total_paid_amount || 0),
          totalUnpaidAmount:
            parseFloat(totalAmountStats?.total_bill_amount || 0) - parseFloat(totalAmountStats?.total_paid_amount || 0),
        },
        roomBillsByStatus: roomBillsByStatus.reduce((acc, item) => {
          acc[item.trang_thai] = parseInt(item.count);
          return acc;
        }, {}),
        studentBillsByPaymentStatus: studentBillsByPaymentStatus.reduce((acc, item) => {
          acc[item.trang_thai_thanh_toan] = {
            count: parseInt(item.count),
            totalAmount: parseFloat(item.total_amount || 0),
            paidAmount: parseFloat(item.paid_amount || 0),
          };
          return acc;
        }, {}),
        monthlyStats: monthlyStats.map((item) => ({
          month: parseInt(item.month),
          billCount: parseInt(item.bill_count),
          totalAmount: parseFloat(item.total_amount || 0),
        })),
        paymentRate:
          totalAmountStats?.total_bill_amount > 0
            ? (
                (parseFloat(totalAmountStats.total_paid_amount || 0) / parseFloat(totalAmountStats.total_bill_amount)) *
                100
              ).toFixed(2)
            : 0,
      };

      return successResponse(res, stats);
    } catch (error) {
      console.error("Statistics error:", error);
      return errorResponse(res, 500, "Không thể lấy thống kê tiền điện", error.message);
    }
  },

  /**
   * Cập nhật hóa đơn tiền điện phòng
   */
  updateRoomElectricityBill: async (req, res) => {
    try {
      const { id } = req.params;
      const { id_phong, tu_ngay, den_ngay, so_dien_cu, so_dien_moi, ghi_chu } = req.body;

      const bill = await HdTienDien.findByPk(id);
      if (!bill) {
        return errorResponse(res, 404, "Hóa đơn không tồn tại");
      }

      if (bill.trang_thai !== "draft") {
        return errorResponse(res, 400, "Chỉ có thể cập nhật hóa đơn ở trạng thái draft");
      }

      // Tìm đơn giá điện phù hợp
      const electricityRate = await electricityUtils.getElectricityRateForDate(new Date(tu_ngay));
      if (!electricityRate) {
        return errorResponse(res, 400, "Không tìm thấy đơn giá điện phù hợp");
      }

      // Tính toán
      const so_dien_tieu_thu = so_dien_moi - so_dien_cu;

      const updatedBill = await bill.update({
        id_phong,
        tu_ngay,
        den_ngay,
        so_dien_cu,
        so_dien_moi,
        id_don_gia_dien: electricityRate.id,
        so_dien_tieu_thu,
        ghi_chu,
        nguoi_cap_nhat: req.user.id,
      });

      return successResponse(res, updatedBill);
    } catch (error) {
      return errorResponse(res, 500, "Không thể cập nhật hóa đơn", error.message);
    }
  },

  /**
   * Xóa hóa đơn tiền điện phòng
   */
  deleteRoomElectricityBill: async (req, res) => {
    try {
      const { id } = req.params;

      const bill = await HdTienDien.findByPk(id);
      if (!bill) {
        return errorResponse(res, 404, "Hóa đơn không tồn tại");
      }

      if (bill.trang_thai !== "draft") {
        return errorResponse(res, 400, "Chỉ có thể xóa hóa đơn ở trạng thái draft");
      }

      // Xóa soft delete
      await bill.update({ dang_hien: false });

      return successResponse(res, { message: "Hóa đơn đã được xóa" });
    } catch (error) {
      return errorResponse(res, 500, "Không thể xóa hóa đơn", error.message);
    }
  },

  /**
   * Tạo hóa đơn hàng loạt
   */
  bulkCreateRoomBills: async (req, res) => {
    try {
      const { bills } = req.body;
      const results = [];
      const errors = [];

      for (let i = 0; i < bills.length; i++) {
        try {
          const billData = bills[i];

          // Tìm đơn giá điện
          const electricityRate = await electricityUtils.getElectricityRateForDate(new Date(billData.tu_ngay));
          if (!electricityRate) {
            errors.push({ index: i, error: "Không tìm thấy đơn giá điện phù hợp" });
            continue;
          }

          const so_dien_tieu_thu = billData.so_dien_moi - billData.so_dien_cu;

          const newBill = await HdTienDien.create({
            ...billData,
            id_don_gia_dien: electricityRate.id,
            so_dien_tieu_thu,
            thanh_tien: 0,
            trang_thai: "draft",
            nguoi_tao: req.user.id,
          });

          results.push(newBill);
        } catch (error) {
          errors.push({ index: i, error: error.message });
        }
      }

      return successResponse(res, {
        created: results.length,
        errors: errors.length,
        results,
        errors,
      });
    } catch (error) {
      return errorResponse(res, 500, "Không thể tạo hóa đơn hàng loạt", error.message);
    }
  },

  /**
   * Preview tính toán tiền điện sinh viên
   */
  previewStudentCalculation: async (req, res) => {
    try {
      const { id } = req.params;

      const hdTienDien = await HdTienDien.findOne({
        where: { id, dang_hien: true },
        include: [
          { model: Phong, as: "Room" },
          { model: DonGiaDien, as: "ElectricityRate" },
        ],
      });

      if (!hdTienDien) {
        return errorResponse(res, 404, "Hóa đơn không tồn tại");
      }

      // Tính toán preview mà không lưu vào DB
      const studentsWithAmounts = await electricityUtils.calculateStudentPortions(
        hdTienDien.id_phong,
        hdTienDien.tu_ngay,
        hdTienDien.den_ngay,
        hdTienDien.so_dien_tieu_thu,
        hdTienDien.ElectricityRate.don_gia,
      );

      return successResponse(res, {
        hdTienDien,
        preview: studentsWithAmounts,
        note: "Đây chỉ là preview, chưa được lưu vào database",
      });
    } catch (error) {
      return errorResponse(res, 500, "Không thể preview tính toán", error.message);
    }
  },

  /**
   * Hủy hóa đơn sinh viên
   */
  cancelStudentBill: async (req, res) => {
    try {
      const { id } = req.params;

      const bill = await HdTienDienSinhVien.findByPk(id);
      if (!bill) {
        return errorResponse(res, 404, "Hóa đơn sinh viên không tồn tại");
      }

      if (bill.trang_thai_thanh_toan === "paid") {
        return errorResponse(res, 400, "Không thể hủy hóa đơn đã thanh toán");
      }

      await bill.update({
        trang_thai_thanh_toan: "cancelled",
        nguoi_cap_nhat: req.user.id,
      });

      return successResponse(res, { message: "Hóa đơn sinh viên đã được hủy" });
    } catch (error) {
      return errorResponse(res, 500, "Không thể hủy hóa đơn", error.message);
    }
  },

  /**
   * Xuất báo cáo Excel
   */
  exportExcel: async (req, res) => {
    try {
      const { tu_ngay, den_ngay, include_students = true, include_rooms = true } = req.query;

      // Validate date range
      if (!tu_ngay || !den_ngay) {
        return errorResponse(res, 400, "Vui lòng cung cấp khoảng thời gian (tu_ngay, den_ngay)");
      }

      const reportData = await electricityController.getReportData(
        tu_ngay,
        den_ngay,
        include_students === "true",
        include_rooms === "true",
      );

      const result = await exportUtils.exportElectricityReportToExcel(reportData);

      // Set headers for file download
      res.setHeader("Content-Type", result.mimeType);
      res.setHeader("Content-Disposition", `attachment; filename="${result.fileName}"`);
      res.setHeader("Content-Length", result.buffer.length);

      return res.send(result.buffer);
    } catch (error) {
      return errorResponse(res, 500, "Không thể xuất báo cáo Excel", error.message);
    }
  },

  /**
   * Xuất báo cáo PDF
   */
  exportPDF: async (req, res) => {
    try {
      const { tu_ngay, den_ngay, include_students = true, include_rooms = true } = req.query;

      // Validate date range
      if (!tu_ngay || !den_ngay) {
        return errorResponse(res, 400, "Vui lòng cung cấp khoảng thời gian (tu_ngay, den_ngay)");
      }

      const reportData = await electricityController.getReportData(
        tu_ngay,
        den_ngay,
        include_students === "true",
        include_rooms === "true",
      );

      const result = await exportUtils.exportElectricityReportToPDF(reportData);

      // Set headers for file download
      res.setHeader("Content-Type", result.mimeType);
      res.setHeader("Content-Disposition", `attachment; filename="${result.fileName}"`);
      res.setHeader("Content-Length", result.buffer.length);

      return res.send(result.buffer);
    } catch (error) {
      return errorResponse(res, 500, "Không thể xuất báo cáo PDF", error.message);
    }
  },

  /**
   * Helper function để lấy dữ liệu báo cáo
   */
  getReportData: async (tuNgay, denNgay, includeStudents = true, includeRooms = true) => {
    const dateStart = new Date(tuNgay);
    const dateEnd = new Date(denNgay);

    // Get room bills
    let roomBills = [];
    if (includeRooms) {
      roomBills = await HdTienDien.findAll({
        where: {
          [COLUMNS.COMMON.DANG_HIEN]: true,
          [COLUMNS.HD_TIEN_DIEN.TU_NGAY]: { [Op.gte]: dateStart },
          [COLUMNS.HD_TIEN_DIEN.DEN_NGAY]: { [Op.lte]: dateEnd },
        },
        include: [
          {
            model: Phong,
            as: "Room",
            attributes: ["id", "ten_phong"],
          },
          {
            model: DonGiaDien,
            as: "ElectricityRate",
            attributes: ["don_gia"],
          },
        ],
        order: [[COLUMNS.HD_TIEN_DIEN.TU_NGAY, "DESC"]],
      });
    }

    // Get student bills
    let studentBills = [];
    if (includeStudents) {
      studentBills = await HdTienDienSinhVien.findAll({
        where: {
          [COLUMNS.COMMON.DANG_HIEN]: true,
        },
        include: [
          {
            model: SinhVien,
            as: "Student",
            attributes: ["id", "mssv", "ten"],
          },
          {
            model: HdTienDien,
            as: "ElectricityBill",
            where: {
              [COLUMNS.HD_TIEN_DIEN.TU_NGAY]: { [Op.gte]: dateStart },
              [COLUMNS.HD_TIEN_DIEN.DEN_NGAY]: { [Op.lte]: dateEnd },
            },
            include: [
              {
                model: Phong,
                as: "Room",
                attributes: ["id", "ten_phong"],
              },
            ],
          },
        ],
        order: [[{ model: HdTienDien, as: "ElectricityBill" }, COLUMNS.HD_TIEN_DIEN.TU_NGAY, "DESC"]],
      });
    }

    // Calculate statistics
    const totalRoomBills = roomBills.length;
    const totalStudentBills = studentBills.length;
    const totalAmount = studentBills.reduce((sum, bill) => sum + parseFloat(bill.so_tien_phai_tra || 0), 0);
    const paidAmount = studentBills.reduce((sum, bill) => sum + parseFloat(bill.so_tien_da_tra || 0), 0);
    const unpaidAmount = totalAmount - paidAmount;
    const paymentRate = totalAmount > 0 ? ((paidAmount / totalAmount) * 100).toFixed(2) : 0;

    return {
      roomBills,
      studentBills,
      statistics: {
        totalRoomBills,
        totalStudentBills,
        totalAmount,
        paidAmount,
        unpaidAmount,
        paymentRate,
      },
      dateRange: {
        from: tuNgay,
        to: denNgay,
      },
    };
  },

  /**
   * Lấy chi tiết hóa đơn tiền điện phòng theo ID
   */
  getRoomElectricityBillById: async (req, res) => {
    try {
      const { id } = req.params;
      console.log("Getting room bill details for ID:", id);

      // Simplified version first - just get basic bill
      const bill = await HdTienDien.findByPk(id);
      console.log("Found bill:", !!bill);

      if (!bill || !bill[COLUMNS.COMMON.DANG_HIEN]) {
        return errorResponse(res, 404, "Hóa đơn không tồn tại");
      }

      // Get student bills without complex includes first
      const studentBillsCount = await HdTienDienSinhVien.count({
        where: {
          [COLUMNS.HD_TIEN_DIEN_SINH_VIEN.ID_HD_TIEN_DIEN]: id,
          [COLUMNS.COMMON.DANG_HIEN]: true,
        },
      });

      console.log("Student bills count:", studentBillsCount);

      const result = {
        id: bill.id,
        id_phong: bill.id_phong,
        tu_ngay: bill.tu_ngay,
        den_ngay: bill.den_ngay,
        so_dien_cu: bill.so_dien_cu,
        so_dien_moi: bill.so_dien_moi,
        trang_thai: bill.trang_thai,
        summary: {
          totalStudents: studentBillsCount,
          totalAmount: 0,
          paidAmount: 0,
          unpaidAmount: 0,
        },
      };

      return successResponse(res, result);
    } catch (error) {
      console.error("getRoomElectricityBillById error:", error);
      return errorResponse(res, 500, "Không thể lấy chi tiết hóa đơn", error.message);
    }
  },

  /**
   * Bulk finalize hóa đơn (hoàn thiện nhiều hóa đơn cùng lúc)
   */
  bulkFinalizeElectricityBills: async (req, res) => {
    try {
      const { bill_ids } = req.body;

      if (!Array.isArray(bill_ids) || bill_ids.length === 0) {
        return errorResponse(res, 400, "Danh sách ID hóa đơn không hợp lệ");
      }

      const results = [];
      const errors = [];

      for (const billId of bill_ids) {
        try {
          const bill = await HdTienDien.findOne({
            where: {
              [COLUMNS.COMMON.ID]: billId,
              [COLUMNS.COMMON.DANG_HIEN]: true,
            },
          });

          if (!bill) {
            errors.push({ billId, error: "Hóa đơn không tồn tại" });
            continue;
          }

          if (bill[COLUMNS.HD_TIEN_DIEN.TRANG_THAI] !== ENUM_HD_TIEN_DIEN_TRANG_THAI.CALCULATED) {
            errors.push({ billId, error: "Hóa đơn phải được tính toán trước khi hoàn thiện" });
            continue;
          }

          await bill.update({
            [COLUMNS.HD_TIEN_DIEN.TRANG_THAI]: ENUM_HD_TIEN_DIEN_TRANG_THAI.FINALIZED,
            [COLUMNS.COMMON.NGUOI_CAP_NHAT]: req.user?.id,
          });

          results.push({ billId, status: "finalized" });
        } catch (error) {
          errors.push({ billId, error: error.message });
        }
      }

      return successResponse(res, {
        finalized: results.length,
        errors: errors.length,
        results,
        errors,
      });
    } catch (error) {
      return errorResponse(res, 500, "Không thể hoàn thiện hóa đơn hàng loạt", error.message);
    }
  },

  /**
   * Bulk payment cho nhiều sinh viên
   */
  bulkPayStudentBills: async (req, res) => {
    try {
      const { payments } = req.body;

      if (!Array.isArray(payments) || payments.length === 0) {
        return errorResponse(res, 400, "Danh sách thanh toán không hợp lệ");
      }

      const results = [];
      const errors = [];

      for (const payment of payments) {
        try {
          const { bill_id, so_tien_thanh_toan, phuong_thuc_thanh_toan, ma_giao_dich, ghi_chu } = payment;

          const bill = await HdTienDienSinhVien.findOne({
            where: {
              [COLUMNS.COMMON.ID]: bill_id,
              [COLUMNS.COMMON.DANG_HIEN]: true,
            },
          });

          if (!bill) {
            errors.push({ bill_id, error: "Hóa đơn không tồn tại" });
            continue;
          }

          const soTienDaTra = parseFloat(bill[COLUMNS.HD_TIEN_DIEN_SINH_VIEN.SO_TIEN_DA_TRA]) || 0;
          const soTienPhaiTra = parseFloat(bill[COLUMNS.HD_TIEN_DIEN_SINH_VIEN.SO_TIEN_PHAI_TRA]);
          const soTienThanhToan = parseFloat(so_tien_thanh_toan);

          if (soTienDaTra + soTienThanhToan > soTienPhaiTra) {
            errors.push({ bill_id, error: "Số tiền thanh toán vượt quá số tiền phải trả" });
            continue;
          }

          const soTienMoi = soTienDaTra + soTienThanhToan;
          let trangThaiMoi = ENUM_HD_TIEN_DIEN_SV_TRANG_THAI.UNPAID;

          if (soTienMoi >= soTienPhaiTra) {
            trangThaiMoi = ENUM_HD_TIEN_DIEN_SV_TRANG_THAI.PAID;
          } else if (soTienMoi > 0) {
            trangThaiMoi = ENUM_HD_TIEN_DIEN_SV_TRANG_THAI.PARTIAL_PAID;
          }

          await bill.update({
            [COLUMNS.HD_TIEN_DIEN_SINH_VIEN.SO_TIEN_DA_TRA]: soTienMoi,
            [COLUMNS.HD_TIEN_DIEN_SINH_VIEN.TRANG_THAI_THANH_TOAN]: trangThaiMoi,
            [COLUMNS.HD_TIEN_DIEN_SINH_VIEN.PHUONG_THUC_THANH_TOAN]: phuong_thuc_thanh_toan,
            [COLUMNS.HD_TIEN_DIEN_SINH_VIEN.MA_GIAO_DICH]: ma_giao_dich,
            [COLUMNS.HD_TIEN_DIEN_SINH_VIEN.NGAY_THANH_TOAN]:
              trangThaiMoi === ENUM_HD_TIEN_DIEN_SV_TRANG_THAI.PAID
                ? new Date()
                : bill[COLUMNS.HD_TIEN_DIEN_SINH_VIEN.NGAY_THANH_TOAN],
            [COLUMNS.HD_TIEN_DIEN_SINH_VIEN.GHI_CHU]: ghi_chu,
            [COLUMNS.COMMON.NGUOI_CAP_NHAT]: req.user?.id,
          });

          results.push({ bill_id, status: trangThaiMoi, amount_paid: soTienThanhToan });
        } catch (error) {
          errors.push({ bill_id, error: error.message });
        }
      }

      return successResponse(res, {
        processed: results.length,
        errors: errors.length,
        results,
        errors,
      });
    } catch (error) {
      return errorResponse(res, 500, "Không thể thanh toán hàng loạt", error.message);
    }
  },

  /**
   * Advanced statistics với filter chi tiết
   */
  getAdvancedStatistics: async (req, res) => {
    try {
      const { year, month } = req.query;
      const currentYear = year ? parseInt(year) : new Date().getFullYear();

      // Basic stats
      const totalRoomBills = await HdTienDien.count({
        where: {
          [COLUMNS.COMMON.DANG_HIEN]: true,
          [Op.and]: [literal(`EXTRACT(YEAR FROM tu_ngay) = ${currentYear}`)],
        },
      });

      const totalStudentBills = await HdTienDienSinhVien.count({
        where: { [COLUMNS.COMMON.DANG_HIEN]: true },
      });

      // Top consuming rooms (simplified)
      const topConsumingRooms = await HdTienDien.findAll({
        attributes: [
          "id_phong",
          [fn("SUM", col("so_dien_tieu_thu")), "total_consumption"],
          [fn("COUNT", col("id")), "bill_count"],
        ],
        where: {
          [COLUMNS.COMMON.DANG_HIEN]: true,
          [Op.and]: [literal(`EXTRACT(YEAR FROM tu_ngay) = ${currentYear}`)],
        },
        group: ["id_phong"],
        order: [[fn("SUM", col("so_dien_tieu_thu")), "DESC"]],
        limit: 5,
        raw: true,
      });

      const result = {
        period: month ? `${month}/${currentYear}` : currentYear.toString(),
        overview: {
          totalRoomBills,
          totalStudentBills,
          year: currentYear,
        },
        topConsumingRooms: topConsumingRooms.map((room) => ({
          roomId: room.id_phong,
          totalConsumption: parseFloat(room.total_consumption || 0),
          billCount: parseInt(room.bill_count),
        })),
      };

      return successResponse(res, result);
    } catch (error) {
      console.error("Advanced statistics error:", error);
      return errorResponse(res, 500, "Không thể lấy thống kê chi tiết", error.message);
    }
  },
};
