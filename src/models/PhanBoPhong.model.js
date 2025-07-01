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
    // Thêm trường trạng thái thanh toán
    trang_thai_thanh_toan: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false, // false = chưa thanh toán, true = đã thanh toán
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
      // Automatically update NGAY_CAP_NHAT before an update operation.
      // Also, set NGAY_KET_THUC if the status changes to TERMINATED or TRANSFERRED
      // and it hasn't been set already.
      beforeUpdate: (phanBo) => {
        phanBo[COLUMNS.COMMON.NGAY_CAP_NHAT] = new Date();

        if (
          phanBo[COLUMNS.PHAN_BO_PHONG.TRANG_THAI] === ENUM_PHAN_BO_PHONG_TRANG_THAI.TERMINATED ||
          phanBo[COLUMNS.PHAN_BO_PHONG.TRANG_THAI] === ENUM_PHAN_BO_PHONG_TRANG_THAI.TRANSFERRED
        ) {
          if (!phanBo[COLUMNS.PHAN_BO_PHONG.NGAY_KET_THUC]) {
            phanBo[COLUMNS.PHAN_BO_PHONG.NGAY_KET_THUC] = new Date();
          }
        }
      },
      // Validate that the bed is available before creating a new allocation.
      // This prevents multiple active allocations for the same bed.
      beforeCreate: async (phanBo) => {
        const existingAssignment = await PhanBoPhong.findOne({
          where: {
            [COLUMNS.PHAN_BO_PHONG.ID_GIUONG]: phanBo[COLUMNS.PHAN_BO_PHONG.ID_GIUONG],
            [COLUMNS.COMMON.DANG_HIEN]: true,
            [COLUMNS.PHAN_BO_PHONG.NGAY_KET_THUC]: null, // Active assignment (not yet ended)
          },
        });

        if (existingAssignment) {
          console.error(
            "PhanBoPhong beforeCreate: Bed already occupied. Bed ID:",
            phanBo[COLUMNS.PHAN_BO_PHONG.ID_GIUONG],
            "Student ID:",
            phanBo[COLUMNS.PHAN_BO_PHONG.ID_SV]
          );
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
          [COLUMNS.PHAN_BO_PHONG.NGAY_KET_THUC]: null, // Ensures only one active assignment per student at a time
        },
        name: "unique_active_assignment_per_student",
      },
      // You could also consider an index for active bed assignments if not already covered by the beforeCreate hook
      // or to add a database-level constraint for it.
      // For example, if you want to ensure no two *active* allocations can ever share the same bed:
      // {
      //   unique: true,
      //   fields: [COLUMNS.PHAN_BO_PHONG.ID_GIUONG],
      //   where: {
      //     [COLUMNS.COMMON.DANG_HIEN]: true,
      //     [COLUMNS.PHAN_BO_PHONG.NGAY_KET_THUC]: null,
      //   },
      //   name: "unique_active_assignment_per_bed",
      // },
    ],
  },
);

export default PhanBoPhong;