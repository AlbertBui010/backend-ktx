import { DataTypes } from "sequelize";
import sequelize from "../config/database.config.js";
import { TABLES, COLUMNS, ENUM_PHIEU_DANG_KY_TRANG_THAI } from "../constants/database.constants.js";

const PhieuDangKy = sequelize.define(
  TABLES.PHIEU_DANG_KY_KTX,
  {
    [COLUMNS.COMMON.ID]: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    [COLUMNS.PHIEU_DANG_KY_KTX.ID_SINH_VIEN]: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: TABLES.SINH_VIEN,
        key: COLUMNS.COMMON.ID,
      },
    },
    [COLUMNS.PHIEU_DANG_KY_KTX.NGAY_DANG_KY]: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    [COLUMNS.PHIEU_DANG_KY_KTX.NGAY_BAT_DAU]: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    [COLUMNS.PHIEU_DANG_KY_KTX.NGAY_KET_THUC]: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    [COLUMNS.PHIEU_DANG_KY_KTX.TRANG_THAI]: {
      type: DataTypes.ENUM(
        ENUM_PHIEU_DANG_KY_TRANG_THAI.PENDING,
        ENUM_PHIEU_DANG_KY_TRANG_THAI.APPROVED,
        ENUM_PHIEU_DANG_KY_TRANG_THAI.REJECTED,
        ENUM_PHIEU_DANG_KY_TRANG_THAI.CANCELLED,
      ),
      allowNull: false,
      defaultValue: ENUM_PHIEU_DANG_KY_TRANG_THAI.PENDING,
    },
    [COLUMNS.PHIEU_DANG_KY_KTX.LY_DO_DANG_KY]: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    [COLUMNS.PHIEU_DANG_KY_KTX.GHI_CHU]: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    [COLUMNS.PHIEU_DANG_KY_KTX.NGUOI_DUYET]: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: TABLES.NHAN_VIEN,
        key: COLUMNS.COMMON.ID,
      },
    },
    [COLUMNS.PHIEU_DANG_KY_KTX.NGAY_DUYET]: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    [COLUMNS.PHIEU_DANG_KY_KTX.LY_DO_TU_CHOI]: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    [COLUMNS.COMMON.NGUOI_TAO]: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: TABLES.NHAN_VIEN,
        key: COLUMNS.COMMON.ID,
      },
    },
    [COLUMNS.COMMON.NGUOI_CAP_NHAT]: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: TABLES.NHAN_VIEN,
        key: COLUMNS.COMMON.ID,
      },
    },
    [COLUMNS.COMMON.DANG_HIEN]: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    tableName: TABLES.PHIEU_DANG_KY_KTX,
    timestamps: true,
    createdAt: COLUMNS.COMMON.NGAY_TAO,
    updatedAt: COLUMNS.COMMON.NGAY_CAP_NHAT,
    underscored: true,
    indexes: [
      {
        fields: [COLUMNS.PHIEU_DANG_KY_KTX.ID_SINH_VIEN],
      },
      {
        fields: [COLUMNS.PHIEU_DANG_KY_KTX.TRANG_THAI],
      },
      {
        fields: [COLUMNS.PHIEU_DANG_KY_KTX.NGAY_DANG_KY],
      },
      {
        fields: [COLUMNS.PHIEU_DANG_KY_KTX.NGUOI_DUYET],
      },
    ],
  },
);

export default PhieuDangKy;
