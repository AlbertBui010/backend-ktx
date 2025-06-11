import { DataTypes } from "sequelize";
import sequelize from "../config/database.config.js";
import { TABLES, COLUMNS, ENUM_GIUONG_TRANG_THAI } from "../constants/database.constants.js";

const Giuong = sequelize.define(
  TABLES.GIUONG,
  {
    [COLUMNS.COMMON.ID]: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    [COLUMNS.GIUONG.TEN_GIUONG]: {
      type: DataTypes.STRING(20),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 20],
      },
    },
    [COLUMNS.GIUONG.ID_PHONG]: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: TABLES.PHONG,
        key: COLUMNS.COMMON.ID,
      },
    },
    [COLUMNS.GIUONG.TRANG_THAI]: {
      type: DataTypes.ENUM(
        ENUM_GIUONG_TRANG_THAI.AVAILABLE,
        ENUM_GIUONG_TRANG_THAI.OCCUPIED,
        ENUM_GIUONG_TRANG_THAI.MAINTENANCE,
        ENUM_GIUONG_TRANG_THAI.RESERVED,
      ),
      allowNull: false,
      defaultValue: ENUM_GIUONG_TRANG_THAI.AVAILABLE,
    },
    [COLUMNS.GIUONG.ID_SINH_VIEN]: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: TABLES.SINH_VIEN,
        key: COLUMNS.COMMON.ID,
      },
    },
    [COLUMNS.GIUONG.GHI_CHU]: {
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
    tableName: TABLES.GIUONG,
    timestamps: true,
    createdAt: COLUMNS.COMMON.NGAY_TAO,
    updatedAt: COLUMNS.COMMON.NGAY_CAP_NHAT,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: [COLUMNS.GIUONG.TEN_GIUONG, COLUMNS.GIUONG.ID_PHONG],
        where: {
          [COLUMNS.COMMON.DANG_HIEN]: true,
        },
      },
      {
        fields: [COLUMNS.GIUONG.ID_PHONG],
      },
      {
        fields: [COLUMNS.GIUONG.TRANG_THAI],
      },
      {
        unique: true,
        fields: [COLUMNS.GIUONG.ID_SINH_VIEN],
        where: {
          [COLUMNS.GIUONG.ID_SINH_VIEN]: {
            [sequelize.Sequelize.Op.ne]: null,
          },
          [COLUMNS.COMMON.DANG_HIEN]: true,
        },
      },
    ],
  },
);

export default Giuong;
