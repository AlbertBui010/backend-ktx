# KTX Management System API Documentation

## 📝 Overview

Backend API cho hệ thống quản lý ký túc xá sinh viên. Hệ thống cung cấp các API để quản lý nhân viên, sinh viên, phòng ốc và các dịch vụ liên quan.

## 🔧 Tech Stack

- **Backend:** Node.js, Express.js 4.x
- **Database:** PostgreSQL với Sequelize ORM
- **Authentication:** JWT với Redis session storage
- **File Storage:** MinIO (S3-compatible)
- **Validation:** express-validator

## 🚀 Getting Started

### Prerequisites

- Node.js >= 18.x
- Docker & Docker Compose
- PostgreSQL 15
- Redis 7.x

### Installation

1. **Clone repository và cài đặt dependencies:**

```bash
git clone <repository-url>
cd backend-ktx-ver-1
npm install
```

2. **Setup môi trường:**

```bash
cp .env.example .env
# Chỉnh sửa .env với thông tin cấu hình của bạn
```

3. **Start services với Docker:**

```bash
docker-compose up -d
```

4. **Tạo admin user:**

```bash
npm run seed:admin
```

5. **Start development server:**

```bash
npm run dev
```

## 🔐 Authentication

Hệ thống sử dụng JWT authentication với refresh token được lưu trữ trong Redis.

### Token Types

- **Access Token:** Hết hạn sau 15 phút, dùng cho các request API
- **Refresh Token:** Hết hạn sau 7 ngày, dùng để gia hạn access token

### Headers

```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

## 📍 API Endpoints

### Health Check

#### GET `/api/health`

Kiểm tra trạng thái server.

**Response:**

```json
{
  "success": true,
  "data": {
    "message": "API is healthy"
  }
}
```

---

## 🔒 Authentication Endpoints

### Staff Login

#### POST `/api/auth/login/staff`

Đăng nhập cho nhân viên (admin/staff).

**Request Body:**

```json
{
  "ma_nv": "ADMIN001",
  "mat_khau": "Admin@123"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "ma_nv": "ADMIN001",
      "ten": "System Administrator",
      "role": "admin",
      "email": "admin@ktx.edu.vn",
      "phong_ban": "IT Department",
      "trang_thai": "active"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIs...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
    }
  }
}
```

### Student Login

#### POST `/api/auth/login/student`

Đăng nhập cho sinh viên.

**Request Body:**

```json
{
  "mssv": "20210001",
  "mat_khau": "student_password"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "mssv": "20210001",
      "ten": "Jane Smith",
      "email": "jane.smith@student.edu.vn",
      "khoa": "Computer Science",
      "trang_thai": "applicant"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIs...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
    }
  }
}
```

### Register Staff (Admin Only)

#### POST `/api/auth/register/staff`

Tạo tài khoản nhân viên mới. Chỉ admin mới có quyền.

**Headers:**

```http
Authorization: Bearer <admin_access_token>
```

**Request Body:**

```json
{
  "ma_nv": "STAFF001",
  "ten": "John Doe",
  "mat_khau": "StrongPassword@123",
  "role": "staff",
  "email": "john.doe@ktx.edu.vn",
  "sdt": "0123456789",
  "phong_ban": "Student Affairs"
}
```

**Validation Rules:**

- `ma_nv`: 3-20 ký tự, bắt buộc
- `ten`: 2-100 ký tự, bắt buộc
- `mat_khau`: Tối thiểu 8 ký tự, phải có chữ hoa, chữ thường, số và ký tự đặc biệt
- `role`: "admin" hoặc "staff"
- `email`: Định dạng email hợp lệ

### Register Student (Staff+ Required)

#### POST `/api/auth/register/student`

Tạo tài khoản sinh viên mới. Staff hoặc admin mới có quyền.

**Headers:**

```http
Authorization: Bearer <staff_or_admin_access_token>
```

**Request Body:**

```json
{
  "mssv": "20210001",
  "ten": "Jane Smith",
  "email": "jane.smith@student.edu.vn",
  "sdt": "0987654321",
  "khoa": "Computer Science",
  "lop": "CS2021A",
  "phai": "Nữ",
  "ngay_sinh": "2003-05-15"
}
```

**Validation Rules:**

- `mssv`: 8-20 ký tự, bắt buộc
- `ten`: 2-100 ký tự, bắt buộc
- `phai`: "Nam", "Nữ", hoặc "Khác"

### Refresh Token

#### POST `/api/auth/refresh`

Gia hạn access token bằng refresh token.

**Request Body:**

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

### Get Profile

#### GET `/api/auth/profile`

Lấy thông tin profile của user hiện tại.

**Headers:**

```http
Authorization: Bearer <access_token>
```

**Response:**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "ma_nv": "ADMIN001",
      "ten": "System Administrator",
      "role": "admin",
      "email": "admin@ktx.edu.vn"
    }
  }
}
```

### Logout

#### POST `/api/auth/logout`

Đăng xuất và xóa refresh token.

**Headers:**

```http
Authorization: Bearer <access_token>
```

**Response:**

```json
{
  "success": true,
  "data": {
    "message": "Logged out successfully"
  }
}
```

---

## 🔐 Authorization Levels

### Public Routes

- `GET /api/health`
- `POST /api/auth/login/staff`
- `POST /api/auth/login/student`
- `POST /api/auth/refresh`

### Authenticated Routes

- `GET /api/auth/profile`
- `POST /api/auth/logout`

### Staff+ Required

- `POST /api/auth/register/student`

### Admin Only

- `POST /api/auth/register/staff`

---

## 📝 Response Format

### Success Response

```json
{
  "success": true,
  "data": {
    // Response data
  },
  "meta": {
    // Optional metadata (pagination, etc.)
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": 400,
    "message": "Error message",
    "details": [
      // Optional error details array
    ]
  }
}
```

## 🚫 Error Codes

| Code | Description                             |
| ---- | --------------------------------------- |
| 400  | Bad Request - Validation errors         |
| 401  | Unauthorized - Invalid or missing token |
| 403  | Forbidden - Insufficient permissions    |
| 404  | Not Found - Resource not found          |
| 409  | Conflict - Resource already exists      |
| 500  | Internal Server Error                   |

## 💾 Database Schema

### nhan_vien (Staff/Admin)

- `id` - Primary key
- `ma_nv` - Employee ID (unique)
- `ten` - Full name
- `mat_khau` - Hashed password
- `role` - admin/staff
- `email` - Email address
- `sdt` - Phone number
- `trang_thai` - active/inactive/suspended

### sinh_vien (Students)

- `id` - Primary key
- `mssv` - Student ID (unique)
- `ten` - Full name
- `mat_khau` - Hashed password (nullable initially)
- `email` - Email address
- `khoa` - Faculty/Department
- `lop` - Class
- `trang_thai` - applicant/active_resident/former_resident/suspended/banned/inactive

## 🔧 Development

### Scripts

```bash
npm run dev          # Start development server
npm run start        # Start production server
npm run seed:admin   # Create initial admin user
```

### Default Admin Credentials

- **Employee ID:** ADMIN001
- **Password:** Admin@123
- **Role:** admin

⚠️ **Security Note:** Đổi mật khẩu admin ngay sau lần đăng nhập đầu tiên!

## 🐳 Docker Services

- **PostgreSQL** (Port 5432) - Main database
- **Redis** (Port 6379) - Session storage
- **Redis Commander** (Port 8081) - Redis web UI
- **MinIO** (Port 9000/9001) - File storage

## 📋 Environment Variables

Xem file `.env.example` để biết danh sách đầy đủ các biến môi trường cần thiết.

---

_Tài liệu này được cập nhật cho Sprint 1 - Authentication System_
