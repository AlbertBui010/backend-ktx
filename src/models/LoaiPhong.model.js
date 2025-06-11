import { DataTypes } from "sequelize";
import sequelize from "../config/database.config.js";
import { TABLES, COLUMNS } from "../constants/database.constants.js";

const LoaiPhong = sequelize.define(
  TABLES.LOAI_PHONG,
  {
    [COLUMNS.COMMON.ID]: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    [COLUMNS.LOAI_PHONG.TEN_LOAI]: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 50],
      },
    },
    [COLUMNS.LOAI_PHONG.SO_GIUONG]: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        isInt: true,
        min: 1,
        max: 10,
      },
    },
    [COLUMNS.LOAI_PHONG.DIEN_TICH]: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      validate: {
        isDecimal: true,
        min: 0,
      },
    },
    [COLUMNS.LOAI_PHONG.MO_TA]: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    [COLUMNS.LOAI_PHONG.GIA_THUE]: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      validate: {
        isDecimal: true,
        min: 0,
      },
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
    tableName: TABLES.LOAI_PHONG,
    timestamps: true,
    createdAt: COLUMNS.COMMON.NGAY_TAO,
    updatedAt: COLUMNS.COMMON.NGAY_CAP_NHAT,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: [COLUMNS.LOAI_PHONG.TEN_LOAI],
        where: {
          [COLUMNS.COMMON.DANG_HIEN]: true,
        },
      },
    ],
  },
);

export default LoaiPhong;
