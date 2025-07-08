// invoices.controller.js
import "dotenv/config";
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
import qrcode from "qrcode";
import crypto from "crypto";

/* -------------------------------------------------------------------------- */
/* Helper: lấy invoice + bed/room + kiểm quyền                               */
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
/* Helper: build & verify PayOS signature                                     */
/* -------------------------------------------------------------------------- */
const checksumKey = process.env.PAYOS_CHECKSUM_KEY;

/** Sort object keys, stringify arrays → "k1=v1&k2=v2…"  */
const buildSignaturePayload = (obj) => {
  return Object.keys(obj)
    .sort()
    .map((k) => {
      let v = obj[k];
      if (v === null || v === undefined) v = "";
      if (Array.isArray(v))
        v = JSON.stringify(
          v.map((el) => {
            const orderedEl = {};
            Object.keys(el)
              .sort()
              .forEach((key) => (orderedEl[key] = el[key]));
            return orderedEl;
          })
        );
      return `${k}=${v}`;
    })
    .join("&");
};

const isValidSignature = (data, signature) => {
  if (!checksumKey) throw new Error("PAYOS_CHECKSUM_KEY chưa khai báo");
  const raw = buildSignaturePayload(data);
  const expected = crypto
    .createHmac("sha256", checksumKey)
    .update(raw)
    .digest("hex");
  return expected === signature;
};

/* -------------------------------------------------------------------------- */
/* CONTROLLER                                                                 */
/* -------------------------------------------------------------------------- */
export const invoiceController = {
  /* -------------------- 1. Nhân viên: tất cả hóa đơn --------------------- */
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
                include: [{ model: Phong, as: "Room" }],
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

  /* ------------------- 2. Sinh viên: hóa đơn của mình -------------------- */
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
              { model: SinhVien, as: "Student" },
              {
                model: Giuong,
                as: "Bed",
                include: [{ model: Phong, as: "Room" }],
              },
            ],
          },
        ],
        order: [[COLUMNS.COMMON.NGAY_TAO, "DESC"]],
      });
      res.status(200).json(invoices);
    } catch (err) {
      console.error("getMyInvoices:", err);
      res.status(500).json({ message: err.message });
    }
  },

  /* ------------------ 3. Lấy một hóa đơn theo allocation ----------------- */
  async getOne(req, res) {
    try {
      const invoice = await getInvoiceWithAllocation(
        req.params.allocationId,
        req.user,
      );
      res.status(200).json({ data: { invoice }, message: "Lấy hóa đơn thành công" });
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  },

  /* ------------------- 4. Sinh viên: tạo checkout PayOS ------------------ */
  async createCheckout(req, res) {
    const t = await sequelize.transaction();
    try {
      const { allocationId } = req.params;
      const invoice = await getInvoiceWithAllocation(allocationId, req.user);

      if (invoice.status === "paid")
        return res.status(409).json({ message: "Hóa đơn đã thanh toán" });

      /* orderCode = {id}{6 số millis cuối} */
      const total = Number(invoice.so_tien_thanh_toan || 0);
      const orderCode = Number(`${invoice.id}${Date.now() % 1e6}`);

      /* student / room info */
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

      if (!payosResult?.qrCode || !payosResult?.checkoutUrl)
        throw new Error("PayOS không trả đủ dữ liệu");

      const qrBase64 = (await qrcode.toDataURL(payosResult.qrCode)).split(",")[1];

      await invoice.update(
        { order_code: orderCode, order_created_at: new Date(), status: "pending" },
        { transaction: t },
      );
      await t.commit();

      /* Auto‑expire sau 5′ nếu chưa thanh toán */
      setTimeout(async () => {
        try {
          const again = await HoaDonPhanBoPhong.findByPk(invoice.id);
          if (again?.status === "pending") {
            await again.update({ order_code: null, status: "overdue" });
            console.log(`⏰ Order ${orderCode} – hết hạn sau 5′`);
          }
        } catch (err) {
          console.error("Auto‑expire error:", err);
        }
      }, 5 * 60 * 1000);

      return res.status(201).json({
        checkoutUrl: payosResult.checkoutUrl,
        qrCode: qrBase64,
        orderCode,
        expireIn: 300,
      });
    } catch (err) {
      await t.rollback();
      console.error("createCheckout:", err);
      res
        .status(500)
        .json({ message: "Không tạo được phiên thanh toán", detail: err.message });
    }
  },

  /* --------------------------- 5. PayOS Webhook -------------------------- */
  async handlePayOSWebhook(req, res) {
  const t = await sequelize.transaction();
  try {
    /* 1. Lấy raw body */
    const rawBody = req.body.toString("utf8");
    const payload = JSON.parse(rawBody);

    /** -------------------------------------------------
     *  PayOS trả về:
     *  { code: "00", desc: "...", data: {...}, signature: "..." }
     *  => success = true <=> (success === true) || (code === "00")
     * ------------------------------------------------- */
    const { data, signature, success, code } = payload || {};
    const isSuccess = success !== undefined ? success : code === "00";

    if (!isSuccess || !data)
      return res.status(400).json({ message: "Thiếu dữ liệu webhook" });

    /* 2. Xác thực chữ ký – bỏ qua khi PayOS trả về SIMULATED_SIGNATURE (sandbox) */
    const isSimulated = signature === "SIMULATED_SIGNATURE";
    if (!isSimulated && !isValidSignature(data, signature))
      return res.status(400).json({ message: "Chữ ký không hợp lệ" });

    /* 3. Xử lý nghiệp vụ (giữ nguyên khối cũ) */
    const {
      orderCode,
      amount,
      reference,
      transactionDateTime,
      paymentLinkId,
    } = data;

    const invoice = await HoaDonPhanBoPhong.findOne(
      { where: { order_code: orderCode } },
      { transaction: t }
    );

    if (!invoice) {
      console.warn("⛔️ Không tìm thấy invoice:", orderCode);
      await t.commit();
      return res.status(200).json({ success: true });
    }

    if (Number(invoice.so_tien_thanh_toan || 0) !== Number(amount))
      console.warn(
        `⚠️ Số tiền không khớp (local ${invoice.so_tien_thanh_toan} ≠ webhook ${amount})`
      );

    if (invoice.status !== "paid") {
      await invoice.update(
        {
          status: "paid",
          reference,
          payment_link_id: paymentLinkId,
          paid_at: new Date(transactionDateTime || Date.now()),
        },
        { transaction: t }
      );
    }

    await t.commit();
    return res.status(200).json({ success: true });
  } catch (err) {
    await t.rollback();
    console.error("PayOS Webhook error:", err);
    res.status(500).json({ message: "Xử lý webhook thất bại" });
  }
},
};

export default invoiceController;
