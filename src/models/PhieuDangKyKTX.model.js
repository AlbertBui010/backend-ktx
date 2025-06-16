import { DataTypes } from "sequelize";
import sequelize from "../config/database.config.js";
import { 
  TABLES, 
  COLUMNS, 
  ENUM_PHIEU_DANG_KY_KTX_TRANG_THAI 
} from "../constants/database.constants.js";

const PhieuDangKyKTX = sequelize.define(
  TABLES.PHIEU_DANG_KY_KTX,
  {
    [COLUMNS.COMMON.ID]: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    [COLUMNS.PHIEU_DANG_KY_KTX.ID_SV]: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: TABLES.SINH_VIEN,
        key: COLUMNS.COMMON.ID,
      },
    },
    [COLUMNS.PHIEU_DANG_KY_KTX.NAM_HOC]: {
      type: DataTypes.STRING(20),
      allowNull: false,
      validate: {
        notEmpty: true,
        is: /^\d{4}-\d{4}$/, // Format: YYYY-YYYY
      },
    },
    [COLUMNS.PHIEU_DANG_KY_KTX.NGAY_DANG_KY]: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    [COLUMNS.PHIEU_DANG_KY_KTX.GHI_CHU]: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    [COLUMNS.PHIEU_DANG_KY_KTX.TRANG_THAI]: {
      type: DataTypes.ENUM(
        ENUM_PHIEU_DANG_KY_KTX_TRANG_THAI.PENDING,
        ENUM_PHIEU_DANG_KY_KTX_TRANG_THAI.APPROVED,
        ENUM_PHIEU_DANG_KY_KTX_TRANG_THAI.REJECTED,
        ENUM_PHIEU_DANG_KY_KTX_TRANG_THAI.CANCELLED
      ),
      allowNull: false,
      defaultValue: ENUM_PHIEU_DANG_KY_KTX_TRANG_THAI.PENDING,
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
    tableName: TABLES.PHIEU_DANG_KY_KTX,
    timestamps: false,
    hooks: {
      beforeUpdate: (phieu) => {
        phieu[COLUMNS.COMMON.NGAY_CAP_NHAT] = new Date();
      },
    },
    indexes: [
      {
        unique: true,
        fields: [COLUMNS.PHIEU_DANG_KY_KTX.ID_SV, COLUMNS.PHIEU_DANG_KY_KTX.NAM_HOC],
        name: 'unique_application_per_year'
      }
    ],
  }
);

export default PhieuDangKyKTX;
