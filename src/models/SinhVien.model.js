import { DataTypes } from "sequelize";
import sequelize from "../config/database.config.js";
import { TABLES, COLUMNS, ENUM_SINH_VIEN_TRANG_THAI } from "../constants/database.constants.js";

const SinhVien = sequelize.define(
  TABLES.SINH_VIEN,
  {
    [COLUMNS.COMMON.ID]: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    [COLUMNS.SINH_VIEN.MSSV]: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true,
        len: [8, 20],
      },
    },
    [COLUMNS.SINH_VIEN.TEN]: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 100],
      },
    },
    [COLUMNS.SINH_VIEN.DIA_CHI]: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    [COLUMNS.SINH_VIEN.PHAI]: {
      type: DataTypes.STRING(10),
      allowNull: true,
      validate: {
        isIn: [["Nam", "Nữ", "Khác"]],
      },
    },
    [COLUMNS.SINH_VIEN.NGAY_SINH]: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    [COLUMNS.SINH_VIEN.NOI_SINH]: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    [COLUMNS.SINH_VIEN.DAN_TOC]: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    [COLUMNS.SINH_VIEN.TON_GIAO]: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    [COLUMNS.SINH_VIEN.KHOA]: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    [COLUMNS.SINH_VIEN.SDT]: {
      type: DataTypes.STRING(15),
      allowNull: true,
      validate: {
        is: /^[0-9+\-\s()]*$/,
      },
    },
    [COLUMNS.SINH_VIEN.CMND]: {
      type: DataTypes.STRING(20),
      allowNull: true,
      unique: true,
      validate: {
        len: [9, 20],
      },
    },
    [COLUMNS.SINH_VIEN.NGAY_CAP_CMND]: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    [COLUMNS.SINH_VIEN.NOI_CAP_CMND]: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    [COLUMNS.SINH_VIEN.HO_KHAU]: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    [COLUMNS.SINH_VIEN.DIA_CHI_LIEN_HE]: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    [COLUMNS.SINH_VIEN.MAT_KHAU]: {
      type: DataTypes.STRING(255),
      allowNull: true, // Initially null, set when student first logs in
    },
    [COLUMNS.SINH_VIEN.TRANG_THAI]: {
      type: DataTypes.ENUM(
        ENUM_SINH_VIEN_TRANG_THAI.ACTIVE_RESIDENT,
        ENUM_SINH_VIEN_TRANG_THAI.FORMER_RESIDENT,
        ENUM_SINH_VIEN_TRANG_THAI.APPLICANT,
        ENUM_SINH_VIEN_TRANG_THAI.SUSPENDED,
        ENUM_SINH_VIEN_TRANG_THAI.BANNED,
        ENUM_SINH_VIEN_TRANG_THAI.INACTIVE,
      ),
      allowNull: false,
      defaultValue: ENUM_SINH_VIEN_TRANG_THAI.APPLICANT,
    },
    [COLUMNS.SINH_VIEN.EMAIL]: {
      type: DataTypes.STRING(100),
      allowNull: true,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    [COLUMNS.SINH_VIEN.LOP]: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    [COLUMNS.SINH_VIEN.PASSWORD_SETUP_TOKEN]: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    [COLUMNS.SINH_VIEN.PASSWORD_SETUP_EXPIRES]: {
      type: DataTypes.DATE,
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
    tableName: TABLES.SINH_VIEN,
    timestamps: false,
    hooks: {
      beforeUpdate: (sinhVien) => {
        sinhVien[COLUMNS.COMMON.NGAY_CAP_NHAT] = new Date();
      },
    },
  },
);

// Instance methods
SinhVien.prototype.toJSON = function () {
  const values = Object.assign({}, this.get());
  delete values[COLUMNS.SINH_VIEN.MAT_KHAU]; // Remove password from JSON response
  delete values[COLUMNS.SINH_VIEN.PASSWORD_SETUP_TOKEN]; // Remove setup token
  return values;
};

export default SinhVien;
