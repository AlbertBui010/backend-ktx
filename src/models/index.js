//src\models\index.js
import NhanVien from "./NhanVien.model.js";
import SinhVien from "./SinhVien.model.js";
import LoaiPhong from "./LoaiPhong.model.js";
import Phong from "./Phong.model.js";
import Giuong from "./Giuong.model.js";
import PhuHuynh from "./PhuHuynh.model.js";
import PhieuDangKy from "./PhieuDangKy.model.js";
import BangTin from "./BangTin.model.js";
import ChuDe from "./ChuDe.model.js";
import PhanBoPhong from "./PhanBoPhong.model.js";
import HoaDonPhanBoPhong from "./HoaDonPhanBoPhong.model.js";
import DonGiaDien from "./DonGiaDien.model.js";
import HdTienDien from "./HdTienDien.model.js";
import HdTienDienSinhVien from "./HdTienDienSinhVien.model.js";
import { COLUMNS } from "../constants/database.constants.js";
// Define associations
// Staff/Admin associations
NhanVien.hasMany(LoaiPhong, { foreignKey: "nguoi_tao", as: "CreatedRoomTypes" });
NhanVien.hasMany(Phong, { foreignKey: "nguoi_tao", as: "CreatedRooms" });
NhanVien.hasMany(Giuong, { foreignKey: "nguoi_tao", as: "CreatedBeds" });
NhanVien.hasMany(PhuHuynh, { foreignKey: "nguoi_tao", as: "CreatedParents" });
NhanVien.hasMany(PhieuDangKy, { foreignKey: "nguoi_duyet", as: "ApprovedRegistrations" });

// Room Type associations
LoaiPhong.hasMany(Phong, { foreignKey: "id_loai_phong", as: "Rooms" });
LoaiPhong.belongsTo(NhanVien, { foreignKey: "nguoi_tao", as: "Creator" });

// Room associations
Phong.belongsTo(LoaiPhong, { foreignKey: "id_loai_phong", as: "RoomType" });
Phong.hasMany(Giuong, { foreignKey: "id_phong", as: "Beds" });
Phong.belongsTo(NhanVien, { foreignKey: "nguoi_tao", as: "Creator" });

// Bed associations
Giuong.belongsTo(Phong, { foreignKey: "id_phong", as: "Room" });
Giuong.belongsTo(SinhVien, { foreignKey: "id_sinh_vien", as: "Student" });
Giuong.belongsTo(NhanVien, { foreignKey: "nguoi_tao", as: "Creator" });

// Student associations
SinhVien.hasOne(Giuong, { foreignKey: "id_sinh_vien", as: "Bed" });
SinhVien.hasMany(PhuHuynh, { foreignKey: "id_sinh_vien", as: "Parents" });
SinhVien.hasMany(PhieuDangKy, { foreignKey: "id_sinh_vien", as: "Registrations" });

// Parent associations
PhuHuynh.belongsTo(SinhVien, { foreignKey: "id_sinh_vien", as: "Student" });
PhuHuynh.belongsTo(NhanVien, { foreignKey: "nguoi_tao", as: "Creator" });

// Registration associations
PhieuDangKy.belongsTo(SinhVien, { foreignKey: "id_sinh_vien", as: "Student" });
PhieuDangKy.belongsTo(NhanVien, { foreignKey: "nguoi_duyet", as: "Approver" });
PhieuDangKy.belongsTo(NhanVien, { foreignKey: "nguoi_tao", as: "Creator" });

// 1. BangTin - NhanVien (người tạo/cập nhật)
NhanVien.hasMany(BangTin, { foreignKey: COLUMNS.COMMON.NGUOI_TAO, as: "CreatedNews" });
BangTin.belongsTo(NhanVien, { foreignKey: COLUMNS.COMMON.NGUOI_TAO, as: "Creator" });

NhanVien.hasMany(BangTin, { foreignKey: COLUMNS.COMMON.NGUOI_CAP_NHAT, as: "UpdatedNews" });
BangTin.belongsTo(NhanVien, { foreignKey: COLUMNS.COMMON.NGUOI_CAP_NHAT, as: "Updater" });

// 2. ChuDe - NhanVien (người tạo/cập nhật)
NhanVien.hasMany(ChuDe, { foreignKey: COLUMNS.COMMON.NGUOI_TAO, as: "CreatedTopics" });
ChuDe.belongsTo(NhanVien, { foreignKey: COLUMNS.COMMON.NGUOI_TAO, as: "Creator" });

NhanVien.hasMany(ChuDe, { foreignKey: COLUMNS.COMMON.NGUOI_CAP_NHAT, as: "UpdatedTopics" });
ChuDe.belongsTo(NhanVien, { foreignKey: COLUMNS.COMMON.NGUOI_CAP_NHAT, as: "Updater" });

// 3. Mối quan hệ MỘT-NHIỀU giữa ChuDe và BangTin
// Một chủ đề có nhiều bản tin
ChuDe.hasMany(BangTin, { foreignKey: COLUMNS.BANG_TIN.ID_CHU_DE, as: "News" });
// Một bản tin thuộc về một chủ đề
BangTin.belongsTo(ChuDe, { foreignKey: COLUMNS.BANG_TIN.ID_CHU_DE, as: "Topic" });

// Bổ sung mối quan hệ của PhanBoPhong
// PhanBoPhong - SinhVien (sinh viên được phân bổ)
SinhVien.hasMany(PhanBoPhong, { foreignKey: "id_sv", as: "RoomAssignments" });
PhanBoPhong.belongsTo(SinhVien, { foreignKey: "id_sv", as: "Student" });

// PhanBoPhong - Giuong (giường được phân bổ)
Giuong.hasMany(PhanBoPhong, { foreignKey: "id_giuong", as: "RoomAssignments" });
PhanBoPhong.belongsTo(Giuong, { foreignKey: "id_giuong", as: "Bed" });

PhanBoPhong.hasOne(HoaDonPhanBoPhong, {
  foreignKey: COLUMNS.HD_PHAN_BO_PHONG.ID_PHAN_BO_PHONG,
  as: "Invoice",
});
HoaDonPhanBoPhong.belongsTo(PhanBoPhong, {
  foreignKey: COLUMNS.HD_PHAN_BO_PHONG.ID_PHAN_BO_PHONG,
  as: "Allocation",
});

// Electricity billing associations
// DonGiaDien associations
DonGiaDien.hasMany(HdTienDien, { foreignKey: "id_don_gia_dien", as: "ElectricityBills" });
DonGiaDien.belongsTo(NhanVien, { foreignKey: "nguoi_tao", as: "Creator" });

// HdTienDien associations
HdTienDien.belongsTo(Phong, { foreignKey: "id_phong", as: "Room" });
HdTienDien.belongsTo(DonGiaDien, { foreignKey: "id_don_gia_dien", as: "ElectricityRate" });
HdTienDien.hasMany(HdTienDienSinhVien, { foreignKey: "id_hd_tien_dien", as: "StudentBills" });
HdTienDien.belongsTo(NhanVien, { foreignKey: "nguoi_tao", as: "Creator" });

// HdTienDienSinhVien associations
HdTienDienSinhVien.belongsTo(HdTienDien, { foreignKey: "id_hd_tien_dien", as: "ElectricityBill" });
HdTienDienSinhVien.belongsTo(SinhVien, { foreignKey: "id_sinh_vien", as: "Student" });
HdTienDienSinhVien.belongsTo(PhanBoPhong, { foreignKey: "id_phan_bo_phong", as: "RoomAllocation" });
HdTienDienSinhVien.belongsTo(NhanVien, { foreignKey: "nguoi_tao", as: "Creator" });

// Reverse associations
Phong.hasMany(HdTienDien, { foreignKey: "id_phong", as: "ElectricityBills" });
SinhVien.hasMany(HdTienDienSinhVien, { foreignKey: "id_sinh_vien", as: "ElectricityBills" });
PhanBoPhong.hasMany(HdTienDienSinhVien, { foreignKey: "id_phan_bo_phong", as: "ElectricityBills" });

export {
  NhanVien,
  SinhVien,
  LoaiPhong,
  Phong,
  Giuong,
  PhuHuynh,
  PhieuDangKy,
  BangTin,
  ChuDe,
  PhanBoPhong,
  HoaDonPhanBoPhong,
  DonGiaDien,
  HdTienDien,
  HdTienDienSinhVien,
};

export default {
  NhanVien,
  SinhVien,
  LoaiPhong,
  Phong,
  Giuong,
  PhuHuynh,
  PhieuDangKy,
  BangTin,
  ChuDe,
  PhanBoPhong,
  HoaDonPhanBoPhong,
  DonGiaDien,
  HdTienDien,
  HdTienDienSinhVien,
};
