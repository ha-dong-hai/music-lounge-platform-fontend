import axiosClient from '../config/axios';

// Tài khoản NHẬN TIỀN của chủ phòng trà — đây là đích đến của tiền quyết toán sau mỗi buổi diễn
// (Settlement.BankAccountId) và của tiền donate trả cho nghệ sĩ (Donation.BankAccountId).
// Không khai tài khoản thì tiền vẫn được ghi sổ nhưng không có chỗ để chuyển đi.
//
// MỘT TÀI KHOẢN THUỘC VỀ MỘT TRONG HAI LOẠI CHỦ SỞ HỮU:
//   ownerType = 'Lounge'    -> ownerId là mã PHÒNG TRÀ
//   ownerType = 'Performer' -> ownerId là mã NGHỆ SĨ do chủ phòng trà tạo
// Cả hai tham số đều bắt buộc khi đọc danh sách; backend chỉ cho chủ đọc tài khoản của chính mình.
//
// accountHolder PHẢI khớp tên định danh hợp pháp của chủ phòng trà (MLACP-399). Không khớp thì
// Admin từ chối khi duyệt, và backend trả về câu giải thích tiếng Việt — hiện nguyên văn câu đó.
export const getBankAccounts = async (ownerType, ownerId) => {
  return axiosClient.get('/bank-accounts', { params: { ownerType, ownerId } });
};

export const createBankAccount = async ({ ownerType, ownerId, bankName, accountNumber, accountHolder, isDefault = false }) => {
  return axiosClient.post('/bank-accounts', { ownerType, ownerId, bankName, accountNumber, accountHolder, isDefault });
};

// PUT ghi đè cả 4 trường — gửi lại đầy đủ, đừng gửi từng phần.
export const updateBankAccount = async (id, { bankName, accountNumber, accountHolder, isDefault }) => {
  return axiosClient.put(`/bank-accounts/${id}`, { bankName, accountNumber, accountHolder, isDefault });
};
