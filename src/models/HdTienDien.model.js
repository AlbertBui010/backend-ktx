import { DataTypes } from "sequelize";
import sequelize from "../config/database.config.js";
import { TABLES, COLUMNS, ENUM_HD_TIEN_DIEN_TRANG_THAI } from "../constants/database.constants.js";

const HdTienDien = sequelize.define(
  TABLES.HD_TIEN_DIEN,
  {
    [COLUMNS.COMMON.ID]: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    [COLUMNS.HD_TIEN_DIEN.ID_PHONG]: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: TABLES.PHONG,
        key: COLUMNS.COMMON.ID,
      },
      comment: "ID phòng",
    },
    [COLUMNS.HD_TIEN_DIEN.TU_NGAY]: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      comment: "Ngày bắt đầu chu kỳ tính tiền điện",
    },
    [COLUMNS.HD_TIEN_DIEN.DEN_NGAY]: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      comment: "Ngày kết thúc chu kỳ tính tiền điện",
    },
    [COLUMNS.HD_TIEN_DIEN.SO_DIEN_CU]: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 0,
      },
      comment: "Số điện đầu kỳ (kWh)",
    },
    [COLUMNS.HD_TIEN_DIEN.SO_DIEN_MOI]: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 0,
      },
      comment: "Số điện cuối kỳ (kWh)",
    },
    [COLUMNS.HD_TIEN_DIEN.ID_DON_GIA_DIEN]: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: TABLES.DON_GIA_DIEN,
        key: COLUMNS.COMMON.ID,
      },
      comment: "ID đơn giá điện áp dụng",
    },
    [COLUMNS.HD_TIEN_DIEN.SO_DIEN_TIEU_THU]: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: "Số điện tiêu thử trong kỳ (kWh) = so_dien_moi - so_dien_cu",
    },
    [COLUMNS.HD_TIEN_DIEN.THANH_TIEN]: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
      comment: "Tổng tiền điện của phòng (VND)",
    },
    [COLUMNS.HD_TIEN_DIEN.TRANG_THAI]: {
      type: DataTypes.ENUM(
        ENUM_HD_TIEN_DIEN_TRANG_THAI.DRAFT,
        ENUM_HD_TIEN_DIEN_TRANG_THAI.CALCULATED,
        ENUM_HD_TIEN_DIEN_TRANG_THAI.FINALIZED,
        ENUM_HD_TIEN_DIEN_TRANG_THAI.CANCELLED,
      ),
      allowNull: false,
      defaultValue: ENUM_HD_TIEN_DIEN_TRANG_THAI.DRAFT,
    },
    [COLUMNS.HD_TIEN_DIEN.GHI_CHU]: {
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
    tableName: TABLES.HD_TIEN_DIEN,
    timestamps: false,
    hooks: {
      beforeUpdate: (hdTienDien) => {
        hdTienDien[COLUMNS.COMMON.NGAY_CAP_NHAT] = new Date();
      },
      beforeSave: (hdTienDien) => {
        // Tự động tính số điện tiêu thụ và thành tiền
        hdTienDien[COLUMNS.HD_TIEN_DIEN.SO_DIEN_TIEU_THU] =
          hdTienDien[COLUMNS.HD_TIEN_DIEN.SO_DIEN_MOI] - hdTienDien[COLUMNS.HD_TIEN_DIEN.SO_DIEN_CU];
      },
    },
  },
);

export default HdTienDien;
