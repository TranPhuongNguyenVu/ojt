export const buildFullAddress = (province, district, detailAddress) =>
  `${detailAddress.trim()}, ${district}, ${province}`;

export const parseAddress = (fullAddress) => {
  if (!fullAddress?.trim()) {
    return { province: "", district: "", detailAddress: "" };
  }

  const parts = fullAddress.split(",").map((part) => part.trim());
  if (parts.length >= 3) {
    const province = parts[parts.length - 1];
    const district = parts[parts.length - 2];
    const detailAddress = parts.slice(0, -2).join(", ");
    return { province, district, detailAddress };
  }

  return { province: "", district: "", detailAddress: fullAddress.trim() };
};

export const validateAddressFields = (formData, required = true) => {
  const errors = {};

  if (!required) return errors;

  if (!formData.province?.trim()) {
    errors.province = "Vui lòng chọn Tỉnh/Thành phố!";
  }
  if (!formData.district?.trim()) {
    errors.district = "Vui lòng chọn Quận/Huyện!";
  }
  if (!formData.detailAddress?.trim()) {
    errors.detailAddress = "Vui lòng nhập địa chỉ chi tiết!";
  }

  return errors;
};

export const applyAddressFieldChange = (formData, name, value) => {
  if (name === "province") {
    return { ...formData, province: value, district: "" };
  }
  return { ...formData, [name]: value };
};
