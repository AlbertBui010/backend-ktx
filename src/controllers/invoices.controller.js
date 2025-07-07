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
import crypto from "crypto";
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
      const invoice = await getInvoiceWithAllocation(allocationId, req.user);

      /* Đã thanh toán → 409 */
      if (invoice.status === "paid")
        return res.status(409).json({ message: "Hóa đơn đã thanh toán" });

      /* Tính tiền & sinh orderCode duy nhất */
      const total = Number(invoice.so_tien_thanh_toan || 0);
      const orderCode = Number(`${invoice.id}${Date.now() % 1e6}`);

      /* Chuẩn bị dữ liệu gửi PayOS */
      const {
        Allocation: {
          Student: { ten = "", email = "", sdt: phone = "" } = {},
          Bed: {
            Room: { ten_phong: roomName = "Phòng KTX" } = {},
            ten_giuong: bedName = "Giường",
          } = {},
        } = {},
      } = invoice;

      const payosResult = await payos.createPaymentLink({
        orderCode,
        amount: total,
        description: "Thanh toán KTX",
        returnUrl: process.env.PAYOS_RETURN_URL,
        cancelUrl: process.env.PAYOS_CANCEL_URL,
        items: [{ name: `Phí ${roomName} – ${bedName}`, quantity: 1, price: total }],
        buyer: { fullName: ten, email, phone },
      });

      /* PayOS phải trả về qrCode + checkoutUrl */
      if (!payosResult?.qrCode || !payosResult?.checkoutUrl)
        throw new Error("PayOS không trả đủ dữ liệu.");

      /* QR → base64 */
      const qrBase64 = (await qrcode.toDataURL(payosResult.qrCode)).split(",")[1];

      /* Cập nhật invoice → pending */
      await invoice.update(
        { order_code: orderCode, order_created_at: new Date(), status: "pending" },
        { transaction: t },
      );
      await t.commit();

      /* Tự hủy sau 5 phút nếu vẫn chưa thanh toán */
      setTimeout(async () => {
        try {
          const again = await HoaDonPhanBoPhong.findByPk(invoice.id);
          if (again?.status === "pending") {
            await again.update({ order_code: null, status: "overdue" });
            console.log(`⏰ Order ${orderCode} – hết hạn sau 5′.`);
          }
        } catch (err) {
          console.error("Auto‑expire error:", err);
        }
      }, 5 * 60 * 1000);

      /* Trả về FE */
      return res.status(201).json({
        checkoutUrl: payosResult.checkoutUrl,
        qrCode: qrBase64,
        orderCode,
        expireIn: 300,
      });
    } catch (err) {
      await t.rollback();
      console.error("createCheckout:", err);
      return res.status(500).json({ message: "Không tạo được phiên thanh toán", detail: err.message });
    }
  },

  
  // Webhook từ PayOS (không cần auth)
  async handlePayOSWebhook(req, res) {
  try {
    /* 1. Xác minh chữ ký – sẽ throw nếu sai */
    const paymentData = payos.verifyPaymentWebhookData(req.body);   // :contentReference[oaicite:0]{index=0}

    /* 2. Chỉ xử lý khi PAID */
    if (paymentData.code !== "00") {
      return res.status(200).json({ message: "Không cần xử lý." });
    }

    const { orderCode, transactionDateTime } = paymentData;

    /* 3. Tìm & cập nhật hóa đơn */
    const invoice = await HoaDonPhanBoPhong.findOne({ where: { order_code: orderCode } });
    if (!invoice) return res.status(404).json({ message: "Không tìm thấy hóa đơn" });
    if (invoice.status === "paid") return res.status(200).json({ message: "Đã cập nhật trước đó" });

    await invoice.update({
      status : "paid",
      paid_at: new Date(transactionDateTime || Date.now()),
    });

    return res.status(200).json({ message: "Đã cập nhật" });

  } catch (err) {
    console.error("Webhook error:", err);
    return res.status(400).json({ message: err.message });
  }
},
};
export default invoiceController;
