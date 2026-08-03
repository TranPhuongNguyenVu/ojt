import React, { useState, useEffect } from 'react';
import HeroComponent from '../../components/HomePage/HeroComponent.jsx';
import QuickBookingBar from '../../components/HomePage/QuickBookingBar.jsx';
import ListFilmComponent from '../../components/HomePage/ListFilmComponent.jsx';
import PromotionComponent from '../../components/HomePage/PromotionComponent.jsx';
import MovieService from "../../services/MovieService";

const HomePage = () => {
  const [nowShowing, setNowShowing] = useState([]);
  const [comingSoon, setComingSoon] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    MovieService.getAllMovies()
      .then((response) => {
        const allMovies = response.data.data || [];

        // Lọc theo status do BE tính (MovieStatusResolver), không tự suy ra từ fromDate/toDate:
        // trang chủ là mặt tiền công khai nên phải luôn ẩn UNSCHEDULED/INACTIVE, kể cả khi
        // API trả về danh sách chưa lọc (trường hợp cookie của tài khoản Admin bị gửi kèm).
        const active = allMovies.filter(m => m.status === 'SHOWING');
        const upcoming = allMovies.filter(m => m.status === 'UPCOMING');

        setNowShowing(active);
        setComingSoon(upcoming);
      })
      .catch((error) => {
        console.error("Lỗi lấy danh sách phim:", error);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <HeroComponent movies={nowShowing} loading={loading} />
      <QuickBookingBar />
      <ListFilmComponent title="Phim đang chiếu" movies={nowShowing} loading={loading} />
      <ListFilmComponent title="Phim sắp chiếu" movies={comingSoon} loading={loading} variant="row" />
      <PromotionComponent />
    </>
  );
};

export default HomePage;
