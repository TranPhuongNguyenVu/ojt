import React, { useEffect, useMemo, useState } from "react";
import { Edit, Trash2, Search, UserPlus } from "lucide-react";
import EmployeeService from "../../../services/EmployeeService";
import Pagination from "../../../components/Pagination";
import AddEmployeeModal from "./add/AddEmployeeModal";
import EditEmployeeModal from "./edit/EditEmployeeModal";
import DeleteEmployeeModal from "./delete/DeleteEmployeeModal";

const PAGE_SIZE = 10;

const EmployeeManagement = () => {
  const [employees, setEmployees] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingEmployeeId, setEditingEmployeeId] = useState(null);
  const [deletingEmployee, setDeletingEmployee] = useState(null);

  const fetchEmployees = async (searchKeyword = "") => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      const response = await EmployeeService.getEmployees(searchKeyword);
      setEmployees(response.data.data || []);
      setCurrentPage(1);
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Không thể tải danh sách nhân viên.");
      setEmployees([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const totalPages = Math.max(1, Math.ceil(employees.length / PAGE_SIZE));

  const paginatedEmployees = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return employees.slice(start, start + PAGE_SIZE);
  }, [employees, currentPage]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchEmployees(keyword);
  };

  const handleRefresh = () => fetchEmployees(keyword);

  const thClass =
    "px-4 py-3 text-xs text-gray-500 font-bold whitespace-nowrap";
  const tdClass = "px-4 py-3 text-sm text-gray-600";

  return (
    <div className="flex-1 flex flex-col h-full bg-gray-50 font-sans -m-8 md:-m-10">
      <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 shrink-0">
        <h2 className="text-xl font-bold text-gray-800">Quản lý nhân viên</h2>
        <div className="flex items-center gap-4">
          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              maxLength={28}
              placeholder="Tìm kiếm nhân viên..."
              className="bg-gray-100 text-sm rounded-full pl-10 pr-4 py-2 focus:outline-none focus:ring-1 focus:ring-gray-300 w-56"
            />
            <Search
              size={16}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            />
          </form>
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 bg-[#C00000] hover:bg-[#a00000] text-white text-sm font-bold px-4 py-2.5 rounded-lg transition-colors shrink-0"
          >
            <UserPlus size={16} />
            Thêm nhân viên
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-8">
        {errorMessage && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        <div className="w-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className={`${thClass} w-[10%]`}>Mã NV</th>
                  <th className={`${thClass} w-[16%]`}>Họ và tên</th>
                  <th className={`${thClass} w-[12%]`}>CMND/CCCD</th>
                  <th className={`${thClass} w-[22%]`}>Email</th>
                  <th className={`${thClass} w-[12%]`}>Số điện thoại</th>
                  <th className={`${thClass} w-[18%]`}>Địa chỉ</th>
                  <th className={`${thClass} w-[10%] text-center`}>Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading ? (
                  <tr>
                    <td colSpan="7" className="px-4 py-10 text-center text-sm text-gray-500">
                      Đang tải dữ liệu...
                    </td>
                  </tr>
                ) : employees.length === 0 ? (
                  <tr>
                    <td
                      colSpan="7"
                      className="px-4 py-16 text-center text-[#C00000] font-black text-2xl tracking-widest uppercase"
                    >
                      Danh sách trống!
                    </td>
                  </tr>
                ) : (
                  paginatedEmployees.map((emp) => (
                    <tr key={emp.employeeId} className="hover:bg-gray-50 transition-colors">
                      <td
                        className={`${tdClass} text-xs font-mono text-gray-500 truncate`}
                        title={emp.employeeId}
                      >
                        {emp.employeeId?.slice(0, 8)}…
                      </td>
                      <td
                        className={`${tdClass} font-medium text-gray-800 truncate`}
                        title={emp.employeeName}
                      >
                        {emp.employeeName || "—"}
                      </td>
                      <td className={`${tdClass} truncate`}>{emp.identityCard || "—"}</td>
                      <td className={`${tdClass} truncate`} title={emp.email}>
                        {emp.email || "—"}
                      </td>
                      <td className={tdClass}>{emp.phoneNumber || "—"}</td>
                      <td className={`${tdClass} truncate`} title={emp.address}>
                        {emp.address || "—"}
                      </td>
                      <td className={tdClass}>
                        <div className="flex justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => setEditingEmployeeId(emp.employeeId)}
                            className="text-blue-500 hover:text-blue-700 p-1.5 bg-blue-50 hover:bg-blue-100 rounded-md"
                            title="Chỉnh sửa"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingEmployee(emp)}
                            className="text-red-500 hover:text-red-700 p-1.5 bg-red-50 hover:bg-red-100 rounded-md"
                            title="Xóa"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {!isLoading && employees.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={employees.length}
              pageSize={PAGE_SIZE}
              onPageChange={setCurrentPage}
              itemLabel="nhân viên"
            />
          )}
        </div>
      </main>

      {isAddModalOpen && (
        <AddEmployeeModal
          onClose={() => setIsAddModalOpen(false)}
          onSuccess={handleRefresh}
        />
      )}

      {editingEmployeeId && (
        <EditEmployeeModal
          employeeId={editingEmployeeId}
          onClose={() => setEditingEmployeeId(null)}
          onSuccess={handleRefresh}
        />
      )}

      {deletingEmployee && (
        <DeleteEmployeeModal
          employee={deletingEmployee}
          onClose={() => setDeletingEmployee(null)}
          onSuccess={handleRefresh}
        />
      )}
    </div>
  );
};

export default EmployeeManagement;
