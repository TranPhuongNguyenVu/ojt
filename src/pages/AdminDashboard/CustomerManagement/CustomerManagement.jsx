import React, { useState, useEffect, useMemo } from 'react';
import { Edit, Trash2, Search, Eye, EyeOff, X, Lock, Unlock, User, Mail, Phone, CreditCard, Calendar, MapPin, Image, Key, UserPlus } from 'lucide-react';
import CustomerService from '../../../services/CustomerService.js';
import Pagination from '../../../components/Pagination';
import {
  applyAddressFieldChange,
  buildFullAddress,
  parseAddress,
  validateAddressFields,
} from '../../../utils/addressUtils';

const locationData = {
  "Hà Nội": [
    "Quận Ba Đình", "Quận Hoàn Kiếm", "Quận Tây Hồ", "Quận Long Biên", "Quận Cầu Giấy",
    "Quận Đống Đa", "Quận Hai Bà Trưng", "Quận Hoàng Mai", "Quận Thanh Xuân", "Huyện Đông Anh",
  ],
  "TP. Hồ Chí Minh": [
    "Quận 1", "Quận 3", "Quận 4", "Quận 5", "Quận 6", "Quận 7", "Quận 8", "Quận 10",
    "Quận 11", "Quận 12", "Quận Bình Thạnh", "Quận Tân Bình", "Quận Gò Vấp", "TP. Thủ Đức",
  ],
  "Đà Nẵng": [
    "Quận Hải Châu", "Quận Thanh Khê", "Quận Sơn Trà", "Quận Ngũ Hành Sơn", "Quận Liên Chiểu", "Quận Cẩm Lệ",
  ],
  "Cần Thơ": [
    "Quận Ninh Kiều", "Quận Bình Thủy", "Quận Cái Răng", "Quận Ô Môn", "Quận Thốt Nốt",
  ],
  "Hải Phòng": [
    "Quận Hồng Bàng", "Quận Ngô Quyền", "Quận Lê Chân", "Quận Hải An", "Quận Kiến An",
  ],
};

const maskIdentityCard = (id) => {
  if (!id) return "N/A";
  if (id.length <= 4) return "••••";
  return "•".repeat(id.length - 4) + id.slice(-4);
};

const CustomerManagement = () => {
  const [customers, setCustomers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [showIdentityCard, setShowIdentityCard] = useState(false);

  // Reset showIdentityCard when detail modal is closed
  useEffect(() => {
    if (!isDetailModalOpen) {
      setShowIdentityCard(false);
    }
  }, [isDetailModalOpen]);
  const [errors, setErrors] = useState({});
  const [addForm, setAddForm] = useState({
    username: '',
    fullName: '',
    email: '',
    phoneNumber: '',
    dateOfBirth: '',
    gender: 'Nam',
    identityCard: '',
    province: '',
    district: '',
    detailAddress: '',
  });
  const [editForm, setEditForm] = useState({
    memberId: '',
    username: '',
    fullName: '',
    email: '',
    phoneNumber: '',
    dateOfBirth: '',
    gender: '',
    identityCard: '',
    province: '',
    district: '',
    detailAddress: '',
    image: '',
  });

  // Vừa mở Component lên là tự động gọi API lấy dữ liệu ngay
  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setIsLoading(true);
      const response = await CustomerService.getCustomers();
      // Bóc tách mảng dữ liệu khách hàng từ API trả về
      setCustomers(response.data.data || []); 
      setIsLoading(false);
    } catch (error) {
      console.error("Lỗi khi tải danh sách:", error);
      setIsLoading(false);
    }
  };

  // Mở modal thêm thành viên mới
  const handleOpenAddModal = () => {
    setAddForm({
      username: '',
      fullName: '',
      email: '',
      phoneNumber: '',
      dateOfBirth: '',
      gender: 'Nam',
      identityCard: '',
      province: '',
      district: '',
      detailAddress: '',
    });
    setErrors({});
    setIsAddModalOpen(true);
  };

  // Submit thêm mới thành viên
  const handleAddCustomer = async (e) => {
    e.preventDefault();
    const errorsObj = {};

    // 1. Tên đăng nhập (username)
    if (!addForm.username || addForm.username.trim() === "") {
      errorsObj.username = "Vui lòng nhập tên đăng nhập!";
    } else {
      const usernameRegex = /^[a-zA-Z0-9]+$/;
      if (!usernameRegex.test(addForm.username)) {
        errorsObj.username = "Tên đăng nhập chỉ được phép chứa chữ cái và số (viết liền không dấu, không khoảng trắng)!";
      } else if (addForm.username.length < 5 || addForm.username.length > 20) {
        errorsObj.username = "Tên đăng nhập phải dài từ 5 đến 20 ký tự!";
      }
    }

    // 2. Họ và tên
    if (!addForm.fullName || addForm.fullName.trim() === "") {
      errorsObj.fullName = "Vui lòng nhập họ và tên!";
    } else {
      const fullNameRegex = /^[\p{L}\s]+$/u;
      if (!fullNameRegex.test(addForm.fullName.trim())) {
        errorsObj.fullName = "Họ và tên chỉ được chứa chữ cái và khoảng trắng!";
      }
    }

    // 3. Email
    if (!addForm.email || addForm.email.trim() === "") {
      errorsObj.email = "Vui lòng nhập email!";
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(addForm.email)) {
        errorsObj.email = "Email không đúng định dạng (ví dụ: email@example.com)!";
      }
    }

    // 4. Số điện thoại
    if (!addForm.phoneNumber || addForm.phoneNumber.trim() === "") {
      errorsObj.phoneNumber = "Vui lòng nhập số điện thoại!";
    } else {
      const phoneRegex = /^0\d{9}$/;
      if (!phoneRegex.test(addForm.phoneNumber)) {
        errorsObj.phoneNumber = "Số điện thoại phải bắt đầu bằng số 0 và có đúng 10 chữ số!";
      }
    }

    // 5. CMND / CCCD
    if (!addForm.identityCard || addForm.identityCard.trim() === "") {
      errorsObj.identityCard = "Vui lòng nhập số CMND/CCCD!";
    } else {
      const identityRegex = /^\d{9}$|^\d{12}$/;
      if (!identityRegex.test(addForm.identityCard)) {
        errorsObj.identityCard = "Số CMND/CCCD phải có đúng 9 hoặc 12 chữ số!";
      }
    }

    // 6. Ngày sinh
    if (!addForm.dateOfBirth || addForm.dateOfBirth.trim() === "") {
      errorsObj.dateOfBirth = "Vui lòng nhập ngày sinh!";
    } else {
      const dob = new Date(addForm.dateOfBirth);
      const today = new Date();
      let age = today.getFullYear() - dob.getFullYear();
      const monthDiff = today.getMonth() - dob.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
        age--;
      }
      if (isNaN(dob.getTime()) || dob > today) {
        errorsObj.dateOfBirth = "Ngày sinh không hợp lệ!";
      } else if (age < 18) {
        errorsObj.dateOfBirth = "Thành viên đăng ký phải từ 18 tuổi trở lên!";
      }
    }

    // 7. Giới tính
    if (!addForm.gender || addForm.gender.trim() === "") {
      errorsObj.gender = "Vui lòng chọn giới tính!";
    }

    // 8. Địa chỉ
    Object.assign(errorsObj, validateAddressFields(addForm, true));

    if (Object.keys(errorsObj).length > 0) {
      setErrors(errorsObj);
      return;
    }

    setErrors({});

    try {
      const submitData = {
        username: addForm.username.trim(),
        fullName: addForm.fullName.trim(),
        email: addForm.email.trim(),
        phoneNumber: addForm.phoneNumber.trim(),
        dateOfBirth: addForm.dateOfBirth,
        gender: addForm.gender.trim(),
        identityCard: addForm.identityCard.trim(),
        address: buildFullAddress(
          addForm.province,
          addForm.district,
          addForm.detailAddress
        ),
        image: null
      };

      await CustomerService.createCustomer(submitData);
      alert("Thêm mới thành viên thành công! Thông tin tài khoản đã được gửi qua email.");
      setIsAddModalOpen(false);
      fetchCustomers();
    } catch (error) {
      console.error("Lỗi khi thêm mới thành viên:", error);
      const serverMsg = error.response?.data?.message || "Lỗi khi thêm mới thành viên!";
      if (serverMsg.includes("Tên đăng nhập đã được sử dụng") || serverMsg.includes("Tên đăng nhập đã tồn tại")) {
        setErrors((prev) => ({ ...prev, username: "Tên đăng nhập đã tồn tại!" }));
      } else if (serverMsg.includes("Email đã được sử dụng") || serverMsg.includes("Email đã tồn tại")) {
        setErrors((prev) => ({ ...prev, email: "Email đã tồn tại!" }));
      } else if (serverMsg.includes("Số điện thoại đã được sử dụng") || serverMsg.includes("Số điện thoại đã tồn tại")) {
        setErrors((prev) => ({ ...prev, phoneNumber: "Số điện thoại đã tồn tại!" }));
      } else if (serverMsg.includes("CMND/CCCD đã được sử dụng") || serverMsg.includes("CMND/CCCD đã tồn tại")) {
        setErrors((prev) => ({ ...prev, identityCard: "CMND/CCCD đã tồn tại!" }));
      } else {
        alert(serverMsg);
      }
    }
  };

  // Mở modal sửa thông tin
  const handleOpenEditModal = (user) => {
    const parsedAddress = parseAddress(user.address || '');
    setEditForm({
      memberId: user.memberId,
      username: user.username,
      fullName: user.fullName || '',
      email: user.email || '',
      phoneNumber: user.phoneNumber || '',
      dateOfBirth: user.dateOfBirth || '',
      gender: user.gender || '',
      identityCard: user.identityCard || '',
      ...parsedAddress,
      image: user.image || '',
    });
    setErrors({});
    setIsEditModalOpen(true);
  };

  // Submit cập nhật thông tin
  const handleUpdateCustomer = async (e) => {
    e.preventDefault();
    const errorsObj = {};

    // 1. Họ và tên
    if (!editForm.fullName || editForm.fullName.trim() === "") {
      errorsObj.fullName = "Vui lòng nhập họ và tên!";
    } else {
      const fullNameRegex = /^[\p{L}\s]+$/u;
      if (!fullNameRegex.test(editForm.fullName.trim())) {
        errorsObj.fullName = "Họ và tên chỉ được chứa chữ cái và khoảng trắng!";
      }
    }

    // 2. Email
    if (!editForm.email || editForm.email.trim() === "") {
      errorsObj.email = "Vui lòng nhập email!";
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(editForm.email)) {
        errorsObj.email = "Email không đúng định dạng (ví dụ: email@example.com)!";
      }
    }

    // 3. Số điện thoại
    if (!editForm.phoneNumber || editForm.phoneNumber.trim() === "") {
      errorsObj.phoneNumber = "Vui lòng nhập số điện thoại!";
    } else {
      const phoneRegex = /^0\d{9}$/;
      if (!phoneRegex.test(editForm.phoneNumber)) {
        errorsObj.phoneNumber = "Số điện thoại phải bắt đầu bằng số 0 và có đúng 10 chữ số!";
      }
    }

    // 4. CMND / CCCD
    if (!editForm.identityCard || editForm.identityCard.trim() === "") {
      errorsObj.identityCard = "Vui lòng nhập số CMND/CCCD!";
    } else {
      const identityRegex = /^\d{9}$|^\d{12}$/;
      if (!identityRegex.test(editForm.identityCard)) {
        errorsObj.identityCard = "Số CMND/CCCD phải có đúng 9 hoặc 12 chữ số!";
      }
    }

    // 5. Ngày sinh
    if (!editForm.dateOfBirth || editForm.dateOfBirth.trim() === "") {
      errorsObj.dateOfBirth = "Vui lòng nhập ngày sinh!";
    } else {
      const dob = new Date(editForm.dateOfBirth);
      const today = new Date();
      let age = today.getFullYear() - dob.getFullYear();
      const monthDiff = today.getMonth() - dob.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
        age--;
      }
      if (isNaN(dob.getTime()) || dob > today) {
        errorsObj.dateOfBirth = "Ngày sinh không hợp lệ!";
      } else if (age < 18) {
        errorsObj.dateOfBirth = "Thành viên đăng ký phải từ 18 tuổi trở lên!";
      }
    }

    // 6. Giới tính
    if (!editForm.gender || editForm.gender.trim() === "") {
      errorsObj.gender = "Vui lòng chọn giới tính!";
    }

    // 7. Địa chỉ
    Object.assign(errorsObj, validateAddressFields(editForm, true));

    if (Object.keys(errorsObj).length > 0) {
      setErrors(errorsObj);
      return;
    }

    setErrors({});

    try {
      const { memberId, province, district, detailAddress, ...updateData } = editForm;
      updateData.fullName = updateData.fullName.trim();
      updateData.email = updateData.email.trim();
      updateData.phoneNumber = updateData.phoneNumber.trim();
      updateData.identityCard = updateData.identityCard.trim();
      updateData.address = buildFullAddress(province, district, detailAddress);
      if (updateData.gender) updateData.gender = updateData.gender.trim();

      await CustomerService.updateCustomer(memberId, updateData);
      alert("Cập nhật thông tin thành viên thành công!");
      setIsEditModalOpen(false);
      fetchCustomers();
    } catch (error) {
      console.error("Lỗi khi cập nhật thông tin:", error);
      const serverMsg = error.response?.data?.message || "Lỗi khi cập nhật thông tin!";
      if (serverMsg.includes("Email đã được sử dụng") || serverMsg.includes("Email đã tồn tại")) {
        setErrors((prev) => ({ ...prev, email: "Email đã được sử dụng bởi tài khoản khác." }));
      } else if (serverMsg.includes("Số điện thoại đã được sử dụng") || serverMsg.includes("Số điện thoại đã tồn tại")) {
        setErrors((prev) => ({ ...prev, phoneNumber: "Số điện thoại đã được sử dụng bởi tài khoản khác." }));
      } else if (serverMsg.includes("CMND/CCCD đã được sử dụng") || serverMsg.includes("CMND/CCCD đã tồn tại")) {
        setErrors((prev) => ({ ...prev, identityCard: "CMND/CCCD đã được sử dụng bởi tài khoản khác." }));
      } else {
        alert(serverMsg);
      }
    }
  };

  // Đặt lại mật khẩu ngẫu nhiên và gửi mail
  const handleResetPassword = async (memberId, username) => {
    if (window.confirm(`Bạn có chắc chắn muốn ĐẶT LẠI MẬT KHẨU ngẫu nhiên cho tài khoản ${username}? Mật khẩu mới sẽ được gửi thẳng về email của khách hàng!`)) {
      try {
        await CustomerService.resetMemberPassword(memberId);
        alert(`Đã đặt lại mật khẩu ngẫu nhiên cho ${username} và gửi email thành công!`);
      } catch (error) {
        console.error("Lỗi khi reset mật khẩu:", error);
        alert(error.response?.data?.message || "Lỗi khi reset mật khẩu!");
      }
    }
  };

  // Khóa tài khoản
  const handleLock = async (memberId, username) => {
    if (window.confirm(`Bạn có chắc chắn muốn KHÓA tài khoản của ${username}?`)) {
      try {
        await CustomerService.lockCustomer(memberId);
        alert(`Đã khóa tài khoản ${username} thành công!`);
        fetchCustomers();
      } catch (error) {
        console.error("Lỗi khi khóa tài khoản:", error);
        alert(error.response?.data?.message || "Lỗi khi khóa tài khoản!");
      }
    }
  };

  // Mở khóa tài khoản
  const handleUnlock = async (memberId, username) => {
    if (window.confirm(`Bạn có chắc chắn muốn MỞ KHÓA tài khoản của ${username}?`)) {
      try {
        await CustomerService.unlockCustomer(memberId);
        alert(`Đã mở khóa tài khoản ${username} thành công!`);
        fetchCustomers();
      } catch (error) {
        console.error("Lỗi khi mở khóa tài khoản:", error);
        alert(error.response?.data?.message || "Lỗi khi mở khóa tài khoản!");
      }
    }
  };

  // Xóa mềm khách hàng
  const handleDelete = async (memberId, username) => {
    if (window.confirm(`Bạn có chắc chắn muốn XÓA MỀM tài khoản của ${username}? Tài khoản sẽ chuyển sang trạng thái đã xóa mềm và không thể đăng nhập.`)) {
      try {
        await CustomerService.deleteCustomer(memberId);
        alert(`Đã xóa mềm tài khoản ${username} thành công!`);
        fetchCustomers();
      } catch (error) {
        console.error("Lỗi khi xóa mềm tài khoản:", error);
        alert(error.response?.data?.message || "Lỗi khi xóa mềm tài khoản!");
      }
    }
  };

  // Lọc danh sách khách hàng tại client
  const filteredCustomers = customers.filter(c => 
    (c.username && c.username.toLowerCase().includes(searchKeyword.toLowerCase())) ||
    (c.fullName && c.fullName.toLowerCase().includes(searchKeyword.toLowerCase())) ||
    (c.email && c.email.toLowerCase().includes(searchKeyword.toLowerCase())) ||
    (c.phoneNumber && c.phoneNumber.includes(searchKeyword))
  );

  const totalPages = Math.max(1, Math.ceil(filteredCustomers.length / PAGE_SIZE));
  const paginatedCustomers = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredCustomers.slice(start, start + PAGE_SIZE);
  }, [filteredCustomers, currentPage]);

  // Reset page khi thay đổi từ khóa tìm kiếm
  useEffect(() => {
    setCurrentPage(1);
  }, [searchKeyword]);

  // Điều chỉnh currentPage nếu vượt quá totalPages
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  return (
    <div className="flex-1 flex flex-col h-full bg-gray-50 dark:bg-gray-950 font-sans -m-8 md:-m-10 transition-colors duration-300">

      {/* Header của phần Quản lý */}
      <header className="h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-8">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">Quản lý Khách hàng (Members)</h2>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Tìm kiếm tài khoản..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="bg-gray-100 dark:bg-gray-800/60 dark:text-white text-sm rounded-full pl-10 pr-4 py-2 focus:outline-none focus:ring-1 focus:ring-gray-300 dark:focus:ring-gray-600 w-64 transition-all"
            />
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
          </div>
          <button 
            type="button"
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 px-4 py-2 bg-[#C00000] text-white text-sm font-bold rounded-lg hover:bg-[#a00000] active:scale-[0.98] transition-all shadow-md shadow-red-900/10"
          >
            <UserPlus size={16} />
            Thêm thành viên
          </button>
        </div>
      </header>

      {/* Nội dung Bảng */}
      <main className="flex-1 overflow-y-auto p-8">
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] table-fixed text-left border-collapse">
            <colgroup>
              <col className="w-[14%]" />
              <col className="w-[10%]" />
              <col className="w-[16%]" />
              <col className="w-[20%]" />
              <col className="w-[12%]" />
              <col className="w-[140px]" />
              <col className="w-[180px]" />
            </colgroup>
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800/60 border-b border-gray-200 dark:border-gray-800 text-xs text-gray-500 dark:text-gray-400 font-bold">
                <th className="px-6 py-4 whitespace-nowrap">Tài khoản</th>
                <th className="px-6 py-4 whitespace-nowrap">Ảnh đại diện</th>
                <th className="px-6 py-4 whitespace-nowrap">Họ và tên</th>
                <th className="px-6 py-4 whitespace-nowrap">Email</th>
                <th className="px-6 py-4 whitespace-nowrap">Số điện thoại</th>
                <th className="px-6 py-4 whitespace-nowrap">Trạng thái</th>
                <th className="px-6 py-4 text-center whitespace-nowrap">Thao tác</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {isLoading ? (
                // Đang tải dữ liệu
                <tr>
                  <td colSpan="7" className="px-6 py-10 text-center text-sm text-gray-500 dark:text-gray-400">Đang tải dữ liệu, vui lòng chờ...</td>
                </tr>
              ) : filteredCustomers.length === 0 ? (
                // Báo rỗng hoặc báo không tìm thấy từ khóa
                <tr>
                  <td colSpan="7" className="px-6 py-16 text-center text-[#C00000] font-black text-2xl tracking-widest uppercase">
                    {searchKeyword ? "Không tìm thấy kết quả!" : "Empty list!"}
                  </td>
                </tr>
              ) : (
                // Render danh sách (AC-01)
                paginatedCustomers.map((user, index) => (
                  <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-bold text-gray-900 dark:text-white text-sm">{user.username}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 overflow-hidden flex items-center justify-center text-gray-600 dark:text-gray-300 font-bold text-sm">
                        {user.image ? (
                          <img src={user.image} alt={user.fullName} className="h-full w-full object-cover" />
                        ) : (
                          user.fullName ? user.fullName.charAt(0).toUpperCase() : "?"
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">{user.fullName || "Chưa cập nhật"}</td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">{user.email || "N/A"}</td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">{user.phoneNumber || "N/A"}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.status === 1
                        ? <span className="inline-flex min-w-[108px] justify-center px-2.5 py-1 text-[10px] uppercase font-bold tracking-wider whitespace-nowrap text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-950/40 rounded-full">Hoạt động</span>
                        : user.status === 2
                        ? <span className="inline-flex min-w-[108px] justify-center px-2.5 py-1 text-[10px] uppercase font-bold tracking-wider whitespace-nowrap text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-950/40 rounded-full">Đã khóa</span>
                        : <span className="inline-flex min-w-[108px] justify-center px-2.5 py-1 text-[10px] uppercase font-bold tracking-wider whitespace-nowrap text-yellow-700 dark:text-yellow-300 bg-yellow-100 dark:bg-yellow-950/40 rounded-full">Chưa xác minh</span>
                      }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex justify-center items-center gap-3">
                      {/* Xem chi tiết */}
                      <button
                        onClick={() => { setSelectedCustomer(user); setIsDetailModalOpen(true); }}
                        className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 p-1.5 bg-gray-50 dark:bg-gray-800/60 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
                        title="Xem chi tiết"
                      >
                        <Eye size={16} />
                      </button>

                      {/* AC-04: Nút Edit */}
                      <button
                        onClick={() => handleOpenEditModal(user)}
                        className="text-blue-500 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 p-1.5 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-md transition-colors"
                        title="Chỉnh sửa"
                      >
                        <Edit size={16} />
                      </button>

                      {/* Nút Khóa / Mở khóa — giữ slot trống khi chưa xác minh để cột không lệch */}
                      {user.status === 1 ? (
                        <button
                          onClick={() => handleLock(user.memberId, user.username)}
                          className="text-amber-500 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 p-1.5 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/50 rounded-md transition-colors"
                          title="Khóa tài khoản"
                        >
                          <Lock size={16} />
                        </button>
                      ) : user.status === 2 ? (
                        <button
                          onClick={() => handleUnlock(user.memberId, user.username)}
                          className="text-green-500 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 p-1.5 bg-green-50 dark:bg-green-950/40 hover:bg-green-100 dark:hover:bg-green-900/50 rounded-md transition-colors"
                          title="Mở khóa tài khoản"
                        >
                          <Unlock size={16} />
                        </button>
                      ) : (
                        <span className="invisible p-1.5 rounded-md pointer-events-none" aria-hidden="true">
                          <Lock size={16} />
                        </span>
                      )}

                      {/* Nút Xóa vĩnh viễn */}
                      <button
                        onClick={() => handleDelete(user.memberId, user.username)}
                        className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 p-1.5 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-md transition-colors"
                        title="Xóa vĩnh viễn"
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

          {!isLoading && filteredCustomers.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredCustomers.length}
              pageSize={PAGE_SIZE}
              onPageChange={setCurrentPage}
              itemLabel="khách hàng"
            />
          )}

        </div>
      </main>

      {/* Modal Chi tiết Khách hàng (Detail Modal) */}
      {isDetailModalOpen && selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 max-w-md w-full overflow-hidden transition-all transform scale-100">
            {/* Header Modal */}
            <div className="bg-gray-950 dark:bg-black text-white px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-bold">Chi tiết khách hàng thành viên</h3>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Nội dung Modal */}
            <div className="p-6 space-y-6">
              {/* Profile Image & Basic Info */}
              <div className="flex items-center space-x-4">
                <div className="h-16 w-16 rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 overflow-hidden flex items-center justify-center text-gray-400 dark:text-gray-500 font-bold text-xl">
                  {selectedCustomer.image ? (
                    <img src={selectedCustomer.image} alt={selectedCustomer.fullName} className="h-full w-full object-cover" />
                  ) : (
                    selectedCustomer.fullName ? selectedCustomer.fullName.charAt(0).toUpperCase() : "?"
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 dark:text-white text-lg">{selectedCustomer.fullName || "Chưa cập nhật"}</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{selectedCustomer.username}</p>
                </div>
              </div>

              {/* Chi tiết thông tin */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-400 dark:text-gray-500 text-xs uppercase font-bold tracking-wider">Email</span>
                  <p className="font-semibold text-gray-700 dark:text-gray-300 mt-0.5 break-all">{selectedCustomer.email || "N/A"}</p>
                </div>
                <div>
                  <span className="text-gray-400 dark:text-gray-500 text-xs uppercase font-bold tracking-wider">Số điện thoại</span>
                  <p className="font-semibold text-gray-700 dark:text-gray-300 mt-0.5">{selectedCustomer.phoneNumber || "N/A"}</p>
                </div>
                <div>
                  <span className="text-gray-400 dark:text-gray-500 text-xs uppercase font-bold tracking-wider">CMND / CCCD</span>
                  <div className="flex items-center space-x-2 mt-0.5">
                    <p className="font-semibold text-gray-700 dark:text-gray-300">
                      {selectedCustomer.identityCard
                        ? (showIdentityCard ? selectedCustomer.identityCard : maskIdentityCard(selectedCustomer.identityCard))
                        : "N/A"}
                    </p>
                    {selectedCustomer.identityCard && (
                      <button
                        type="button"
                        onClick={() => setShowIdentityCard(!showIdentityCard)}
                        className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                        title={showIdentityCard ? "Ẩn số CCCD" : "Hiển thị số CCCD"}
                      >
                        {showIdentityCard ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    )}
                  </div>
                </div>
                <div>
                  <span className="text-gray-400 dark:text-gray-500 text-xs uppercase font-bold tracking-wider">Ngày sinh</span>
                  <p className="font-semibold text-gray-700 dark:text-gray-300 mt-0.5">{selectedCustomer.dateOfBirth || "N/A"}</p>
                </div>
                <div>
                  <span className="text-gray-400 dark:text-gray-500 text-xs uppercase font-bold tracking-wider">Giới tính</span>
                  <p className="font-semibold text-gray-700 dark:text-gray-300 mt-0.5">{selectedCustomer.gender || "Chưa cập nhật"}</p>
                </div>
                <div>
                  <span className="text-gray-400 dark:text-gray-500 text-xs uppercase font-bold tracking-wider">Điểm tích lũy</span>
                  <p className="font-semibold text-yellow-600 dark:text-yellow-400 mt-0.5">{selectedCustomer.score || 0} điểm</p>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-400 dark:text-gray-500 text-xs uppercase font-bold tracking-wider">Địa chỉ</span>
                  <p className="font-semibold text-gray-700 dark:text-gray-300 mt-0.5">{selectedCustomer.address || "N/A"}</p>
                </div>
                <div>
                  <span className="text-gray-400 dark:text-gray-500 text-xs uppercase font-bold tracking-wider">Quyền (Role)</span>
                  <p className="font-semibold text-gray-700 dark:text-gray-300 mt-0.5">
                    {selectedCustomer.roleId === 2 ? "Member" : "Role " + (selectedCustomer.roleId || 2)}
                  </p>
                </div>
                <div>
                  <span className="text-gray-400 dark:text-gray-500 text-xs uppercase font-bold tracking-wider">Trạng thái</span>
                  <div className="mt-1">
                    {selectedCustomer.status === 1 ? (
                      <span className="inline-block px-2.5 py-1 text-[10px] uppercase font-bold tracking-wider whitespace-nowrap text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-950/40 rounded-full">Hoạt động</span>
                    ) : selectedCustomer.status === 2 ? (
                      <span className="inline-block px-2.5 py-1 text-[10px] uppercase font-bold tracking-wider whitespace-nowrap text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-950/40 rounded-full">Đã khóa</span>
                    ) : (
                      <span className="inline-block px-2.5 py-1 text-[10px] uppercase font-bold tracking-wider whitespace-nowrap text-yellow-700 dark:text-yellow-300 bg-yellow-100 dark:bg-yellow-950/40 rounded-full">Chưa xác minh</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Modal */}
            <div className="bg-gray-50 dark:bg-gray-800/60 px-6 py-4 flex justify-end">
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="px-4 py-2 bg-gray-900 dark:bg-gray-700 text-white text-sm font-semibold rounded-lg hover:bg-gray-800 dark:hover:bg-gray-600 transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Chỉnh sửa Khách hàng (Edit Modal) */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 max-w-3xl w-full overflow-hidden my-8">
            {/* Header Modal */}
            <div className="bg-blue-600 text-white px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-bold">Chỉnh sửa thông tin thành viên</h3>
              <button 
                type="button"
                onClick={() => setIsEditModalOpen(false)} 
                className="text-blue-200 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Form Modal */}
            <form onSubmit={handleUpdateCustomer}>
              <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-left">
                  
                  {/* Tên tài khoản (Read-only) */}
                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                      Tên đăng nhập
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
                        <User size={16} />
                      </span>
                      <input
                        type="text"
                        value={editForm.username}
                        disabled
                        className="block w-full rounded-lg border border-gray-200 dark:border-gray-800 pl-10 pr-3 py-2 text-sm bg-gray-50 dark:bg-gray-800/60 text-gray-400 dark:text-gray-500 cursor-not-allowed"
                      />
                    </div>
                  </div>

                  {/* Số điện thoại */}
                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                      Số điện thoại <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
                        <Phone size={16} />
                      </span>
                      <input 
                        type="text" 
                        required
                        placeholder="0901234567"
                        value={editForm.phoneNumber} 
                        onChange={(e) => {
                          setEditForm({ ...editForm, phoneNumber: e.target.value });
                          setErrors((prev) => ({ ...prev, phoneNumber: "" }));
                        }}
                        className="block w-full rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800/60 dark:text-white pl-10 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm"
                      />
                    </div>
                    {errors.phoneNumber && <span className="text-[#C00000] text-xs font-semibold mt-1 block">{errors.phoneNumber}</span>}
                  </div>

                  {/* Họ và Tên */}
                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                      Họ và Tên <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
                        <User size={16} />
                      </span>
                      <input 
                        type="text" 
                        required
                        placeholder="Nguyễn Văn A"
                        value={editForm.fullName} 
                        onChange={(e) => {
                          setEditForm({ ...editForm, fullName: e.target.value });
                          setErrors((prev) => ({ ...prev, fullName: "" }));
                        }}
                        className="block w-full rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800/60 dark:text-white pl-10 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm"
                      />
                    </div>
                    {errors.fullName && <span className="text-[#C00000] text-xs font-semibold mt-1 block">{errors.fullName}</span>}
                  </div>

                  {/* CMND/CCCD */}
                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                      CMND / CCCD <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
                        <CreditCard size={16} />
                      </span>
                      <input 
                        type="text" 
                        required
                        placeholder="Nhập số CCCD..."
                        value={editForm.identityCard} 
                        onChange={(e) => {
                          setEditForm({ ...editForm, identityCard: e.target.value });
                          setErrors((prev) => ({ ...prev, identityCard: "" }));
                        }}
                        className="block w-full rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800/60 dark:text-white pl-10 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm"
                      />
                    </div>
                    {errors.identityCard && <span className="text-[#C00000] text-xs font-semibold mt-1 block">{errors.identityCard}</span>}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
                        <Mail size={16} />
                      </span>
                      <input 
                        type="email" 
                        required
                        placeholder="email@example.com"
                        value={editForm.email} 
                        onChange={(e) => {
                          setEditForm({ ...editForm, email: e.target.value });
                          setErrors((prev) => ({ ...prev, email: "" }));
                        }}
                        className="block w-full rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800/60 dark:text-white pl-10 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm"
                      />
                    </div>
                    {errors.email && <span className="text-[#C00000] text-xs font-semibold mt-1 block">{errors.email}</span>}
                  </div>

                  {/* Ngày sinh */}
                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                      Ngày sinh <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
                        <Calendar size={16} />
                      </span>
                      <input 
                        type="date" 
                        required
                        value={editForm.dateOfBirth} 
                        onChange={(e) => {
                          setEditForm({ ...editForm, dateOfBirth: e.target.value });
                          setErrors((prev) => ({ ...prev, dateOfBirth: "" }));
                        }}
                        className="block w-full rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800/60 dark:text-white pl-10 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm"
                      />
                    </div>
                    {errors.dateOfBirth && <span className="text-[#C00000] text-xs font-semibold mt-1 block">{errors.dateOfBirth}</span>}
                  </div>


                  {/* Giới tính */}
                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                      Giới tính <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none">
                        <User size={16} />
                      </span>
                      <select 
                        required
                        value={editForm.gender} 
                        onChange={(e) => {
                          setEditForm({ ...editForm, gender: e.target.value });
                          setErrors((prev) => ({ ...prev, gender: "" }));
                        }}
                        className="block w-full rounded-lg border border-gray-200 dark:border-gray-700 pl-10 pr-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm bg-white dark:bg-gray-800/60 dark:text-white"
                      >
                        <option value="">-- Chọn giới tính --</option>
                        <option value="Nam">Nam</option>
                        <option value="Nữ">Nữ</option>
                        <option value="Khác">Khác</option>
                      </select>
                    </div>
                    {errors.gender && <span className="text-[#C00000] text-xs font-semibold mt-1 block">{errors.gender}</span>}
                  </div>

                  {/* Phần Reset mật khẩu */}
                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Mật khẩu</label>
                    <div className="relative">
                      <button 
                        type="button"
                        onClick={() => handleResetPassword(editForm.memberId, editForm.username)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-[9px] bg-yellow-50 dark:bg-yellow-950/40 hover:bg-yellow-100 dark:hover:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300 border border-yellow-300 dark:border-yellow-500/30 rounded-lg text-sm font-bold shadow-sm transition-colors"
                        title="Đặt lại mật khẩu ngẫu nhiên mới và gửi email cho khách hàng"
                      >
                        <Key size={16} />
                        Reset & Gửi Mail
                      </button>
                    </div>
                  </div>

                  <div className="md:col-span-2 space-y-4 text-left">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                          Tỉnh / Thành phố <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
                            <MapPin size={16} />
                          </span>
                          <select
                            name="province"
                            required
                            value={editForm.province}
                            onChange={(e) => {
                              const { name, value } = e.target;
                              setEditForm((prev) => applyAddressFieldChange(prev, name, value));
                              setErrors((prev) => ({ ...prev, province: '', district: '', detailAddress: '', address: '' }));
                            }}
                            className="block w-full rounded-lg border border-gray-200 dark:border-gray-700 pl-10 pr-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm bg-white dark:bg-gray-800/60 dark:text-white"
                          >
                            <option value="">Chọn Tỉnh/Thành...</option>
                            {Object.keys(locationData).map((item) => (
                              <option key={item} value={item}>{item}</option>
                            ))}
                          </select>
                        </div>
                        {errors.province && <span className="text-[#C00000] text-xs font-semibold mt-1 block">{errors.province}</span>}
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                          Quận / Huyện <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
                            <MapPin size={16} />
                          </span>
                          <select
                            name="district"
                            required
                            value={editForm.district}
                            onChange={(e) => {
                              const { name, value } = e.target;
                              setEditForm((prev) => applyAddressFieldChange(prev, name, value));
                              setErrors((prev) => ({ ...prev, [name]: '', address: '' }));
                            }}
                            disabled={!editForm.province}
                            className="block w-full rounded-lg border border-gray-200 dark:border-gray-700 pl-10 pr-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm bg-white dark:bg-gray-800/60 dark:text-white disabled:bg-gray-50 dark:disabled:bg-gray-800/40 disabled:cursor-not-allowed"
                          >
                            <option value="">Chọn Quận/Huyện...</option>
                            {editForm.province && locationData[editForm.province]?.map((item) => (
                              <option key={item} value={item}>{item}</option>
                            ))}
                          </select>
                        </div>
                        {errors.district && <span className="text-[#C00000] text-xs font-semibold mt-1 block">{errors.district}</span>}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                        Địa chỉ chi tiết
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
                          <MapPin size={16} />
                        </span>
                        <input
                          type="text"
                          name="detailAddress"
                          placeholder="Số nhà, tên đường, phường/xã... (có thể cập nhật sau)"
                          value={editForm.detailAddress}
                          onChange={(e) => {
                            const { name, value } = e.target;
                            setEditForm((prev) => applyAddressFieldChange(prev, name, value));
                            setErrors((prev) => ({ ...prev, [name]: '', address: '' }));
                          }}
                          className="block w-full rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800/60 dark:text-white pl-10 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm"
                        />
                      </div>
                      {(errors.detailAddress || errors.address) && (
                        <span className="text-[#C00000] text-xs font-semibold mt-1 block">
                          {errors.detailAddress || errors.address}
                        </span>
                      )}
                    </div>
                  </div>

                </div>
              </div>

              {/* Footer Modal */}
              <div className="bg-gray-50 dark:bg-gray-800/60 px-6 py-4 flex justify-end space-x-3 border-t border-gray-100 dark:border-gray-800">
                <button 
                  type="button"
                  onClick={() => setIsEditModalOpen(false)} 
                  className="px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm font-semibold rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors shadow-sm"
                >
                  Hủy
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                >
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Thêm mới Khách hàng (Add Modal) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 max-w-3xl w-full overflow-hidden my-8">
            {/* Header Modal */}
            <div className="bg-[#C00000] text-white px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-bold">Thêm khách hàng thành viên mới</h3>
              <button 
                type="button"
                onClick={() => setIsAddModalOpen(false)} 
                className="text-red-200 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Form Modal */}
            <form onSubmit={handleAddCustomer}>
              <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-left">
                  
                  {/* Tên tài khoản */}
                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                      Tên đăng nhập <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
                        <User size={16} />
                      </span>
                      <input 
                        type="text" 
                        required
                        placeholder="Chữ thường viết liền, 5-20 ký tự..."
                        value={addForm.username} 
                        onChange={(e) => {
                          setAddForm({ ...addForm, username: e.target.value });
                          setErrors((prev) => ({ ...prev, username: "" }));
                        }}
                        className="block w-full rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800/60 dark:text-white pl-10 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all shadow-sm"
                      />
                    </div>
                    {errors.username && <span className="text-[#C00000] text-xs font-semibold mt-1 block">{errors.username}</span>}
                  </div>

                  {/* Số điện thoại */}
                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                      Số điện thoại <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
                        <Phone size={16} />
                      </span>
                      <input 
                        type="text" 
                        required
                        placeholder="0901234567"
                        value={addForm.phoneNumber} 
                        onChange={(e) => {
                          setAddForm({ ...addForm, phoneNumber: e.target.value });
                          setErrors((prev) => ({ ...prev, phoneNumber: "" }));
                        }}
                        className="block w-full rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800/60 dark:text-white pl-10 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all shadow-sm"
                      />
                    </div>
                    {errors.phoneNumber && <span className="text-[#C00000] text-xs font-semibold mt-1 block">{errors.phoneNumber}</span>}
                  </div>

                  {/* Họ và Tên */}
                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                      Họ và Tên <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
                        <User size={16} />
                      </span>
                      <input 
                        type="text" 
                        required
                        placeholder="Nguyễn Văn A"
                        value={addForm.fullName} 
                        onChange={(e) => {
                          setAddForm({ ...addForm, fullName: e.target.value });
                          setErrors((prev) => ({ ...prev, fullName: "" }));
                        }}
                        className="block w-full rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800/60 dark:text-white pl-10 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all shadow-sm"
                      />
                    </div>
                    {errors.fullName && <span className="text-[#C00000] text-xs font-semibold mt-1 block">{errors.fullName}</span>}
                  </div>

                  {/* CMND/CCCD */}
                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                      CMND / CCCD <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
                        <CreditCard size={16} />
                      </span>
                      <input 
                        type="text" 
                        required
                        placeholder="Nhập số CMND/CCCD..."
                        value={addForm.identityCard} 
                        onChange={(e) => {
                          setAddForm({ ...addForm, identityCard: e.target.value });
                          setErrors((prev) => ({ ...prev, identityCard: "" }));
                        }}
                        className="block w-full rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800/60 dark:text-white pl-10 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all shadow-sm"
                      />
                    </div>
                    {errors.identityCard && <span className="text-[#C00000] text-xs font-semibold mt-1 block">{errors.identityCard}</span>}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
                        <Mail size={16} />
                      </span>
                      <input 
                        type="email" 
                        required
                        placeholder="email@example.com"
                        value={addForm.email} 
                        onChange={(e) => {
                          setAddForm({ ...addForm, email: e.target.value });
                          setErrors((prev) => ({ ...prev, email: "" }));
                        }}
                        className="block w-full rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800/60 dark:text-white pl-10 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all shadow-sm"
                      />
                    </div>
                    {errors.email && <span className="text-[#C00000] text-xs font-semibold mt-1 block">{errors.email}</span>}
                  </div>

                  {/* Ngày sinh */}
                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                      Ngày sinh <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
                        <Calendar size={16} />
                      </span>
                      <input 
                        type="date" 
                        required
                        value={addForm.dateOfBirth} 
                        onChange={(e) => {
                          setAddForm({ ...addForm, dateOfBirth: e.target.value });
                          setErrors((prev) => ({ ...prev, dateOfBirth: "" }));
                        }}
                        className="block w-full rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800/60 dark:text-white pl-10 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all shadow-sm"
                      />
                    </div>
                    {errors.dateOfBirth && <span className="text-[#C00000] text-xs font-semibold mt-1 block">{errors.dateOfBirth}</span>}
                  </div>

                  {/* Giới tính */}
                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                      Giới tính <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none">
                        <User size={16} />
                      </span>
                      <select 
                        required
                        value={addForm.gender} 
                        onChange={(e) => {
                          setAddForm({ ...addForm, gender: e.target.value });
                          setErrors((prev) => ({ ...prev, gender: "" }));
                        }}
                        className="block w-full rounded-lg border border-gray-200 dark:border-gray-700 pl-10 pr-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all shadow-sm bg-white dark:bg-gray-800/60 dark:text-white"
                      >
                        <option value="Nam">Nam</option>
                        <option value="Nữ">Nữ</option>
                        <option value="Khác">Khác</option>
                      </select>
                    </div>
                    {errors.gender && <span className="text-[#C00000] text-xs font-semibold mt-1 block">{errors.gender}</span>}
                  </div>

                  {/* Nhắc nhở mật khẩu tự sinh */}
                  <div className="flex items-center p-3 text-[11px] font-semibold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-500/30 rounded-lg">
                    <span className="leading-relaxed">
                      💡 Mật khẩu của tài khoản sẽ được sinh ngẫu nhiên ở server và tự động gửi tới Email của thành viên.
                    </span>
                  </div>

                  <div className="md:col-span-2 space-y-4 text-left">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                          Tỉnh / Thành phố <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
                            <MapPin size={16} />
                          </span>
                          <select
                            name="province"
                            required
                            value={addForm.province}
                            onChange={(e) => {
                              const { name, value } = e.target;
                              setAddForm((prev) => applyAddressFieldChange(prev, name, value));
                              setErrors((prev) => ({ ...prev, province: '', district: '', detailAddress: '', address: '' }));
                            }}
                            className="block w-full rounded-lg border border-gray-200 dark:border-gray-700 pl-10 pr-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all shadow-sm bg-white dark:bg-gray-800/60 dark:text-white"
                          >
                            <option value="">Chọn Tỉnh/Thành...</option>
                            {Object.keys(locationData).map((item) => (
                              <option key={item} value={item}>{item}</option>
                            ))}
                          </select>
                        </div>
                        {errors.province && <span className="text-[#C00000] text-xs font-semibold mt-1 block">{errors.province}</span>}
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                          Quận / Huyện <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
                            <MapPin size={16} />
                          </span>
                          <select
                            name="district"
                            required
                            value={addForm.district}
                            onChange={(e) => {
                              const { name, value } = e.target;
                              setAddForm((prev) => applyAddressFieldChange(prev, name, value));
                              setErrors((prev) => ({ ...prev, [name]: '', address: '' }));
                            }}
                            disabled={!addForm.province}
                            className="block w-full rounded-lg border border-gray-200 dark:border-gray-700 pl-10 pr-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all shadow-sm bg-white dark:bg-gray-800/60 dark:text-white disabled:bg-gray-50 dark:disabled:bg-gray-800/40 disabled:cursor-not-allowed"
                          >
                            <option value="">Chọn Quận/Huyện...</option>
                            {addForm.province && locationData[addForm.province]?.map((item) => (
                              <option key={item} value={item}>{item}</option>
                            ))}
                          </select>
                        </div>
                        {errors.district && <span className="text-[#C00000] text-xs font-semibold mt-1 block">{errors.district}</span>}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                        Địa chỉ chi tiết
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
                          <MapPin size={16} />
                        </span>
                        <input
                          type="text"
                          name="detailAddress"
                          placeholder="Số nhà, tên đường, phường/xã... (có thể cập nhật sau)"
                          value={addForm.detailAddress}
                          onChange={(e) => {
                            const { name, value } = e.target;
                            setAddForm((prev) => applyAddressFieldChange(prev, name, value));
                            setErrors((prev) => ({ ...prev, [name]: '', address: '' }));
                          }}
                          className="block w-full rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800/60 dark:text-white pl-10 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all shadow-sm"
                        />
                      </div>
                      {(errors.detailAddress || errors.address) && (
                        <span className="text-[#C00000] text-xs font-semibold mt-1 block">
                          {errors.detailAddress || errors.address}
                        </span>
                      )}
                    </div>
                  </div>

                </div>
              </div>

              {/* Footer Modal */}
              <div className="bg-gray-50 dark:bg-gray-800/60 px-6 py-4 flex justify-end space-x-3 border-t border-gray-100 dark:border-gray-800">
                <button 
                  type="button"
                  onClick={() => setIsAddModalOpen(false)} 
                  className="px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm font-semibold rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors shadow-sm"
                >
                  Hủy
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-[#C00000] text-white text-sm font-semibold rounded-lg hover:bg-[#a00000] transition-colors shadow-sm"
                >
                  Thêm mới
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default CustomerManagement;