import dotenv from "dotenv";
import { connectDatabase } from "../config/database.config.js";
import { NhanVien } from "../models/index.js";
import { passwordUtils } from "../utils/password.util.js";
import { COLUMNS, ENUM_NHAN_VIEN_ROLE, ENUM_NHAN_VIEN_TRANG_THAI } from "../constants/database.constants.js";

dotenv.config();

const createAdminUser = async () => {
  try {
    console.log("🌱 Starting admin user creation...");

    await connectDatabase();

    // Check if admin already exists
    const existingAdmin = await NhanVien.findOne({
      where: {
        [COLUMNS.NHAN_VIEN.MA_NV]: "ADMIN002",
        [COLUMNS.COMMON.DANG_HIEN]: true,
      },
    });

    if (existingAdmin) {
      console.log("✅ Admin user already exists");
      process.exit(0);
    }

    // Create admin user
    const adminPassword = "quy123";
    const hashedPassword = await passwordUtils.hashPassword(adminPassword);

    const adminUser = await NhanVien.create({
      [COLUMNS.NHAN_VIEN.MA_NV]: "ADMIN002",
      [COLUMNS.NHAN_VIEN.TEN]: "System Administrator",
      [COLUMNS.NHAN_VIEN.MAT_KHAU]: hashedPassword,
      [COLUMNS.NHAN_VIEN.ROLE]: ENUM_NHAN_VIEN_ROLE.ADMIN,
      [COLUMNS.NHAN_VIEN.EMAIL]: "quy.admin@gmail.com",
      [COLUMNS.NHAN_VIEN.PHONG_BAN]: "IT Department",
      [COLUMNS.NHAN_VIEN.TRANG_THAI]: ENUM_NHAN_VIEN_TRANG_THAI.ACTIVE,
      [COLUMNS.NHAN_VIEN.NGAY_VAO_LAM]: new Date(),
    });

    console.log("✅ Admin user created successfully!");
    console.log("📋 Admin Credentials:");
    console.log(`   Employee ID: ${adminUser[COLUMNS.NHAN_VIEN.MA_NV]}`);
    console.log(`   Password: ${adminPassword}`);
    console.log(`   Email: ${adminUser[COLUMNS.NHAN_VIEN.EMAIL]}`);
    console.log(`   Role: ${adminUser[COLUMNS.NHAN_VIEN.ROLE]}`);
    console.log("\n⚠️  Please change the default password after first login!");

    process.exit(0);
  } catch (error) {
    console.error("❌ Failed to create admin user:", error);
    process.exit(1);
  }
};

createAdminUser();
