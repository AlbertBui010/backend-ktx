import { DataTypes } from "sequelize";
import sequelize from "../config/database.config.js";
import { TABLES, COLUMNS } from "../constants/database.constants.js";

const PhuHuynh = sequelize.define(
  TABLES.PHU_HUYNH,
  {
    [COLUMNS.COMMON.ID]: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    [COLUMNS.PHU_HUYNH.ID_SINH_VIEN]: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: TABLES.SINH_VIEN,
        key: COLUMNS.COMMON.ID,
      },
    },
    [COLUMNS.PHU_HUYNH.TEN]: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 100],
      },
    },
    [COLUMNS.PHU_HUYNH.QUAN_HE]: {
      type: DataTypes.STRING(20),
      allowNull: false,
      validate: {
        isIn: [["Cha", "Mẹ", "Anh", "Chị", "Em", "Ông", "Bà", "Khác"]],
      },
    },
    [COLUMNS.PHU_HUYNH.SDT]: {
      type: DataTypes.STRING(15),
      allowNull: true,
      validate: {
        is: /^[0-9+\-\s()]*$/,
      },
    },
    [COLUMNS.PHU_HUYNH.EMAIL]: {
      type: DataTypes.STRING(100),
      allowNull: true,
      validate: {
        isEmail: true,
      },
    },
    [COLUMNS.PHU_HUYNH.NGHE_NGHIEP]: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    [COLUMNS.PHU_HUYNH.DIA_CHI]: {
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
    tableName: TABLES.PHU_HUYNH,
    timestamps: true,
    createdAt: COLUMNS.COMMON.NGAY_TAO,
    updatedAt: COLUMNS.COMMON.NGAY_CAP_NHAT,
    underscored: true,
    indexes: [
      {
        fields: [COLUMNS.PHU_HUYNH.ID_SINH_VIEN],
      },
      {
        fields: [COLUMNS.PHU_HUYNH.SDT],
      },
      {
        fields: [COLUMNS.PHU_HUYNH.EMAIL],
      },
    ],
  },
);

export default PhuHuynh;
