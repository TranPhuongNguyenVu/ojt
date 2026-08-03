import React, { useState } from "react";
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
import { applyAddressFieldChange, buildFullAddress } from "../../../../utils/addressUtils";

const AddEmployeeModal = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState(emptyEmployeeForm);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => applyAddressFieldChange(prev, name, value));
    setErrors((prev) => ({ ...prev, [name]: "", address: "" }));
    setErrorMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    const validationErrors = validateEmployeeForm(formData, "add");
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});

    const payload = {
      username: formData.username.trim(),
      password: formData.password,
      confirmPassword: formData.password,
      fullName: formData.fullName.trim(),
      email: formData.email.trim(),
      phoneNumber: formData.phoneNumber.trim(),
      identityCard: formData.identityCard.trim(),
      gender: formData.gender.trim(),
      dateOfBirth: formData.dateOfBirth || null,
      address: buildFullAddress(
        formData.province,
        formData.district,
        formData.detailAddress
      ),
    };

    setIsSubmitting(true);
    try {
      await EmployeeService.createEmployee(payload);
      onSuccess();
      onClose();
    } catch (error) {
      const serverMsg = getApiErrorMessage(error, "Không thể thêm nhân viên.");
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
    <EmployeeModalLayout title="Thêm nhân viên mới" onClose={onClose}>
      <form onSubmit={handleSubmit} noValidate>
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {errorMessage && (
            <div className="rounded-lg border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-950/40 px-4 py-3 text-sm text-red-700 dark:text-red-300">
              {errorMessage}
            </div>
          )}

          <EmployeeFormFields
            formData={formData}
            onChange={handleChange}
            mode="add"
            errors={errors}
          />
        </div>

        <EmployeeModalFooter
          onCancel={onClose}
          submitLabel="Thêm mới"
          isSubmitting={isSubmitting}
        />
      </form>
    </EmployeeModalLayout>
  );
};

export default AddEmployeeModal;
