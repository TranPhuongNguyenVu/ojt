import React, { useState } from "react";
import { AlertTriangle } from "lucide-react";
import EmployeeService from "../../../../services/EmployeeService";
import EmployeeModalLayout from "../shared/EmployeeModalLayout";
import EmployeeModalFooter from "../shared/EmployeeModalFooter";

const DeleteEmployeeModal = ({ employee, onClose, onSuccess }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleDelete = async () => {
    setErrorMessage("");
    setIsDeleting(true);
    try {
      await EmployeeService.deleteEmployee(employee.employeeId);
      onSuccess();
      onClose();
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message || "Không thể xóa nhân viên."
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <EmployeeModalLayout title="Xóa nhân viên" onClose={onClose}>
      <div className="p-6 space-y-4">
        <div className="flex flex-col items-center text-center gap-3">
          <div className="p-3 rounded-full bg-red-50 text-red-500">
            <AlertTriangle size={28} />
          </div>
          <p className="text-sm text-gray-600">
            Bạn có chắc muốn xóa nhân viên{" "}
            <span className="font-bold text-gray-900">
              {employee.employeeName || "này"}
            </span>
            ? Hành động này không thể hoàn tác.
          </p>
        </div>

        {errorMessage && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </div>
        )}
      </div>

      <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t border-gray-100">
        <button
          type="button"
          onClick={onClose}
          disabled={isDeleting}
          className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-60"
        >
          Hủy
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={isDeleting}
          className="px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 transition-colors shadow-sm disabled:opacity-60"
        >
          {isDeleting ? "Đang xóa..." : "Xóa nhân viên"}
        </button>
      </div>
    </EmployeeModalLayout>
  );
};

export default DeleteEmployeeModal;
