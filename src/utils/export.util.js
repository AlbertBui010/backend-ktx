import XLSX from "xlsx";
import puppeteer from "puppeteer";
import moment from "moment";
import path from "path";
import fs from "fs";

export const exportUtils = {
  /**
   * Export dữ liệu ra Excel
   */
  async exportToExcel(data, sheetName = "Sheet1", fileName = "export.xlsx") {
    try {
      // Tạo workbook và worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(data);

      // Auto-fit columns
      const colWidths = [];
      if (data.length > 0) {
        Object.keys(data[0]).forEach((key, index) => {
          const maxLength = Math.max(key.length, ...data.map((row) => String(row[key] || "").length));
          colWidths[index] = { width: Math.min(maxLength + 2, 50) };
        });
      }
      worksheet["!cols"] = colWidths;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

      // Write to buffer
      const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

      return {
        buffer,
        fileName,
        mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      };
    } catch (error) {
      throw new Error(`Lỗi export Excel: ${error.message}`);
    }
  },

  /**
   * Export báo cáo tiền điện ra Excel
   */
  async exportElectricityReportToExcel(reportData) {
    try {
      const { roomBills = [], studentBills = [], statistics = {}, dateRange = {} } = reportData;

      // Prepare room bills data
      const roomBillsData = roomBills.map((bill) => ({
        "ID Hóa đơn": bill.id,
        Phòng: bill.Room?.ten_phong || "N/A",
        "Từ ngày": moment(bill.tu_ngay).format("DD/MM/YYYY"),
        "Đến ngày": moment(bill.den_ngay).format("DD/MM/YYYY"),
        "Số điện cũ": bill.so_dien_cu,
        "Số điện mới": bill.so_dien_moi,
        "Tiêu thụ (kWh)": bill.so_dien_tieu_thu,
        "Thành tiền (VNĐ)": new Intl.NumberFormat("vi-VN").format(bill.thanh_tien),
        "Trạng thái": bill.trang_thai,
        "Ngày tạo": moment(bill.ngay_tao).format("DD/MM/YYYY HH:mm"),
      }));

      // Prepare student bills data
      const studentBillsData = studentBills.map((bill) => ({
        "ID Hóa đơn SV": bill.id,
        MSSV: bill.Student?.mssv || "N/A",
        "Tên sinh viên": bill.Student?.ten || "N/A",
        Phòng: bill.ElectricityBill?.Room?.ten_phong || "N/A",
        "Số ngày ở": bill.so_ngay_o,
        "Tỷ lệ chia": `${(bill.ty_le_chia * 100).toFixed(2)}%`,
        "Số tiền phải trả (VNĐ)": new Intl.NumberFormat("vi-VN").format(bill.so_tien_phai_tra),
        "Số tiền đã trả (VNĐ)": new Intl.NumberFormat("vi-VN").format(bill.so_tien_da_tra),
        "Trạng thái": bill.trang_thai_thanh_toan,
        "Phương thức TT": bill.phuong_thuc_thanh_toan || "Chưa TT",
        "Ngày thanh toán": bill.ngay_thanh_toan ? moment(bill.ngay_thanh_toan).format("DD/MM/YYYY HH:mm") : "Chưa TT",
      }));

      // Summary data
      const summaryData = [
        { "Thống kê": "Tổng số hóa đơn phòng", "Giá trị": statistics.totalRoomBills || 0 },
        { "Thống kê": "Tổng số hóa đơn sinh viên", "Giá trị": statistics.totalStudentBills || 0 },
        {
          "Thống kê": "Tổng tiền điện (VNĐ)",
          "Giá trị": new Intl.NumberFormat("vi-VN").format(statistics.totalAmount || 0),
        },
        { "Thống kê": "Đã thu (VNĐ)", "Giá trị": new Intl.NumberFormat("vi-VN").format(statistics.paidAmount || 0) },
        {
          "Thống kê": "Chưa thu (VNĐ)",
          "Giá trị": new Intl.NumberFormat("vi-VN").format(statistics.unpaidAmount || 0),
        },
        { "Thống kê": "Tỷ lệ thu (%)", "Giá trị": `${statistics.paymentRate || 0}%` },
      ];

      // Create workbook with multiple sheets
      const workbook = XLSX.utils.book_new();

      // Add summary sheet
      const summaryWS = XLSX.utils.json_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summaryWS, "Tổng quan");

      // Add room bills sheet
      if (roomBillsData.length > 0) {
        const roomBillsWS = XLSX.utils.json_to_sheet(roomBillsData);
        XLSX.utils.book_append_sheet(workbook, roomBillsWS, "Hóa đơn phòng");
      }

      // Add student bills sheet
      if (studentBillsData.length > 0) {
        const studentBillsWS = XLSX.utils.json_to_sheet(studentBillsData);
        XLSX.utils.book_append_sheet(workbook, studentBillsWS, "Hóa đơn sinh viên");
      }

      const fileName = `Bao_cao_tien_dien_${moment().format("YYYYMMDD_HHmmss")}.xlsx`;
      const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

      return {
        buffer,
        fileName,
        mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      };
    } catch (error) {
      throw new Error(`Lỗi export báo cáo Excel: ${error.message}`);
    }
  },

  /**
   * Tạo HTML template cho PDF
   */
  generateElectricityReportHTML(reportData) {
    const {
      roomBills = [],
      studentBills = [],
      statistics = {},
      dateRange = {},
      title = "BÁO CÁO TIỀN ĐIỆN KÝ TÚC XÁ",
    } = reportData;

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${title}</title>
    <style>
        body {
            font-family: 'Times New Roman', serif;
            margin: 20px;
            color: #333;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .header h1 {
            color: #2c3e50;
            margin-bottom: 10px;
        }
        .header p {
            margin: 5px 0;
            color: #666;
        }
        .summary {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
        }
        .summary h2 {
            color: #2c3e50;
            margin-bottom: 15px;
        }
        .summary-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
        }
        .summary-item {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #dee2e6;
        }
        .summary-item:last-child {
            border-bottom: none;
        }
        .summary-label {
            font-weight: bold;
        }
        .summary-value {
            color: #007bff;
            font-weight: bold;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        table caption {
            font-size: 18px;
            font-weight: bold;
            color: #2c3e50;
            margin-bottom: 10px;
            text-align: left;
        }
        th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
        }
        th {
            background-color: #3498db;
            color: white;
            font-weight: bold;
        }
        tbody tr:nth-child(even) {
            background-color: #f2f2f2;
        }
        tbody tr:hover {
            background-color: #e8f4fd;
        }
        .status-paid { color: #28a745; font-weight: bold; }
        .status-unpaid { color: #dc3545; font-weight: bold; }
        .status-partial { color: #ffc107; font-weight: bold; }
        .status-finalized { color: #28a745; font-weight: bold; }
        .status-calculated { color: #007bff; font-weight: bold; }
        .status-draft { color: #6c757d; font-weight: bold; }
        .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #dee2e6;
            color: #666;
        }
        .currency {
            text-align: right;
        }
        .page-break {
            page-break-after: always;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>${title}</h1>
        <p>Thời gian: ${dateRange.from || "N/A"} - ${dateRange.to || "N/A"}</p>
        <p>Ngày xuất báo cáo: ${moment().format("DD/MM/YYYY HH:mm:ss")}</p>
    </div>

    <div class="summary">
        <h2>📊 TỔNG QUAN</h2>
        <div class="summary-grid">
            <div class="summary-item">
                <span class="summary-label">Tổng số hóa đơn phòng:</span>
                <span class="summary-value">${statistics.totalRoomBills || 0}</span>
            </div>
            <div class="summary-item">
                <span class="summary-label">Tổng số hóa đơn sinh viên:</span>
                <span class="summary-value">${statistics.totalStudentBills || 0}</span>
            </div>
            <div class="summary-item">
                <span class="summary-label">Tổng tiền điện:</span>
                <span class="summary-value currency">${new Intl.NumberFormat("vi-VN").format(
                  statistics.totalAmount || 0,
                )} VNĐ</span>
            </div>
            <div class="summary-item">
                <span class="summary-label">Đã thu:</span>
                <span class="summary-value currency">${new Intl.NumberFormat("vi-VN").format(
                  statistics.paidAmount || 0,
                )} VNĐ</span>
            </div>
            <div class="summary-item">
                <span class="summary-label">Chưa thu:</span>
                <span class="summary-value currency">${new Intl.NumberFormat("vi-VN").format(
                  statistics.unpaidAmount || 0,
                )} VNĐ</span>
            </div>
            <div class="summary-item">
                <span class="summary-label">Tỷ lệ thu:</span>
                <span class="summary-value">${statistics.paymentRate || 0}%</span>
            </div>
        </div>
    </div>

    ${
      roomBills.length > 0
        ? `
    <table>
        <caption>📋 HÓA ĐƠN TIỀN ĐIỆN PHÒNG</caption>
        <thead>
            <tr>
                <th>ID</th>
                <th>Phòng</th>
                <th>Từ ngày</th>
                <th>Đến ngày</th>
                <th>Điện cũ</th>
                <th>Điện mới</th>
                <th>Tiêu thụ</th>
                <th>Thành tiền</th>
                <th>Trạng thái</th>
            </tr>
        </thead>
        <tbody>
            ${roomBills
              .map(
                (bill) => `
            <tr>
                <td>${bill.id}</td>
                <td>${bill.Room?.ten_phong || "N/A"}</td>
                <td>${moment(bill.tu_ngay).format("DD/MM/YYYY")}</td>
                <td>${moment(bill.den_ngay).format("DD/MM/YYYY")}</td>
                <td>${bill.so_dien_cu}</td>
                <td>${bill.so_dien_moi}</td>
                <td>${bill.so_dien_tieu_thu} kWh</td>
                <td class="currency">${new Intl.NumberFormat("vi-VN").format(bill.thanh_tien)} VNĐ</td>
                <td class="status-${bill.trang_thai}">${bill.trang_thai}</td>
            </tr>
            `,
              )
              .join("")}
        </tbody>
    </table>
    `
        : ""
    }

    ${
      studentBills.length > 0
        ? `
    <div class="page-break"></div>
    <table>
        <caption>👥 HÓA ĐƠN TIỀN ĐIỆN SINH VIÊN</caption>
        <thead>
            <tr>
                <th>ID</th>
                <th>MSSV</th>
                <th>Tên sinh viên</th>
                <th>Phòng</th>
                <th>Số ngày ở</th>
                <th>Tỷ lệ chia</th>
                <th>Phải trả</th>
                <th>Đã trả</th>
                <th>Trạng thái</th>
            </tr>
        </thead>
        <tbody>
            ${studentBills
              .slice(0, 50)
              .map(
                (bill) => `
            <tr>
                <td>${bill.id}</td>
                <td>${bill.Student?.mssv || "N/A"}</td>
                <td>${bill.Student?.ten || "N/A"}</td>
                <td>${bill.ElectricityBill?.Room?.ten_phong || "N/A"}</td>
                <td>${bill.so_ngay_o}</td>
                <td>${(bill.ty_le_chia * 100).toFixed(2)}%</td>
                <td class="currency">${new Intl.NumberFormat("vi-VN").format(bill.so_tien_phai_tra)} VNĐ</td>
                <td class="currency">${new Intl.NumberFormat("vi-VN").format(bill.so_tien_da_tra)} VNĐ</td>
                <td class="status-${bill.trang_thai_thanh_toan.replace("_", "-")}">${bill.trang_thai_thanh_toan}</td>
            </tr>
            `,
              )
              .join("")}
            ${
              studentBills.length > 50
                ? `
            <tr>
                <td colspan="9" style="text-align: center; font-style: italic; color: #666;">
                    ... và ${studentBills.length - 50} bản ghi khác (xem chi tiết trong file Excel)
                </td>
            </tr>
            `
                : ""
            }
        </tbody>
    </table>
    `
        : ""
    }

    <div class="footer">
        <p>Báo cáo được tạo tự động bởi Hệ thống quản lý KTX</p>
        <p>Thời gian tạo: ${moment().format("DD/MM/YYYY HH:mm:ss")}</p>
    </div>
</body>
</html>
    `;
  },

  /**
   * Export báo cáo ra PDF
   */
  async exportElectricityReportToPDF(reportData) {
    let browser;
    try {
      // Generate HTML
      const html = this.generateElectricityReportHTML(reportData);

      // Launch browser
      browser = await puppeteer.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });

      const page = await browser.newPage();

      // Set content
      await page.setContent(html, { waitUntil: "networkidle0" });

      // Generate PDF
      const pdfBuffer = await page.pdf({
        format: "A4",
        margin: {
          top: "20mm",
          right: "15mm",
          bottom: "20mm",
          left: "15mm",
        },
        printBackground: true,
        displayHeaderFooter: true,
        headerTemplate: "<div></div>",
        footerTemplate: `
          <div style="font-size: 10px; text-align: center; width: 100%; color: #666;">
            Trang <span class="pageNumber"></span> / <span class="totalPages"></span>
          </div>
        `,
      });

      const fileName = `Bao_cao_tien_dien_${moment().format("YYYYMMDD_HHmmss")}.pdf`;

      return {
        buffer: pdfBuffer,
        fileName,
        mimeType: "application/pdf",
      };
    } catch (error) {
      throw new Error(`Lỗi export PDF: ${error.message}`);
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  },
};
