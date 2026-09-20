import axiosClient from '../config/axios';

// Donate đi qua VNPay giống hệt mua vé — trả về paymentUrl thật, không xác nhận ngay tức thời.
export const createDonation = async ({ performanceId, amount, isAnonymous = false, message = null, isMessagePublic = true }) => {
  return axiosClient.post('/donations', { performanceId, amount, isAnonymous, message, isMessagePublic });
};

export const getMyDonations = async (params = {}) => {
  return axiosClient.get('/donations/my', { params });
};
