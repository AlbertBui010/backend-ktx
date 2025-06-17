import { DataTypes } from "sequelize";
import sequelize from "../config/database.config.js";
import { TABLES, COLUMNS, ENUM_PHAN_BO_PHONG_TRANG_THAI } from "../constants/database.constants.js";

const PhanBoPhong = sequelize.define(
  TABLES.PHAN_BO_PHONG,
  {
    [COLUMNS.COMMON.ID]: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    [COLUMNS.PHAN_BO_PHONG.ID_SV]: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: TABLES.SINH_VIEN,
        key: COLUMNS.COMMON.ID,
      },
    },
    [COLUMNS.PHAN_BO_PHONG.ID_GIUONG]: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: TABLES.GIUONG,
        key: COLUMNS.COMMON.ID,
      },
    },
    [COLUMNS.PHAN_BO_PHONG.NGAY_BAT_DAU]: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    [COLUMNS.PHAN_BO_PHONG.NGAY_KET_THUC]: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    [COLUMNS.PHAN_BO_PHONG.TRANG_THAI]: {
      // Thêm trường trạng thái
      type: DataTypes.ENUM(
        ENUM_PHAN_BO_PHONG_TRANG_THAI.ACTIVE,
        ENUM_PHAN_BO_PHONG_TRANG_THAI.EXPIRED,
        ENUM_PHAN_BO_PHONG_TRANG_THAI.TEMPORARILY_AWAY,
        ENUM_PHAN_BO_PHONG_TRANG_THAI.SUSPENDED,
        ENUM_PHAN_BO_PHONG_TRANG_THAI.TERMINATED,
        ENUM_PHAN_BO_PHONG_TRANG_THAI.PENDING_CHECKOUT,
        ENUM_PHAN_BO_PHONG_TRANG_THAI.TRANSFERRED,
      ),
      allowNull: false,
      defaultValue: ENUM_PHAN_BO_PHONG_TRANG_THAI.ACTIVE,
    },
    [COLUMNS.PHAN_BO_PHONG.LY_DO_KET_THUC]: {
      // Lý do kết thúc phân bổ
      type: DataTypes.TEXT,
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
    tableName: TABLES.PHAN_BO_PHONG,
    timestamps: false,
    hooks: {
      beforeUpdate: (phanBo) => {
        phanBo[COLUMNS.COMMON.NGAY_CAP_NHAT] = new Date();

        // Tự động set ngày rời thực tế khi chuyển sang trạng thái kết thúc
        if (
          phanBo[COLUMNS.PHAN_BO_PHONG.TRANG_THAI] === ENUM_PHAN_BO_PHONG_TRANG_THAI.TERMINATED ||
          phanBo[COLUMNS.PHAN_BO_PHONG.TRANG_THAI] === ENUM_PHAN_BO_PHONG_TRANG_THAI.TRANSFERRED
        ) {
          if (!phanBo[COLUMNS.PHAN_BO_PHONG.NGAY_KET_THUC]) {
            phanBo[COLUMNS.PHAN_BO_PHONG.NGAY_KET_THUC] = new Date();
          }
        }
      },
      beforeCreate: async (phanBo) => {
        // Validate that the bed is available
        const existingAssignment = await PhanBoPhong.findOne({
          where: {
            [COLUMNS.PHAN_BO_PHONG.ID_GIUONG]: phanBo[COLUMNS.PHAN_BO_PHONG.ID_GIUONG],
            [COLUMNS.COMMON.DANG_HIEN]: true,
            [COLUMNS.PHAN_BO_PHONG.NGAY_KET_THUC]: null, // Active assignment
          },
        });

        if (existingAssignment) {
          throw new Error("This bed is already occupied");
        }
      },
    },
    indexes: [
      {
        unique: true,
        fields: [COLUMNS.PHAN_BO_PHONG.ID_SV],
        where: {
          [COLUMNS.COMMON.DANG_HIEN]: true,
          [COLUMNS.PHAN_BO_PHONG.NGAY_KET_THUC]: null,
        },
        name: "unique_active_assignment_per_student",
      },
    ],
  },
);

export default PhanBoPhong;
