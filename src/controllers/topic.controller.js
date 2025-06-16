import { BangTin, ChuDe, NhanVien } from "../models/index.js"; // Đã xóa BangTinChuDe
import { successResponse, errorResponse } from "../utils/response.util.js";
import { COLUMNS } from "../constants/database.constants.js";
import sequelize from "../config/database.config.js"; // Cần cho Op.iLike nếu có search

export const topicController = {
  // ChuDe
  createTopic: async (req, res) => {
    try {
      const { ten_chu_de, mo_ta } = req.body;
      if (!ten_chu_de) return errorResponse(res, 400, "Tên chủ đề là bắt buộc");
      const exist = await ChuDe.findOne({
        where: { [COLUMNS.CHU_DE.TEN_CHU_DE]: ten_chu_de, [COLUMNS.COMMON.DANG_HIEN]: true }
      });
      if (exist) return errorResponse(res, 409, "Chủ đề đã tồn tại");
      const topic = await ChuDe.create({
        [COLUMNS.CHU_DE.TEN_CHU_DE]: ten_chu_de,
        [COLUMNS.CHU_DE.MO_TA]: mo_ta,
        [COLUMNS.COMMON.NGUOI_TAO]: req.user?.id,
      });
      return successResponse(res, { topic, message: "Tạo chủ đề thành công" }, null, 201);
    } catch (error) {
      console.error("Lỗi tạo chủ đề:", error);
      return errorResponse(res, 500, "Tạo chủ đề thất bại", error.message);
    }
  },
  updateTopic: async (req, res) => {
    try {
      const { id } = req.params;
      const { ten_chu_de, mo_ta } = req.body;
      const topic = await ChuDe.findByPk(id);
      if (!topic || !topic.dang_hien) return errorResponse(res, 404, "Không tìm thấy chủ đề");

      // Kiểm tra tên chủ đề trùng lặp nếu có thay đổi
      if (ten_chu_de && ten_chu_de !== topic[COLUMNS.CHU_DE.TEN_CHU_DE]) {
          const existingTopic = await ChuDe.findOne({
              where: {
                  [COLUMNS.CHU_DE.TEN_CHU_DE]: ten_chu_de,
                  [COLUMNS.COMMON.DANG_HIEN]: true,
                  [COLUMNS.COMMON.ID]: { [sequelize.Op.ne]: id } // Loại trừ chính chủ đề đang cập nhật
              }
          });
          if (existingTopic) {
              return errorResponse(res, 409, "Tên chủ đề đã tồn tại");
          }
      }

      topic[COLUMNS.CHU_DE.TEN_CHU_DE] = ten_chu_de || topic[COLUMNS.CHU_DE.TEN_CHU_DE];
      topic[COLUMNS.CHU_DE.MO_TA] = mo_ta || topic[COLUMNS.CHU_DE.MO_TA];
      topic[COLUMNS.COMMON.NGUOI_CAP_NHAT] = req.user?.id;
      await topic.save();
      return successResponse(res, { topic, message: "Cập nhật chủ đề thành công" });
    } catch (error) {
      console.error("Lỗi cập nhật chủ đề:", error);
      return errorResponse(res, 500, "Cập nhật chủ đề thất bại", error.message);
    }
  },
  deleteTopic: async (req, res) => {
    try {
      const { id } = req.params;
      const topic = await ChuDe.findByPk(id);
      if (!topic || !topic.dang_hien) return errorResponse(res, 404, "Không tìm thấy chủ đề");

      // Kiểm tra xem có bản tin nào đang thuộc chủ đề này không
      const newsCount = await BangTin.count({
          where: {
              [COLUMNS.BANG_TIN.ID_CHU_DE]: id,
              [COLUMNS.COMMON.DANG_HIEN]: true
          }
      });
      if (newsCount > 0) {
          return errorResponse(res, 400, "Không thể xóa chủ đề vì đang có bản tin thuộc chủ đề này. Vui lòng chuyển bản tin sang chủ đề khác hoặc xóa bản tin trước.");
      }

      topic[COLUMNS.COMMON.DANG_HIEN] = false;
      topic[COLUMNS.COMMON.NGUOI_CAP_NHAT] = req.user?.id; // Cập nhật người xóa
      await topic.save();
      return successResponse(res, { message: "Xóa chủ đề thành công" });
    } catch (error) {
      console.error("Lỗi xóa chủ đề:", error);
      return errorResponse(res, 500, "Xóa chủ đề thất bại", error.message);
    }
  },
  getAllTopics: async (req, res) => {
    try {
      const topics = await ChuDe.findAll({
        where: { [COLUMNS.COMMON.DANG_HIEN]: true },
        order: [[COLUMNS.COMMON.NGAY_TAO, "DESC"]],
      });
      return successResponse(res, { topics });
    } catch (error) {
      console.error("Lỗi lấy danh sách chủ đề:", error);
      return errorResponse(res, 500, "Lấy danh sách chủ đề thất bại", error.message);
    }
  },

  // BangTin
  createBangTin: async (req, res) => {
    try {
      const { tieu_de, mo_ta, noi_dung, hinh_nen, id_chu_de } = req.body; // <-- Thêm id_chu_de
      if (!tieu_de || !noi_dung || !id_chu_de) return errorResponse(res, 400, "Tiêu đề, nội dung và ID chủ đề là bắt buộc");

      // Kiểm tra chủ đề có tồn tại không
      const chuDe = await ChuDe.findByPk(id_chu_de);
      if (!chuDe || !chuDe.dang_hien) return errorResponse(res, 404, "Chủ đề không tồn tại");

      const exist = await BangTin.findOne({
        where: { [COLUMNS.BANG_TIN.TIEU_DE]: tieu_de, [COLUMNS.COMMON.DANG_HIEN]: true }
      });
      if (exist) return errorResponse(res, 409, "Bản tin đã tồn tại");

      const bangTin = await BangTin.create({
        [COLUMNS.BANG_TIN.TIEU_DE]: tieu_de,
        [COLUMNS.BANG_TIN.MO_TA]: mo_ta,
        [COLUMNS.BANG_TIN.NOI_DUNG]: noi_dung,
        [COLUMNS.BANG_TIN.HINH_NEN]: hinh_nen,
        [COLUMNS.BANG_TIN.ID_CHU_DE]: id_chu_de, // <-- Lưu khóa ngoại
        [COLUMNS.COMMON.NGUOI_TAO]: req.user?.id,
      });
      return successResponse(res, { bangTin, message: "Tạo bản tin thành công" }, null, 201);
    } catch (error) {
      console.error("Lỗi tạo bản tin:", error);
      return errorResponse(res, 500, "Tạo bản tin thất bại", error.message);
    }
  },
  updateBangTin: async (req, res) => {
    try {
      const { id } = req.params;
      const { tieu_de, mo_ta, noi_dung, hinh_nen, id_chu_de } = req.body; // <-- Thêm id_chu_de
      const bangTin = await BangTin.findByPk(id);
      if (!bangTin || !bangTin.dang_hien) return errorResponse(res, 404, "Không tìm thấy bản tin");

      // Kiểm tra tiêu đề trùng lặp nếu có thay đổi
      if (tieu_de && tieu_de !== bangTin[COLUMNS.BANG_TIN.TIEU_DE]) {
          const existingNews = await BangTin.findOne({
              where: {
                  [COLUMNS.BANG_TIN.TIEU_DE]: tieu_de,
                  [COLUMNS.COMMON.DANG_HIEN]: true,
                  [COLUMNS.COMMON.ID]: { [sequelize.Op.ne]: id }
              }
          });
          if (existingNews) {
              return errorResponse(res, 409, "Tiêu đề bản tin đã tồn tại");
          }
      }

      // Kiểm tra chủ đề mới có tồn tại không nếu id_chu_de được cung cấp
      if (id_chu_de && id_chu_de !== bangTin[COLUMNS.BANG_TIN.ID_CHU_DE]) {
          const chuDe = await ChuDe.findByPk(id_chu_de);
          if (!chuDe || !chuDe.dang_hien) {
              return errorResponse(res, 404, "Chủ đề mới không tồn tại");
          }
          bangTin[COLUMNS.BANG_TIN.ID_CHU_DE] = id_chu_de; // Cập nhật khóa ngoại
      }

      bangTin[COLUMNS.BANG_TIN.TIEU_DE] = tieu_de || bangTin[COLUMNS.BANG_TIN.TIEU_DE];
      bangTin[COLUMNS.BANG_TIN.MO_TA] = mo_ta || bangTin[COLUMNS.BANG_TIN.MO_TA];
      bangTin[COLUMNS.BANG_TIN.NOI_DUNG] = noi_dung || bangTin[COLUMNS.BANG_TIN.NOI_DUNG];
      bangTin[COLUMNS.BANG_TIN.HINH_NEN] = hinh_nen || bangTin[COLUMNS.BANG_TIN.HINH_NEN];
      bangTin[COLUMNS.COMMON.NGUOI_CAP_NHAT] = req.user?.id;
      await bangTin.save();
      return successResponse(res, { bangTin, message: "Cập nhật bản tin thành công" });
    } catch (error) {
      console.error("Lỗi cập nhật bản tin:", error);
      return errorResponse(res, 500, "Cập nhật bản tin thất bại", error.message);
    }
  },
  deleteBangTin: async (req, res) => {
    try {
      const { id } = req.params;
      const bangTin = await BangTin.findByPk(id);
      if (!bangTin || !bangTin.dang_hien) return errorResponse(res, 404, "Không tìm thấy bản tin");
      bangTin[COLUMNS.COMMON.DANG_HIEN] = false;
      bangTin[COLUMNS.COMMON.NGUOI_CAP_NHAT] = req.user?.id; // Cập nhật người xóa
      await bangTin.save();
      return successResponse(res, { message: "Xóa bản tin thành công" });
    } catch (error) {
      console.error("Lỗi xóa bản tin:", error);
      return errorResponse(res, 500, "Xóa bản tin thất bại", error.message);
    }
  },
  getAllBangTin: async (req, res) => {
    try {
      const news = await BangTin.findAll({
        where: { [COLUMNS.COMMON.DANG_HIEN]: true },
        include: [{
            model: ChuDe, // Bao gồm thông tin Chủ đề
            as: 'Topic', // Alias đã định nghĩa trong index.js
            attributes: [COLUMNS.COMMON.ID, COLUMNS.CHU_DE.TEN_CHU_DE]
        }],
        order: [[COLUMNS.COMMON.NGAY_TAO, "DESC"]],
      });
      return successResponse(res, { news });
    } catch (error) {
      console.error("Lỗi lấy danh sách bản tin:", error);
      return errorResponse(res, 500, "Lấy danh sách bản tin thất bại", error.message);
    }
  },

};
