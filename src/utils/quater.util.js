/**
 * TÍNH CHU KỲ & ĐƠN VỊ THÁNG PHẢI ĐÓNG (theo quý)
 *
 * Logic:
 *   ┌─────────────┬───────────────┬──────────────┐
 *   │  Tháng trong│  Ngày < 15    │  Ngày ≥ 15   │
 *   │    quý      │               │              │
 *   ├─────────────┼───────────────┼──────────────┤
 *   │  Tháng 1    │   3 tháng     │   2.5 tháng  │
 *   │  Tháng 2    │   2 tháng     │   1.5 tháng  │
 *   │  Tháng 3    │   4 tháng (*) │   3.5 tháng  │
 *   └─────────────┴───────────────┴──────────────┘
 *   (*) gồm tháng 3 (trọn) + quý kế (3 tháng)
 *
 * @param {string|Date} startDate   YYYY-MM-DD hoặc Date
 * @returns {{ endDate: Date, soDonViThang: number }}
 */
export const calculateQuarterEndDate = (startDate) => {
  const start = new Date(startDate);
  if (Number.isNaN(start)) throw new Error("Invalid startDate");

  const day     = start.getDate();          // 1‑31
  const month   = start.getMonth();         // 0‑11
  const quarter = Math.floor(month / 3);    // 0‑3
  const monthPos = month % 3;               // 0,1,2  (tháng 1‑2‑3 trong quý)

  let soDonViThang;
  let endDate;

  /* ---------- Xác định đơn vị tháng phải đóng ---------- */
  switch (monthPos) {
    case 0:               // Tháng đầu quý
      soDonViThang = day < 15 ? 3   : 2.5;
      break;
    case 1:               // Tháng thứ 2
      soDonViThang = day < 15 ? 2   : 1.5;
      break;
    case 2:               // Tháng thứ 3
      soDonViThang = day < 15 ? 4   : 3.5;
      break;
  }

  /* ---------- Tính endDate (ngày cuối cùng cần thanh toán) ---------- */
  if (monthPos === 2) {
    // Sang quý kế tiếp
    const nextQ  = (quarter + 1) % 4;
    const yEnd   = quarter === 3 ? start.getFullYear() + 1 : start.getFullYear();
    const mEnd   = nextQ * 3 + 2;               // tháng thứ 3 của quý kế (0‑based)
    endDate      = new Date(yEnd, mEnd + 1, 0); // cuối tháng đó
  } else {
    // Kết thúc ngay cuối quý hiện tại
    const mEnd = quarter * 3 + 2;               // tháng 3 của chính quý
    endDate    = new Date(start.getFullYear(), mEnd + 1, 0);
  }

  // Khoá 12 h tránh lệch TZ
  endDate.setHours(12, 0, 0, 0);

  return { endDate, soDonViThang };
};

export default { calculateQuarterEndDate };
