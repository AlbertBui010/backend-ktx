/**
 * Utility function để tính ngày kết thúc dựa trên quy tắc Quý
 * @param {string|Date} startDate - Ngày bắt đầu (format: YYYY-MM-DD hoặc Date object)
 * @returns {Object} - Object chứa thông tin chi tiết về tính toán
 */
export const calculateQuarterEndDate = (startDate) => {
  try {
    const ngay = new Date(startDate);
    const nam = ngay.getFullYear();
    const thang = ngay.getMonth();

    const quy = Math.floor(thang / 3);
    const ngayCanChuyen = new Date(nam, quy * 3 + 1, 15); // Ngày 15 tháng thứ 2 của quý

    let quyKetThuc;
    let namKetThuc = nam;
    let thangBatDau = ngay.getMonth();
    let soDonViThangDau;

    // Tính đơn vị tháng đầu tiên (tháng hiện tại)
    if (ngay.getDate() <= 15) {
      soDonViThangDau = 1;
    } else {
      soDonViThangDau = 0.5;
    }

    // Quyết định quý kết thúc
    if (ngay <= ngayCanChuyen) {
      quyKetThuc = quy;
    } else {
      quyKetThuc = quy + 1;
      if (quyKetThuc > 3) {
        quyKetThuc = 0;
        namKetThuc += 1;
      }
    }

    // Tính tháng kết thúc của quý
    const thangKetThuc = quyKetThuc * 3 + 2;
    const ngayKetThuc = new Date(namKetThuc, thangKetThuc + 1, 0);
    ngayKetThuc.setHours(12); // tránh lệch timezone

    // Tính số tháng trọn từ tháng sau tháng bắt đầu đến tháng kết thúc
    let tongThang = 0;
    let thangHienTai = thangBatDau + 1;
    let namHienTai = nam;

    while (namHienTai < namKetThuc || (namHienTai === namKetThuc && thangHienTai <= thangKetThuc)) {
      tongThang += 1;
      thangHienTai++;
      if (thangHienTai > 11) {
        thangHienTai = 0;
        namHienTai++;
      }
    }

    const tongDonViThang = soDonViThangDau + tongThang;

    return {
      endDate: ngayKetThuc,
      soDonViThang: tongDonViThang,
    };
  } catch (error) {
    throw new Error(`Quarter calculation failed: ${error.message}`);
  }
};

// Export all functions
export default {
  calculateQuarterEndDate,
};
