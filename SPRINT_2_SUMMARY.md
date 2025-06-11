# Sprint 2 - Room & Registration Management Implementation

## ✅ Completed Features

### 🏠 Room Management System

- ✅ **Database Models**

  - `LoaiPhong` (Room Type) - Quản lý loại phòng và giá thuê
  - `Phong` (Room) - Quản lý phòng theo tầng và giới tính
  - `Giuong` (Bed) - Quản lý giường trong phòng
  - `PhuHuynh` (Parent) - Thông tin phụ huynh sinh viên
  - `PhieuDangKy` (Registration) - Phiếu đăng ký KTX

- ✅ **Model Associations**
  - LoaiPhong ↔ Phong (1:n)
  - Phong ↔ Giuong (1:n)
  - SinhVien ↔ Giuong (1:1)
  - SinhVien ↔ PhuHuynh (1:n)
  - SinhVien ↔ PhieuDangKy (1:n)
  - NhanVien creator relationships

### 📍 API Endpoints - Room Management

#### Room Types

- `GET /api/rooms/room-types` - Danh sách loại phòng
- `POST /api/rooms/room-types` - Tạo loại phòng mới (Staff+)

#### Rooms

- `GET /api/rooms/rooms` - Danh sách phòng (có filter & search)
- `POST /api/rooms/rooms` - Tạo phòng mới (Staff+)
- `GET /api/rooms/rooms/available` - Phòng có chỗ trống
- `GET /api/rooms/rooms/:roomId/beds` - Giường trong phòng

### 📍 API Endpoints - Student Management

#### Students (Staff+ only)

- `GET /api/students/` - Danh sách sinh viên
- `GET /api/students/without-accommodation` - SV chưa có chỗ ở
- `GET /api/students/:id` - Chi tiết sinh viên
- `PUT /api/students/:id` - Cập nhật thông tin sinh viên

#### Parents

- `POST /api/students/:id/parents` - Thêm thông tin phụ huynh
- `PUT /api/students/parents/:parentId` - Sửa thông tin phụ huynh
- `DELETE /api/students/parents/:parentId` - Xóa thông tin phụ huynh

#### Password Setup

- `POST /api/students/setup-password` - Thiết lập mật khẩu (Public)

### 📍 API Endpoints - Registration System

#### Student Registration

- `POST /api/registrations/` - Tạo đơn đăng ký KTX
- `GET /api/registrations/my-registrations` - Đơn của sinh viên

#### Staff Management (Staff+ only)

- `GET /api/registrations/` - Danh sách đơn đăng ký
- `GET /api/registrations/:id` - Chi tiết đơn đăng ký
- `POST /api/registrations/:id/approve` - Duyệt đơn & phân giường
- `POST /api/registrations/:id/reject` - Từ chối đơn
- `POST /api/registrations/:id/cancel` - Hủy đơn

### 🔐 Authorization Levels

- **Public**: Password setup
- **Authenticated**: Tạo & xem đơn đăng ký của mình
- **Staff+**: CRUD phòng, sinh viên, duyệt đơn
- **Admin**: Full access

### ✉️ Email System

- ✅ **Email Utilities**

  - Password setup notification
  - Welcome email with room info
  - Staff notification system
  - Email connection testing

- ✅ **Email Templates**
  - HTML formatted emails
  - Responsive design
  - Security warnings
  - Automatic system emails

### 🔄 Registration Workflow

1. **Student submits registration**

   - Validation: dates, existing registrations
   - Status: PENDING

2. **Staff reviews application**

   - View student details & requirements
   - Check available accommodations

3. **Approval process**

   - Assign specific bed
   - Update student status to ACTIVE_RESIDENT
   - Generate password setup token (if needed)
   - Send email notification

4. **Email verification**
   - Password setup link (24h expiry)
   - Account activation
   - Welcome email with room details

### 🎯 Business Logic

- ✅ **Room Constraints**

  - One student per bed
  - Gender-appropriate room assignment
  - Floor and room type management
  - Automatic bed creation when room is created

- ✅ **Registration Rules**

  - One active registration per student
  - Future start dates only
  - No duplicate accommodations
  - Proper status transitions

- ✅ **Data Integrity**
  - Foreign key constraints
  - Unique indexes where needed
  - Soft delete support
  - Audit trail with creator/updater

### 🔍 Search & Filtering

- **Room search**: Name, status, floor, room type
- **Student search**: Name, MSSV, faculty, status
- **Registration search**: Student name/MSSV, status
- **Pagination**: Consistent across all endpoints

## 🚀 Technical Improvements

### 📊 Database Features

- Proper indexing for performance
- Enum constraints for data integrity
- Timestamps and audit fields
- Soft delete pattern

### 🛡️ Validation & Security

- Request validation with express-validator
- Permission-based access control
- Input sanitization
- Error handling consistency

### 📧 Email Integration

- Nodemailer with Gmail SMTP
- Environment-based configuration
- Error handling for email failures
- Template-based email content

## 🧪 Testing Recommendations

1. **Room Management**

   - Create room types and rooms
   - Test bed auto-generation
   - Verify availability filtering

2. **Registration Flow**

   - Student registration submission
   - Staff approval with bed assignment
   - Email notification testing

3. **Permission Testing**
   - Student vs Staff access levels
   - Student own-data access only
   - Admin full access verification

## 📋 Environment Variables Added

```env
# Email configuration
EMAIL_SERVICE=gmail
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
```

## 🔄 Next Steps (Sprint 3)

1. **Billing System**

   - Electricity bill management
   - Room allocation billing
   - Payment tracking

2. **Advanced Features**
   - File upload for documents
   - News/announcement system
   - Reporting and analytics

---

_Sprint 2 successfully implements the core dormitory management features with proper validation, security, and email integration._
