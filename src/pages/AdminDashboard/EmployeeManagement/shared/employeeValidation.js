import { validateAddressFields } from "../../../../utils/addressUtils";

const USERNAME_REGEX = /^[a-zA-Z0-9]+$/;
const FULL_NAME_REGEX = /^[\p{L}\s]+$/u;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^0\d{9}$/;
const IDENTITY_REGEX = /^\d{9}$|^\d{12}$/;

export const getApiErrorMessage = (error, fallback) =>
  error?.response?.data?.message || error?.message || fallback;

export const mapServerErrorToField = (serverMsg) => {
  if (!serverMsg) return null;

  if (
    serverMsg.includes("Tên đăng nhập đã được sử dụng") ||
    serverMsg.includes("Tên đăng nhập đã tồn tại") ||
    serverMsg.includes("already existed")
  ) {
    return { username: "Tên đăng nhập đã tồn tại!" };
  }
  if (
    serverMsg.includes("Email đã được sử dụng") ||
    serverMsg.includes("Email đã tồn tại")
  ) {
    return { email: "Email đã tồn tại!" };
  }
  if (
    serverMsg.includes("Số điện thoại đã được sử dụng") ||
    serverMsg.includes("Số điện thoại đã tồn tại")
  ) {
    return { phoneNumber: "Số điện thoại đã tồn tại!" };
  }
  if (
    serverMsg.includes("CMND/CCCD đã được sử dụng") ||
    serverMsg.includes("CMND/CCCD đã tồn tại")
  ) {
    return { identityCard: "CMND/CCCD đã tồn tại!" };
  }
  if (serverMsg.includes("Họ và tên chỉ được chứa")) {
    return { fullName: serverMsg };
  }
  if (serverMsg.includes("Tên đăng nhập chỉ được chứa")) {
    return { username: serverMsg };
  }
  if (serverMsg.includes("Email không hợp lệ")) {
    return { email: serverMsg };
  }
  if (serverMsg.includes("Số điện thoại phải")) {
    return { phoneNumber: serverMsg };
  }
  if (serverMsg.includes("CMND/CCCD phải")) {
    return { identityCard: serverMsg };
  }
  if (serverMsg.includes("Vui lòng nhập tài khoản") || serverMsg.includes("Tài khoản")) {
    return { username: serverMsg };
  }
  if (serverMsg.includes("mật khẩu") || serverMsg.includes("Mật khẩu")) {
    return { password: serverMsg };
  }
  if (serverMsg.includes("địa chỉ")) {
    return { address: serverMsg };
  }
  if (serverMsg.includes("ngày sinh")) {
    return { dateOfBirth: serverMsg };
  }
  if (serverMsg.includes("giới tính")) {
    return { gender: serverMsg };
  }
  return null;
};

export const validateEmployeeForm = (formData, mode = "add") => {
  const isAdd = mode === "add";
  const errorsObj = {};

  if (isAdd) {
    if (!formData.username?.trim()) {
      errorsObj.username = "Vui lòng nhập tên đăng nhập!";
    } else if (!USERNAME_REGEX.test(formData.username.trim())) {
      errorsObj.username =
        "Tên đăng nhập chỉ được chứa chữ cái và số, không chứa ký tự đặc biệt như @#$.";
    } else if (formData.username.trim().length > 28) {
      errorsObj.username = "Tài khoản tối đa 28 ký tự!";
    }

    if (!formData.password?.trim()) {
      errorsObj.password = "Vui lòng nhập mật khẩu!";
    } else if (formData.password.length > 28) {
      errorsObj.password = "Mật khẩu tối đa 28 ký tự!";
    }
  }

  if (!formData.fullName?.trim()) {
    errorsObj.fullName = "Vui lòng nhập họ và tên!";
  } else if (!FULL_NAME_REGEX.test(formData.fullName.trim())) {
    errorsObj.fullName =
      "Họ và tên chỉ được chứa chữ cái và khoảng trắng, không chứa ký tự đặc biệt như @#$.";
  } else if (formData.fullName.trim().length > 28) {
    errorsObj.fullName = "Tên nhân viên tối đa 28 ký tự!";
  }

  if (!formData.email?.trim()) {
    errorsObj.email = "Vui lòng nhập email!";
  } else if (!EMAIL_REGEX.test(formData.email.trim())) {
    errorsObj.email = "Email không đúng định dạng (ví dụ: email@example.com)!";
  } else if (formData.email.trim().length > 28) {
    errorsObj.email = "Email tối đa 28 ký tự!";
  }

  if (!formData.phoneNumber?.trim()) {
    errorsObj.phoneNumber = "Vui lòng nhập số điện thoại!";
  } else if (!PHONE_REGEX.test(formData.phoneNumber.trim())) {
    errorsObj.phoneNumber = "Số điện thoại phải bắt đầu bằng số 0 và có đúng 10 chữ số!";
  }

  if (!formData.identityCard?.trim()) {
    errorsObj.identityCard = "Vui lòng nhập số CMND/CCCD!";
  } else if (!IDENTITY_REGEX.test(formData.identityCard.trim())) {
    errorsObj.identityCard = "Số CMND/CCCD phải có đúng 9 hoặc 12 chữ số!";
  }

  if (isAdd) {
    if (!formData.dateOfBirth?.trim()) {
      errorsObj.dateOfBirth = "Vui lòng nhập ngày sinh!";
    } else {
      const dob = new Date(formData.dateOfBirth);
      const today = new Date();
      if (Number.isNaN(dob.getTime()) || dob > today) {
        errorsObj.dateOfBirth = "Ngày sinh không hợp lệ!";
      }
    }

    if (!formData.gender?.trim()) {
      errorsObj.gender = "Vui lòng chọn giới tính!";
    }

    Object.assign(errorsObj, validateAddressFields(formData, true));
  }

  return errorsObj;
};
