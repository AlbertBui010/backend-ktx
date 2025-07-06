import 'dotenv/config';
import {
  HoaDonPhanBoPhong,
  PhanBoPhong,
  Giuong,
  Phong,
  LoaiPhong,
  SinhVien,
} from "../models/index.js";
import sequelize from "../config/database.config.js";
import payos from "../utils/payos.util.js";
import { COLUMNS } from "../constants/database.constants.js";
import qrcode from 'qrcode'; // Import thư viện qrcode cho Node.js

/* -------------------------------------------------------------------------- */
/* Helper: Lấy HĐ + Allocation kèm Room info & kiểm quyền                    */
/* -------------------------------------------------------------------------- */
const getInvoiceWithAllocation = async (allocationId, user = null) => {
  const invoice = await HoaDonPhanBoPhong.findOne({
    where: {
      [COLUMNS.HD_PHAN_BO_PHONG.ID_PHAN_BO_PHONG]: allocationId,
      [COLUMNS.COMMON.DANG_HIEN]: true,
    },
    include: [
      {
        model: PhanBoPhong,
        as: "Allocation",
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
      },
    ],
  });

  if (!invoice) throw new Error("Không tìm thấy hóa đơn");

  if (
    user &&
    user.type === "student" &&
    invoice.Allocation[COLUMNS.PHAN_BO_PHONG.ID_SV] !== user.id
  ) {
    throw new Error("Bạn không có quyền truy cập hóa đơn này");
  }

  return invoice;
};

/* -------------------------------------------------------------------------- */
/* CONTROLLER                                                                */
/* -------------------------------------------------------------------------- */
export const invoiceController = {
  // Nhân viên: lấy tất cả hóa đơn
  async getAll(req, res) {
    try {
      const { page = 1, limit = 20, status } = req.query;
      const offset = (page - 1) * limit;

      const where = { [COLUMNS.COMMON.DANG_HIEN]: true };
      if (status) where.status = status;

      const { count, rows } = await HoaDonPhanBoPhong.findAndCountAll({
        where,
        limit: +limit,
        offset: +offset,
        include: [
          {
            model: PhanBoPhong,
            as: "Allocation",
            include: [
              {
                model: Giuong,
                as: "Bed",
                include: [
                  {
                    model: Phong,
                    as: "Room",
                  },
                ],
              },
              { model: SinhVien, as: "Student" },
            ],
          },
        ],
        order: [[COLUMNS.COMMON.NGAY_TAO, "DESC"]],
      });

      return res.status(200).json({
        data: { invoices: rows },
        pagination: {
          total: count,
          page: +page,
          totalPages: Math.ceil(count / limit),
        },
      });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  },

  // Sinh viên: lấy hóa đơn của mình
  async getMyInvoices(req, res) {
    try {
      const studentId = req.user.id;

      const invoices = await HoaDonPhanBoPhong.findAll({
        include: [
          {
            model: PhanBoPhong,
            as: "Allocation",
            where: { [COLUMNS.PHAN_BO_PHONG.ID_SV]: studentId },
            include: [
              {
                model: SinhVien, // ← BỔ SUNG DÒNG NÀY
                as: "Student",
              },
              {
                model: Giuong,
                as: "Bed",
                include: [{ model: Phong, as: "Room" }],
              },
            ],
          },
        ],
        // order: [['ngay_tao', "DESC"]],
      });
      console.log("Invoices trả về:", JSON.stringify(invoices, null, 2));

      res.status(200).json(invoices);
    } catch (err) {
      console.error("getMyInvoices error:", err);
      return res.status(500).json({ message: err.message });
    }
  },

  //lay 1 hóa đơn theo allocationId
  async getOne(req, res) {
    try {
      const invoice = await getInvoiceWithAllocation(
        req.params.allocationId,
        req.user
      );
      return res.status(200).json({
        data: { invoice },
        message: "Lấy hóa đơn thành công",
      });
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }
  },

// Sinh viên: tạo checkout link
  async createCheckout(req, res) {
    const t = await sequelize.transaction();

    try {
      const { allocationId } = req.params;
      console.log("1. Starting checkout for allocationId:", allocationId);

      const invoice = await getInvoiceWithAllocation(allocationId, req.user);
      console.log("2. Invoice fetched:", invoice?.id);

      if (invoice.status === "paid") {
        return res.status(409).json({ message: "Hóa đơn đã thanh toán" });
      }

      const totalAmount = parseInt(
        invoice[COLUMNS.HD_PHAN_BO_PHONG.SO_TIEN_THANH_TOAN] ?? 0,
        10
      );
      console.log("3. Total Amount (parsed to int):", totalAmount);

      const shortTimestamp = Date.now() % 1e6;
      const orderCode = Number(`${invoice.id}${shortTimestamp}`);
      console.log("4. Order Code:", orderCode);

      console.log("DEBUG: PAYOS_RETURN_URL:", process.env.PAYOS_RETURN_URL);
      console.log("DEBUG: PAYOS_CANCEL_URL:", process.env.PAYOS_CANCEL_URL);

      const {
        Allocation: {
          Student: { ten: studentName = "", email: studentEmail = "", sdt: studentPhone = "" } = {},
          Bed: {
            Room: { ten_phong: roomName = "Phòng KTX" } = {},
            ten_giuong: bedName = "Giường",
          } = {},
        } = {},
      } = invoice;

      const description = "Thanh toán KTX";

      const paymentData = {
        orderCode,
        amount: totalAmount,
        description,
        returnUrl: process.env.PAYOS_RETURN_URL,
        cancelUrl: process.env.PAYOS_CANCEL_URL,
        items: [
          {
            name: `Phí thuê phòng ${roomName} - Giường ${bedName}`,
            quantity: 1,
            price: totalAmount,
          },
        ],
        buyer: {
          fullName: studentName,
          email: studentEmail,
          phone: studentPhone,
        },
      };

      console.log("DEBUG: Sending to PayOS:", JSON.stringify(paymentData, null, 2));

      const payosResult = await payos.createPaymentLink(paymentData); // Đổi tên biến để tránh trùng lặp

      let qrCodeBase64 = null;
      if (payosResult.qrCode) { // payosResult.qrCode là chuỗi QR thô từ PayOS
        try {
          // Chuyển đổi chuỗi QR thô thành hình ảnh Base64
          // toDataURL trả về định dạng "data:image/png;base64,..."
          const fullQrCodeDataUrl = await qrcode.toDataURL(payosResult.qrCode, { type: 'image/png' });
          // Lấy phần Base64 sau dấu phẩy
          qrCodeBase64 = fullQrCodeDataUrl.split(',')[1];
          console.log("DEBUG: QR Code Base64 generated successfully.");
        } catch (qrErr) {
          console.error("Error generating QR code Base64:", qrErr);
          // NÉM LỖI RA ĐÂY ĐỂ NGĂN CHẶN LỖI THẦM LẶNG
          throw new Error("Không thể tạo mã QR thanh toán từ PayOS: " + qrErr.message);
        }
      } else {
        // Nếu payosResult.qrCode không tồn tại, cũng ném lỗi
        throw new Error("PayOS không trả về chuỗi QR code.");
      }

      console.log("5. PayOS createPaymentLink result:", payosResult);
      console.log("DEBUG: qrCodeBase64 sent to frontend:", qrCodeBase64 ? "Generated" : "Null/Undefined"); // Thêm log này

      await invoice.update(
        {
          order_code: orderCode,
          order_created_at: new Date(), // Lưu timestamp tạo order
        },
        { transaction: t }
      );
      console.log("6. Invoice updated with order_code and order_created_at.");

      // Lập lịch để hủy bỏ orderCode sau 5 phút (300,000 ms) nếu chưa thanh toán
      setTimeout(async () => {
        try {
          const updatedInvoice = await HoaDonPhanBoPhong.findByPk(invoice.id);
          if (updatedInvoice && updatedInvoice.status !== "paid") {
            await updatedInvoice.update({ order_code: null });
            console.log(`Order ${orderCode} invalidated for invoice ${invoice.id}`);
          }
        } catch (err) {
          console.error(`Failed to invalidate order ${orderCode}:`, err);
        }
      }, 300000);

      await t.commit();
      console.log("7. Transaction committed.");

      return res.status(201).json({
        checkoutUrl: payosResult.checkoutUrl,
        qrCode: qrCodeBase64, // Gửi chuỗi Base64 của hình ảnh QR về frontend
        orderCode, // Trả về orderCode cho frontend
        expireIn: 300,
      });
    } catch (err) {
      console.error("Error in createCheckout:", err);
      await t.rollback();
      return res.status(500).json({
        message: "Không tạo được phiên thanh toán",
        detail: err.message,
      });
    }
  },

  // Webhook từ PayOS (không cần auth)
  async handlePayOSWebhook(req, res) {
    try {
      const data = payos.verifyPaymentWebhook(req.body);
      const { orderCode, status } = data;

      // orderCode: INV-<invoiceId>-timestamp
      const invoiceId = orderCode?.toString().slice(0, -6); // Trích xuất invoiceId từ orderCode
      if (status === "PAID" && invoiceId) {
        await HoaDonPhanBoPhong.update(
          { status: "paid" },
          { where: { id: invoiceId } }
        );
        const invoice = await HoaDonPhanBoPhong.findByPk(invoiceId);
        await PhanBoPhong.update(
          { trang_thai_thanh_toan: true },
          { where: { id: invoice?.[COLUMNS.HD_PHAN_BO_PHONG.ID_PHAN_BO_PHONG] } }
        );
      }

      return res.status(200).json({ received: true });
    } catch (err) {
      console.error("Webhook error:", err);
      return res.status(400).json({ error: "Invalid signature" });
    }
  },
};
export default invoiceController;
