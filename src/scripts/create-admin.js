import dotenv from "dotenv";
import { connectDatabase } from "../config/database.config.js";
import { NhanVien } from "../models/index.js";
import { passwordUtils } from "../utils/password.util.js";
import { COLUMNS, ENUM_NHAN_VIEN_ROLE, ENUM_NHAN_VIEN_TRANG_THAI } from "../constants/database.constants.js";

dotenv.config();
const uniqueId = Math.random().toString(36).substring(2, 8);
console.log("Unique ID for admin user:", uniqueId);
const ADMIN_DATA = {
  username: "ADMIN111" ,
  password: "ADMIN" + "123",
  email: "ADMIN" + "@gmail.com",
};

const createAdminUser = async () => {
  try {
    await connectDatabase();

    const existingAdmin = await NhanVien.findOne({
      where: {
        [COLUMNS.NHAN_VIEN.MA_NV]: ADMIN_DATA.username,
        [COLUMNS.COMMON.DANG_HIEN]: true,
      },
    });

    if (existingAdmin) {
      console.log("Admin user already exists");
      process.exit(0);
    }

    // Create admin user
    const adminPassword = ADMIN_DATA.password;
    const hashedPassword = await passwordUtils.hashPassword(adminPassword);

    const adminUser = await NhanVien.create({
      [COLUMNS.NHAN_VIEN.MA_NV]: ADMIN_DATA.username,
      [COLUMNS.NHAN_VIEN.TEN]: "System Administrator",
      [COLUMNS.NHAN_VIEN.MAT_KHAU]: hashedPassword,
      [COLUMNS.NHAN_VIEN.ROLE]: ENUM_NHAN_VIEN_ROLE.ADMIN,
      [COLUMNS.NHAN_VIEN.EMAIL]: ADMIN_DATA.email,
      [COLUMNS.NHAN_VIEN.PHONG_BAN]: "IT Department",
      [COLUMNS.NHAN_VIEN.TRANG_THAI]: ENUM_NHAN_VIEN_TRANG_THAI.ACTIVE,
      [COLUMNS.NHAN_VIEN.NGAY_VAO_LAM]: new Date(),
    });

    console.log("Admin user created successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Failed to create admin user:", error);
    process.exit(1);
  }
};

createAdminUser();
