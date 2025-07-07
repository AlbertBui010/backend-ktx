// src/scripts/seed-data.js
import bcrypt from "bcrypt";
import {
  NhanVien,
  SinhVien,
  LoaiPhong,
  Phong,
  Giuong,
  PhuHuynh,
  PhanBoPhong,
  DonGiaDien,
  HdTienDien,
  HdTienDienSinhVien,
  ChuDe,
  BangTin,
} from "../models/index.js";
import sequelize from "../config/database.config.js";

// Dữ liệu mẫu Việt Nam
const seedData = {
  // Nhân viên
  nhanVien: [
    {
      ma_nv: "ADMIN001",
      ten: "Nguyễn Văn Quản",
      mat_khau: "admin123",
      role: "admin",
      sdt: "0901234567",
      email: "admin@ktx.edu.vn",
      phai: "Nam",
      ngay_sinh: "1985-05-15",
      noi_sinh: "Hà Nội",
      dan_toc: "Kinh",
      cccd: "001085012345",
      dia_chi: "123 Phố Huế, Hai Bà Trưng, Hà Nội",
      trang_thai: "active",
    },
    {
      ma_nv: "STAFF001",
      ten: "Trần Thị Lan",
      mat_khau: "staff123",
      role: "staff",
      sdt: "0912345678",
      email: "lan.tran@ktx.edu.vn",
      phai: "Nữ",
      ngay_sinh: "1990-08-20",
      noi_sinh: "Hồ Chí Minh",
      dan_toc: "Kinh",
      cccd: "079090054321",
      dia_chi: "456 Lý Tự Trọng, Quận 1, TP.HCM",
      trang_thai: "active",
    },
    {
      ma_nv: "STAFF002",
      ten: "Lê Minh Đức",
      mat_khau: "staff123",
      role: "staff",
      sdt: "0923456789",
      email: "duc.le@ktx.edu.vn",
      phai: "Nam",
      ngay_sinh: "1988-12-10",
      noi_sinh: "Đà Nẵng",
      dan_toc: "Kinh",
      cccd: "043088098765",
      dia_chi: "789 Trần Phú, Hải Châu, Đà Nẵng",
      trang_thai: "active",
    },
  ],

  // Sinh viên
  sinhVien: [
    {
      mssv: "20210001",
      ten: "Phạm Thị Mai",
      dia_chi: "12 Nguyễn Trãi, Thanh Xuân, Hà Nội",
      phai: "Nữ",
      ngay_sinh: "2003-03-15",
      noi_sinh: "Hà Nội",
      dan_toc: "Kinh",
      cccd: "001203012345",
      sdt: "0934567890",
      email: "mai.pham@student.edu.vn",
      lop: "CNTT2021-K66",
      khoa: "Công nghệ thông tin",
      he_dao_tao: "Đại học chính quy",
      nam_hoc: "2021-2025",
      trang_thai: "active_resident",
    },
    {
      mssv: "20210002",
      ten: "Nguyễn Thanh Sơn",
      dia_chi: "34 Lê Lợi, Quận 1, TP.HCM",
      phai: "Nam",
      ngay_sinh: "2003-07-22",
      noi_sinh: "TP.HCM",
      dan_toc: "Kinh",
      cccd: "079203087654",
      sdt: "0945678901",
      email: "son.nguyen@student.edu.vn",
      lop: "CNTT2021-K66",
      khoa: "Công nghệ thông tin",
      he_dao_tao: "Đại học chính quy",
      nam_hoc: "2021-2025",
      trang_thai: "active_resident",
    },
    {
      mssv: "20210003",
      ten: "Vũ Thị Hương",
      dia_chi: "56 Hoàng Diệu, Hải Châu, Đà Nẵng",
      phai: "Nữ",
      ngay_sinh: "2003-11-08",
      noi_sinh: "Đà Nẵng",
      dan_toc: "Kinh",
      cccd: "043203065432",
      sdt: "0956789012",
      email: "huong.vu@student.edu.vn",
      lop: "QTKD2021-K66",
      khoa: "Quản trị kinh doanh",
      he_dao_tao: "Đại học chính quy",
      nam_hoc: "2021-2025",
      trang_thai: "active_resident",
    },
    {
      mssv: "20210004",
      ten: "Hoàng Văn Tuấn",
      dia_chi: "78 Nguyễn Huệ, Ninh Kiều, Cần Thơ",
      phai: "Nam",
      ngay_sinh: "2003-01-14",
      noi_sinh: "Cần Thơ",
      dan_toc: "Kinh",
      cccd: "092203043210",
      sdt: "0967890123",
      email: "tuan.hoang@student.edu.vn",
      lop: "KT2021-K66",
      khoa: "Kế toán",
      he_dao_tao: "Đại học chính quy",
      nam_hoc: "2021-2025",
      trang_thai: "active_resident",
    },
    {
      mssv: "20220001",
      ten: "Đặng Thị Linh",
      dia_chi: "90 Điện Biên Phủ, Ba Đình, Hà Nội",
      phai: "Nữ",
      ngay_sinh: "2004-05-30",
      noi_sinh: "Hà Nội",
      dan_toc: "Kinh",
      cccd: "001204054321",
      sdt: "0978901234",
      email: "linh.dang@student.edu.vn",
      lop: "CNTT2022-K67",
      khoa: "Công nghệ thông tin",
      he_dao_tao: "Đại học chính quy",
      nam_hoc: "2022-2026",
      trang_thai: "active_resident",
    },
    {
      mssv: "20220002",
      ten: "Bùi Minh Khoa",
      dia_chi: "112 Lê Duẩn, Quận 3, TP.HCM",
      phai: "Nam",
      ngay_sinh: "2004-09-12",
      noi_sinh: "TP.HCM",
      dan_toc: "Kinh",
      cccd: "079204098765",
      sdt: "0989012345",
      email: "khoa.bui@student.edu.vn",
      lop: "CNTT2022-K67",
      khoa: "Công nghệ thông tin",
      he_dao_tao: "Đại học chính quy",
      nam_hoc: "2022-2026",
      trang_thai: "active_resident",
    },
  ],

  // Phụ huynh
  phuHuynh: [
    {
      ten: "Phạm Văn Hòa",
      sdt: "0912111213",
      email: "hoa.pham@gmail.com",
      dia_chi: "12 Nguyễn Trãi, Thanh Xuân, Hà Nội",
      quan_he: "Cha",
    },
    {
      ten: "Nguyễn Thị Lan",
      sdt: "0923141516",
      email: "lan.nguyen@gmail.com",
      dia_chi: "34 Lê Lợi, Quận 1, TP.HCM",
      quan_he: "Mẹ",
    },
    {
      ten: "Vũ Văn Minh",
      sdt: "0934171819",
      email: "minh.vu@gmail.com",
      dia_chi: "56 Hoàng Diệu, Hải Châu, Đà Nẵng",
      quan_he: "Cha",
    },
    {
      ten: "Hoàng Thị Hạnh",
      sdt: "0945202122",
      email: "hanh.hoang@gmail.com",
      dia_chi: "78 Nguyễn Huệ, Ninh Kiều, Cần Thơ",
      quan_he: "Mẹ",
    },
    {
      ten: "Đặng Văn Hùng",
      sdt: "0956232425",
      email: "hung.dang@gmail.com",
      dia_chi: "90 Điện Biên Phủ, Ba Đình, Hà Nội",
      quan_he: "Cha",
    },
    {
      ten: "Bùi Thị Nga",
      sdt: "0967262728",
      email: "nga.bui@gmail.com",
      dia_chi: "112 Lê Duẩn, Quận 3, TP.HCM",
      quan_he: "Mẹ",
    },
  ],

  // Loại phòng
  loaiPhong: [
    {
      ten_loai: "Phòng 4 người có điều hòa",
      so_giuong: 4,
      dien_tich: 20.5,
      mo_ta: "Phòng ở 4 người, có điều hòa, tủ lạnh, bàn học",
      gia_thue: 1200000,
      tien_ich: JSON.stringify(["Điều hòa", "Tủ lạnh", "Bàn học", "Tủ quần áo", "WiFi miễn phí", "Nhà vệ sinh riêng"]),
    },
    {
      ten_loai: "Phòng 6 người thường",
      so_giuong: 6,
      dien_tich: 25.0,
      mo_ta: "Phòng ở 6 người, quạt trần, bàn học chung",
      gia_thue: 800000,
      tien_ich: JSON.stringify(["Quạt trần", "Bàn học chung", "Tủ quần áo", "WiFi miễn phí", "Nhà vệ sinh chung"]),
    },
    {
      ten_loai: "Phòng 2 người VIP",
      so_giuong: 2,
      dien_tich: 18.0,
      mo_ta: "Phòng ở 2 người, đầy đủ tiện nghi cao cấp",
      gia_thue: 2000000,
      tien_ich: JSON.stringify([
        "Điều hòa",
        "Tủ lạnh",
        "Bàn học riêng",
        "Tủ quần áo lớn",
        "WiFi miễn phí",
        "Nhà vệ sinh riêng",
        "Balcony",
      ]),
    },
  ],

  // Phòng
  phong: [
    {
      ten_phong: "A101",
      id_loai_phong: 1, // Phòng 4 người có điều hòa
      so_tang: 1,
      trang_thai: "occupied",
      gioi_tinh: "Nam",
      ghi_chu: "Phòng nam tầng 1",
    },
    {
      ten_phong: "A102",
      id_loai_phong: 1, // Phòng 4 người có điều hòa
      so_tang: 1,
      trang_thai: "occupied",
      gioi_tinh: "Nam",
      ghi_chu: "Phòng nam tầng 1",
    },
    {
      ten_phong: "A201",
      id_loai_phong: 2, // Phòng 6 người không điều hòa
      so_tang: 2,
      trang_thai: "occupied",
      gioi_tinh: "Nam",
      ghi_chu: "Phòng nam tầng 2",
    },
    {
      ten_phong: "B101",
      id_loai_phong: 1, // Phòng 4 người có điều hòa
      so_tang: 1,
      trang_thai: "available",
      gioi_tinh: "Nữ",
      ghi_chu: "Phòng nữ tầng 1",
    },
    {
      ten_phong: "B102",
      id_loai_phong: 2, // Phòng 6 người không điều hòa
      so_tang: 1,
      trang_thai: "available",
      gioi_tinh: "Nữ",
      ghi_chu: "Phòng nữ tầng 1",
    },
  ],

  // Giường
  giuong: [
    // Phòng A101 (id: 1) - 4 người có điều hòa
    { ten_giuong: "A101-1", id_phong: 1, trang_thai: "occupied", ghi_chu: "Góc trái" },
    { ten_giuong: "A101-2", id_phong: 1, trang_thai: "occupied", ghi_chu: "Góc phải" },
    { ten_giuong: "A101-3", id_phong: 1, trang_thai: "available", ghi_chu: "Giữa trái" },
    { ten_giuong: "A101-4", id_phong: 1, trang_thai: "available", ghi_chu: "Giữa phải" },

    // Phòng A102 (id: 2) - 4 người có điều hòa
    { ten_giuong: "A102-1", id_phong: 2, trang_thai: "occupied", ghi_chu: "Góc trái" },
    { ten_giuong: "A102-2", id_phong: 2, trang_thai: "occupied", ghi_chu: "Góc phải" },
    { ten_giuong: "A102-3", id_phong: 2, trang_thai: "occupied", ghi_chu: "Giữa trái" },
    { ten_giuong: "A102-4", id_phong: 2, trang_thai: "occupied", ghi_chu: "Giữa phải" },

    // Phòng A201 (id: 3) - 6 người không điều hòa
    { ten_giuong: "A201-1", id_phong: 3, trang_thai: "occupied", ghi_chu: "Bên trái" },
    { ten_giuong: "A201-2", id_phong: 3, trang_thai: "occupied", ghi_chu: "Bên phải" },
    { ten_giuong: "A201-3", id_phong: 3, trang_thai: "occupied", ghi_chu: "Giữa trái" },
    { ten_giuong: "A201-4", id_phong: 3, trang_thai: "occupied", ghi_chu: "Giữa phải" },
    { ten_giuong: "A201-5", id_phong: 3, trang_thai: "available", ghi_chu: "Cửa trái" },
    { ten_giuong: "A201-6", id_phong: 3, trang_thai: "available", ghi_chu: "Cửa phải" },

    // Phòng B101 (id: 4) - 4 người có điều hòa
    { ten_giuong: "B101-1", id_phong: 4, trang_thai: "available", ghi_chu: "Góc trái" },
    { ten_giuong: "B101-2", id_phong: 4, trang_thai: "available", ghi_chu: "Góc phải" },
    { ten_giuong: "B101-3", id_phong: 4, trang_thai: "available", ghi_chu: "Giữa trái" },
    { ten_giuong: "B101-4", id_phong: 4, trang_thai: "available", ghi_chu: "Giữa phải" },

    // Phòng B102 (id: 5) - 6 người không điều hòa
    { ten_giuong: "B102-1", id_phong: 5, trang_thai: "available", ghi_chu: "Góc trái" },
    { ten_giuong: "B102-2", id_phong: 5, trang_thai: "available", ghi_chu: "Góc phải" },
    { ten_giuong: "B102-3", id_phong: 5, trang_thai: "available", ghi_chu: "Giữa trái" },
    { ten_giuong: "B102-4", id_phong: 5, trang_thai: "available", ghi_chu: "Giữa phải" },
    { ten_giuong: "B102-5", id_phong: 5, trang_thai: "available", ghi_chu: "Cửa trái" },
    { ten_giuong: "B102-6", id_phong: 5, trang_thai: "available", ghi_chu: "Cửa phải" },
  ],

  // Chủ đề tin tức
  chuDe: [
    {
      ten_chu_de: "Thông báo chung",
      mo_ta: "Các thông báo chung của KTX",
      trang_thai: "published",
    },
    {
      ten_chu_de: "Hoạt động sinh viên",
      mo_ta: "Thông tin về các hoạt động dành cho sinh viên",
      trang_thai: "published",
    },
    {
      ten_chu_de: "Quy định KTX",
      mo_ta: "Các quy định và nội quy của KTX",
      trang_thai: "published",
    },
  ],

  // Bảng tin
  bangTin: [
    {
      tieu_de: "Thông báo về việc đóng tiền phòng tháng 1/2024",
      noi_dung: "Thông báo đến tất cả sinh viên về việc đóng tiền phòng tháng 1/2024. Hạn cuối: 31/01/2024.",
      trang_thai: "published",
      ngay_dang: "2024-01-01",
    },
    {
      tieu_de: "Lịch kiểm tra phòng định kỳ tháng 1/2024",
      noi_dung: "Ban quản lý KTX sẽ tiến hành kiểm tra phòng định kỳ từ ngày 15-20/01/2024.",
      trang_thai: "published",
      ngay_dang: "2024-01-10",
    },
    {
      tieu_de: "Quy định mới về giờ giấc ra vào KTX",
      noi_dung: "Từ ngày 01/02/2024, giờ đóng cửa KTX là 23:00, giờ mở cửa là 05:00.",
      trang_thai: "published",
      ngay_dang: "2024-01-25",
    },
  ],

  // Đơn giá điện
  donGiaDien: [
    {
      don_gia: 1678,
      tu_ngay: "2024-01-01",
      den_ngay: "2024-03-31",
      ghi_chu: "Bậc 1: Từ 0 đến 50 kWh - Quý 1/2024",
    },
    {
      don_gia: 1734,
      tu_ngay: "2024-04-01",
      den_ngay: "2024-06-30",
      ghi_chu: "Bậc 2: Từ 51 đến 100 kWh - Quý 2/2024",
    },
    {
      don_gia: 2014,
      tu_ngay: "2024-07-01",
      den_ngay: "2024-09-30",
      ghi_chu: "Bậc 3: Từ 101 đến 200 kWh - Quý 3/2024",
    },
    {
      don_gia: 2536,
      tu_ngay: "2024-10-01",
      den_ngay: null,
      ghi_chu: "Bậc 4: Từ 201 đến 300 kWh - Từ Q4/2024",
    },
  ],
};

// Hàm hash mật khẩu
async function hashPassword(password) {
  return await bcrypt.hash(password, 10);
}

// Hàm seed dữ liệu
async function seedDatabase() {
  try {
    console.log("🌱 Bắt đầu seed dữ liệu...");

    // Kiểm tra dữ liệu hiện tại
    const existingStaff = await NhanVien.findOne({ where: { ma_nv: "ADMIN001" } });
    if (existingStaff) {
      console.log("⚠️  Dữ liệu đã tồn tại! Có muốn xóa và tạo lại? (y/n)");
      console.log("📄 Chạy với option --force để tự động xóa và tạo lại:");
      console.log("   npm run seed:data -- --force");

      // Kiểm tra force flag
      const forceFlag = process.argv.includes("--force");
      if (!forceFlag) {
        console.log("🛑 Dừng seed. Sử dụng --force để xóa dữ liệu cũ và tạo mới.");
        return;
      }

      console.log("🗑️  Xóa dữ liệu cũ...");

      // Xóa theo thứ tự ngược lại để tránh lỗi foreign key
      await HdTienDienSinhVien.destroy({ where: {}, truncate: true, cascade: true });
      await HdTienDien.destroy({ where: {}, truncate: true, cascade: true });
      await DonGiaDien.destroy({ where: {}, truncate: true, cascade: true });
      await BangTin.destroy({ where: {}, truncate: true, cascade: true });
      await ChuDe.destroy({ where: {}, truncate: true, cascade: true });
      await PhanBoPhong.destroy({ where: {}, truncate: true, cascade: true });
      await Giuong.destroy({ where: {}, truncate: true, cascade: true });
      await Phong.destroy({ where: {}, truncate: true, cascade: true });
      await LoaiPhong.destroy({ where: {}, truncate: true, cascade: true });
      await PhuHuynh.destroy({ where: {}, truncate: true, cascade: true });
      await SinhVien.destroy({ where: {}, truncate: true, cascade: true });
      await NhanVien.destroy({ where: {}, truncate: true, cascade: true });

      console.log("✅ Đã xóa dữ liệu cũ");
    }

    // Đảm bảo database đồng bộ
    await sequelize.sync({ force: false });

    // 1. Seed nhân viên
    console.log("👥 Seeding nhân viên...");
    const createdNhanVien = [];
    for (const nvData of seedData.nhanVien) {
      const hashedPassword = await hashPassword(nvData.mat_khau);
      const nv = await NhanVien.create({
        ...nvData,
        mat_khau: hashedPassword,
      });
      createdNhanVien.push(nv);
      console.log(`✅ Tạo nhân viên: ${nv.ten} (${nv.ma_nv})`);
    }

    // 2. Seed sinh viên
    console.log("🎓 Seeding sinh viên...");
    const createdSinhVien = [];
    for (const svData of seedData.sinhVien) {
      const sv = await SinhVien.create(svData);
      createdSinhVien.push(sv);
      console.log(`✅ Tạo sinh viên: ${sv.ten} (${sv.mssv})`);
    }

    // 3. Seed phụ huynh
    console.log("👨‍👩‍👧‍👦 Seeding phụ huynh...");
    const createdPhuHuynh = [];
    for (let i = 0; i < seedData.phuHuynh.length; i++) {
      const phData = {
        ...seedData.phuHuynh[i],
        id_sinh_vien: createdSinhVien[i].id,
        nguoi_tao: createdNhanVien[0].id, // Admin tạo
      };
      const ph = await PhuHuynh.create(phData);
      createdPhuHuynh.push(ph);
      console.log(`✅ Tạo phụ huynh: ${ph.ten} - con: ${createdSinhVien[i].ten}`);
    }

    // 4. Seed loại phòng
    console.log("🏠 Seeding loại phòng...");
    const createdLoaiPhong = [];
    for (const lpData of seedData.loaiPhong) {
      const lp = await LoaiPhong.create({
        ...lpData,
        nguoi_tao: createdNhanVien[0].id, // Admin tạo
      });
      createdLoaiPhong.push(lp);
      console.log(`✅ Tạo loại phòng: ${lp.ten_loai}`);
    }

    // 5. Seed phòng
    console.log("🏘️ Seeding phòng...");
    const createdPhong = [];
    const roomTypeMapping = [0, 1, 2, 0, 1]; // Mapping loại phòng cho các phòng
    for (let i = 0; i < seedData.phong.length; i++) {
      const pData = {
        ...seedData.phong[i],
        id_loai_phong: createdLoaiPhong[roomTypeMapping[i]].id,
        nguoi_tao: createdNhanVien[0].id,
      };
      const p = await Phong.create(pData);
      createdPhong.push(p);
      console.log(`✅ Tạo phòng: ${p.ten_phong} - ${createdLoaiPhong[roomTypeMapping[i]].ten_loai}`);
    }

    // 6. Seed giường
    console.log("🛏️ Seeding giường...");
    const createdGiuong = [];
    let giuongIndex = 0;
    const bedsPerRoom = [4, 6, 2, 4, 6]; // Số giường mỗi phòng

    for (let roomIndex = 0; roomIndex < createdPhong.length; roomIndex++) {
      for (let bedInRoom = 0; bedInRoom < bedsPerRoom[roomIndex]; bedInRoom++) {
        const gData = {
          ...seedData.giuong[giuongIndex],
          id_phong: createdPhong[roomIndex].id,
          nguoi_tao: createdNhanVien[0].id,
        };

        // Gán sinh viên cho một số giường đã có người
        if (gData.trang_thai === "occupied" && giuongIndex < createdSinhVien.length) {
          gData.id_sinh_vien = createdSinhVien[giuongIndex].id;
        }

        const g = await Giuong.create(gData);
        createdGiuong.push(g);
        console.log(`✅ Tạo giường: ${g.ten_giuong} - Phòng ${createdPhong[roomIndex].ten_phong}`);
        giuongIndex++;
      }
    }

    // 7. Seed phân bổ phòng cho sinh viên đã có giường
    console.log("📋 Seeding phân bổ phòng...");
    const createdPhanBoPhong = [];
    const occupiedBeds = createdGiuong.filter((g) => g.id_sinh_vien);

    for (const bed of occupiedBeds) {
      const pbp = await PhanBoPhong.create({
        id_sv: bed.id_sinh_vien,
        id_giuong: bed.id,
        ngay_bat_dau: "2024-01-01",
        ngay_ket_thuc: "2024-12-31",
        trang_thai: "active",
        nguoi_tao: createdNhanVien[0].id,
      });
      createdPhanBoPhong.push(pbp);
      const student = createdSinhVien.find((s) => s.id === bed.id_sinh_vien);
      console.log(`✅ Phân bổ sinh viên ${student.ten} vào giường ${bed.ten_giuong}`);
    }

    // 8. Seed chủ đề
    console.log("📰 Seeding chủ đề...");
    const createdChuDe = [];
    for (const cdData of seedData.chuDe) {
      const cd = await ChuDe.create({
        ...cdData,
        nguoi_tao: createdNhanVien[0].id,
      });
      createdChuDe.push(cd);
      console.log(`✅ Tạo chủ đề: ${cd.ten_chu_de}`);
    }

    // 9. Seed bảng tin
    console.log("📢 Seeding bảng tin...");
    for (let i = 0; i < seedData.bangTin.length; i++) {
      const btData = {
        ...seedData.bangTin[i],
        id_chu_de: createdChuDe[i % createdChuDe.length].id,
        nguoi_tao: createdNhanVien[0].id,
      };
      const bt = await BangTin.create(btData);
      console.log(`✅ Tạo bản tin: ${bt.tieu_de}`);
    }

    // 10. Seed đơn giá điện
    console.log("⚡ Seeding đơn giá điện...");
    const createdDonGiaDien = [];
    for (const dgdData of seedData.donGiaDien) {
      const dgd = await DonGiaDien.create({
        ...dgdData,
        nguoi_tao: createdNhanVien[0].id,
      });
      createdDonGiaDien.push(dgd);
      console.log(`✅ Tạo đơn giá điện: ${dgd.ghi_chu} - ${dgd.don_gia}đ/kWh`);
    }

    // 11. Seed hóa đơn tiền điện phòng (mẫu)
    console.log("🧾 Seeding hóa đơn tiền điện phòng...");
    const roomsWithStudents = createdPhong.filter((p) =>
      createdGiuong.some((g) => g.id_phong === p.id && g.id_sinh_vien),
    );

    for (const room of roomsWithStudents.slice(0, 3)) {
      // Tạo hóa đơn cho 3 phòng đầu
      const soDienCu = Math.floor(Math.random() * 100) + 50; // 50-150
      const soDienMoi = soDienCu + Math.floor(Math.random() * 100) + 50; // thêm 50-150
      const soDienTieuThu = soDienMoi - soDienCu;

      const hdTienDien = await HdTienDien.create({
        id_phong: room.id,
        tu_ngay: "2024-01-01",
        den_ngay: "2024-01-31",
        so_dien_cu: soDienCu,
        so_dien_moi: soDienMoi,
        id_don_gia_dien: createdDonGiaDien[0].id,
        so_dien_tieu_thu: soDienTieuThu,
        thanh_tien: soDienTieuThu * createdDonGiaDien[0].don_gia,
        trang_thai: "calculated",
        nguoi_tao: createdNhanVien[0].id,
      });

      console.log(
        `✅ Tạo hóa đơn điện phòng ${room.ten_phong}: ${soDienTieuThu} kWh - ${(
          soDienTieuThu * createdDonGiaDien[0].don_gia
        ).toLocaleString()}đ`,
      );

      // Tạo hóa đơn cho sinh viên trong phòng
      const studentsInRoom = createdGiuong.filter((g) => g.id_phong === room.id && g.id_sinh_vien);
      const soNgayTrongThang = 30; // Chu kỳ tính tiền 30 ngày
      const tyLeChiaDeu = 1 / studentsInRoom.length; // Chia đều cho số sinh viên trong phòng
      const tienMoiSinhVien = Math.floor(soDienTieuThu * createdDonGiaDien[0].don_gia * tyLeChiaDeu);

      for (const bed of studentsInRoom) {
        const allocation = createdPhanBoPhong.find((pbp) => pbp.id_giuong === bed.id);
        if (allocation) {
          await HdTienDienSinhVien.create({
            id_hd_tien_dien: hdTienDien.id,
            id_sinh_vien: bed.id_sinh_vien,
            id_phan_bo_phong: allocation.id,
            so_ngay_o: soNgayTrongThang, // Số ngày thực tế ở trong chu kỳ
            ty_le_chia: tyLeChiaDeu, // Tỷ lệ chia (ví dụ: 0.25 cho 4 người/phòng)
            so_tien_phai_tra: tienMoiSinhVien,
            so_tien_da_tra: 0,
            trang_thai_thanh_toan: "unpaid",
            nguoi_tao: createdNhanVien[0].id,
          });

          const student = createdSinhVien.find((s) => s.id === bed.id_sinh_vien);
          console.log(`✅ Tạo hóa đơn sinh viên ${student.ten}: ${tienMoiSinhVien.toLocaleString()}đ`);
        }
      }
    }

    console.log("\n🎉 Hoàn thành seed dữ liệu!");
    console.log("📊 Thống kê dữ liệu đã tạo:");
    console.log(`👥 Nhân viên: ${createdNhanVien.length}`);
    console.log(`🎓 Sinh viên: ${createdSinhVien.length}`);
    console.log(`👨‍👩‍👧‍👦 Phụ huynh: ${createdPhuHuynh.length}`);
    console.log(`🏠 Loại phòng: ${createdLoaiPhong.length}`);
    console.log(`🏘️ Phòng: ${createdPhong.length}`);
    console.log(`🛏️ Giường: ${createdGiuong.length}`);
    console.log(`📋 Phân bổ phòng: ${createdPhanBoPhong.length}`);
    console.log(`📰 Chủ đề: ${createdChuDe.length}`);
    console.log(`📢 Bảng tin: ${seedData.bangTin.length}`);
    console.log(`⚡ Đơn giá điện: ${createdDonGiaDien.length}`);
    console.log(`🧾 Hóa đơn điện: ${roomsWithStudents.slice(0, 3).length} phòng`);

    console.log("\n🔑 Thông tin đăng nhập:");
    console.log("Admin: admin@ktx.edu.vn / admin123");
    console.log("Staff: lan.tran@ktx.edu.vn / staff123");
    console.log("Staff: duc.le@ktx.edu.vn / staff123");
  } catch (error) {
    console.error("❌ Lỗi khi seed dữ liệu:", error);
    throw error;
  }
}

// Chạy seed nếu file được gọi trực tiếp
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase()
    .then(() => {
      console.log("✅ Seed hoàn thành!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Seed thất bại:", error);
      process.exit(1);
    });
}

export default seedDatabase;
