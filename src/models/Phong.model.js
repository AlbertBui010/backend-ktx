import { DataTypes } from "sequelize";
import sequelize from "../config/database.config.js";
import { TABLES, COLUMNS, ENUM_PHONG_TRANG_THAI, ENUM_PHONG_GIOI_TINH } from "../constants/database.constants.js";

const Phong = sequelize.define(
  TABLES.PHONG,
  {
    [COLUMNS.COMMON.ID]: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    [COLUMNS.PHONG.TEN_PHONG]: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true,
        len: [1, 20],
      },
    },
    [COLUMNS.PHONG.ID_LOAI_PHONG]: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: TABLES.LOAI_PHONG,
        key: COLUMNS.COMMON.ID,
      },
    },
    [COLUMNS.PHONG.SO_TANG]: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        isInt: true,
        min: 1,
        max: 20,
      },
    },
    [COLUMNS.PHONG.TRANG_THAI]: {
      type: DataTypes.ENUM(
        ENUM_PHONG_TRANG_THAI.AVAILABLE,
        ENUM_PHONG_TRANG_THAI.OCCUPIED,
        ENUM_PHONG_TRANG_THAI.MAINTENANCE,
        ENUM_PHONG_TRANG_THAI.RESERVED,
      ),
      allowNull: false,
      defaultValue: ENUM_PHONG_TRANG_THAI.AVAILABLE,
    },
    [COLUMNS.PHONG.GIOI_TINH]: {
      type: DataTypes.ENUM(ENUM_PHONG_GIOI_TINH.NAM, ENUM_PHONG_GIOI_TINH.NU, ENUM_PHONG_GIOI_TINH.HOP_NAM),
      allowNull: false,
      defaultValue: ENUM_PHONG_GIOI_TINH.HOP_NAM,
    },
    [COLUMNS.PHONG.GHI_CHU]: {
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
    tableName: TABLES.PHONG,
    timestamps: true,
    createdAt: COLUMNS.COMMON.NGAY_TAO,
    updatedAt: COLUMNS.COMMON.NGAY_CAP_NHAT,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: [COLUMNS.PHONG.TEN_PHONG],
        where: {
          [COLUMNS.COMMON.DANG_HIEN]: true,
        },
      },
      {
        fields: [COLUMNS.PHONG.ID_LOAI_PHONG],
      },
      {
        fields: [COLUMNS.PHONG.TRANG_THAI],
      },
      {
        fields: [COLUMNS.PHONG.SO_TANG],
      },
    ],
  },
);

export default Phong;
