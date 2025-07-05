// src/controllers/invoice.controller.js
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

/* -------------------------------------------------------------------------- */
/*  Helper: Lấy HĐ + Allocation kèm Room info & kiểm quyền                    */
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
        as: "Allocation",               // alias đặt ở models/index
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

  /* --- Quyền: sinh viên chỉ xem HĐ của mình --- */
  if (
    user &&
    user.type === "sinh_vien" &&
    invoice.Allocation[COLUMNS.PHAN_BO_PHONG.ID_SV] !== user.id
  ) {
    throw new Error("Bạn không có quyền truy cập hóa đơn này");
  }

  return invoice;
};

/* -------------------------------------------------------------------------- */
/*  CONTROLLER                                                                */
/* -------------------------------------------------------------------------- */
export const invoiceController = {
  /* -------------------------------------------------------------------- */
  /*  STAFF – GET /invoices?status=&page=&limit=                          */
  /* -------------------------------------------------------------------- */
  async getAll(req, res) {
    try {
      const { page = 1, limit = 20, status } = req.query;
      const offset = (page - 1) * limit;

      const where = { [COLUMNS.COMMON.DANG_HIEN]: true };
      if (status) where.status = status; // status = pending|paid|overdue

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
        data:{invoices: rows},
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

  /* -------------------------------------------------------------------- */
  /*  STUDENT – GET /invoices/my                                          */
  /* -------------------------------------------------------------------- */
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
                model: Giuong,
                as: "Bed",
                include: [{ model: Phong, as: "Room" }],
              },
            ],
          },
        ],
        order: [["created_at", "DESC"]],
      });

      return res.status(200).json({ invoices });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  },

  /* -------------------------------------------------------------------- */
  /*  GET /invoices/:allocationId                                         */
  /* -------------------------------------------------------------------- */
  async getOne(req, res) {
    try {
      const invoice = await getInvoiceWithAllocation(
        req.params.allocationId,
        req.user
      );
      return res.status(200).json(invoice);
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }
  },

  /* -------------------------------------------------------------------- */
  /*  POST /invoices/:allocationId/checkout                               */
  /* -------------------------------------------------------------------- */
  async createCheckout(req, res) {
    const t = await sequelize.transaction();
    try {
      const invoice = await getInvoiceWithAllocation(
        req.params.allocationId,
        req.user
      );

      if (invoice.status === "paid")
        return res.status(409).json({ message: "Hóa đơn đã thanh toán" });

      const totalAmount =
        invoice[COLUMNS.HD_PHAN_BO_PHONG.SO_TIEN_THANH_TOAN] ?? 0;

      /* 1) Gọi PayOS */
      const orderCode = `INV-${invoice.id}-${Date.now()}`;
      const result = await payos.createPaymentLink({
        orderCode,
        amount: totalAmount,
        description: `Thanh toán KTX cho sinh viên ${invoice.Allocation.Student?.ten ?? ""}`,
        returnUrl: process.env.PAYOS_RETURN_URL,
        cancelUrl: process.env.PAYOS_CANCEL_URL,
      });

      /* 2) Lưu orderCode để khớp webhook (optional) */
      await invoice.update({ order_code: orderCode }, { transaction: t });
      await t.commit();

      return res.status(201).json({ checkoutUrl: result.checkoutUrl });
    } catch (err) {
      await t.rollback();
      return res
        .status(500)
        .json({ message: "Không tạo được phiên thanh toán", detail: err.message });
    }
  },

  /* -------------------------------------------------------------------- */
  /*  POST /invoices/payos-webhook                                        */
  /* -------------------------------------------------------------------- */
  async handlePayOSWebhook(req, res) {
    try {
      const data = payos.verifyPaymentWebhook(req.body);
      const { orderCode, status } = data; // PAID | ...

      // orderCode: INV-<invoiceId>-timestamp
      const invoiceId = orderCode?.split("-")[1];

      if (status === "PAID" && invoiceId) {
        await HoaDonPhanBoPhong.update(
          { status: "paid" },
          { where: { id: invoiceId } }
        );
        // Đồng thời update Allocation
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