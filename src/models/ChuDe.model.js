import { DataTypes } from "sequelize";
import sequelize from "../config/database.config.js";
import { TABLES, COLUMNS } from "../constants/database.constants.js";

const ChuDe = sequelize.define(
  TABLES.CHU_DE,
  {
    [COLUMNS.COMMON.ID]: { // Sử dụng cột ID chung
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    [COLUMNS.CHU_DE.TEN_CHU_DE]: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true, // Tên chủ đề là duy nhất
      validate: {
        notEmpty: true,
      },
    },
    [COLUMNS.CHU_DE.MO_TA]: {
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
  },
  {
    tableName: TABLES.CHU_DE,
    timestamps: true,
    createdAt: COLUMNS.COMMON.NGAY_TAO,
    updatedAt: COLUMNS.COMMON.NGAY_CAP_NHAT,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: [COLUMNS.CHU_DE.TEN_CHU_DE],
        where: {
          [COLUMNS.COMMON.DANG_HIEN]: true,
        },
      },
    ],
  },
);

export default ChuDe;
