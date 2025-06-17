import { PhieuDangKy, SinhVien, Giuong, Phong, LoaiPhong, NhanVien, PhanBoPhong } from "../models/index.js";
import { successResponse, errorResponse } from "../utils/response.util.js";
import { emailUtils } from "../utils/email.util.js";
import {
  COLUMNS,
  ENUM_PHIEU_DANG_KY_TRANG_THAI,
  ENUM_SINH_VIEN_TRANG_THAI,
  ENUM_GIUONG_TRANG_THAI,
} from "../constants/database.constants.js";
import sequelize from "../config/database.config.js";
import { Op } from "sequelize";
import quaterUtil from "../utils/quater.util.js";

export const registrationController = {
  // Create new registration
  createRegistration: async (req, res) => {
    try {
      const { id_sinh_vien, ngay_bat_dau, ngay_ket_thuc, ly_do_dang_ky, ghi_chu } = req.body;

      if (!id_sinh_vien || !ngay_bat_dau) {
        return errorResponse(res, 400, "Student ID and start date are required");
      }

      // Check if student exists
      const student = await SinhVien.findByPk(id_sinh_vien);
      if (!student) {
        return errorResponse(res, 404, "Student not found");
      }

      // Check if student already has an active registration
      const existingRegistration = await PhieuDangKy.findOne({
        where: {
          [COLUMNS.PHIEU_DANG_KY_KTX.ID_SINH_VIEN]: id_sinh_vien,
          [COLUMNS.PHIEU_DANG_KY_KTX.TRANG_THAI]: {
            [Op.in]: [ENUM_PHIEU_DANG_KY_TRANG_THAI.PENDING, ENUM_PHIEU_DANG_KY_TRANG_THAI.APPROVED],
          },
          [COLUMNS.COMMON.DANG_HIEN]: true,
        },
      });

      if (existingRegistration) {
        return errorResponse(res, 409, "Student already has an active registration");
      }

      // Check if student already has accommodation
      const existingBed = await Giuong.findOne({
        where: {
          [COLUMNS.GIUONG.ID_SINH_VIEN]: id_sinh_vien,
          [COLUMNS.COMMON.DANG_HIEN]: true,
        },
      });

      if (existingBed) {
        return errorResponse(res, 409, "Student already has accommodation");
      }

      // Validate start date
      const startDate = new Date(ngay_bat_dau);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Ngày bắt đầu không ở quá khứ và không quá 20 ngày kể từ ngày đăng ký hiện tại
      if (startDate <= today) {
        return errorResponse(res, 400, "Start date must be in the future");
      }

      const maxStartDate = new Date(today);
      maxStartDate.setDate(today.getDate() + 20);

      if (startDate > maxStartDate) {
        return errorResponse(res, 400, "Start date cannot be more than 20 days from today");
      }

      // Create registration
      const newRegistration = await PhieuDangKy.create({
        [COLUMNS.PHIEU_DANG_KY_KTX.ID_SINH_VIEN]: id_sinh_vien,
        [COLUMNS.PHIEU_DANG_KY_KTX.NGAY_BAT_DAU]: ngay_bat_dau,
        [COLUMNS.PHIEU_DANG_KY_KTX.NGAY_KET_THUC]: ngay_ket_thuc || null, // Cho phép null
        [COLUMNS.PHIEU_DANG_KY_KTX.LY_DO_DANG_KY]: ly_do_dang_ky,
        [COLUMNS.PHIEU_DANG_KY_KTX.GHI_CHU]: ghi_chu,
        [COLUMNS.COMMON.NGUOI_TAO]: req.user?.id,
      });

      return successResponse(
        res,
        {
          registration: newRegistration.toJSON(),
          message: "Registration submitted successfully",
        },
        null,
        201,
      );
    } catch (error) {
      return errorResponse(res, 500, "Failed to create registration", error.message);
    }
  },

  // Get all registrations
  getRegistrations: async (req, res) => {
    try {
      const { page = 1, limit = 10, trang_thai, search } = req.query;
      const offset = (page - 1) * limit;

      const whereClause = {
        [COLUMNS.COMMON.DANG_HIEN]: true,
      };

      if (trang_thai) {
        whereClause[COLUMNS.PHIEU_DANG_KY_KTX.TRANG_THAI] = trang_thai;
      }

      const { count, rows } = await PhieuDangKy.findAndCountAll({
        where: whereClause,
        limit: parseInt(limit),
        offset: parseInt(offset),
        include: [
          {
            model: SinhVien,
            as: "Student",
            attributes: [
              COLUMNS.COMMON.ID,
              COLUMNS.SINH_VIEN.MSSV,
              COLUMNS.SINH_VIEN.TEN,
              COLUMNS.SINH_VIEN.EMAIL,
              COLUMNS.SINH_VIEN.SDT,
              COLUMNS.SINH_VIEN.KHOA,
            ],
            where: search
              ? {
                  [sequelize.Op.or]: [
                    {
                      [COLUMNS.SINH_VIEN.TEN]: {
                        [sequelize.Op.iLike]: `%${search}%`,
                      },
                    },
                    {
                      [COLUMNS.SINH_VIEN.MSSV]: {
                        [sequelize.Op.iLike]: `%${search}%`,
                      },
                    },
                  ],
                }
              : undefined,
          },
          {
            model: NhanVien,
            as: "Approver",
            attributes: [COLUMNS.COMMON.ID, COLUMNS.NHAN_VIEN.TEN],
            required: false,
          },
        ],
        order: [[COLUMNS.COMMON.NGAY_TAO, "DESC"]],
      });

      return successResponse(res, {
        registrations: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / limit),
        },
      });
    } catch (error) {
      return errorResponse(res, 500, "Failed to get registrations", error.message);
    }
  },

  // Get registration by ID
  getRegistrationById: async (req, res) => {
    try {
      const { id } = req.params;

      const registration = await PhieuDangKy.findByPk(id, {
        include: [
          {
            model: SinhVien,
            as: "Student",
            include: [
              {
                model: Giuong,
                as: "Bed",
                include: [
                  {
                    model: Phong,
                    as: "Room",
                    include: [
                      {
                        model: LoaiPhong,
                        as: "RoomType",
                      },
                    ],
                  },
                ],
              },
            ],
            attributes: {
              exclude: [
                COLUMNS.SINH_VIEN.MAT_KHAU,
                COLUMNS.SINH_VIEN.PASSWORD_SETUP_TOKEN,
                COLUMNS.SINH_VIEN.PASSWORD_SETUP_EXPIRES,
              ],
            },
          },
          {
            model: NhanVien,
            as: "Approver",
            required: false,
          },
          {
            model: NhanVien,
            as: "Creator",
            required: false,
            attributes: { exclude: [COLUMNS.NHAN_VIEN.MAT_KHAU] },
          },
        ],
      });

      if (!registration) {
        return errorResponse(res, 404, "Registration not found");
      }

      return successResponse(res, {
        registration: registration.toJSON(),
      });
    } catch (error) {
      return errorResponse(res, 500, "Failed to get registration", error.message);
    }
  },

  // Approve registration and assign accommodation
  // approveRegistration: async (req, res) => {
  //   try {
  //     const { id } = req.params;
  //     const { id_giuong, ghi_chu } = req.body;

  //     if (!id_giuong) {
  //       return errorResponse(res, 400, "Bed ID is required for approval");
  //     }

  //     // Get registration
  //     const registration = await PhieuDangKy.findByPk(id, {
  //       include: [
  //         {
  //           model: SinhVien,
  //           as: "Student",
  //         },
  //       ],
  //     });

  //     if (!registration) {
  //       return errorResponse(res, 404, "Registration not found");
  //     }

  //     if (registration[COLUMNS.PHIEU_DANG_KY_KTX.TRANG_THAI] !== ENUM_PHIEU_DANG_KY_TRANG_THAI.PENDING) {
  //       return errorResponse(res, 400, "Only pending registrations can be approved");
  //     }

  //     // Check if bed is available
  //     const bed = await Giuong.findByPk(id_giuong, {
  //       include: [
  //         {
  //           model: Phong,
  //           as: "Room",
  //           include: [
  //             {
  //               model: LoaiPhong,
  //               as: "RoomType",
  //             },
  //           ],
  //         },
  //       ],
  //     });

  //     if (!bed) {
  //       return errorResponse(res, 404, "Bed not found");
  //     }

  //     // Kiểm tra giới tính của giường (phòng) với giới tính của sinh viên
  //     if (
  //       bed.Room?.[COLUMNS.PHONG.GIOI_TINH] &&
  //       bed.Room[COLUMNS.PHONG.GIOI_TINH] !== registration.Student[COLUMNS.SINH_VIEN.PHAI]
  //     ) {
  //       return errorResponse(res, 400, "Bed does not match student's gender");
  //     }

  //     if (bed[COLUMNS.GIUONG.TRANG_THAI] !== ENUM_GIUONG_TRANG_THAI.AVAILABLE) {
  //       return errorResponse(res, 400, "Bed is not available");
  //     }

  //     if (bed[COLUMNS.GIUONG.ID_SINH_VIEN]) {
  //       return errorResponse(res, 400, "Bed is already occupied");
  //     }

  //     // Start transaction
  //     const transaction = await sequelize.transaction();

  //     try {
  //       // Update registration status
  //       await registration.update(
  //         {
  //           [COLUMNS.PHIEU_DANG_KY_KTX.TRANG_THAI]: ENUM_PHIEU_DANG_KY_TRANG_THAI.APPROVED,
  //           [COLUMNS.PHIEU_DANG_KY_KTX.NGUOI_DUYET]: req.user.id,
  //           [COLUMNS.PHIEU_DANG_KY_KTX.NGAY_DUYET]: new Date(),
  //           [COLUMNS.PHIEU_DANG_KY_KTX.GHI_CHU]: ghi_chu,
  //           [COLUMNS.COMMON.NGUOI_CAP_NHAT]: req.user.id,
  //         },
  //         { transaction },
  //       );

  //       // Assign bed to student
  //       await bed.update(
  //         {
  //           [COLUMNS.GIUONG.ID_SINH_VIEN]: registration[COLUMNS.PHIEU_DANG_KY_KTX.ID_SINH_VIEN],
  //           [COLUMNS.GIUONG.TRANG_THAI]: ENUM_GIUONG_TRANG_THAI.OCCUPIED,
  //           [COLUMNS.COMMON.NGUOI_CAP_NHAT]: req.user.id,
  //         },
  //         { transaction },
  //       );

  //       // Update student status
  //       await registration.Student.update(
  //         {
  //           [COLUMNS.SINH_VIEN.TRANG_THAI]: ENUM_SINH_VIEN_TRANG_THAI.ACTIVE_RESIDENT,
  //           [COLUMNS.COMMON.NGUOI_CAP_NHAT]: req.user.id,
  //         },
  //         { transaction },
  //       );

  //       // Tạo phân bổ phòng cho sinh viên

  //       // Generate password setup token if student doesn't have password
  //       if (!registration.Student[COLUMNS.SINH_VIEN.MAT_KHAU]) {
  //         const setupToken = crypto.randomBytes(32).toString("hex");
  //         const setupExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  //         await registration.Student.update(
  //           {
  //             [COLUMNS.SINH_VIEN.PASSWORD_SETUP_TOKEN]: setupToken,
  //             [COLUMNS.SINH_VIEN.PASSWORD_SETUP_EXPIRES]: setupExpires,
  //           },
  //           { transaction },
  //         );

  //         // Send email with setup link
  //         if (registration.Student[COLUMNS.SINH_VIEN.EMAIL]) {
  //           try {
  //             const roomInfo = {
  //               room: bed.Room?.[COLUMNS.PHONG.TEN_PHONG],
  //               bed: bed[COLUMNS.GIUONG.TEN_GIUONG],
  //               roomType: bed.Room?.RoomType?.[COLUMNS.LOAI_PHONG.TEN_LOAI],
  //               floor: bed.Room?.[COLUMNS.PHONG.SO_TANG],
  //             };

  //             await emailUtils.sendWelcomeEmail(
  //               registration.Student[COLUMNS.SINH_VIEN.EMAIL],
  //               registration.Student[COLUMNS.SINH_VIEN.TEN],
  //               roomInfo,
  //             );

  //             await emailUtils.sendPasswordSetupEmail(
  //               registration.Student[COLUMNS.SINH_VIEN.EMAIL],
  //               registration.Student[COLUMNS.SINH_VIEN.TEN],
  //               setupToken,
  //             );
  //           } catch (emailError) {
  //             console.error("Failed to send password setup email:", emailError);
  //             // Don't fail the whole operation if email fails
  //           }
  //         }
  //       }

  //       await transaction.commit();

  //       return successResponse(res, {
  //         message: "Registration approved and accommodation assigned successfully",
  //         accommodation: {
  //           bed: bed.toJSON(),
  //           room: bed.Room?.toJSON(),
  //         },
  //       });
  //     } catch (error) {
  //       await transaction.rollback();
  //       throw error;
  //     }
  //   } catch (error) {
  //     return errorResponse(res, 500, "Failed to approve registration", error.message);
  //   }
  // },

  approveRegistration: async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
      const { id } = req.params; // ID của PhieuDangKy
      const { id_giuong } = req.body; // ID của giường được chọn để phân bổ

      if (!id_giuong) {
        await transaction.rollback();
        return errorResponse(res, 400, "Yêu cầu cung cấp ID giường (id_giuong) trong request body để phân bổ.");
      }

      const registration = await PhieuDangKy.findByPk(id, {
        include: [{ model: SinhVien, as: "Student" }], // Đảm bảo alias 'Student' là chính xác
        transaction,
      });

      if (!registration) {
        await transaction.rollback();
        return errorResponse(res, 404, "Không tìm thấy phiếu đăng ký.");
      }
      if (!registration.Student) {
        await transaction.rollback();
        return errorResponse(res, 404, "Không tìm thấy sinh viên liên kết với phiếu đăng ký này.");
      }
      if (registration.trang_thai === ENUM_PHIEU_DANG_KY_TRANG_THAI.APPROVED) {
        await transaction.rollback();
        return errorResponse(res, 400, "Phiếu đăng ký đã được duyệt.");
      }
      // Chỉ duyệt phiếu đang ở trạng thái PENDING hoặc trạng thái hợp lệ khác
      if (registration.trang_thai !== ENUM_PHIEU_DANG_KY_TRANG_THAI.PENDING) {
        await transaction.rollback();
        return errorResponse(
          res,
          400,
          `Không thể duyệt phiếu đăng ký từ trạng thái hiện tại: ${registration.trang_thai}.`,
        );
      }

      // Tìm và kiểm tra giường được chọn
      const bedToAssign = await Giuong.findByPk(id_giuong, { transaction });

      if (!bedToAssign) {
        await transaction.rollback();
        return errorResponse(res, 404, "Không tìm thấy giường được chọn.");
      }

      if (bedToAssign.trang_thai !== ENUM_GIUONG_TRANG_THAI.AVAILABLE) {
        await transaction.rollback();
        return errorResponse(res, 400, "Giường được chọn không còn trống.");
      }

      // Tính ngày kết thúc mặc định
      const result = quaterUtil.calculateQuarterEndDate(registration.ngay_bat_dau);

      // 1. Cập nhật PhieuDangKy
      registration.set({
        [COLUMNS.PHIEU_DANG_KY_KTX.TRANG_THAI]: ENUM_PHIEU_DANG_KY_TRANG_THAI.APPROVED,
        [COLUMNS.PHIEU_DANG_KY_KTX.NGUOI_DUYET]: req.user?.id,
        [COLUMNS.PHIEU_DANG_KY_KTX.NGAY_DUYET]: new Date(),
        [COLUMNS.COMMON.NGUOI_CAP_NHAT]: req.user?.id,
        [COLUMNS.PHIEU_DANG_KY_KTX.GHI_CHU]: req.body.ghi_chu || null, // Cho phép ghi chú tùy chọn
        [COLUMNS.PHIEU_DANG_KY_KTX.NGAY_KET_THUC]: result.endDate, // Ngày kết thúc theo chính sách
      });
      await registration.save({ transaction });

      // 2. Cập nhật SinhVien
      registration.Student.set({
        [COLUMNS.SINH_VIEN.TRANG_THAI]: ENUM_SINH_VIEN_TRANG_THAI.ACTIVE_RESIDENT,
        [COLUMNS.COMMON.NGUOI_CAP_NHAT]: req.user?.id,
      });
      await registration.Student.save({ transaction });

      // 3. Cập nhật Giuong
      bedToAssign.set({
        [COLUMNS.GIUONG.TRANG_THAI]: ENUM_GIUONG_TRANG_THAI.OCCUPIED,
        [COLUMNS.GIUONG.ID_SINH_VIEN]: registration.id_sinh_vien,
        [COLUMNS.COMMON.NGUOI_CAP_NHAT]: req.user?.id,
      });
      await bedToAssign.save({ transaction });

      // 4. Tạo bản ghi PhanBoPhong
      const phanBoData = {
        [COLUMNS.PHAN_BO_PHONG.ID_SV]: registration.id_sinh_vien,
        [COLUMNS.PHAN_BO_PHONG.ID_GIUONG]: bedToAssign.id,
        [COLUMNS.PHAN_BO_PHONG.NGAY_BAT_DAU]: registration.ngay_bat_dau,
        [COLUMNS.PHAN_BO_PHONG.NGAY_KET_THUC]: result.endDate, // Ngày kết thúc theo chính sách
        [COLUMNS.COMMON.NGUOI_TAO]: req.user?.id,
      };

      phanBoData[COLUMNS.PHAN_BO_PHONG.NGAY_KET_THUC] = result.endDate; // Theo chính sách

      const newPhanBoPhong = await PhanBoPhong.create(phanBoData, {
        transaction,
      });

      await transaction.commit();

      // Gửi email chào mừng với thông tin phòng và giường
      if (registration.Student.email) {
        try {
          const phongDetails = await Phong.findByPk(bedToAssign.id_phong);
          const roomInfoForEmail = {
            phong: phongDetails ? phongDetails.ten_phong : "Chưa xác định",
            giuong: bedToAssign.ma_giuong || `ID ${bedToAssign.id}`, // Sử dụng ma_giuong nếu có
          };
          await emailUtils.sendWelcomeEmail(registration.Student.email, registration.Student.ten, roomInfoForEmail);
        } catch (emailError) {
          console.error("Lỗi gửi email chào mừng sau khi duyệt phiếu:", emailError);
          // Không làm thất bại toàn bộ yêu cầu chỉ vì lỗi gửi email
        }
      }

      return successResponse(res, {
        message: "Duyệt phiếu đăng ký, phân bổ giường và tạo bản ghi phân bổ phòng thành công.",
        registration: registration.toJSON(),
        phanBoPhong: newPhanBoPhong.toJSON(),
      });
    } catch (error) {
      // Đảm bảo rollback nếu transaction chưa được commit hoặc rollback
      if (transaction.finished !== "committed" && transaction.finished !== "rolled back") {
        await transaction.rollback();
      }
      console.error("Lỗi trong quá trình duyệt phiếu và phân bổ giường:", error);
      return errorResponse(res, 500, "Thất bại trong việc duyệt phiếu đăng ký và phân bổ giường.", error.message);
    }
  },

  // Reject registration
  rejectRegistration: async (req, res) => {
    const transaction = await sequelize.transaction();

    try {
      const { id } = req.params;
      const { ly_do_tu_choi } = req.body;

      // Tìm phiếu đăng ký và thông tin sinh viên
      const registration = await PhieuDangKy.findOne({
        where: { [COLUMNS.COMMON.ID]: id },
        include: [
          {
            model: SinhVien,
            as: "Student",
          },
        ],
        transaction,
      });

      if (!registration) {
        await transaction.rollback();
        return errorResponse(res, 404, "Registration not found");
      }

      // Update trạng thái
      await registration.update(
        {
          [COLUMNS.PHIEU_DANG_KY_KTX.TRANG_THAI]: ENUM_PHIEU_DANG_KY_TRANG_THAI.REJECTED,
          [COLUMNS.PHIEU_DANG_KY_KTX.NGUOI_DUYET]: req.user?.id,
          [COLUMNS.PHIEU_DANG_KY_KTX.NGAY_DUYET]: new Date(),
          [COLUMNS.PHIEU_DANG_KY_KTX.LY_DO_TU_CHOI]: ly_do_tu_choi,
          [COLUMNS.COMMON.NGUOI_CAP_NHAT]: req.user?.id,
        },
        { transaction },
      );

      // Commit transaction trước khi gửi email
      await transaction.commit();
      // Gửi email thông báo từ chối (sau khi commit)
      if (registration.Student?.email) {
        try {
          await emailUtils.sendRejectionEmail(registration.Student.email, registration.Student.ten, ly_do_tu_choi);
        } catch (emailError) {
          console.error("Failed to send rejection email:", emailError);
          // Không return lỗi vì database đã update thành công
        }
      } else {
        console.log(`No email found for student, skipping email notification`);
      }

      return successResponse(res, {
        message: "Registration rejected successfully",
        registration: registration.toJSON(),
      });
    } catch (error) {
      await transaction.rollback();
      console.error("Error rejecting registration:", error);
      return errorResponse(res, 500, "Failed to reject registration", error.message);
    }
  },
  cancelRegistration: async (req, res) => {
    try {
      const { id } = req.params;

      const registration = await PhieuDangKy.findByPk(id);
      if (!registration) {
        return errorResponse(res, 404, "Registration not found");
      }

      // Check permissions - student can only cancel their own pending registration
      if (req.user.type === "sinh_vien") {
        if (
          registration[COLUMNS.PHIEU_DANG_KY_KTX.ID_SINH_VIEN] !== req.user.id ||
          registration[COLUMNS.PHIEU_DANG_KY_KTX.TRANG_THAI] !== ENUM_PHIEU_DANG_KY_TRANG_THAI.PENDING
        ) {
          return errorResponse(res, 403, "You can only cancel your own pending registrations");
        }
      }

      if (registration[COLUMNS.PHIEU_DANG_KY_KTX.TRANG_THAI] === ENUM_PHIEU_DANG_KY_TRANG_THAI.CANCELLED) {
        return errorResponse(res, 400, "Registration is already cancelled");
      }

      await registration.update({
        [COLUMNS.PHIEU_DANG_KY_KTX.TRANG_THAI]: ENUM_PHIEU_DANG_KY_TRANG_THAI.CANCELLED,
        [COLUMNS.COMMON.NGUOI_CAP_NHAT]: req.user.id,
      });

      return successResponse(res, {
        message: "Registration cancelled successfully",
      });
    } catch (error) {
      return errorResponse(res, 500, "Failed to cancel registration", error.message);
    }
  },

  // Get student's own registrations
  getMyRegistrations: async (req, res) => {
    try {
      const studentId = req.user.id;

      const registrations = await PhieuDangKy.findAll({
        where: {
          [COLUMNS.PHIEU_DANG_KY_KTX.ID_SINH_VIEN]: studentId,
          [COLUMNS.COMMON.DANG_HIEN]: true,
        },
        include: [
          {
            model: NhanVien,
            as: "Approver",
            attributes: [COLUMNS.COMMON.ID, COLUMNS.NHAN_VIEN.TEN],
            required: false,
          },
        ],
        order: [[COLUMNS.COMMON.NGAY_TAO, "DESC"]],
      });

      return successResponse(res, {
        registrations,
      });
    } catch (error) {
      return errorResponse(res, 500, "Failed to get registrations", error.message);
    }
  },
};
