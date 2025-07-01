// src/controllers/payment.controller.js
import { successResponse, errorResponse } from "../utils/response.util.js";
import payos from "../utils/payos.util.js";
import {
  PhanBoPhong,
  Giuong,
  Phong,
  LoaiPhong,
  HoaDonPhanBoPhong,
  SinhVien,
} from "../models/index.js";
import sequelize from "../config/database.config.js";
import { calculateQuarterEndDate } from "../utils/quater.util.js";
import { COLUMNS } from "../constants/database.constants.js";

/**
 * Helper: lấy allocation + room price + số đơn vị tháng phải đóng
 */
const getPaymentInfo = async (allocationId, user) => {
  const allocation = await PhanBoPhong.findByPk(allocationId, {
    include: [
      {
        model: Giuong,
        as: "Bed",
        include: [
          {
            model: Phong,
            as: "Room",
            include: [{ model: LoaiPhong, as: "RoomType" }],
          },
        ],
      },
      { model: SinhVien, as: "Student" },
    ],
  });
  // ✋ Chỉ sinh viên của chính allocation mới được xem/ trả tiền
  if (user.type === "sinh_vien" && allocation.id_sv !== user.id) {
    throw new Error("Bạn không có quyền truy cập hóa đơn này");
  }

  if (!allocation) throw new Error("Allocation not found");

  // Lấy giá phòng / tháng
  const pricePerMonth =
    allocation.Bed?.Room?.RoomType?.[COLUMNS.LOAI_PHONG.GIA_THUE] || 0;

  // Tính đơn vị tháng phải đóng
  const { soDonViThang } = calculateQuarterEndDate(
    allocation[COLUMNS.PHAN_BO_PHONG.NGAY_BAT_DAU]
  );

  const totalAmount = pricePerMonth * soDonViThang;

  return { allocation, pricePerMonth, soDonViThang, totalAmount };
};

export const paymentController = {
  /**
   * GET /payments/:allocationId
   * Lấy chi tiết thanh toán (để hiển thị ở UI trước khi tạo phiên)
   */
  getPaymentDetails: async (req, res) => {
    try {
      const { allocationId } = req.params;
      const info = await getPaymentInfo(allocationId);

      return successResponse(res, {
        allocation: info.allocation,
        pricePerMonth: info.pricePerMonth,
        soDonViThang: info.soDonViThang,
        totalAmount: info.totalAmount,
      });
    } catch (error) {
      return errorResponse(res, 400, error.message);
    }
  },

  /**
   * POST /payments/:allocationId/checkout
   * Tạo link thanh toán PayOS ➜ trả về checkoutUrl
   */
  createCheckout: async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
      const { allocationId } = req.params;
      const {
        allocation,
        pricePerMonth,
        soDonViThang,
        totalAmount,
      } = await getPaymentInfo(allocationId);

      if (allocation.trang_thai_thanh_toan)
        return errorResponse(res, 409, "Khoản này đã được thanh toán");

      // === 1. Gọi PayOS tạo order ===
      const orderId = `KTX-${allocationId}-${Date.now()}`;
      const result = await payos.createPaymentLink({
        orderCode: orderId,
        amount: totalAmount,
        description: `Thanh toán KTX cho sinh viên ${allocation.Student?.ten || ""}`,
        returnUrl: process.env.PAYOS_RETURN_URL,
        cancelUrl: process.env.PAYOS_CANCEL_URL,
      });

      // === 2. Lưu hóa đơn (ở trạng thái pending) ===
      await HoaDonPhanBoPhong.create(
        {
          [COLUMNS.HD_PHAN_BO_PHONG.ID_PHAN_BO_PHONG]: allocationId,
          [COLUMNS.HD_PHAN_BO_PHONG.SO_TIEN_THANH_TOAN]: totalAmount,
          // có thể thêm trường trạng thái nếu bạn muốn
        },
        { transaction }
      );

      await transaction.commit();

      return successResponse(res, { checkoutUrl: result.checkoutUrl });
    } catch (error) {
      await transaction.rollback();
      return errorResponse(res, 500, "Không tạo được phiên thanh toán", error.message);
    }
  },

  /**
   * POST /payments/payos-webhook
   * PayOS bắn webhook ➜ xác thực, cập nhật DB
   */
  handlePayOSWebhook: async (req, res) => {
    try {
      const verifiedData = payos.verifyPaymentWebhook(req.body);

      const { orderCode, status } = verifiedData; // status = "PAID" | ...

      // Rút allocationId từ orderCode
      // orderCode = "KTX-<allocationId>-<timestamp>"
      const allocationId = orderCode.split("-")[1];

      if (status === "PAID") {
        await PhanBoPhong.update(
          { trang_thai_thanh_toan: true },
          { where: { id: allocationId } }
        );
      }

      // Trả 200 ngay để PayOS không retry
      res.status(200).json({ received: true });
    } catch (error) {
      console.error("Webhook validation failed:", error);
      res.status(400).json({ error: "Invalid signature" });
    }
  },
};
