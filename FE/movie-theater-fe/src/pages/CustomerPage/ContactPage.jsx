import React, { useState } from 'react';
import { MapPin, Phone, Mail, Clock, User, MessageSquare, Send, CheckCircle } from 'lucide-react';

const INITIAL_FORM = {
  fullName: '',
  email: '',
  phone: '',
  subject: '',
  message: '',
};

const CONTACT_INFO = [
  {
    icon: MapPin,
    label: 'Địa chỉ',
    value: '123 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh',
  },
  {
    icon: Phone,
    label: 'Hotline',
    value: '1900 1234',
  },
  {
    icon: Mail,
    label: 'Email',
    value: 'support@cinemaelite.vn',
  },
  {
    icon: Clock,
    label: 'Giờ mở cửa',
    value: 'Thứ 2 – Chủ nhật: 08:00 – 23:00',
  },
];

const ContactPage = () => {
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
    setSuccessMessage('');
  };

  const validate = () => {
    const next = {};
    if (!form.fullName.trim()) next.fullName = 'Vui lòng nhập họ tên!';
    if (!form.email.trim()) {
      next.email = 'Vui lòng nhập email!';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      next.email = 'Email không hợp lệ!';
    }
    if (form.phone.trim() && !/^(0|\+84)[0-9]{8,10}$/.test(form.phone.trim().replace(/\s/g, ''))) {
      next.phone = 'Số điện thoại không hợp lệ!';
    }
    if (!form.subject.trim()) next.subject = 'Vui lòng nhập chủ đề!';
    if (!form.message.trim()) next.message = 'Vui lòng nhập nội dung!';
    else if (form.message.trim().length < 10) next.message = 'Nội dung cần ít nhất 10 ký tự!';
    return next;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const nextErrors = validate();
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setForm(INITIAL_FORM);
      setErrors({});
      setSuccessMessage('Cảm ơn bạn! Tin nhắn đã được gửi thành công. Chúng tôi sẽ phản hồi sớm nhất.');
      setTimeout(() => setSuccessMessage(''), 5000);
    }, 600);
  };

  const inputClass =
    'w-full bg-white dark:bg-gray-900 text-sm text-gray-800 dark:text-gray-200 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 focus:ring-1 focus:ring-gray-400 dark:focus:ring-gray-500 transition-all placeholder-gray-300 dark:placeholder-gray-500';
  const labelClass = 'text-[10px] font-black tracking-widest text-gray-400 dark:text-gray-500 uppercase block mb-1.5';

  return (
    <div className="w-full min-h-[70vh] bg-[#F8F9FA] dark:bg-transparent font-sans transition-colors duration-300">
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-12 md:py-16">
        <div className="text-center mb-10 md:mb-14 space-y-2">
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white tracking-tight">
            Liên hệ với chúng tôi
          </h1>
          <p className="text-gray-400 dark:text-gray-500 text-sm md:text-base max-w-xl mx-auto">
            Có câu hỏi về vé, suất chiếu hay ưu đãi? Hãy gửi tin nhắn — đội ngũ Cinema Elite luôn sẵn sàng hỗ trợ.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-10">
          {/* Info column */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-6 md:p-8 space-y-6 transition-colors duration-300">
              <h2 className="text-lg font-black text-gray-900 dark:text-white tracking-tight">
                Thông tin liên hệ
              </h2>
              <ul className="space-y-5">
                {CONTACT_INFO.map(({ icon: Icon, label, value }) => (
                  <li key={label} className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-50 dark:bg-red-950/40 text-[#C00000] dark:text-[#E50914]">
                      <Icon size={18} strokeWidth={1.8} />
                    </span>
                    <div>
                      <p className="text-[10px] font-black tracking-widest text-gray-400 dark:text-gray-500 uppercase">
                        {label}
                      </p>
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mt-0.5 leading-relaxed">
                        {value}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Form column */}
          <div className="lg:col-span-3">
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-6 md:p-8 transition-colors duration-300">
              <h2 className="text-lg font-black text-gray-900 dark:text-white tracking-tight mb-6">
                Gửi tin nhắn
              </h2>

              {successMessage && (
                <div className="flex items-start gap-2 mb-5 p-3 text-[13px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/50 rounded-xl">
                  <CheckCircle size={18} className="shrink-0 mt-0.5" />
                  <span>{successMessage}</span>
                </div>
              )}

              <form className="space-y-4" onSubmit={handleSubmit} noValidate>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Họ tên *</label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
                        <User size={16} strokeWidth={2} />
                      </span>
                      <input
                        type="text"
                        value={form.fullName}
                        onChange={handleChange('fullName')}
                        placeholder="Nguyễn Văn A"
                        className={`${inputClass} pl-11`}
                      />
                    </div>
                    {errors.fullName && (
                      <p className="mt-1 text-xs font-semibold text-[#C00000]">{errors.fullName}</p>
                    )}
                  </div>

                  <div>
                    <label className={labelClass}>Email *</label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
                        <Mail size={16} strokeWidth={2} />
                      </span>
                      <input
                        type="email"
                        value={form.email}
                        onChange={handleChange('email')}
                        placeholder="email@example.com"
                        className={`${inputClass} pl-11`}
                      />
                    </div>
                    {errors.email && (
                      <p className="mt-1 text-xs font-semibold text-[#C00000]">{errors.email}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Số điện thoại</label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
                        <Phone size={16} strokeWidth={2} />
                      </span>
                      <input
                        type="tel"
                        value={form.phone}
                        onChange={handleChange('phone')}
                        placeholder="0901234567"
                        className={`${inputClass} pl-11`}
                      />
                    </div>
                    {errors.phone && (
                      <p className="mt-1 text-xs font-semibold text-[#C00000]">{errors.phone}</p>
                    )}
                  </div>

                  <div>
                    <label className={labelClass}>Chủ đề *</label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
                        <MessageSquare size={16} strokeWidth={2} />
                      </span>
                      <input
                        type="text"
                        value={form.subject}
                        onChange={handleChange('subject')}
                        placeholder="Hỗ trợ đặt vé, phản hồi..."
                        className={`${inputClass} pl-11`}
                      />
                    </div>
                    {errors.subject && (
                      <p className="mt-1 text-xs font-semibold text-[#C00000]">{errors.subject}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Nội dung *</label>
                  <textarea
                    value={form.message}
                    onChange={handleChange('message')}
                    placeholder="Nhập nội dung tin nhắn của bạn..."
                    rows={5}
                    className={`${inputClass} resize-y min-h-[120px]`}
                  />
                  {errors.message && (
                    <p className="mt-1 text-xs font-semibold text-[#C00000]">{errors.message}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#C00000] hover:bg-[#990011] disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-bold px-8 py-3 rounded-xl transition-colors shadow-sm"
                >
                  <Send size={16} strokeWidth={2} />
                  {isSubmitting ? 'Đang gửi...' : 'Gửi tin nhắn'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
