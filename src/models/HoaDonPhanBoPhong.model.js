import { DataTypes } from "sequelize";
import sequelize from "../config/database.config.js";
import { TABLES, COLUMNS } from "../constants/database.constants.js";

const HoaDonPhanBoPhong = sequelize.define(
  TABLES.HD_PHAN_BO_PHONG,
  {
    [COLUMNS.COMMON.ID]: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    [COLUMNS.HD_PHAN_BO_PHONG.ID_PHAN_BO_PHONG]: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: TABLES.PHAN_BO_PHONG,
        key: COLUMNS.COMMON.ID,
      },
    },
    [COLUMNS.HD_PHAN_BO_PHONG.SO_TIEN_THANH_TOAN]: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      validate: {
        isDecimal: true,
        min: 0,
      },
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
    tableName: TABLES.HD_PHAN_BO_PHONG,
    timestamps: false,
    underscored: true,
    indexes: [
      {
        fields: [COLUMNS.HD_PHAN_BO_PHONG.ID_PHAN_BO_PHONG],
      },
    ],
  }
);

export default HoaDonPhanBoPhong;