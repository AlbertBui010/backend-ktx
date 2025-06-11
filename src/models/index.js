import NhanVien from "./NhanVien.model.js";
import SinhVien from "./SinhVien.model.js";

// Define associations here when needed
// Example:
// NhanVien.hasMany(SinhVien, { foreignKey: 'nguoi_tao' });
// SinhVien.belongsTo(NhanVien, { foreignKey: 'nguoi_tao' });

export { NhanVien, SinhVien };

export default {
  NhanVien,
  SinhVien,
};
