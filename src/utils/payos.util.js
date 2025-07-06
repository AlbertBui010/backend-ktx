// src/utils/payos.util.js
import PayOS from '@payos/node';
import dotenv from 'dotenv';

/* --------------------------------------------------------
 * Load biến môi trường thật sớm để các file import sau
 * (trong cùng tiến trình) đều có sẵn giá trị.
 * ------------------------------------------------------*/
dotenv.config();

/* --- Kiểm tra nhanh xem các khóa có bị undefined không --- */
console.log('[PayOS] CLIENT_ID  :', process.env.PAYOS_CLIENT_ID);
console.log('[PayOS] API_KEY    :', process.env.PAYOS_API_KEY);
console.log('[PayOS] CHECKSUM   :', process.env.PAYOS_CHECKSUM_KEY);

/* --------------------------------------------------------
 * Khởi tạo PayOS với 3 tham số POSITIONAL
 *  new PayOS(clientId, apiKey, checksumKey)
 * ------------------------------------------------------*/
const payos = new PayOS(
  process.env.PAYOS_CLIENT_ID,
  process.env.PAYOS_API_KEY,
  process.env.PAYOS_CHECKSUM_KEY,
  // partnerCode ‑ nếu bạn có, thêm ở đây; nếu không bỏ qua
);

export default payos;
