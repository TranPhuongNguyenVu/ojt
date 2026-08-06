import React, { useEffect, useMemo, useRef, useState } from 'react';
import { NavLink, Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { Search, User, LogOut, LayoutDashboard, UserCircle, LogIn, UserPlus } from 'lucide-react';
import CustomerService from '../services/CustomerService.js';
import MovieService from '../services/MovieService.js';
import ThemeToggle from './ThemeToggle.jsx';
import { stripDiacritics } from '../utils/textNormalizeUtils.js';

const SUGGESTION_LIMIT = 8;

const getMovieName = (movie) => movie.movieNameVn || movie.movieNameEnglish || '';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [allMovies, setAllMovies] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const menuRef = useRef(null);
  const searchBoxRef = useRef(null);

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

  useEffect(() => {
    if (location.pathname === '/movies') {
      setKeyword(searchParams.get('q') || '');
    }
  }, [location.pathname, searchParams]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    let cancelled = false;
    MovieService.getAllMovies()
      .then((response) => {
        if (cancelled) return;
        // Gợi ý tìm kiếm là mặt tiền công khai: ẩn phim UNSCHEDULED/INACTIVE/ENDED
        // kể cả khi API trả về danh sách chưa lọc.
        const list = (response.data.data || []).filter(
          (m) => m.status !== 'UNSCHEDULED' && m.status !== 'INACTIVE' && m.status !== 'ENDED'
        );
        setAllMovies(list);
      })
      .catch(() => {
        if (!cancelled) setAllMovies([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const suggestions = useMemo(() => {
    const query = stripDiacritics(keyword.trim().toLowerCase());
    if (!query) return [];

    return allMovies
      .filter((movie) => {
        const vn = stripDiacritics((movie.movieNameVn || '').toLowerCase());
        const en = stripDiacritics((movie.movieNameEnglish || '').toLowerCase());
        return vn.includes(query) || en.includes(query);
      })
      .sort((a, b) => getMovieName(a).localeCompare(getMovieName(b), 'vi', { sensitivity: 'base' }))
      .slice(0, SUGGESTION_LIMIT);
  }, [keyword, allMovies]);

  const userString = localStorage.getItem('USER_LOGIN');
  const user = userString ? JSON.parse(userString) : null;
  const role = user ? user.roleName : null;
  const navItems = [
    { name: 'Trang chủ', path: '' },
    { name: 'Phim', path: '/movies' },
    { name: 'Rạp', path: '/cinemas' },
    { name: 'Liên hệ', path: '/contact' },
  ];

  const handleLogout = () => {
    localStorage.removeItem('USER_LOGIN');
    CustomerService.Logout();
    setMenuOpen(false);
    navigate('/login');
  };

  const handleSearch = () => {
    const trimmed = keyword.trim();
    setShowSuggestions(false);
    if (!trimmed) {
      navigate('/movies');
      return;
    }
    navigate(`/movies?q=${encodeURIComponent(trimmed)}&page=1`);
  };

  const handleKeywordChange = (event) => {
    const value = event.target.value;
    setKeyword(value);
    setShowSuggestions(true);

    // Ô rỗng thì bỏ kết quả tìm kiếm cũ ngay, không chờ submit lại
    if (!value.trim() && location.pathname === '/movies' && searchParams.get('q')) {
      navigate('/movies', { replace: true });
    }
  };

  const handleSelectSuggestion = (movie) => {
    const name = getMovieName(movie);
    setKeyword(name);
    setShowSuggestions(false);
    navigate(`/detail/${movie.movieId}`);
  };

  return (
    <nav
      className={`cine-navbar sticky top-0 w-full bg-[#F8F9FA] dark:bg-transparent border-b border-gray-200 dark:border-transparent px-6 py-3.5 flex items-center justify-between font-sans z-50 transition-[background-color,box-shadow,border-color] duration-300 print:hidden ${
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
        <div className="relative hidden lg:block" ref={searchBoxRef}>
          <input
            type="text"
            value={keyword}
            onChange={handleKeywordChange}
            onFocus={() => {
              setSearchFocused(true);
              setShowSuggestions(true);
            }}
            onBlur={() => setSearchFocused(false)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSearch();
              if (e.key === 'Escape') setShowSuggestions(false);
            }}
            maxLength={100}
            placeholder="Nhập tên phim..."
            aria-label="Tìm kiếm phim"
            aria-autocomplete="list"
            aria-expanded={showSuggestions && keyword.trim().length > 0}
            className={`cine-search w-56 bg-[#F0F2F5] dark:bg-white/5 text-xs text-gray-600 dark:text-white/90 pl-4 pr-10 py-2.5 rounded-full border border-transparent dark:border-white/10 focus:outline-none focus:bg-white dark:focus:bg-[#10131A]/90 focus:border-gray-300 dark:focus:border-[#4CC9F0]/50 transition-[background-color,border-color,box-shadow] duration-200 placeholder-gray-400 dark:placeholder-white/35 ${
              searchFocused ? 'dark:shadow-[0_0_0_3px_rgba(76,201,240,0.15)]' : ''
            }`}
          />
          <button
            type="button"
            onClick={handleSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-white/45 hover:text-gray-600 dark:hover:text-[#4CC9F0] transition-colors"
            aria-label="Tìm kiếm"
          >
            <Search size={16} />
          </button>
          {showSuggestions && keyword.trim() && (
            <ul className="absolute right-0 top-full mt-2 z-50 w-72 bg-white dark:bg-[#10131A]/95 dark:backdrop-blur-md border border-gray-200 dark:border-white/10 rounded-xl shadow-lg max-h-72 overflow-y-auto">
              {suggestions.length > 0 ? (
                suggestions.map((movie) => (
                  <li key={movie.movieId}>
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => handleSelectSuggestion(movie)}
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-800 dark:text-white/90 hover:bg-gray-50 dark:hover:bg-white/8 transition-colors"
                    >
                      <span className="font-semibold">{getMovieName(movie)}</span>
                      {movie.movieNameVn &&
                        movie.movieNameEnglish &&
                        movie.movieNameVn !== movie.movieNameEnglish && (
                          <span className="block text-xs text-gray-400 dark:text-white/40 mt-0.5">
                            {movie.movieNameEnglish}
                          </span>
                        )}
                    </button>
                  </li>
                ))
              ) : (
                <li className="px-4 py-3 text-sm text-gray-500 dark:text-white/50">Không tìm thấy phim</li>
              )}
            </ul>
          )}
        </div>

        <ThemeToggle />

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
                      Bảng điều khiển (Quản trị)
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
