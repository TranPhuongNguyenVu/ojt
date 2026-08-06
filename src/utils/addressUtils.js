export const buildFullAddress = (province, district, detailAddress) => {
  const parts = [];
  if (detailAddress?.trim()) parts.push(detailAddress.trim());
  if (district?.trim()) parts.push(district.trim());
  if (province?.trim()) parts.push(province.trim());
  return parts.join(", ");
};

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

  if (parts.length === 2) {
    return { province: parts[1], district: parts[0], detailAddress: "" };
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

  return errors;
};

export const applyAddressFieldChange = (formData, name, value) => {
  if (name === "province") {
    return { ...formData, province: value, district: "" };
  }
  return { ...formData, [name]: value };
};
