/**
 * @file database.constants.js
 * @description Constants for database table and column names.
 * This file helps to avoid magic strings and provides a centralized place
 * for database schema references.
 */

// --- Database Configuration Constants ---
export const DB_CONFIG = {
  ENCODING: "UTF8",
  LOCALE: "en_US.UTF8",
  TIME_ZONE: "Asia/Ho_Chi_Minh",
  DATE_STYLE: "ISO, DMY",
};

// --- Custom ENUM Types for various entities/tables ---

/**
 * @enum {string} ENUM_NHAN_VIEN_PHAI - Giới tính của nhân viên.
 */
export const ENUM_NHAN_VIEN_PHAI = {
  NAM: "Nam",
  NU: "Nữ",
  KHAC: "Khác",
};

/**
 * @enum {string} ENUM_NHAN_VIEN_ROLE - Vai trò/chức vụ của nhân viên trong hệ thống.
 */
export const ENUM_NHAN_VIEN_ROLE = {
  ADMIN: "admin",
  STAFF: "staff",
};

/**
 * @enum {string} ENUM_NHAN_VIEN_TRANG_THAI - Trạng thái hoạt động của tài khoản nhân viên.
 */
export const ENUM_NHAN_VIEN_TRANG_THAI = {
  ACTIVE: "active", // Đang hoạt động, có thể truy cập hệ thống.
  INACTIVE: "inactive", // Không hoạt động (ví dụ: đã nghỉ việc, hoặc tạm thời không được phép truy cập).
  SUSPENDED: "suspended", // Bị tạm khóa (ví dụ: do vi phạm quy định, hoặc đang trong quá trình điều tra).
};

/**
 * @enum {string} ENUM_BANG_TIN_TRANG_THAI - Trạng thái của một bài viết trong bảng tin.
 */
export const ENUM_BANG_TIN_TRANG_THAI = {
  DRAFT: "draft", // Bản nháp, chưa công bố.
  PUBLISHED: "published", // Đã công bố, đang hiển thị cho người dùng.
  ARCHIVED: "archived", // Đã lưu trữ, không hiển thị công khai nhưng vẫn được giữ lại.
};

/**
 * @enum {string} ENUM_CHU_DE_TRANG_THAI - Trạng thái của một chủ đề (topic).
 */
export const ENUM_CHU_DE_TRANG_THAI = {
  ACTIVE: "active", // Chủ đề đang hoạt động, có thể được sử dụng cho bài viết.
  INACTIVE: "inactive", // Chủ đề không hoạt động, không nên dùng cho bài viết mới.
};

/**
 * @enum {string} ENUM_DON_GIA_DIEN_TRANG_THAI - Trạng thái áp dụng của đơn giá điện.
 */
export const ENUM_DON_GIA_DIEN_TRANG_THAI = {
  ACTIVE: "active", // Đơn giá đang được áp dụng hiện tại.
  INACTIVE: "inactive", // Đơn giá không còn hiệu lực (đã hết hạn hoặc bị thay thế).
};

/**
 * @enum {string} ENUM_GIUONG_TRANG_THAI - Trạng thái sẵn sàng sử dụng của một chiếc giường.
 */
export const ENUM_GIUONG_TRANG_THAI = {
  AVAILABLE: "available", // Giường trống, sẵn sàng để phân bổ cho sinh viên.
  OCCUPIED: "occupied", // Giường đang có sinh viên ở.
  MAINTENANCE: "maintenance", // Giường đang trong quá trình bảo trì, không thể sử dụng.
  UNAVAILABLE: "unavailable", // Giường không khả dụng (ví dụ: hư hỏng, đang chờ sửa chữa nghiêm trọng).
};

/**
 * @enum {string} ENUM_HOA_DON_TRANG_THAI - Trạng thái thanh toán của các loại hóa đơn (VD: phân bổ phòng, tiền điện).
 */
export const ENUM_HOA_DON_TRANG_THAI = {
  PENDING: "pending", // Chờ thanh toán.
  PAID: "paid", // Đã thanh toán đầy đủ.
  PARTIAL_PAID: "partial_paid", // Đã thanh toán một phần.
  OVERDUE: "overdue", // Quá hạn thanh toán.
  CANCELLED: "cancelled", // Đã hủy hóa đơn.
  GENERATED: "generated", // Đã tạo hóa đơn nhưng chưa đến hạn thanh toán (chỉ dùng cho tiền điện).
};

/**
 * @enum {string} ENUM_NOI_QUY_TRANG_THAI - Trạng thái áp dụng của một nội quy.
 */
export const ENUM_NOI_QUY_TRANG_THAI = {
  ACTIVE: "active", // Nội quy đang được áp dụng.
  INACTIVE: "inactive", // Nội quy không còn áp dụng (ví dụ: đã được thay thế).
};

/**
 * @enum {string} ENUM_PHAN_BO_PHONG_TRANG_THAI - Trạng thái của một lần phân bổ phòng cho sinh viên.
 */
export const ENUM_PHAN_BO_PHONG_TRANG_THAI = {
  ACTIVE: "active", // Sinh viên đang ở trong phòng theo phân bổ này.
  EXPIRED: "expired", // Phân bổ đã hết hạn.
  TERMINATED: "terminated", // Phân bổ đã kết thúc sớm (ví dụ: sinh viên chuyển đi).
  PENDING: "pending", // Chờ sinh viên vào ở theo phân bổ.
  CANCELLED: "cancelled", // Đã hủy phân bổ.
};

/**
 * @enum {string} ENUM_PHIEU_DANG_KY_KTX_TRANG_THAI - Trạng thái của một phiếu đăng ký KTX.
 */
export const ENUM_PHIEU_DANG_KY_KTX_TRANG_THAI = {
  PENDING: "pending", // Phiếu đang chờ được xử lý/duyệt.
  APPROVED: "approved", // Phiếu đã được duyệt.
  REJECTED: "rejected", // Phiếu đã bị từ chối.
  CANCELLED: "cancelled", // Phiếu đã bị hủy bởi sinh viên.
};

/**
 * @enum {string} ENUM_PHONG_TRANG_THAI - Trạng thái của một phòng trong KTX.
 */
export const ENUM_PHONG_TRANG_THAI = {
  AVAILABLE: "available", // Phòng trống hoàn toàn, sẵn sàng cho sinh viên vào.
  PARTIALLY_OCCUPIED: "partially_occupied", // Phòng có sinh viên nhưng vẫn còn giường trống.
  FULL: "full", // Phòng đã đầy giường.
  MAINTENANCE: "maintenance", // Phòng đang trong quá trình bảo trì, không thể sử dụng.
  UNAVAILABLE: "unavailable", // Phòng không khả dụng (ví dụ: bị niêm phong, hư hỏng nặng).
};

/**
 * @enum {string} ENUM_SINH_VIEN_TRANG_THAI - Trạng thái của sinh viên liên quan đến KTX.
 */
export const ENUM_SINH_VIEN_TRANG_THAI = {
  ACTIVE_RESIDENT: "active_resident", // Sinh viên đang là cư dân KTX.
  FORMER_RESIDENT: "former_resident", // Sinh viên đã từng là cư dân KTX (đã chuyển đi).
  APPLICANT: "applicant", // Sinh viên đang là ứng viên đăng ký KTX.
  SUSPENDED: "suspended", // Sinh viên bị đình chỉ (ví dụ: do vi phạm nội quy KTX).
  BANNED: "banned", // Sinh viên bị cấm túc khỏi KTX.
  INACTIVE: "inactive", // Sinh viên không còn liên quan đến KTX (ví dụ: đã tốt nghiệp và không ở KTX).
};

/**
 * @enum {string} ENUM_TAI_LIEU_DINH_KEM_TRANG_THAI - Trạng thái của một tài liệu đính kèm.
 */
export const ENUM_TAI_LIEU_DINH_KEM_TRANG_THAI = {
  ACTIVE: "active", // Tài liệu đang được sử dụng hoặc hiển thị.
  ARCHIVED: "archived", // Tài liệu đã được lưu trữ (không còn sử dụng chính).
  DELETED: "deleted", // Tài liệu đã bị xóa (soft delete).
};

/**
 * @enum {string} ENUM_PHONG_GENDER - Giới tính phù hợp cho phòng.
 * Dùng cho trường 'gender' trong bảng `phong`.
 */
export const ENUM_PHONG_GENDER = {
  NAM: "Nam", // Phòng chỉ dành cho nam sinh viên.
  NU: "Nữ", // Phòng chỉ dành cho nữ sinh viên.
  UNISEX: "Unisex", // Phòng có thể dành cho cả nam và nữ (ít phổ biến trong KTX, nhưng có thể có).
};

/**
 * @enum {string} ENUM_TAI_LIEU_DINH_KEM_TYPE - Các loại tài liệu đính kèm.
 * Dùng cho trường 'type' trong bảng `tai_lieu_dinh_kem`.
 */
export const ENUM_TAI_LIEU_DINH_KEM_TYPE = {
  STUDENT_PROFILE: "student_profile", // Tài liệu liên quan đến hồ sơ sinh viên.
  REGISTRATION_FORM: "registration_form", // Phiếu đăng ký KTX.
  IDENTIFICATION: "identification", // Giấy tờ tùy thân (CMND/CCCD/Hộ chiếu).
  HEALTH_CERTIFICATE: "health_certificate", // Giấy khám sức khỏe.
  SCHOOL_TRANSCRIPT: "school_transcript", // Bảng điểm/Kết quả học tập.
  OTHER: "other", // Các loại tài liệu khác không thuộc danh mục trên.
};

/**
 * @enum {string} ENUM_NOI_QUY_TYPE - Các loại nội quy.
 * Dùng cho trường 'type' trong bảng `noi_quy`.
 */
export const ENUM_NOI_QUY_TYPE = {
  CHUNG_KTX: "chung_ktx", // Nội quy chung áp dụng cho toàn bộ KTX.
  RIENG_PHONG: "rieng_phong", // Nội quy đặc thù áp dụng cho từng phòng hoặc loại phòng.
};

// --- Date Formats ---
// Ví dụ: Các năm học (nếu có định dạng chuẩn)
export const ENUM_NAM_HOC_FORMAT = {
  EXAMPLE: "YYYY-YYYY", // Ví dụ: '2023-2024'
};

// --- Table Names ---
export const TABLES = {
  BANG_TIN: "bang_tin",
  BANG_TIN_CHU_DE: "bang_tin_chu_de",
  CHU_DE: "chu_de",
  DON_GIA_DIEN: "don_gia_dien",
  GIUONG: "giuong",
  HD_PHAN_BO_PHONG: "hd_phan_bo_phong",
  HD_TIEN_DIEN: "hd_tien_dien",
  LOAI_PHONG: "loai_phong",
  NHAN_VIEN: "nhan_vien",
  NOI_QUY: "noi_quy",
  NOI_QUY_PHONG: "noi_quy_phong",
  PHAN_BO_PHONG: "phan_bo_phong",
  PHIEU_DANG_KY_KTX: "phieu_dang_ky_ktx",
  PHONG: "phong",
  PHU_HUYNH: "phu_huynh",
  SINH_VIEN: "sinh_vien",
  TAI_LIEU_DINH_KEM: "tai_lieu_dinh_kem",
  TIEN_DIEN_SINH_VIEN: "tien_dien_sinh_vien",
};

// --- Column Names for Each Table ---

export const COLUMNS = {
  COMMON: {
    ID: "id",
    DANG_HIEN: "dang_hien", // 'dang_hien' is used across many tables
    NGAY_TAO: "ngay_tao",
    NGAY_CAP_NHAT: "ngay_cap_nhat",
    NGUOI_TAO: "nguoi_tao",
    NGUOI_CAP_NHAT: "nguoi_cap_nhat",
  },
  BANG_TIN: {
    TIEU_DE: "tieu_de",
    NOI_DUNG: "noi_dung",
    HINH_NEN: "hinh_nen",
  },
  BANG_TIN_CHU_DE: {
    ID_BANG_TIN: "id_bang_tin",
    ID_CHU_DE: "id_chu_de",
  },
  CHU_DE: {
    TEN_CHU_DE: "ten_chu_de",
    MO_TA: "mo_ta",
  },
  DON_GIA_DIEN: {
    MO_TA: "mo_ta",
    DON_GIA_DIEN: "don_gia_dien",
  },
  GIUONG: {
    ID_PHONG: "id_phong",
    TEN: "ten",
  },
  HD_PHAN_BO_PHONG: {
    ID_PHAN_BO_PHONG: "id_phan_bo_phong",
    SO_TIEN_THANH_TOAN: "so_tien_thanh_toan",
  },
  HD_TIEN_DIEN: {
    ID_PHONG: "id_phong",
    TU_NGAY: "tu_ngay",
    DEN_NGAY: "den_ngay",
    SO_DIEN_CU: "so_dien_cu",
    SO_DIEN_MOI: "so_dien_moi",
    ID_DON_GIA_DIEN: "id_don_gia_dien",
    TRANG_THAI: "trang_thai",
    THANH_TIEN: "thanh_tien",
  },
  LOAI_PHONG: {
    TEN: "ten",
    GIA: "gia",
    MO_TA: "mo_ta",
  },
  NHAN_VIEN: {
    MA_NV: "ma_nv",
    TEN: "ten",
    MAT_KHAU: "mat_khau",
    ROLE: "role",
    SDT: "sdt",
    EMAIL: "email",
    CMND: "cmnd",
    PHAI: "phai",
    PHONG_BAN: "phong_ban",
    NGAY_VAO_LAM: "ngay_vao_lam",
    TRANG_THAI: "trang_thai",
    NGAY_SINH: "ngay_sinh",
  },
  NOI_QUY: {
    TYPE: "type",
    NOI_QUY: "noi_quy",
  },
  NOI_QUY_PHONG: {
    ID_PHONG: "id_phong",
    ID_NOI_QUY: "id_noi_quy",
  },
  PHAN_BO_PHONG: {
    ID_SV: "id_sv",
    ID_GIUONG: "id_giuong",
    NGAY_BAT_DAU: "ngay_bat_dau",
    NGAY_KET_THUC: "ngay_ket_thuc",
  },
  PHIEU_DANG_KY_KTX: {
    ID_SV: "id_sv",
    NAM_HOC: "nam_hoc",
    NGAY_DANG_KY: "ngay_dang_ky",
    GHI_CHU: "ghi_chu",
    TRANG_THAI: "trang_thai",
  },
  PHONG: {
    ID_LOAI_PHONG: "id_loai_phong",
    TEN: "ten",
    SL_MAX: "sl_max",
    SL_HIEN_TAI: "sl_hien_tai",
    TRANG_THAI: "trang_thai",
    MO_TA: "mo_ta",
    GENDER: "gender",
  },
  PHU_HUYNH: {
    ID_SV: "id_sv",
    HO_TEN: "ho_ten",
    NAM_SINH: "nam_sinh",
    NGHE_NGHIEP: "nghe_nghiep",
    SDT: "sdt",
    MOI_QUAN_HE: "moi_quan_he",
  },
  SINH_VIEN: {
    MSSV: "mssv",
    TEN: "ten",
    DIA_CHI: "dia_chi",
    PHAI: "phai",
    NGAY_SINH: "ngay_sinh",
    NOI_SINH: "noi_sinh",
    DAN_TOC: "dan_toc",
    TON_GIAO: "ton_giao",
    KHOA: "khoa",
    SDT: "sdt",
    CMND: "cmnd",
    NGAY_CAP_CMND: "ngay_cap_cmnd",
    NOI_CAP_CMND: "noi_cap_cmnd",
    HO_KHAU: "ho_khau",
    DIA_CHI_LIEN_HE: "dia_chi_lien_he",
    MAT_KHAU: "mat_khau",
    TRANG_THAI: "trang_thai",
    EMAIL: "email",
    LOP: "lop",
    PASSWORD_SETUP_TOKEN: "password_setup_token",
    PASSWORD_SETUP_EXPIRES: "password_setup_expires",
  },
  TAI_LIEU_DINH_KEM: {
    TYPE: "type",
    ID_LOAI_TAI_LIEU: "id_loai_tai_lieu",
    LOAI_TAI_LIEU: "loai_tai_lieu",
    FILE_PATH: "file_path",
    FILE_NAME: "file_name",
    MIME_TYPE: "mime_type",
    KICH_THUOC: "kich_thuoc",
    NGAY_TAI_LEN: "ngay_tai_len",
  },
  TIEN_DIEN_SINH_VIEN: {
    ID_SV: "id_sv",
    ID_HOA_DON: "id_hoa_don",
    THANH_TIEN: "thanh_tien",
    TRANG_THAI: "trang_thai",
  },
};
