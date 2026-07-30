import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save } from "lucide-react";
import EmployeeService from "../../../services/EmployeeService";
import { getApiErrorMessage } from "../../../services/ApiErrorUtils";

const emptyForm = {
  username: "",
  password: "",
  confirmPassword: "",
  fullName: "",
  email: "",
  phoneNumber: "",
  identityCard: "",
  gender: "Nam",
  dateOfBirth: "",
  address: "",
};

const EmployeeForm = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [formData, setFormData] = useState(emptyForm);
  const [isLoading, setIsLoading] = useState(isEdit);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!isEdit) return;

    const loadEmployee = async () => {
      try {
        const response = await EmployeeService.getEmployeeById(id);
        const emp = response.data.data;
        setFormData({
          username: "",
          password: "",
          confirmPassword: "",
          fullName: emp.employeeName || "",
          email: emp.email || "",
          phoneNumber: emp.phoneNumber || "",
          identityCard: emp.identityCard || "",
          gender: emp.gender || "Nam",
          dateOfBirth: emp.dateOfBirth || "",
          address: emp.address || "",
        });
      } catch (error) {
        setErrorMessage(getApiErrorMessage(error, "Không thể tải thông tin nhân viên."));
      } finally {
        setIsLoading(false);
      }
    };

    loadEmployee();
  }, [id, isEdit]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrorMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (!isEdit) {
      if (!formData.username.trim() || !formData.password.trim()) {
        setErrorMessage("Vui lòng nhập username và mật khẩu.");
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setErrorMessage("Mật khẩu xác nhận không khớp.");
        return;
      }
    } else if (formData.password && formData.password !== formData.confirmPassword) {
      setErrorMessage("Mật khẩu xác nhận không khớp.");
      return;
    }

    const payload = {
      fullName: formData.fullName,
      email: formData.email,
      phoneNumber: formData.phoneNumber,
      identityCard: formData.identityCard,
      gender: formData.gender,
      dateOfBirth: formData.dateOfBirth || null,
      address: formData.address,
    };

    if (!isEdit) {
      payload.username = formData.username;
      payload.password = formData.password;
    } else if (formData.password) {
      payload.password = formData.password;
    }

    setIsSubmitting(true);
    try {
      if (isEdit) {
        await EmployeeService.updateEmployee(id, payload);
} else {
        await EmployeeService.createEmployee(payload);
      }
      navigate("/admin/employees");
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(error, isEdit ? "Không thể cập nhật nhân viên." : "Không thể thêm nhân viên.")
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-gray-500">
        Đang tải thông tin...
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-50 font-sans -m-8 md:-m-10">
      <header className="h-16 bg-white border-b border-gray-200 flex items-center gap-4 px-8">
        <button
          type="button"
          onClick={() => navigate("/admin/employees")}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
        >
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-xl font-bold text-gray-800">
          {isEdit ? "Chỉnh sửa Nhân viên" : "Thêm Nhân viên mới"}
        </h2>
      </header>

      <main className="flex-1 overflow-y-auto p-8">
        <form
          onSubmit={handleSubmit}
          className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm border border-gray-200 p-8 space-y-6"
        >
          {errorMessage && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorMessage}
            </div>
          )}

          {!isEdit && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                  Username *
                </label>
                <input
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#C00000]/20 focus:border-[#C00000]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                  Mật khẩu *
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#C00000]/20 focus:border-[#C00000]"
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                Họ và tên *
              </label>
              <input
name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                required
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#C00000]/20 focus:border-[#C00000]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                Email *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#C00000]/20 focus:border-[#C00000]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                Số điện thoại
              </label>
              <input
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#C00000]/20 focus:border-[#C00000]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                CMND/CCCD
              </label>
              <input
                name="identityCard"
                value={formData.identityCard}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#C00000]/20 focus:border-[#C00000]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                Giới tính
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#C00000]/20 focus:border-[#C00000]"
              >
                <option value="Nam">Nam</option>
                <option value="Nữ">Nữ</option>
                <option value="Khác">Khác</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                Ngày sinh
              </label>
              <input
                type="date"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleChange}
className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#C00000]/20 focus:border-[#C00000]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
              Địa chỉ
            </label>
            <input
              name="address"
              value={formData.address}
              onChange={handleChange}
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#C00000]/20 focus:border-[#C00000]"
            />
          </div>

          {isEdit && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-gray-100">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                  Mật khẩu mới (tùy chọn)
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#C00000]/20 focus:border-[#C00000]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                  Xác nhận mật khẩu
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#C00000]/20 focus:border-[#C00000]"
                />
              </div>
            </div>
          )}

          {!isEdit && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                Xác nhận mật khẩu *
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#C00000]/20 focus:border-[#C00000]"
              />
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => navigate("/admin/employees")}
              className="px-6 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              Hủy
            </button>
            <button
type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 bg-[#C00000] hover:bg-[#a00000] disabled:opacity-60 text-white text-sm font-bold px-6 py-2.5 rounded-lg"
            >
              <Save size={16} />
              {isSubmitting ? "Đang lưu..." : "Lưu"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default EmployeeForm;
