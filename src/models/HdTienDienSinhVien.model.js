import { DataTypes } from "sequelize";
import sequelize from "../config/database.config.js";
import { TABLES, COLUMNS, ENUM_HD_TIEN_DIEN_SV_TRANG_THAI } from "../constants/database.constants.js";

const HdTienDienSinhVien = sequelize.define(
  TABLES.HD_TIEN_DIEN_SINH_VIEN,
  {
    [COLUMNS.COMMON.ID]: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    [COLUMNS.HD_TIEN_DIEN_SINH_VIEN.ID_HD_TIEN_DIEN]: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: TABLES.HD_TIEN_DIEN,
        key: COLUMNS.COMMON.ID,
      },
      comment: "ID hóa đơn tiền điện phòng",
    },
    [COLUMNS.HD_TIEN_DIEN_SINH_VIEN.ID_SINH_VIEN]: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: TABLES.SINH_VIEN,
        key: COLUMNS.COMMON.ID,
      },
      comment: "ID sinh viên",
    },
    [COLUMNS.HD_TIEN_DIEN_SINH_VIEN.ID_PHAN_BO_PHONG]: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: TABLES.PHAN_BO_PHONG,
        key: COLUMNS.COMMON.ID,
      },
      comment: "ID phân bổ phòng để trace lịch sử",
    },
    [COLUMNS.HD_TIEN_DIEN_SINH_VIEN.SO_NGAY_O]: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 0,
      },
      comment: "Số ngày thực tế ở trong chu kỳ",
    },
    [COLUMNS.HD_TIEN_DIEN_SINH_VIEN.TY_LE_CHIA]: {
      type: DataTypes.DECIMAL(5, 4),
      allowNull: false,
      validate: {
        min: 0,
        max: 1,
      },
      comment: "Tỷ lệ chia tiền điện (0.0000 - 1.0000)",
    },
    [COLUMNS.HD_TIEN_DIEN_SINH_VIEN.SO_TIEN_PHAI_TRA]: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      validate: {
        min: 0,
      },
      comment: "Số tiền sinh viên phải trả (VND)",
    },
    [COLUMNS.HD_TIEN_DIEN_SINH_VIEN.TRANG_THAI_THANH_TOAN]: {
      type: DataTypes.ENUM(
        ENUM_HD_TIEN_DIEN_SV_TRANG_THAI.UNPAID,
        ENUM_HD_TIEN_DIEN_SV_TRANG_THAI.PAID,
        ENUM_HD_TIEN_DIEN_SV_TRANG_THAI.PARTIAL_PAID,
        ENUM_HD_TIEN_DIEN_SV_TRANG_THAI.OVERDUE,
        ENUM_HD_TIEN_DIEN_SV_TRANG_THAI.CANCELLED,
      ),
      allowNull: false,
      defaultValue: ENUM_HD_TIEN_DIEN_SV_TRANG_THAI.UNPAID,
    },
    [COLUMNS.HD_TIEN_DIEN_SINH_VIEN.NGAY_THANH_TOAN]: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: "Ngày thanh toán",
    },
    [COLUMNS.HD_TIEN_DIEN_SINH_VIEN.SO_TIEN_DA_TRA]: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
      comment: "Số tiền đã trả (VND)",
    },
    [COLUMNS.HD_TIEN_DIEN_SINH_VIEN.PHUONG_THUC_THANH_TOAN]: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: "Phương thức thanh toán (cash, bank_transfer, digital_wallet, etc.)",
    },
    [COLUMNS.HD_TIEN_DIEN_SINH_VIEN.MA_GIAO_DICH]: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: "Mã giao dịch thanh toán",
    },
    [COLUMNS.HD_TIEN_DIEN_SINH_VIEN.GHI_CHU]: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Ghi chú",
    },
    [COLUMNS.COMMON.DANG_HIEN]: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    [COLUMNS.COMMON.NGAY_TAO]: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    [COLUMNS.COMMON.NGAY_CAP_NHAT]: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    [COLUMNS.COMMON.NGUOI_TAO]: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    [COLUMNS.COMMON.NGUOI_CAP_NHAT]: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    tableName: TABLES.HD_TIEN_DIEN_SINH_VIEN,
    timestamps: false,
    hooks: {
      beforeUpdate: (hdTienDienSinhVien) => {
        hdTienDienSinhVien[COLUMNS.COMMON.NGAY_CAP_NHAT] = new Date();

        // Tự động cập nhật trạng thái thanh toán dựa trên số tiền đã trả
        if (
          hdTienDienSinhVien[COLUMNS.HD_TIEN_DIEN_SINH_VIEN.SO_TIEN_DA_TRA] >=
          hdTienDienSinhVien[COLUMNS.HD_TIEN_DIEN_SINH_VIEN.SO_TIEN_PHAI_TRA]
        ) {
          hdTienDienSinhVien[COLUMNS.HD_TIEN_DIEN_SINH_VIEN.TRANG_THAI_THANH_TOAN] =
            ENUM_HD_TIEN_DIEN_SV_TRANG_THAI.PAID;
          if (!hdTienDienSinhVien[COLUMNS.HD_TIEN_DIEN_SINH_VIEN.NGAY_THANH_TOAN]) {
            hdTienDienSinhVien[COLUMNS.HD_TIEN_DIEN_SINH_VIEN.NGAY_THANH_TOAN] = new Date();
          }
        } else if (hdTienDienSinhVien[COLUMNS.HD_TIEN_DIEN_SINH_VIEN.SO_TIEN_DA_TRA] > 0) {
          hdTienDienSinhVien[COLUMNS.HD_TIEN_DIEN_SINH_VIEN.TRANG_THAI_THANH_TOAN] =
            ENUM_HD_TIEN_DIEN_SV_TRANG_THAI.PARTIAL_PAID;
        }
      },
    },
  },
);

export default HdTienDienSinhVien;
