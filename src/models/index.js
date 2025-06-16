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
import { COLUMNS } from '../constants/database.constants.js';
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
NhanVien.hasMany(BangTin, { foreignKey: COLUMNS.COMMON.NGUOI_TAO, as: 'CreatedNews' });
BangTin.belongsTo(NhanVien, { foreignKey: COLUMNS.COMMON.NGUOI_TAO, as: 'Creator' });

NhanVien.hasMany(BangTin, { foreignKey: COLUMNS.COMMON.NGUOI_CAP_NHAT, as: 'UpdatedNews' });
BangTin.belongsTo(NhanVien, { foreignKey: COLUMNS.COMMON.NGUOI_CAP_NHAT, as: 'Updater' });

// 2. ChuDe - NhanVien (người tạo/cập nhật)
NhanVien.hasMany(ChuDe, { foreignKey: COLUMNS.COMMON.NGUOI_TAO, as: 'CreatedTopics' });
ChuDe.belongsTo(NhanVien, { foreignKey: COLUMNS.COMMON.NGUOI_TAO, as: 'Creator' });

NhanVien.hasMany(ChuDe, { foreignKey: COLUMNS.COMMON.NGUOI_CAP_NHAT, as: 'UpdatedTopics' });
ChuDe.belongsTo(NhanVien, { foreignKey: COLUMNS.COMMON.NGUOI_CAP_NHAT, as: 'Updater' });


// 3. Mối quan hệ MỘT-NHIỀU giữa ChuDe và BangTin
// Một chủ đề có nhiều bản tin
ChuDe.hasMany(BangTin, { foreignKey: COLUMNS.BANG_TIN.ID_CHU_DE, as: 'News' });
// Một bản tin thuộc về một chủ đề
BangTin.belongsTo(ChuDe, { foreignKey: COLUMNS.BANG_TIN.ID_CHU_DE, as: 'Topic' });

export {
  NhanVien, SinhVien, LoaiPhong, Phong, Giuong, PhuHuynh, PhieuDangKy,
  BangTin, ChuDe
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
};
