import AuthService from './AuthService';

const SupportService = {
  /** Public — form liên hệ trang chủ */
  create: (payload) => AuthService.post('support', payload),

  /** Admin — danh sách yêu cầu hỗ trợ */
  list: (params) => AuthService.get('admin/support', { params }),

  getById: (id) => AuthService.get(`admin/support/${id}`),

  update: (id, payload) => AuthService.patch(`admin/support/${id}`, payload),

  stats: () => AuthService.get('admin/support/stats'),
};

export default SupportService;
