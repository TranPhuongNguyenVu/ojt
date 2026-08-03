import React, { useEffect, useState } from "react";
import {
  Search, UserPlus, Edit, Lock, Unlock, Trash2, RotateCcw, Eye, EyeOff, X, ShieldAlert
} from "lucide-react";
import SystemAdminService from "../../services/SystemAdminService";
import Pagination from "../../components/Pagination";

const locationData = {
  "Hà Nội": [
    "Quận Ba Đình", "Quận Hoàn Kiếm", "Quận Tây Hồ", "Quận Long Biên", "Quận Cầu Giấy", 
    "Quận Đống Đa", "Quận Hai Bà Trưng", "Quận Hoàng Mai", "Quận Thanh Xuân", "Huyện Đông Anh"
  ],
  "TP. Hồ Chí Minh": [
    "Quận 1", "Quận 3", "Quận 4", "Quận 5", "Quận 6", "Quận 7", "Quận 8", "Quận 10", 
    "Quận 11", "Quận 12", "Quận Bình Thạnh", "Quận Tân Bình", "Quận Gò Vấp", "TP. Thủ Đức"
  ],
  "Đà Nẵng": [
    "Quận Hải Châu", "Quận Thanh Khê", "Quận Sơn Trà", "Quận Ngũ Hành Sơn", "Quận Liên Chiểu", "Quận Cẩm Lệ"
  ],
  "Cần Thơ": [
    "Quận Ninh Kiều", "Quận Bình Thủy", "Quận Cái Răng", "Quận Ô Môn", "Quận Thốt Nốt"
  ],
  "Hải Phòng": [
    "Quận Hồng Bàng", "Quận Ngô Quyền", "Quận Lê Chân", "Quận Hải An", "Quận Kiến An"
  ]
};

const parseAddress = (fullAddress) => {
  if (!fullAddress) {
    return { province: "", district: "", detailAddress: "" };
  }
  const parts = fullAddress.split(",").map(p => p.trim());
  if (parts.length >= 3) {
    const province = parts[parts.length - 1];
    const district = parts[parts.length - 2];
    const detailAddress = parts.slice(0, parts.length - 2).join(", ");
    return { province, district, detailAddress };
  }
  return { province: "", district: "", detailAddress: fullAddress };
};

const getFullAddress = (form) => {
  const parts = [];
  if (form.detailAddress && form.detailAddress.trim()) parts.push(form.detailAddress.trim());
  if (form.district && form.district.trim()) parts.push(form.district.trim());
  if (form.province && form.province.trim()) parts.push(form.province.trim());
  return parts.join(", ");
};


const PAGE_SIZE = 10;

const STATUS_LABEL = {
  0: { text: "Chờ xác thực", cls: "bg-yellow-100 dark:bg-yellow-950/40 text-yellow-700 dark:text-yellow-300" },
  1: { text: "Hoạt động",    cls: "bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-300" },
  2: { text: "Đã khóa",      cls: "bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-300"    },
};

// ─── Reusable Modal wrapper ───────────────────────────────────────────────────
const Modal = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
        <h3 className="text-lg font-bold text-gray-800 dark:text-white">{title}</h3>
        <button onClick={onClose} className="text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
          <X size={20} />
        </button>
      </div>
      <div className="overflow-y-auto flex-1 px-6 py-4">{children}</div>
    </div>
  </div>
);

// ─── Reusable Form field ──────────────────────────────────────────────────────
const Field = ({ label, required, children }) => (
  <div>
    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {children}
  </div>
);

const inputCls = "w-full border border-gray-200 dark:border-gray-700 dark:bg-gray-800/60 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 dark:focus:ring-indigo-500/40 transition";

// ─── Admin Form (shared between Add & Edit) ───────────────────────────────────
const AdminForm = ({ form, onChange, isEdit = false }) => (
  <div className="space-y-4">
    {!isEdit && (
      <Field label="Tên đăng nhập" required>
        <input id="admin-username" className={inputCls} value={form.username} onChange={e => onChange("username", e.target.value)} placeholder="vd: admin_nam" />
      </Field>
    )}
    <Field label="Họ và tên" required>
      <input id="admin-fullName" className={inputCls} value={form.fullName} onChange={e => onChange("fullName", e.target.value)} placeholder="Nguyễn Văn Nam" />
    </Field>
    <Field label="Email" required>
      <input id="admin-email" className={inputCls} type="email" value={form.email} onChange={e => onChange("email", e.target.value)} placeholder="example@email.com" />
    </Field>
    <Field label="Số điện thoại">
      <input id="admin-phone" className={inputCls} value={form.phoneNumber} onChange={e => onChange("phoneNumber", e.target.value)} placeholder="09xxxxxxxx" />
    </Field>
    <Field label="CMND / CCCD">
      <input id="admin-identity" className={inputCls} value={form.identityCard} onChange={e => onChange("identityCard", e.target.value)} placeholder="0123456789" />
    </Field>
    <div className="grid grid-cols-2 gap-3">
      <Field label="Giới tính">
        <select id="admin-gender" className={inputCls} value={form.gender} onChange={e => onChange("gender", e.target.value)}>
          <option value="">-- Chọn --</option>
          <option value="Nam">Nam</option>
          <option value="Nữ">Nữ</option>
          <option value="Khác">Khác</option>
        </select>
      </Field>
      <Field label="Ngày sinh">
        <input id="admin-dob" className={inputCls} type="date" value={form.dateOfBirth} onChange={e => onChange("dateOfBirth", e.target.value)} />
      </Field>
    </div>
    <div className="grid grid-cols-2 gap-3">
      <Field label="Tỉnh / Thành phố">
        <select 
          id="admin-province"
          className={inputCls} 
          value={form.province || ""} 
          onChange={e => {
            onChange("province", e.target.value);
            onChange("district", "");
          }}
        >
          <option value="">Chọn Tỉnh/Thành...</option>
          {Object.keys(locationData).map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </Field>
      <Field label="Quận / Huyện">
        <select 
          id="admin-district"
          className={inputCls} 
          value={form.district || ""} 
          onChange={e => onChange("district", e.target.value)}
          disabled={!form.province}
        >
          <option value="">Chọn Quận/Huyện...</option>
          {form.province && locationData[form.province]?.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
      </Field>
    </div>
    <Field label="Địa chỉ chi tiết">
      <input 
        id="admin-detailAddress"
        className={inputCls} 
        value={form.detailAddress || ""} 
        onChange={e => onChange("detailAddress", e.target.value)} 
        placeholder="Số nhà, tên đường, phường/xã..." 
      />
    </Field>
    <Field label="URL Ảnh đại diện">
      <input id="admin-image" className={inputCls} value={form.image} onChange={e => onChange("image", e.target.value)} placeholder="https://..." />
    </Field>
    {!isEdit && (
      <div className="flex items-start gap-2 p-3 bg-indigo-50 dark:bg-indigo-950/40 rounded-lg">
        <ShieldAlert size={16} className="text-indigo-500 dark:text-indigo-400 mt-0.5 shrink-0" />
        <p className="text-xs text-indigo-700 dark:text-indigo-300">Tài khoản mới sẽ có mật khẩu mặc định: <strong>Admin@123456</strong></p>
      </div>
    )}
  </div>
);

// ─── Default blank form ───────────────────────────────────────────────────────
const blankForm = () => ({ username: "", fullName: "", email: "", phoneNumber: "", identityCard: "", gender: "", dateOfBirth: "", province: "", district: "", detailAddress: "", image: "" });

// ─── Main component ───────────────────────────────────────────────────────────
const AdminManagement = () => {
  const [admins, setAdmins]             = useState([]);
  const [keyword, setKeyword]           = useState("");
  const [currentPage, setCurrentPage]   = useState(1);
  const [isLoading, setIsLoading]       = useState(true);
  const [errMsg, setErrMsg]             = useState("");

  // Modal states
  const [addOpen, setAddOpen]           = useState(false);
  const [editTarget, setEditTarget]     = useState(null);   // admin object
  const [deleteTarget, setDeleteTarget] = useState(null);   // admin object
  const [resetTarget, setResetTarget]   = useState(null);   // admin object

  // Form state (shared for add/edit)
  const [form, setForm]                 = useState(blankForm());
  const [formErr, setFormErr]           = useState("");
  const [submitting, setSubmitting]     = useState(false);

  // ─── Fetch ────────────────────────────────────────────────────────────────
  const fetchAdmins = async () => {
    setIsLoading(true);
    setErrMsg("");
    try {
      const res = await SystemAdminService.getAdmins();
      setAdmins(res.data.data || []);
      setCurrentPage(1);
    } catch (err) {
      setErrMsg(err.response?.data?.message || "Không thể tải danh sách Admin.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchAdmins(); }, []);

  // ─── Filter + Paginate ────────────────────────────────────────────────────
  const filtered = admins.filter(a => {
    const kw = keyword.toLowerCase();
    return !kw || a.fullName?.toLowerCase().includes(kw) || a.username?.toLowerCase().includes(kw) || a.email?.toLowerCase().includes(kw);
  });
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // Điều chỉnh currentPage nếu vượt quá totalPages khi lọc danh sách
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  // ─── Form helpers ─────────────────────────────────────────────────────────
  const onChange = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const openAdd = () => {
    setForm(blankForm());
    setFormErr("");
    setAddOpen(true);
  };

  const openEdit = (admin) => {
    const parsedAddr = parseAddress(admin.address || "");
    setForm({
      username:    admin.username    || "",
      fullName:    admin.fullName    || "",
      email:       admin.email       || "",
      phoneNumber: admin.phoneNumber || "",
      identityCard:admin.identityCard|| "",
      gender:      admin.gender      || "",
      dateOfBirth: admin.dateOfBirth || "",
      image:       admin.image       || "",
      province:    parsedAddr.province,
      district:    parsedAddr.district,
      detailAddress: parsedAddr.detailAddress,
    });
    setFormErr("");
    setEditTarget(admin);
  };

  // ─── Submit handlers ──────────────────────────────────────────────────────
  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.fullName || !form.email || !form.username) {
      setFormErr("Vui lòng điền đầy đủ các trường bắt buộc."); return;
    }
    setSubmitting(true); setFormErr("");
    try {
      const submitData = {
        ...form,
        address: getFullAddress(form),
      };
      await SystemAdminService.createAdmin(submitData);
      setAddOpen(false);
      fetchAdmins();
    } catch (err) {
      setFormErr(err.response?.data?.message || "Tạo Admin thất bại.");
    } finally { setSubmitting(false); }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    if (!form.fullName || !form.email) {
      setFormErr("Vui lòng điền đầy đủ các trường bắt buộc."); return;
    }
    setSubmitting(true); setFormErr("");
    try {
      const submitData = {
        ...form,
        address: getFullAddress(form),
      };
      await SystemAdminService.updateAdmin(editTarget.accountId, submitData);
      setEditTarget(null);
      fetchAdmins();
    } catch (err) {
      setFormErr(err.response?.data?.message || "Cập nhật thất bại.");
    } finally { setSubmitting(false); }
  };

  const handleToggleStatus = async (admin) => {
    try {
      if (admin.status === 2) {
        await SystemAdminService.restoreAdmin(admin.accountId);
      } else {
        await SystemAdminService.deactivateAdmin(admin.accountId);
      }
      fetchAdmins();
    } catch (err) {
      alert(err.response?.data?.message || "Thao tác thất bại.");
    }
  };

  const handleResetPassword = async () => {
    if (!resetTarget) return;
    try {
      await SystemAdminService.resetAdminPassword(resetTarget.accountId);
      alert(`Đã reset mật khẩu của ${resetTarget.fullName} về: Admin@123456`);
      setResetTarget(null);
    } catch (err) {
      alert(err.response?.data?.message || "Reset mật khẩu thất bại.");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await SystemAdminService.deleteAdmin(deleteTarget.accountId);
      setDeleteTarget(null);
      fetchAdmins();
    } catch (err) {
      alert(err.response?.data?.message || "Xóa thất bại.");
    }
  };

  // ─── Table helpers ────────────────────────────────────────────────────────
  const thCls = "px-4 py-3 text-xs text-gray-500 dark:text-gray-400 font-bold whitespace-nowrap";
  const tdCls = "px-4 py-3 text-sm text-gray-700 dark:text-gray-300";

  return (
    <div className="flex-1 flex flex-col h-full bg-gray-50 dark:bg-gray-950 font-sans -m-8 md:-m-10 transition-colors duration-300">

      {/* Header */}
      <header className="h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-8 shrink-0">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">Quản lý tài khoản admin</h2>
        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              value={keyword}
              onChange={e => { setKeyword(e.target.value); setCurrentPage(1); }}
              placeholder="Tìm kiếm admin..."
              className="bg-gray-100 dark:bg-gray-800/60 dark:text-white text-sm rounded-full pl-10 pr-4 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-300 dark:focus:ring-indigo-500/40 w-56"
            />
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
          </div>
          {/* Add button */}
          <button
            id="btn-add-admin"
            onClick={openAdd}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold px-4 py-2 rounded-full transition-all"
          >
            <UserPlus size={15} />
            Thêm admin
          </button>
        </div>
      </header>

      {/* Error banner */}
      {errMsg && <div className="mx-8 mt-4 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-500/30 rounded-lg text-sm text-red-600 dark:text-red-300">{errMsg}</div>}

      {/* Table area */}
      <div className="flex-1 p-8 overflow-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-40 text-gray-400 dark:text-gray-500 text-sm">Đang tải...</div>
        ) : (
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 dark:bg-gray-800/60 border-b border-gray-100 dark:border-gray-800">
                  <tr>
                    <th className={thCls}>#</th>
                    <th className={thCls}>Họ tên</th>
                    <th className={thCls}>Tên đăng nhập</th>
                    <th className={thCls}>Email</th>
                    <th className={thCls}>Số điện thoại</th>
                    <th className={thCls}>Trạng thái</th>
                    <th className={thCls}>Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                  {paginated.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-16 text-gray-400 dark:text-gray-500 text-sm">
                        Không tìm thấy tài khoản Admin nào.
                      </td>
                    </tr>
                  ) : paginated.map((admin, idx) => {
                    const statusInfo = STATUS_LABEL[admin.status] || STATUS_LABEL[1];
                    const rowNum = (currentPage - 1) * PAGE_SIZE + idx + 1;
                    return (
                      <tr key={admin.accountId} className="hover:bg-gray-50/60 dark:hover:bg-gray-800/60 transition-colors">
                        <td className={tdCls}>{rowNum}</td>
                        <td className={tdCls}>
                          <div className="flex items-center gap-3">
                            {admin.image ? (
                              <img src={admin.image} alt="" className="w-8 h-8 rounded-full object-cover border border-gray-200 dark:border-gray-700" />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-600 dark:text-indigo-300 font-bold text-sm">
                                {admin.fullName?.[0] || "A"}
                              </div>
                            )}
                            <span className="font-semibold text-gray-800 dark:text-white">{admin.fullName}</span>
                          </div>
                        </td>
                        <td className={tdCls + " font-mono text-xs"}>{admin.username}</td>
                        <td className={tdCls}>{admin.email}</td>
                        <td className={tdCls}>{admin.phoneNumber || "—"}</td>
                        <td className={tdCls}>
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusInfo.cls}`}>
                            {statusInfo.text}
                          </span>
                        </td>
                        <td className={tdCls}>
                          <div className="flex items-center gap-2">
                            {/* Edit */}
                            <button
                              id={`btn-edit-${admin.accountId}`}
                              onClick={() => openEdit(admin)}
                              title="Sửa thông tin"
                              className="p-1.5 rounded-lg text-gray-400 dark:text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors"
                            >
                              <Edit size={15} />
                            </button>
                            {/* Lock / Unlock */}
                            <button
                              id={`btn-toggle-${admin.accountId}`}
                              onClick={() => handleToggleStatus(admin)}
                              title={admin.status === 2 ? "Mở khóa" : "Khóa"}
                              className={`p-1.5 rounded-lg transition-colors ${admin.status === 2 ? "text-gray-400 dark:text-gray-500 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-950/40" : "text-gray-400 dark:text-gray-500 hover:text-orange-500 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/40"}`}
                            >
                              {admin.status === 2 ? <Unlock size={15} /> : <Lock size={15} />}
                            </button>
                            {/* Reset password */}
                            <button
                              id={`btn-reset-${admin.accountId}`}
                              onClick={() => setResetTarget(admin)}
                              title="Reset mật khẩu"
                              className="p-1.5 rounded-lg text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
                            >
                              <RotateCcw size={15} />
                            </button>
                            {/* Delete */}
                            <button
                              id={`btn-delete-${admin.accountId}`}
                              onClick={() => setDeleteTarget(admin)}
                              title="Xóa"
                              className="p-1.5 rounded-lg text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="border-t border-gray-100 dark:border-gray-800 p-4">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={filtered.length}
                  pageSize={PAGE_SIZE}
                  onPageChange={setCurrentPage}
                  itemLabel="tài khoản Admin"
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* ─── ADD Modal ─────────────────────────────────────────────────────── */}
      {addOpen && (
        <Modal title="Thêm tài khoản Admin mới" onClose={() => setAddOpen(false)}>
          <form onSubmit={handleAdd} className="space-y-4">
            <AdminForm form={form} onChange={onChange} isEdit={false} />
            {formErr && <p className="text-red-500 dark:text-red-400 text-sm">{formErr}</p>}
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setAddOpen(false)} className="flex-1 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition">Hủy</button>
              <button type="submit" disabled={submitting} className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition disabled:opacity-50">
                {submitting ? "Đang tạo..." : "Tạo tài khoản"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ─── EDIT Modal ────────────────────────────────────────────────────── */}
      {editTarget && (
        <Modal title={`Sửa thông tin: ${editTarget.fullName}`} onClose={() => setEditTarget(null)}>
          <form onSubmit={handleEdit} className="space-y-4">
            <AdminForm form={form} onChange={onChange} isEdit={true} />
            {formErr && <p className="text-red-500 dark:text-red-400 text-sm">{formErr}</p>}
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setEditTarget(null)} className="flex-1 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition">Hủy</button>
              <button type="submit" disabled={submitting} className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition disabled:opacity-50">
                {submitting ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ─── RESET PASSWORD Confirm ─────────────────────────────────────────── */}
      {resetTarget && (
        <Modal title="Xác nhận đặt lại mật khẩu" onClose={() => setResetTarget(null)}>
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Bạn có chắc muốn reset mật khẩu của <strong>{resetTarget.fullName}</strong> về mật khẩu mặc định không?
            </p>
            <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950/40 rounded-lg">
              <ShieldAlert size={16} className="text-blue-500 dark:text-blue-400 shrink-0" />
              <p className="text-xs text-blue-700 dark:text-blue-300">Mật khẩu mới sẽ là: <strong>Admin@123456</strong></p>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setResetTarget(null)} className="flex-1 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition">Hủy</button>
              <button onClick={handleResetPassword} className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition">Đặt lại mật khẩu</button>
            </div>
          </div>
        </Modal>
      )}

      {/* ─── DELETE Confirm ─────────────────────────────────────────────────── */}
      {deleteTarget && (
        <Modal title="Xác nhận xóa tài khoản Admin" onClose={() => setDeleteTarget(null)}>
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Bạn có chắc muốn <strong className="text-red-600 dark:text-red-400">xóa vĩnh viễn</strong> tài khoản Admin{" "}
              <strong>{deleteTarget.fullName}</strong>? Hành động này không thể hoàn tác.
            </p>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition">Hủy</button>
              <button onClick={handleDelete} className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition">Xóa tài khoản</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AdminManagement;
