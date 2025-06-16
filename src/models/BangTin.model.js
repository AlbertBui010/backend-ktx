// src/models/BangTin.js
import { DataTypes } from "sequelize";
import sequelize from "../config/database.config.js";
import { TABLES, COLUMNS } from "../constants/database.constants.js";

const BangTin = sequelize.define(
  TABLES.BANG_TIN,
  {
    [COLUMNS.COMMON.ID]: { // Sử dụng cột ID chung
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    [COLUMNS.BANG_TIN.TIEU_DE]: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true, // Đảm bảo tiêu đề là duy nhất
      validate: {
        notEmpty: true,
      },
    },
    [COLUMNS.BANG_TIN.MO_TA]: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    [COLUMNS.BANG_TIN.NOI_DUNG]: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    [COLUMNS.BANG_TIN.HINH_NEN]: {
      type: DataTypes.STRING(255), // Lưu đường dẫn hoặc URL của hình ảnh
      allowNull: true,
    },
    [COLUMNS.BANG_TIN.ID_CHU_DE]: { // <-- Cột khóa ngoại mới
      type: DataTypes.INTEGER,
      allowNull: false, // Bản tin phải thuộc về một chủ đề
      references: {
        model: TABLES.CHU_DE, // Tham chiếu đến bảng ChuDe
        key: COLUMNS.COMMON.ID,
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
    tableName: TABLES.BANG_TIN,
    timestamps: true,
    createdAt: COLUMNS.COMMON.NGAY_TAO,
    updatedAt: COLUMNS.COMMON.NGAY_CAP_NHAT,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: [COLUMNS.BANG_TIN.TIEU_DE],
        where: {
          [COLUMNS.COMMON.DANG_HIEN]: true,
        },
      },
      { // Thêm index cho khóa ngoại
        fields: [COLUMNS.BANG_TIN.ID_CHU_DE],
      },
    ],
  },
);

export default BangTin;
