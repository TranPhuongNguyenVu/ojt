import React, { useState } from 'react';
import { Sun, Moon } from 'lucide-react';

/**
 * Switch chuyển sáng/tối: đổi class .dark trên <html>, lưu lựa chọn vào localStorage.
 * Trạng thái ban đầu đã được script trong index.html áp trước khi React chạy.
 */
const ThemeToggle = () => {
  const [dark, setDark] = useState(() =>
    typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
  );

  const toggle = () => {
    setDark((d) => {
      const next = !d;
      document.documentElement.classList.toggle('dark', next);
      try {
        localStorage.setItem('THEME', next ? 'dark' : 'light');
      } catch {
        // storage bị chặn thì theme vẫn hoạt động trong phiên hiện tại
      }
      return next;
    });
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={dark}
      aria-label={dark ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
      onClick={toggle}
      className={`relative inline-flex h-7 w-13 shrink-0 items-center rounded-full border transition-all duration-300 cursor-pointer ${
        dark
          ? 'bg-[#10131A] border-white/15 shadow-[0_0_16px_rgba(123,97,255,0.35)]'
          : 'bg-gray-200 border-gray-300'
      }`}
    >
      <span
        className={`inline-flex h-5.5 w-5.5 items-center justify-center rounded-full bg-white shadow-md transform transition-transform duration-300 ${
          dark ? 'translate-x-6.5 shadow-[0_0_12px_rgba(247,183,49,0.45)]' : 'translate-x-0.5'
        }`}
      >
        {dark ? (
          <Moon size={12} className="text-[#7B61FF]" fill="currentColor" strokeWidth={0} />
        ) : (
          <Sun size={13} className="text-amber-500" />
        )}
      </span>
    </button>
  );
};

export default ThemeToggle;
