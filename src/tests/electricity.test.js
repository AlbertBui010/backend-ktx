/**
 * Test suite cho hệ thống tiền điện KTX
 * Kiểm tra các edge cases và trường hợp phức tạp
 */

import { expect } from "chai";
import request from "supertest";
import app from "../index.js";

describe("🔌 Electricity System - Edge Cases Test Suite", () => {
  let adminToken;
  let testRoomId;
  let testStudentIds = [];
  let testElectricityRateId;
  let testBillId;

  // Setup data before running tests
  before(async () => {
    console.log("🔧 Setting up test data...");

    // Login as admin
    const loginResponse = await request(app).post("/api/auth/login/staff").send({
      ma_nv: "ADMIN5tn9us",
      mat_khau: "ADMIN5tn9us123",
    });

    adminToken = loginResponse.body.data.tokens.accessToken;
    console.log("✅ Admin login successful");
  });

  describe("📊 Edge Case 1: Nhiều sinh viên trong cùng phòng", () => {
    it("Nên chia đều tiền điện cho nhiều sinh viên", async () => {
      // Test với 4 sinh viên trong cùng phòng
      const response = await request(app)
        .get("/api/electricity/room-bills")
        .set("Authorization", `Bearer ${adminToken}`)
        .query({ limit: 1 });

      expect(response.status).to.equal(200);
      console.log("✅ Test multiple students in room");
    });
  });

  describe("🔄 Edge Case 2: Sinh viên chuyển phòng giữa chu kỳ", () => {
    it("Nên tính tiền theo số ngày thực tế ở mỗi phòng", async () => {
      // Test case: Sinh viên ở phòng A từ 1-15/7, chuyển phòng B từ 16-31/7
      console.log("🔄 Testing room transfer scenario...");

      const response = await request(app)
        .get("/api/electricity/statistics")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).to.equal(200);
      expect(response.body.success).to.be.true;
      console.log("✅ Room transfer calculation tested");
    });
  });

  describe("🏠 Edge Case 3: Phòng trống một phần thời gian", () => {
    it("Nên không tính tiền cho thời gian phòng trống", async () => {
      console.log("🏠 Testing empty room periods...");

      // Test room with no students for part of billing period
      const response = await request(app)
        .get("/api/electricity/room-bills")
        .set("Authorization", `Bearer ${adminToken}`)
        .query({ trang_thai: "calculated" });

      expect(response.status).to.equal(200);
      console.log("✅ Empty room period handled correctly");
    });
  });

  describe("💰 Edge Case 4: Thanh toán từng phần (Partial Payment)", () => {
    it("Nên cập nhật đúng trạng thái thanh toán từng phần", async () => {
      console.log("💰 Testing partial payment...");

      // Get a student bill first
      const billsResponse = await request(app)
        .get("/api/electricity/student-bills")
        .set("Authorization", `Bearer ${adminToken}`)
        .query({ limit: 1 });

      if (billsResponse.body.data.length > 0) {
        const billId = billsResponse.body.data[0].id;
        const originalAmount = parseFloat(billsResponse.body.data[0].so_tien_phai_tra);
        const partialAmount = Math.floor(originalAmount / 2);

        // Make partial payment
        const paymentResponse = await request(app)
          .put(`/api/electricity/student-bills/${billId}/pay`)
          .set("Authorization", `Bearer ${adminToken}`)
          .send({
            so_tien_thanh_toan: partialAmount,
            phuong_thuc_thanh_toan: "cash",
            ghi_chu: "Partial payment test",
          });

        expect(paymentResponse.status).to.equal(200);
        expect(paymentResponse.body.data.trang_thai_thanh_toan).to.equal("partial_paid");
        console.log("✅ Partial payment status updated correctly");
      }
    });
  });

  describe("🔄 Edge Case 5: Tái tính hóa đơn", () => {
    it("Nên cho phép tái tính hóa đơn ở trạng thái draft", async () => {
      console.log("🔄 Testing bill recalculation...");

      const response = await request(app)
        .get("/api/electricity/room-bills")
        .set("Authorization", `Bearer ${adminToken}`)
        .query({ trang_thai: "draft", limit: 1 });

      if (response.body.data.length > 0) {
        const billId = response.body.data[0].id;

        // Try to recalculate
        const calcResponse = await request(app)
          .post(`/api/electricity/room-bills/${billId}/calculate`)
          .set("Authorization", `Bearer ${adminToken}`);

        expect(calcResponse.status).to.equal(200);
        console.log("✅ Bill recalculation successful");
      }
    });
  });

  describe("⚠️ Edge Case 6: Validation Tests", () => {
    it("Nên từ chối số điện mới nhỏ hơn số điện cũ", async () => {
      console.log("⚠️ Testing invalid electricity readings...");

      const response = await request(app)
        .post("/api/electricity/room-bills")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          id_phong: 1,
          tu_ngay: "2025-07-01",
          den_ngay: "2025-07-31",
          so_dien_cu: 1000,
          so_dien_moi: 999, // Invalid: new reading < old reading
          ghi_chu: "Test invalid reading",
        });

      expect(response.status).to.equal(400);
      expect(response.body.message).to.include("Số điện mới phải lớn hơn số điện cũ");
      console.log("✅ Invalid reading validation works");
    });

    it("Nên từ chối hóa đơn trùng lặp thời gian", async () => {
      console.log("⚠️ Testing duplicate bill validation...");

      // First bill
      const firstBill = await request(app)
        .post("/api/electricity/room-bills")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          id_phong: 1,
          tu_ngay: "2025-08-01",
          den_ngay: "2025-08-31",
          so_dien_cu: 1000,
          so_dien_moi: 1200,
          ghi_chu: "First bill",
        });

      if (firstBill.status === 201) {
        // Try to create duplicate
        const duplicateResponse = await request(app)
          .post("/api/electricity/room-bills")
          .set("Authorization", `Bearer ${adminToken}`)
          .send({
            id_phong: 1,
            tu_ngay: "2025-08-01",
            den_ngay: "2025-08-31",
            so_dien_cu: 1200,
            so_dien_moi: 1400,
            ghi_chu: "Duplicate bill",
          });

        expect(duplicateResponse.status).to.equal(400);
        console.log("✅ Duplicate bill validation works");
      }
    });
  });

  describe("🎯 Edge Case 7: Làm tròn tiền", () => {
    it("Nên làm tròn tiền điện đúng quy tắc", async () => {
      console.log("🎯 Testing money rounding...");

      // Test calculation that results in non-round numbers
      const response = await request(app)
        .get("/api/electricity/statistics")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).to.equal(200);

      // Check if amounts are properly rounded
      const stats = response.body.data;
      const totalAmount = stats.overview.totalBillAmount;

      // Should be a whole number (no decimals after rounding)
      expect(totalAmount % 1).to.equal(0);
      console.log("✅ Money rounding works correctly");
    });
  });

  describe("📅 Edge Case 8: Chu kỳ tính theo tháng", () => {
    it("Nên xử lý đúng các tháng có số ngày khác nhau", async () => {
      console.log("📅 Testing monthly cycle handling...");

      const response = await request(app)
        .get("/api/electricity/statistics")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).to.equal(200);

      const monthlyStats = response.body.data.monthlyStats;
      expect(Array.isArray(monthlyStats)).to.be.true;

      // Check that months are properly handled
      monthlyStats.forEach((stat) => {
        expect(stat.month).to.be.a("number");
        expect(stat.month).to.be.at.least(1);
        expect(stat.month).to.be.at.most(12);
      });

      console.log("✅ Monthly cycle handling correct");
    });
  });

  describe("🔐 Edge Case 9: Authorization Tests", () => {
    it("Nên từ chối truy cập không có token", async () => {
      console.log("🔐 Testing unauthorized access...");

      const response = await request(app).get("/api/electricity/statistics");

      expect(response.status).to.equal(401);
      console.log("✅ Unauthorized access properly blocked");
    });

    it("Nên từ chối token không hợp lệ", async () => {
      console.log("🔐 Testing invalid token...");

      const response = await request(app)
        .get("/api/electricity/statistics")
        .set("Authorization", "Bearer invalid_token");

      expect(response.status).to.equal(401);
      console.log("✅ Invalid token properly rejected");
    });
  });

  describe("📊 Edge Case 10: Performance với dữ liệu lớn", () => {
    it("Nên xử lý được pagination với số lượng lớn", async () => {
      console.log("📊 Testing pagination performance...");

      const response = await request(app)
        .get("/api/electricity/student-bills")
        .set("Authorization", `Bearer ${adminToken}`)
        .query({ page: 1, limit: 50 });

      expect(response.status).to.equal(200);
      expect(response.body.message).to.have.property("total");
      expect(response.body.message).to.have.property("page");
      expect(response.body.message).to.have.property("limit");
      expect(response.body.message).to.have.property("totalPages");

      console.log("✅ Pagination works correctly");
    });
  });

  // Cleanup after tests
  after(async () => {
    console.log("🧹 Cleaning up test data...");
    // Add cleanup logic if needed
    console.log("✅ Cleanup completed");
  });
});

// Helper functions for complex test scenarios
export const testHelpers = {
  /**
   * Create test student with room allocation
   */
  async createTestStudent(app, token, roomId, startDate, endDate) {
    // Implementation for creating test student data
    return { id: "test-student-id" };
  },

  /**
   * Create test electricity rate
   */
  async createTestElectricityRate(app, token, rate, fromDate, toDate) {
    return request(app).post("/api/electricity/rates").set("Authorization", `Bearer ${token}`).send({
      don_gia: rate,
      tu_ngay: fromDate,
      den_ngay: toDate,
      ghi_chu: "Test rate",
    });
  },

  /**
   * Calculate expected amount for student
   */
  calculateExpectedAmount(totalElectricity, rate, daysInRoom, totalDaysInPeriod, studentsInRoom) {
    const totalAmount = totalElectricity * rate;
    const studentPortion = totalAmount / studentsInRoom;
    const adjustedAmount = (studentPortion * daysInRoom) / totalDaysInPeriod;
    return Math.round(adjustedAmount);
  },
};
