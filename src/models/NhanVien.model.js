import { DataTypes } from "sequelize";
import sequelize from "../config/database.config.js";
import {
  TABLES,
  COLUMNS,
  ENUM_NHAN_VIEN_PHAI,
  ENUM_NHAN_VIEN_ROLE,
  ENUM_NHAN_VIEN_TRANG_THAI,
} from "../constants/database.constants.js";

const NhanVien = sequelize.define(
  TABLES.NHAN_VIEN,
  {
    [COLUMNS.COMMON.ID]: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    [COLUMNS.NHAN_VIEN.MA_NV]: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true,
        len: [3, 20],
      },
    },
    [COLUMNS.NHAN_VIEN.TEN]: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 100],
      },
    },
    [COLUMNS.NHAN_VIEN.MAT_KHAU]: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    [COLUMNS.NHAN_VIEN.ROLE]: {
      type: DataTypes.ENUM(ENUM_NHAN_VIEN_ROLE.ADMIN, ENUM_NHAN_VIEN_ROLE.STAFF),
      allowNull: false,
      defaultValue: ENUM_NHAN_VIEN_ROLE.STAFF,
    },
    [COLUMNS.NHAN_VIEN.SDT]: {
      type: DataTypes.STRING(15),
      allowNull: true,
      validate: {
        is: /^[0-9+\-\s()]*$/,
      },
    },
    [COLUMNS.NHAN_VIEN.EMAIL]: {
      type: DataTypes.STRING(100),
      allowNull: true,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    [COLUMNS.NHAN_VIEN.CMND]: {
      type: DataTypes.STRING(20),
      allowNull: true,
      unique: true,
      validate: {
        len: [9, 20],
      },
    },
    [COLUMNS.NHAN_VIEN.PHAI]: {
      type: DataTypes.ENUM(ENUM_NHAN_VIEN_PHAI.NAM, ENUM_NHAN_VIEN_PHAI.NU, ENUM_NHAN_VIEN_PHAI.KHAC),
      allowNull: true,
    },
    [COLUMNS.NHAN_VIEN.PHONG_BAN]: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    [COLUMNS.NHAN_VIEN.NGAY_VAO_LAM]: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    [COLUMNS.NHAN_VIEN.TRANG_THAI]: {
      type: DataTypes.ENUM(
        ENUM_NHAN_VIEN_TRANG_THAI.ACTIVE,
        ENUM_NHAN_VIEN_TRANG_THAI.INACTIVE,
        ENUM_NHAN_VIEN_TRANG_THAI.SUSPENDED,
      ),
      allowNull: false,
      defaultValue: ENUM_NHAN_VIEN_TRANG_THAI.ACTIVE,
    },
    [COLUMNS.NHAN_VIEN.NGAY_SINH]: {
      type: DataTypes.DATEONLY,
      allowNull: true,
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
    tableName: TABLES.NHAN_VIEN,
    timestamps: false,
    hooks: {
      beforeUpdate: (nhanVien) => {
        nhanVien[COLUMNS.COMMON.NGAY_CAP_NHAT] = new Date();
      },
    },
  },
);

// Instance methods
NhanVien.prototype.toJSON = function () {
  const values = Object.assign({}, this.get());
  delete values[COLUMNS.NHAN_VIEN.MAT_KHAU]; // Remove password from JSON response
  return values;
};

export default NhanVien;
