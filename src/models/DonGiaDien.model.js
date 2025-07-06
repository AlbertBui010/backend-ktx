import { DataTypes } from "sequelize";
import sequelize from "../config/database.config.js";
import { TABLES, COLUMNS } from "../constants/database.constants.js";

const DonGiaDien = sequelize.define(
  TABLES.DON_GIA_DIEN,
  {
    [COLUMNS.COMMON.ID]: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    [COLUMNS.DON_GIA_DIEN.DON_GIA]: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      validate: {
        min: 0,
      },
      comment: "Đơn giá điện (VND/kWh)",
    },
    [COLUMNS.DON_GIA_DIEN.TU_NGAY]: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      comment: "Ngày bắt đầu áp dụng đơn giá",
    },
    [COLUMNS.DON_GIA_DIEN.DEN_NGAY]: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      comment: "Ngày kết thúc áp dụng đơn giá (null = áp dụng đến khi có đơn giá mới)",
    },
    [COLUMNS.DON_GIA_DIEN.GHI_CHU]: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Ghi chú về đơn giá điện",
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
    tableName: TABLES.DON_GIA_DIEN,
    timestamps: false,
    hooks: {
      beforeUpdate: (donGia) => {
        donGia[COLUMNS.COMMON.NGAY_CAP_NHAT] = new Date();
      },
    },
    indexes: [
      {
        fields: [COLUMNS.DON_GIA_DIEN.TU_NGAY, COLUMNS.DON_GIA_DIEN.DEN_NGAY],
        name: "idx_don_gia_dien_date_range",
      },
      {
        fields: [COLUMNS.COMMON.DANG_HIEN],
        name: "idx_don_gia_dien_dang_hien",
      },
    ],
  },
);

export default DonGiaDien;
