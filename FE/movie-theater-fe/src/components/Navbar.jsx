import React, { useEffect, useRef, useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { Search, Bell, User, LogOut, LayoutDashboard, UserCircle, LogIn, UserPlus } from 'lucide-react';
import CustomerService from '../services/CustomerService.js';
import ThemeToggle from './ThemeToggle.jsx';

const Navbar = () => {
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [menuOpen]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const userString = localStorage.getItem('USER_LOGIN');
  const user = userString ? JSON.parse(userString) : null;
  const role = user ? user.roleName : null;
  const navItems = [
    { name: 'Home', path: '' },
    { name: 'Movies', path: '/movies' },
    { name: 'Cinemas', path: '/cinemas' },
    { name: 'Contact', path: '/contact' },
  ];

  const handleLogout = () => {
    localStorage.removeItem('USER_LOGIN');
    CustomerService.Logout();
    setMenuOpen(false);
    navigate('/login');
  };

  return (
    <nav
      className={`cine-navbar w-full bg-[#F8F9FA] dark:bg-transparent border-b border-gray-200 dark:border-transparent px-6 py-3.5 flex items-center justify-between font-sans relative z-50 transition-all duration-300 ${
        scrolled ? 'is-scrolled' : ''
      }`}
    >
      <div className="flex items-center">
        <Link
          to="/"
          className="font-display text-xl font-black tracking-tight text-[#C00000] dark:text-white cursor-pointer select-none dark:drop-shadow-[0_0_18px_rgba(229,9,20,0.45)]"
        >
          CINEMA<span className="text-[#E50914]"> ELITE</span>
        </Link>
      </div>

      <div className="hidden md:flex items-center space-x-8">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            end={item.path === ''}
            className={({ isActive }) =>
              `relative pb-1.5 text-sm font-semibold transition-colors duration-200 ${
                isActive
                  ? 'text-[#C00000] dark:text-white'
                  : 'text-gray-600 dark:text-white/60 hover:text-gray-900 dark:hover:text-white'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {item.name}
                {isActive && <span className="cine-nav-underline absolute bottom-0 left-0 w-full h-[2px] bg-[#C00000] dark:bg-[#E50914] rounded-full" />}
              </>
            )}
          </NavLink>
        ))}
      </div>

      <div className="flex items-center space-x-4 md:space-x-5">
        <div className="relative hidden lg:block">
          <input
            type="text"
            placeholder="Search movies..."
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            className={`cine-search w-56 dark:w-52 bg-[#F0F2F5] dark:bg-white/5 text-xs text-gray-600 dark:text-white/90 pl-4 pr-10 py-2.5 rounded-full border border-transparent dark:border-white/10 focus:outline-none focus:bg-white dark:focus:bg-[#10131A]/90 focus:border-gray-300 dark:focus:border-[#4CC9F0]/50 transition-all placeholder-gray-400 dark:placeholder-white/35 ${
              searchFocused ? 'dark:shadow-[0_0_0_3px_rgba(76,201,240,0.15)]' : ''
            }`}
          />
          <Search
            size={16}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-white/45 cursor-pointer hover:text-gray-600 dark:hover:text-[#4CC9F0] transition-colors"
          />
        </div>

        <ThemeToggle />

        <button className="relative text-gray-500 dark:text-white/55 hover:text-gray-800 dark:hover:text-white transition-colors p-1.5 dark:rounded-full dark:hover:bg-white/8">
          <Bell size={20} strokeWidth={1.8} />
          {user && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-[#E50914] rounded-full shadow-[0_0_8px_rgba(229,9,20,0.8)]" />
          )}
        </button>

        <div className="relative cursor-pointer" ref={menuRef}>
          <div
            onClick={() => setMenuOpen((prev) => !prev)}
            className="w-9 h-9 rounded-full overflow-hidden border border-gray-300 dark:border-white/15 flex items-center justify-center bg-gray-100 dark:bg-white/10 hover:opacity-90 dark:hover:border-[#E50914]/50 dark:hover:shadow-[0_0_16px_rgba(229,9,20,0.35)] transition-all shadow-sm"
          >
            {!user ? (
              <User size={20} className="text-gray-500 dark:text-white/60" />
            ) : user.image ? (
              <img src={user.image} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-sm font-bold text-gray-600 dark:text-white uppercase">
                {user.username ? user.username.charAt(0) : '?'}
              </span>
            )}
          </div>

          <div
            className={`absolute right-0 top-full mt-3 w-52 bg-white cine-glass-strong border border-gray-100 dark:border-white/10 shadow-2xl rounded-2xl transition-all duration-200 overflow-hidden backdrop-blur-xl ${
              menuOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-1'
            }`}
          >
            {!user ? (
              <div className="py-2">
                <Link
                  to="/login"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center px-4 py-3 text-sm font-semibold text-gray-700 dark:text-white/85 hover:bg-gray-50 dark:hover:bg-white/8 transition-colors"
                >
                  <LogIn size={18} className="mr-3 text-gray-400 dark:text-[#4CC9F0]" /> Đăng nhập
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center px-4 py-3 text-sm font-semibold text-gray-700 dark:text-white/85 hover:bg-gray-50 dark:hover:bg-white/8 transition-colors"
                >
                  <UserPlus size={18} className="mr-3 text-gray-400 dark:text-[#7B61FF]" /> Đăng ký thành viên
                </Link>
              </div>
            ) : (
              <div>
                <div className="px-4 py-3 border-b border-gray-100 dark:border-white/8 bg-gray-50/50 dark:bg-white/5">
                  <p className="text-[10px] uppercase font-bold tracking-widest text-gray-400 dark:text-white/40">
                    Xin chào,
                  </p>
                  <p className="text-sm font-bold text-[#C00000] dark:text-[#E50914] truncate mt-0.5">
                    @{user.username}
                  </p>
                </div>

                <div className="py-2">
                  {role === 'Admin' || role === 'Employee' || role === 'SystemAdmin' ? (
                    <Link
                      to={
                        role === 'Admin'
                          ? '/admin'
                          : role === 'SystemAdmin'
                            ? '/system-admin'
                            : '/employee'
                      }
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center px-4 py-2.5 text-sm font-semibold text-gray-700 dark:text-white/85 hover:bg-gray-50 dark:hover:bg-white/8 transition-colors"
                    >
                      <LayoutDashboard size={16} className="mr-3 text-gray-400 dark:text-[#F7B731]" />
                      Dashboard (Quản trị)
                    </Link>
                  ) : (
                    <Link
                      to="/profile"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center px-4 py-2.5 text-sm font-semibold text-gray-700 dark:text-white/85 hover:bg-gray-50 dark:hover:bg-white/8 transition-colors"
                    >
                      <UserCircle size={16} className="mr-3 text-gray-400 dark:text-[#4CC9F0]" />
                      Thông tin cá nhân
                    </Link>
                  )}

                  <div className="h-[1px] bg-gray-100 dark:bg-white/8 my-1" />

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center px-4 py-2.5 text-sm font-semibold text-[#C00000] dark:text-[#E50914] hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors text-left"
                  >
                    <LogOut size={16} className="mr-3" />
                    Đăng xuất
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
