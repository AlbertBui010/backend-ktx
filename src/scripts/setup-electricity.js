import { DonGiaDien, HdTienDien, HdTienDienSinhVien } from "../models/index.js";
import { electricityUtils } from "../utils/electricity.util.js";

/**
 * Script để tạo dữ liệu mẫu cho hệ thống tiền điện
 */
async function seedElectricityData() {
  try {
    console.log("🌱 Bắt đầu tạo dữ liệu mẫu cho hệ thống tiền điện...");

    // 1. Tạo đơn giá điện mẫu
    console.log("📋 Tạo đơn giá điện mẫu...");

    const sampleRates = [
      {
        don_gia: 3500.0,
        tu_ngay: "2024-01-01",
        den_ngay: "2024-06-30",
        ghi_chu: "Đơn giá điện 6 tháng đầu năm 2024",
        nguoi_tao: 1,
      },
      {
        don_gia: 3800.0,
        tu_ngay: "2024-07-01",
        den_ngay: null,
        ghi_chu: "Đơn giá điện từ tháng 7/2024",
        nguoi_tao: 1,
      },
    ];

    for (const rate of sampleRates) {
      const existingRate = await DonGiaDien.findOne({
        where: { tu_ngay: rate.tu_ngay },
      });

      if (!existingRate) {
        await DonGiaDien.create(rate);
        console.log(`✅ Tạo đơn giá điện: ${rate.don_gia} VND/kWh từ ${rate.tu_ngay}`);
      } else {
        console.log(`⚠️  Đơn giá điện từ ${rate.tu_ngay} đã tồn tại`);
      }
    }

    console.log("✅ Hoàn thành tạo dữ liệu mẫu!");
  } catch (error) {
    console.error("❌ Lỗi khi tạo dữ liệu mẫu:", error);
  }
}

/**
 * Test các function utility
 */
async function testElectricityUtils() {
  try {
    console.log("🧪 Bắt đầu test các utility functions...");

    // Test làm tròn
    console.log("📊 Test làm tròn tiền:");
    const testAmounts = [33333.33, 12345.67, 99999.99, 50000.0];
    testAmounts.forEach((amount) => {
      const rounded = electricityUtils.roundAmount(amount);
      console.log(`  ${amount} → ${rounded}`);
    });

    // Test tính ngày
    console.log("📅 Test tính số ngày:");
    const testDates = [
      ["2024-01-01", "2024-01-31"],
      ["2024-02-01", "2024-02-29"],
      ["2024-01-15", "2024-01-25"],
    ];
    testDates.forEach(([start, end]) => {
      const days = electricityUtils.calculateDaysBetween(start, end);
      console.log(`  ${start} → ${end}: ${days} ngày`);
    });

    // Test lấy đơn giá điện
    console.log("💰 Test lấy đơn giá điện:");
    const testDate = "2024-08-15";
    const rate = await electricityUtils.getElectricityRateAtDate(testDate);
    if (rate) {
      console.log(`  Đơn giá tại ${testDate}: ${rate.don_gia} VND/kWh`);
    } else {
      console.log(`  Không tìm thấy đơn giá tại ${testDate}`);
    }

    console.log("✅ Hoàn thành test utilities!");
  } catch (error) {
    console.error("❌ Lỗi khi test utilities:", error);
  }
}

/**
 * Main function
 */
async function main() {
  console.log("🚀 Khởi chạy script setup hệ thống tiền điện...");

  await seedElectricityData();
  await testElectricityUtils();

  console.log("🎉 Hoàn thành setup hệ thống tiền điện!");
  process.exit(0);
}

// Chạy script nếu được gọi trực tiếp
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error("❌ Lỗi trong quá trình setup:", error);
    process.exit(1);
  });
}

export { seedElectricityData, testElectricityUtils };
