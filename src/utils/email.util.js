import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

// Create transporter
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

export const emailUtils = {
  // Send password setup email
  sendPasswordSetupEmail: async (email, studentName, token) => {
    try {
      const setupUrl = `${process.env.APP_URL}/verify-email?token=${token}`;

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Thiết lập mật khẩu tài khoản KTX",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2c3e50;">Chào ${studentName}!</h2>
            
            <p>Đơn đăng ký ký túc xá của bạn đã được duyệt thành công.</p>
            
            <p>Để hoàn tất quá trình đăng ký, vui lòng thiết lập mật khẩu cho tài khoản của bạn bằng cách nhấp vào liên kết dưới đây:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${setupUrl}" 
                 style="background-color: #3498db; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Thiết lập mật khẩu
              </a>
            </div>
            
            <p><strong>Lưu ý quan trọng:</strong></p>
            <ul>
              <li>Liên kết này sẽ hết hạn sau 24 giờ</li>
              <li>Chỉ sử dụng liên kết này một lần duy nhất</li>
              <li>Không chia sẻ liên kết này với người khác</li>
            </ul>
            
            <p>Nếu bạn có bất kỳ thắc mắc nào, vui lòng liên hệ với Ban quản lý ký túc xá.</p>
            
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <p style="color: #7f8c8d; font-size: 12px;">
              Email này được gửi tự động từ hệ thống quản lý KTX. Vui lòng không trả lời email này.
            </p>
          </div>
        `,
      };

      await transporter.sendMail(mailOptions);
      console.log(`Password setup email sent to ${email}`);
    } catch (error) {
      console.error("Error sending password setup email:", error);
      throw error;
    }
  },

  // Send welcome email after successful registration
  sendWelcomeEmail: async (email, studentName, roomInfo) => {
    try {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Chào mừng đến với KTX - Thông tin phòng ở",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #27ae60;">Chào mừng ${studentName}!</h2>
            
            <p>Chúc mừng bạn đã được phân bổ chỗ ở tại ký túc xá.</p>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
              <h3 style="color: #2c3e50; margin-top: 0;">Thông tin chỗ ở:</h3>
              <p><strong>Phòng:</strong> ${roomInfo.room}</p>
              <p><strong>Giường:</strong> ${roomInfo.bed}</p>
              <p><strong>Tầng:</strong> ${roomInfo.floor}</p>
              <p><strong>Loại phòng:</strong> ${roomInfo.roomType}</p>
            </div>
            
            <p><strong>Hướng dẫn tiếp theo:</strong></p>
            <ol>
              <li>Hoàn thành thủ tục nhập học</li>
              <li>Đóng phí ký túc xá theo quy định</li>
              <li>Tuân thủ nội quy ký túc xá</li>
            </ol>
            
            <p>Chúc bạn có một năm học thành công và tận hưởng cuộc sống tại ký túc xá!</p>
            
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <p style="color: #7f8c8d; font-size: 12px;">
              Email này được gửi tự động từ hệ thống quản lý KTX. Vui lòng không trả lời email này.
            </p>
          </div>
        `,
      };

      await transporter.sendMail(mailOptions);
      console.log(`Welcome email sent to ${email}`);
    } catch (error) {
      console.error("Error sending welcome email:", error);
      throw error;
    }
  },

  // Send rejection email to student
  sendRejectionEmail: async (email, studentName, reason = null) => {
    try {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Thông báo về phiếu đăng ký KTX",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #e74c3c;">Thông báo phiếu đăng ký KTX</h2>
            
            <p>Xin chào ${studentName},</p>
            
            <p>Chúng tôi rất tiếc phải thông báo rằng phiếu đăng ký ký túc xá của bạn <strong>không được duyệt</strong>.</p>
            
            ${
              reason
                ? `
              <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107;">
                <h4 style="color: #856404; margin-top: 0;">Lý do từ chối:</h4>
                <p style="color: #856404; margin-bottom: 0;">${reason}</p>
              </div>
            `
                : ""
            }
            
            <p><strong>Các bước tiếp theo:</strong></p>
            <ul>
              <li>Kiểm tra lại thông tin và hồ sơ đã nộp</li>
              <li>Liên hệ với Ban quản lý ký túc xá để được tư vấn cụ thể</li>
              <li>Có thể nộp lại hồ sơ trong kỳ đăng ký tiếp theo (nếu có)</li>
            </ul>
            
            <div style="background-color: #d1ecf1; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #17a2b8;">
              <h4 style="color: #0c5460; margin-top: 0;">Thông tin liên hệ:</h4>
              <p style="color: #0c5460; margin-bottom: 0;">
                Để biết thêm chi tiết hoặc khiếu nại, vui lòng liên hệ:<br>
                📧 Email: ktx@university.edu.vn<br>
                📞 Điện thoại: (024) 1234-5678<br>
                🏢 Văn phòng: Tầng 1, Tòa nhà A, Cao Lỗ, Quận 8
              </p>
            </div>
            
            <p>Chúng tôi xin lỗi vì sự bất tiện này và cảm ơn bạn đã quan tâm đến dịch vụ ký túc xá.</p>
            
            <p>Trân trọng,<br>Ban quản lý ký túc xá</p>
            
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <p style="color: #7f8c8d; font-size: 12px;">
              Email này được gửi tự động từ hệ thống quản lý KTX. Vui lòng không trả lời email này.
            </p>
          </div>
        `,
      };

      await transporter.sendMail(mailOptions);
      console.log(`Rejection email sent to ${email}`);
    } catch (error) {
      console.error("Error sending rejection email:", error);
      throw error;
    }
  },

  // Send notification email to staff
  sendStaffNotificationEmail: async (email, subject, message) => {
    try {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: `[KTX System] ${subject}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #e74c3c;">Thông báo hệ thống KTX</h2>
            <p>${message}</p>
            <p>Vui lòng đăng nhập vào hệ thống để xem chi tiết.</p>
            
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <p style="color: #7f8c8d; font-size: 12px;">
              Email này được gửi tự động từ hệ thống quản lý KTX.
            </p>
          </div>
        `,
      };

      await transporter.sendMail(mailOptions);
    } catch (error) {
      console.error("Error sending staff notification email:", error);
      throw error;
    }
  },

  // Test email connection
  testConnection: async () => {
    try {
      await transporter.verify();
      console.log("✅ Email service is ready");
      return true;
    } catch (error) {
      console.error("❌ Email service connection failed:", error);
      return false;
    }
  },
};
