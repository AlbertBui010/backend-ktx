// utils/response.util.js

export const successResponse = (res, data, message = "Success", statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message: message,
    data: data,
  });
};

export const errorResponse = (res, statusCode, message, errorDetails = null) => {
  // errorDetails là tùy chọn, có thể dùng để debug ở server hoặc log
  // hoặc có thể trả về cho client nếu muốn hiển thị chi tiết hơn (ví dụ: lỗi validation)
  return res.status(statusCode).json({
    success: false,
    message: message, // Thông báo lỗi chính cho client
    // error: errorDetails // Có thể thêm nếu muốn debug ở client
  });
};