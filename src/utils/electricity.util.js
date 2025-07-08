import { Op } from "sequelize";
import { HdTienDien, HdTienDienSinhVien, PhanBoPhong, Giuong, SinhVien, Phong, DonGiaDien } from "../models/index.js";
import { COLUMNS, ENUM_HD_TIEN_DIEN_TRANG_THAI } from "../constants/database.constants.js";

/**
 * Utility functions for electricity billing calculations
 */
export const electricityUtils = {
  /**
   * Làm tròn tiền điện theo quy tắc: 33,333.33 → 33,340
   * @param {number} amount - Số tiền cần làm tròn
   * @returns {number} - Số tiền đã làm tròn
   */
  roundAmount(amount) {
    // Làm tròn lên đến hàng chục
    return Math.ceil(amount / 10) * 10;
  },

  /**
   * Tính số ngày giữa 2 ngày (bao gồm cả ngày đầu và cuối)
   * @param {Date|string} startDate - Ngày bắt đầu
   * @param {Date|string} endDate - Ngày kết thúc
   * @returns {number} - Số ngày
   */
  calculateDaysBetween(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays + 1; // +1 để bao gồm cả ngày đầu và cuối
  },

  /**
   * Tính số ngày sinh viên thực tế ở trong chu kỳ
   * @param {Object} phanBo - Thông tin phân bổ phòng
   * @param {Date|string} cycleStart - Ngày bắt đầu chu kỳ
   * @param {Date|string} cycleEnd - Ngày kết thúc chu kỳ
   * @returns {number} - Số ngày thực tế ở
   */
  calculateActualDaysInCycle(phanBo, cycleStart, cycleEnd) {
    const start = new Date(Math.max(new Date(phanBo.ngay_bat_dau), new Date(cycleStart)));

    const end = new Date(
      Math.min(phanBo.ngay_ket_thuc ? new Date(phanBo.ngay_ket_thuc) : new Date(cycleEnd), new Date(cycleEnd)),
    );

    // Nếu sinh viên không ở trong chu kỳ này
    if (start > end) {
      return 0;
    }

    const days = this.calculateDaysBetween(start, end);

    // Xử lý trạng thái tạm vắng - theo yêu cầu, tạm vắng vẫn tính tiền đầy đủ
    // Có thể mở rộng logic này sau nếu cần

    return Math.max(0, days);
  },

  /**
   * Lấy tất cả sinh viên có trong phòng trong chu kỳ
   * @param {number} roomId - ID phòng
   * @param {Date|string} cycleStart - Ngày bắt đầu chu kỳ
   * @param {Date|string} cycleEnd - Ngày kết thúc chu kỳ
   * @returns {Array} - Danh sách sinh viên và thông tin phân bổ
   */
  async getStudentsInRoomDuringCycle(roomId, cycleStart, cycleEnd) {
    // Lấy tất cả giường trong phòng
    const beds = await Giuong.findAll({
      where: {
        [COLUMNS.GIUONG.ID_PHONG]: roomId,
        [COLUMNS.COMMON.DANG_HIEN]: true,
      },
      attributes: ["id"],
    });

    const bedIds = beds.map((bed) => bed.id);

    if (bedIds.length === 0) {
      return [];
    }

    // Lấy tất cả phân bổ phòng trong chu kỳ
    const allocations = await PhanBoPhong.findAll({
      where: {
        [COLUMNS.PHAN_BO_PHONG.ID_GIUONG]: {
          [Op.in]: bedIds,
        },
        [COLUMNS.COMMON.DANG_HIEN]: true,
        [Op.or]: [
          // Phân bổ bắt đầu trong chu kỳ
          {
            [COLUMNS.PHAN_BO_PHONG.NGAY_BAT_DAU]: {
              [Op.between]: [cycleStart, cycleEnd],
            },
          },
          // Phân bổ kết thúc trong chu kỳ
          {
            [COLUMNS.PHAN_BO_PHONG.NGAY_KET_THUC]: {
              [Op.between]: [cycleStart, cycleEnd],
            },
          },
          // Phân bổ bao trùm cả chu kỳ
          {
            [Op.and]: [
              {
                [COLUMNS.PHAN_BO_PHONG.NGAY_BAT_DAU]: {
                  [Op.lte]: cycleStart,
                },
              },
              {
                [Op.or]: [
                  {
                    [COLUMNS.PHAN_BO_PHONG.NGAY_KET_THUC]: {
                      [Op.gte]: cycleEnd,
                    },
                  },
                  {
                    [COLUMNS.PHAN_BO_PHONG.NGAY_KET_THUC]: null,
                  }, // Vẫn đang ở
                ],
              },
            ],
          },
        ],
      },
      include: [
        {
          model: SinhVien,
          as: "Student",
          attributes: ["id", "mssv", "ten"],
        },
      ],
    });

    return allocations.map((allocation) => ({
      phanBo: allocation,
      sinhVien: allocation.Student,
      soNgayO: this.calculateActualDaysInCycle(allocation, cycleStart, cycleEnd),
    }));
  },

  /**
   * Tính tỷ lệ chia tiền điện cho từng sinh viên
   * @param {Array} studentsData - Danh sách sinh viên và số ngày ở
   * @returns {Array} - Danh sách sinh viên với tỷ lệ chia
   */
  calculateSplitRatio(studentsData) {
    // Lọc những sinh viên thực sự có ở (số ngày > 0)
    const actualStudents = studentsData.filter((student) => student.soNgayO > 0);

    if (actualStudents.length === 0) {
      return [];
    }

    const totalDays = actualStudents.reduce((sum, student) => sum + student.soNgayO, 0);

    return actualStudents.map((student) => ({
      ...student,
      tyLe: student.soNgayO / totalDays,
      tyLeFormatted: parseFloat((student.soNgayO / totalDays).toFixed(4)),
    }));
  },

  /**
   * Tính tiền điện cho từng sinh viên
   * @param {Array} studentsWithRatio - Sinh viên với tỷ lệ chia
   * @param {number} totalAmount - Tổng tiền điện phòng
   * @returns {Array} - Sinh viên với số tiền phải trả
   */
  calculateStudentAmounts(studentsWithRatio, totalAmount) {
    return studentsWithRatio.map((student) => {
      const rawAmount = student.tyLe * totalAmount;
      const roundedAmount = this.roundAmount(rawAmount);

      return {
        ...student,
        soTienRaw: rawAmount,
        soTienPhaiTra: roundedAmount,
      };
    });
  },

  /**
   * Lấy đơn giá điện hiệu lực tại thời điểm
   * @param {Date|string} date - Ngày cần kiểm tra
   * @returns {Object|null} - Thông tin đơn giá điện
   */
  async getElectricityRateAtDate(date) {
    const targetDate = new Date(date);

    const rate = await DonGiaDien.findOne({
      where: {
        [COLUMNS.DON_GIA_DIEN.TU_NGAY]: {
          [Op.lte]: targetDate,
        },
        [Op.or]: [
          {
            [COLUMNS.DON_GIA_DIEN.DEN_NGAY]: {
              [Op.gte]: targetDate,
            },
          },
          {
            [COLUMNS.DON_GIA_DIEN.DEN_NGAY]: null,
          },
        ],
        [COLUMNS.COMMON.DANG_HIEN]: true,
      },
      order: [[COLUMNS.DON_GIA_DIEN.TU_NGAY, "DESC"]],
    });

    return rate;
  },

  /**
   * Tạo hóa đơn tiền điện cho sinh viên
   * @param {number} hdTienDienId - ID hóa đơn tiền điện phòng
   * @param {Array} studentsWithAmounts - Sinh viên với số tiền phải trả
   * @param {number} creatorId - ID người tạo
   * @returns {Array} - Danh sách hóa đơn sinh viên đã tạo
   */
  async createStudentElectricityBills(hdTienDienId, studentsWithAmounts, creatorId) {
    const studentBills = [];

    for (const student of studentsWithAmounts) {
      const bill = await HdTienDienSinhVien.create({
        [COLUMNS.HD_TIEN_DIEN_SINH_VIEN.ID_HD_TIEN_DIEN]: hdTienDienId,
        [COLUMNS.HD_TIEN_DIEN_SINH_VIEN.ID_SINH_VIEN]: student.sinhVien.id,
        [COLUMNS.HD_TIEN_DIEN_SINH_VIEN.ID_PHAN_BO_PHONG]: student.phanBo.id,
        [COLUMNS.HD_TIEN_DIEN_SINH_VIEN.SO_NGAY_O]: student.soNgayO,
        [COLUMNS.HD_TIEN_DIEN_SINH_VIEN.TY_LE_CHIA]: student.tyLeFormatted,
        [COLUMNS.HD_TIEN_DIEN_SINH_VIEN.SO_TIEN_PHAI_TRA]: student.soTienPhaiTra,
        [COLUMNS.COMMON.NGUOI_TAO]: creatorId,
      });

      studentBills.push(bill);
    }

    return studentBills;
  },

  /**
   * Tính toán hoàn chỉnh tiền điện cho một phòng
   * @param {number} hdTienDienId - ID hóa đơn tiền điện
   * @param {number} creatorId - ID người thực hiện
   * @returns {Object} - Kết quả tính toán
   */
  async calculateRoomElectricityBills(hdTienDienId, creatorId) {
    // Lấy thông tin hóa đơn tiền điện phòng
    const hdTienDien = await HdTienDien.findOne({
      where: {
        [COLUMNS.COMMON.ID]: hdTienDienId,
        [COLUMNS.COMMON.DANG_HIEN]: true,
      },
      include: [
        {
          model: Phong,
          as: "Room",
          attributes: ["id", "ten_phong"],
        },
        {
          model: DonGiaDien,
          as: "ElectricityRate",
        },
      ],
    });

    if (!hdTienDien) {
      throw new Error("Hóa đơn tiền điện không tồn tại");
    }

    if (hdTienDien[COLUMNS.HD_TIEN_DIEN.TRANG_THAI] === ENUM_HD_TIEN_DIEN_TRANG_THAI.FINALIZED) {
      throw new Error("Hóa đơn đã được hoàn thiện, không thể tính lại");
    }

    // Tính tiền điện tổng của phòng
    const soDienTieuThu = hdTienDien[COLUMNS.HD_TIEN_DIEN.SO_DIEN_MOI] - hdTienDien[COLUMNS.HD_TIEN_DIEN.SO_DIEN_CU];
    const donGia = hdTienDien.ElectricityRate[COLUMNS.DON_GIA_DIEN.DON_GIA];
    const thanhTien = soDienTieuThu * donGia;

    // Cập nhật thành tiền cho hóa đơn phòng
    await hdTienDien.update({
      [COLUMNS.HD_TIEN_DIEN.SO_DIEN_TIEU_THU]: soDienTieuThu,
      [COLUMNS.HD_TIEN_DIEN.THANH_TIEN]: thanhTien,
      [COLUMNS.COMMON.NGUOI_CAP_NHAT]: creatorId,
    });

    // Lấy sinh viên trong phòng trong chu kỳ
    const studentsData = await this.getStudentsInRoomDuringCycle(
      hdTienDien[COLUMNS.HD_TIEN_DIEN.ID_PHONG],
      hdTienDien[COLUMNS.HD_TIEN_DIEN.TU_NGAY],
      hdTienDien[COLUMNS.HD_TIEN_DIEN.DEN_NGAY],
    );

    if (studentsData.length === 0) {
      throw new Error("Không có sinh viên nào ở trong phòng trong chu kỳ này");
    }

    // Tính tỷ lệ chia
    const studentsWithRatio = this.calculateSplitRatio(studentsData);

    // Tính số tiền cho từng sinh viên
    const studentsWithAmounts = this.calculateStudentAmounts(studentsWithRatio, thanhTien);

    // Xóa hóa đơn sinh viên cũ (nếu có)
    await HdTienDienSinhVien.destroy({
      where: {
        [COLUMNS.HD_TIEN_DIEN_SINH_VIEN.ID_HD_TIEN_DIEN]: hdTienDienId,
      },
    });

    // Tạo hóa đơn cho sinh viên
    const studentBills = await this.createStudentElectricityBills(hdTienDienId, studentsWithAmounts, creatorId);

    // Cập nhật trạng thái hóa đơn
    await hdTienDien.update({
      [COLUMNS.HD_TIEN_DIEN.TRANG_THAI]: ENUM_HD_TIEN_DIEN_TRANG_THAI.CALCULATED,
      [COLUMNS.COMMON.NGUOI_CAP_NHAT]: creatorId,
    });

    return {
      hdTienDien,
      studentsWithAmounts,
      studentBills,
      summary: {
        totalElectricity: soDienTieuThu,
        totalAmount: thanhTien,
        studentsCount: studentsWithAmounts.length,
        totalStudentAmount: studentsWithAmounts.reduce((sum, s) => sum + s.soTienPhaiTra, 0),
      },
    };
  },
};
