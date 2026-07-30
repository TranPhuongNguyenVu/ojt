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
        const tzoffset = (new Date()).getTimezoneOffset() * 60000;
        const localISODate = (new Date(Date.now() - tzoffset)).toISOString().split('T')[0];

        // Phân loại phim:
        // Phim đang chiếu: từ ngày <= hôm nay và (không có ngày kết thúc hoặc ngày kết thúc >= hôm nay)
        const active = allMovies.filter(m => m.fromDate <= localISODate && (!m.toDate || m.toDate >= localISODate));
        // Phim sắp chiếu: từ ngày > hôm nay
        const upcoming = allMovies.filter(m => m.fromDate > localISODate);

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
