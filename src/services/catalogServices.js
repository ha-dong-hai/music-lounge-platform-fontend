import axiosClient from '../config/axios';

// MLACP-522: danh mục hành chính 2 cấp từ 01/7/2025 (34 tỉnh, 3.321 phường/xã — QĐ 19/2025/QĐ-TTg). Không còn cấp
// quận/huyện, nên không có "danh sách quận": chọn tỉnh rồi chọn phường/xã. Mỗi mục: { code, name, divisionType }.
export const getProvinces = async () => axiosClient.get('/catalog/provinces');
export const getWardsOfProvince = async (provinceCode) => axiosClient.get(`/catalog/provinces/${provinceCode}/wards`);
