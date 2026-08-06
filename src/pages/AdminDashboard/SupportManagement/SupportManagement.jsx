import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Eye, Loader2, Mail, Phone, RefreshCw, Search, X } from 'lucide-react';
import SupportService from '../../../services/SupportService';
import Pagination from '../../../components/Pagination';

const PAGE_SIZE = 10;

const STATUS_OPTIONS = [
  { value: '', label: 'Tất cả' },
  { value: 'NEW', label: 'Mới' },
  { value: 'IN_PROGRESS', label: 'Đang xử lý' },
  { value: 'RESOLVED', label: 'Đã giải quyết' },
  { value: 'CLOSED', label: 'Đã đóng' },
];

const STATUS_META = {
  NEW: {
    label: 'Mới',
    className: 'text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/40',
  },
  IN_PROGRESS: {
    label: 'Đang xử lý',
    className: 'text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-950/40',
  },
  RESOLVED: {
    label: 'Đã giải quyết',
    className: 'text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-950/40',
  },
  CLOSED: {
    label: 'Đã đóng',
    className: 'text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800',
  },
};

const formatDateTime = (value) => {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return value;
  }
};

const SupportManagement = () => {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const [editStatus, setEditStatus] = useState('NEW');
  const [adminNote, setAdminNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const fetchList = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const params = statusFilter ? { status: statusFilter } : undefined;
      const res = await SupportService.list(params);
      setItems(res.data?.data || []);
      window.dispatchEvent(new Event('support-updated'));
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Không tải được danh sách hỗ trợ.');
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, searchKeyword]);

  const filtered = useMemo(() => {
    const q = searchKeyword.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) =>
      [item.fullName, item.email, item.phone, item.subject, item.message]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(q))
    );
  }, [items, searchKeyword]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, currentPage]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const openDetail = (item) => {
    setSelected(item);
    setEditStatus(item.status || 'NEW');
    setAdminNote(item.adminNote || '');
    setSaveError('');
  };

  const handleSave = async () => {
    if (!selected) return;
    setIsSaving(true);
    setSaveError('');
    try {
      const res = await SupportService.update(selected.supportRequestId, {
        status: editStatus,
        adminNote,
      });
      const updated = res.data?.data;
      setSelected(updated);
      setItems((prev) =>
        prev.map((row) =>
          row.supportRequestId === updated.supportRequestId ? updated : row
        )
      );
      window.dispatchEvent(new Event('support-updated'));
    } catch (err) {
      setSaveError(err.response?.data?.message || 'Cập nhật thất bại.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-gray-50 dark:bg-gray-950 font-sans -m-8 md:-m-10 transition-colors duration-300">
      <header className="h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-8 gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">Hỗ trợ khách hàng</h2>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
            Tin nhắn gửi từ trang Liên hệ
          </p>
        </div>
        <button
          type="button"
          onClick={fetchList}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          <RefreshCw size={14} />
          Làm mới
        </button>
      </header>

      <main className="flex-1 overflow-y-auto p-8 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <div className="relative max-w-md w-full">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="Tìm theo tên, email, chủ đề..."
              className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-gray-400"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-gray-400"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value || 'all'} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 px-4 py-3 text-sm text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/60 border-b border-gray-200 dark:border-gray-800 text-xs text-gray-500 dark:text-gray-400 font-bold">
                  <th className="px-5 py-3.5 whitespace-nowrap">Thời gian</th>
                  <th className="px-5 py-3.5 whitespace-nowrap">Khách hàng</th>
                  <th className="px-5 py-3.5 whitespace-nowrap">Chủ đề</th>
                  <th className="px-5 py-3.5 whitespace-nowrap">Trạng thái</th>
                  <th className="px-5 py-3.5 text-center whitespace-nowrap">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {isLoading ? (
                  <tr>
                    <td colSpan="5" className="px-5 py-12 text-center text-sm text-gray-500">
                      <span className="inline-flex items-center gap-2">
                        <Loader2 size={16} className="animate-spin" />
                        Đang tải...
                      </span>
                    </td>
                  </tr>
                ) : paginated.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-5 py-14 text-center text-sm text-gray-500 dark:text-gray-400">
                      Chưa có yêu cầu hỗ trợ nào.
                    </td>
                  </tr>
                ) : (
                  paginated.map((item) => {
                    const meta = STATUS_META[item.status] || STATUS_META.NEW;
                    return (
                      <tr key={item.supportRequestId} className="hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors">
                        <td className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                          {formatDateTime(item.createdAt)}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900 dark:text-white">{item.fullName}</div>
                          <div className="text-xs text-gray-400 mt-0.5">{item.email}</div>
                        </td>
                        <td className="px-5 py-4 text-sm text-gray-700 dark:text-gray-300 max-w-xs truncate" title={item.subject}>
                          {item.subject}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2.5 py-1 text-[10px] uppercase font-bold tracking-wider rounded-full ${meta.className}`}>
                            {meta.label}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <button
                            type="button"
                            onClick={() => openDetail(item)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          >
                            <Eye size={14} />
                            Xem
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {!isLoading && filtered.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filtered.length}
              pageSize={PAGE_SIZE}
              onPageChange={setCurrentPage}
              itemLabel="yêu cầu"
            />
          )}
        </div>
      </main>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 max-w-2xl w-full overflow-hidden">
            <div className="bg-gray-950 dark:bg-black text-white px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-bold">Chi tiết yêu cầu #{selected.supportRequestId}</h3>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-black tracking-widest text-gray-400 uppercase">Họ tên</p>
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mt-1">{selected.fullName}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black tracking-widest text-gray-400 uppercase">Thời gian gửi</p>
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mt-1">{formatDateTime(selected.createdAt)}</p>
                </div>
                <div className="flex items-start gap-2">
                  <Mail size={14} className="mt-1 text-gray-400 shrink-0" />
                  <div>
                    <p className="text-[10px] font-black tracking-widest text-gray-400 uppercase">Email</p>
                    <a href={`mailto:${selected.email}`} className="text-sm font-semibold text-[#C00000] dark:text-[#E50914] hover:underline">
                      {selected.email}
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Phone size={14} className="mt-1 text-gray-400 shrink-0" />
                  <div>
                    <p className="text-[10px] font-black tracking-widest text-gray-400 uppercase">Điện thoại</p>
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mt-1">{selected.phone || '—'}</p>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-[10px] font-black tracking-widest text-gray-400 uppercase">Chủ đề</p>
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mt-1">{selected.subject}</p>
              </div>

              <div>
                <p className="text-[10px] font-black tracking-widest text-gray-400 uppercase mb-1.5">Nội dung</p>
                <div className="rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 p-4 text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                  {selected.message}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black tracking-widest text-gray-400 uppercase block mb-1.5">
                    Trạng thái
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200"
                  >
                    {STATUS_OPTIONS.filter((o) => o.value).map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black tracking-widest text-gray-400 uppercase block mb-1.5">
                  Ghi chú nội bộ
                </label>
                <textarea
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  rows={3}
                  placeholder="Ghi chú xử lý cho admin..."
                  className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 resize-y"
                />
              </div>

              {saveError && (
                <p className="text-sm font-semibold text-[#C00000]">{saveError}</p>
              )}
            </div>

            <div className="bg-gray-50 dark:bg-gray-800/60 px-6 py-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="px-4 py-2 text-sm font-semibold rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                Đóng
              </button>
              <button
                type="button"
                disabled={isSaving}
                onClick={handleSave}
                className="px-4 py-2 text-sm font-semibold rounded-lg bg-[#C00000] text-white hover:bg-[#a00000] disabled:opacity-60 transition-colors"
              >
                {isSaving ? 'Đang lưu...' : 'Lưu cập nhật'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupportManagement;
