import React, { useEffect, useState } from "react";
import EmployeeService from "../../../../services/EmployeeService";
import EmployeeModalLayout from "../shared/EmployeeModalLayout";
import EmployeeModalFooter from "../shared/EmployeeModalFooter";
import EmployeeFormFields from "../shared/EmployeeFormFields";
import { emptyEmployeeForm } from "../shared/employeeFormConstants";
import {
  getApiErrorMessage,
  mapServerErrorToField,
  validateEmployeeForm,
} from "../shared/employeeValidation";
import {
  applyAddressFieldChange,
  buildFullAddress,
  parseAddress,
} from "../../../../utils/addressUtils";

const EditEmployeeModal = ({ employeeId, onClose, onSuccess }) => {
  const [formData, setFormData] = useState(emptyEmployeeForm);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const loadEmployee = async () => {
      setIsLoading(true);
      setErrorMessage("");
      try {
        const response = await EmployeeService.getEmployeeById(employeeId);
        const emp = response.data.data;
        const parsedAddress = parseAddress(emp.address || "");
        setFormData({
          username: "",
          password: "",
          fullName: emp.employeeName || "",
          email: emp.email || "",
          phoneNumber: emp.phoneNumber || "",
          identityCard: emp.identityCard || "",
          gender: emp.gender || "Nam",
          dateOfBirth: emp.dateOfBirth || "",
          ...parsedAddress,
        });
      } catch (error) {
        setErrorMessage(
          getApiErrorMessage(error, "Không thể tải thông tin nhân viên.")
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadEmployee();
  }, [employeeId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => applyAddressFieldChange(prev, name, value));
    setErrors((prev) => ({ ...prev, [name]: "", address: "" }));
    setErrorMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    const validationErrors = validateEmployeeForm(formData, "edit");
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});

    const payload = {
      fullName: formData.fullName.trim(),
      email: formData.email.trim(),
      phoneNumber: formData.phoneNumber.trim(),
      identityCard: formData.identityCard.trim(),
      gender: formData.gender.trim(),
      dateOfBirth: formData.dateOfBirth || null,
      address:
        formData.province && formData.district && formData.detailAddress
          ? buildFullAddress(
              formData.province,
              formData.district,
              formData.detailAddress
            )
          : "",
    };

    if (formData.password) {
      payload.password = formData.password;
    }

    setIsSubmitting(true);
    try {
      await EmployeeService.updateEmployee(employeeId, payload);
      onSuccess();
      onClose();
    } catch (error) {
      const serverMsg = getApiErrorMessage(error, "Không thể cập nhật nhân viên.");
      const fieldError = mapServerErrorToField(serverMsg);
      if (fieldError) {
        setErrors((prev) => ({ ...prev, ...fieldError }));
      } else {
        setErrorMessage(serverMsg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <EmployeeModalLayout title="Chỉnh sửa nhân viên" onClose={onClose}>
      <form onSubmit={handleSubmit} noValidate>
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {errorMessage && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorMessage}
            </div>
          )}

          {isLoading ? (
            <p className="text-center text-sm text-gray-500 py-8">
              Đang tải thông tin...
            </p>
          ) : (
            <EmployeeFormFields
              formData={formData}
              onChange={handleChange}
              mode="edit"
              errors={errors}
            />
          )}
        </div>

        <EmployeeModalFooter
          onCancel={onClose}
          submitLabel="Lưu thay đổi"
          isSubmitting={isSubmitting}
          disabled={isLoading}
        />
      </form>
    </EmployeeModalLayout>
  );
};

export default EditEmployeeModal;
