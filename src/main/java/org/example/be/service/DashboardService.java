package org.example.be.service;

import org.example.be.dto.DashboardDTO;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.Timestamp;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Locale;

@Service
public class DashboardService {
    private static final String PAID_STATUS_SQL = """
            upper(coalesce(p.payment_status, '')) in ('PAID', 'SUCCESS', 'SUCCESSFUL', 'COMPLETED')
            """;

    private final NamedParameterJdbcTemplate jdbcTemplate;

    public DashboardService(NamedParameterJdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public DashboardDTO.Overview getOverview(String timeFilter, LocalDate startDate, LocalDate endDate, String movieId) {
        DashboardDTO.Filter filter = buildFilter(timeFilter, startDate, endDate, movieId);

        return DashboardDTO.Overview.builder()
                .kpis(getKpis(filter))
                .revenueTrend(getRevenueTrend(filter))
                .revenueByMovie(getRevenueByMovie(filter))
                .ticketSalesByTimeSlot(getTicketSalesByTimeSlot(filter))
                .topRevenueMovies(getTopRevenueMovies(filter, 5))
                .operational(getOperationalStatistics())
                .build();
    }

    public DashboardDTO.Kpi getKpis(String timeFilter, LocalDate startDate, LocalDate endDate, String movieId) {
        return getKpis(buildFilter(timeFilter, startDate, endDate, movieId));
    }

    public List<DashboardDTO.MovieOption> getMovieOptions() {
        String sql = """
                select movie_id, coalesce(nullif(movie_name_vn, ''), movie_name_english, movie_id) as movie_name
                from movie
                where status is distinct from 'INACTIVE'
                order by movie_name
                """;

        return jdbcTemplate.query(sql, new MapSqlParameterSource(), (rs, rowNum) ->
                DashboardDTO.MovieOption.builder()
                        .movieId(rs.getString("movie_id"))
                        .movieName(rs.getString("movie_name"))
                        .build());
    }

    public DashboardDTO.Operational getOperationalStatistics() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime todayStart = LocalDate.now().atStartOfDay();
        LocalDateTime tomorrowStart = todayStart.plusDays(1);

        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("now", Timestamp.valueOf(now))
                .addValue("todayStart", Timestamp.valueOf(todayStart))
                .addValue("tomorrowStart", Timestamp.valueOf(tomorrowStart));

        String sql = """
                select
                    (select count(*)
                     from schedule
                     where start_time <= :now and end_time >= :now) as active_showtimes,
                    (select count(inv_s.invoice_seat_id)
                     from invoice i
                     join payment p on p.invoice_id = i.invoice_id
                     join invoice_seat inv_s on inv_s.invoice_id = i.invoice_id
                     where %s
                       and coalesce(p.created_at, i.booking_date) >= :todayStart
                       and coalesce(p.created_at, i.booking_date) < :tomorrowStart) as tickets_sold_today,
                    (select coalesce(sum(coalesce(p.amount, i.total_money, 0)), 0)
                     from invoice i
                     join payment p on p.invoice_id = i.invoice_id
                     where %s
                       and coalesce(p.created_at, i.booking_date) >= :todayStart
                       and coalesce(p.created_at, i.booking_date) < :tomorrowStart) as today_revenue
                """.formatted(PAID_STATUS_SQL, PAID_STATUS_SQL);

        return jdbcTemplate.queryForObject(sql, params, (rs, rowNum) ->
                DashboardDTO.Operational.builder()
                        .activeShowtimes(rs.getLong("active_showtimes"))
                        .ticketsSoldToday(rs.getLong("tickets_sold_today"))
                        .todayRevenue(defaultMoney(rs.getBigDecimal("today_revenue")))
                        .build());
    }

    public List<DashboardDTO.Trend> getRevenueTrend(String timeFilter, LocalDate startDate, LocalDate endDate, String movieId) {
        return getRevenueTrend(buildFilter(timeFilter, startDate, endDate, movieId));
    }

    public List<DashboardDTO.MovieRevenue> getRevenueByMovie(String timeFilter, LocalDate startDate, LocalDate endDate, String movieId) {
        return getRevenueByMovie(buildFilter(timeFilter, startDate, endDate, movieId));
    }

    public List<DashboardDTO.TimeSlot> getTicketSalesByTimeSlot(String timeFilter, LocalDate startDate, LocalDate endDate, String movieId) {
        return getTicketSalesByTimeSlot(buildFilter(timeFilter, startDate, endDate, movieId));
    }

    public List<DashboardDTO.MovieRevenue> getTopRevenueMovies(String timeFilter, LocalDate startDate, LocalDate endDate, String movieId, Integer limit) {
        return getTopRevenueMovies(buildFilter(timeFilter, startDate, endDate, movieId), limit == null ? 5 : limit);
    }

    private DashboardDTO.Kpi getKpis(DashboardDTO.Filter filter) {
        MapSqlParameterSource params = params(filter);

        String salesSql = """
                select
                    coalesce(sum(pi.amount), 0) as total_revenue,
                    coalesce(sum(pi.ticket_count), 0) as total_tickets
                from (
                    select i.invoice_id,
                           coalesce(p.amount, i.total_money, 0) as amount,
                           count(inv_s.invoice_seat_id) as ticket_count
                    from invoice i
                    join payment p on p.invoice_id = i.invoice_id
                    join schedule s on s.schedule_id = i.schedule_id
                    left join invoice_seat inv_s on inv_s.invoice_id = i.invoice_id
                    where %s
                      and coalesce(p.created_at, i.booking_date) >= :startDateTime
                      and coalesce(p.created_at, i.booking_date) < :endDateTime
                      and (cast(:movieId as varchar) is null or s.movie_id = cast(:movieId as varchar))
                    group by i.invoice_id, p.amount, i.total_money
                ) pi
                """.formatted(PAID_STATUS_SQL);

        DashboardDTO.Kpi sales = jdbcTemplate.queryForObject(salesSql, params, (rs, rowNum) ->
                DashboardDTO.Kpi.builder()
                        .totalRevenue(defaultMoney(rs.getBigDecimal("total_revenue")))
                        .totalTicketsSold(rs.getLong("total_tickets"))
                        .build());

        String occupancySql = """
                select
                    coalesce((
                        select count(inv_s.invoice_seat_id)
                        from invoice i
                        join payment p on p.invoice_id = i.invoice_id
                        join schedule s on s.schedule_id = i.schedule_id
                        join invoice_seat inv_s on inv_s.invoice_id = i.invoice_id
                        where %s
                          and s.start_time >= :startDateTime
                          and s.start_time < :endDateTime
                          and (cast(:movieId as varchar) is null or s.movie_id = cast(:movieId as varchar))
                    ), 0) as seats_sold,
                    coalesce((
                        select count(se.seat_id)
                        from schedule s
                        join seat se on se.cinema_room_id = s.cinema_room_id and se.status = 'ACTIVE'
                        where s.start_time >= :startDateTime
                          and s.start_time < :endDateTime
                          and (cast(:movieId as varchar) is null or s.movie_id = cast(:movieId as varchar))
                    ), 0) as available_seats
                """.formatted(PAID_STATUS_SQL);

        BigDecimal occupancyRate = jdbcTemplate.queryForObject(occupancySql, params, (rs, rowNum) ->
                percent(rs.getBigDecimal("seats_sold"), rs.getBigDecimal("available_seats")));

        BigDecimal averageRevenuePerTicket = BigDecimal.ZERO;
        if (sales != null && sales.getTotalTicketsSold() != null && sales.getTotalTicketsSold() > 0) {
            averageRevenuePerTicket = sales.getTotalRevenue()
                    .divide(BigDecimal.valueOf(sales.getTotalTicketsSold()), 2, RoundingMode.HALF_UP);
        }

        return DashboardDTO.Kpi.builder()
                .totalRevenue(sales == null ? BigDecimal.ZERO : sales.getTotalRevenue())
                .totalTicketsSold(sales == null ? 0L : sales.getTotalTicketsSold())
                .averageOccupancyRate(occupancyRate)
                .averageRevenuePerTicket(averageRevenuePerTicket)
                .build();
    }
    private List<DashboardDTO.Trend> getRevenueTrend(DashboardDTO.Filter filter) {
        // Lấy chuỗi cấu hình trực tiếp từ hàm bổ trợ
        String bucket = trendBucket(filter);          // Trả về 'day', 'week', hoặc 'month'
        String labelFormat = trendLabelFormat(filter);  // Trả về định dạng chuỗi mẫu ngày/tháng

        MapSqlParameterSource params = params(filter); // Chỉ giữ lại các biến datetime và movieId an toàn

        // ĐÃ SỬA: Thay :bucket và :labelFormat bằng cách nối chuỗi trực tiếp %s vào câu SQLText Block
        String sql = """
                select to_char(date_trunc('%s', sales_at), '%s') as label,
                       coalesce(sum(amount), 0) as revenue,
                       coalesce(sum(ticket_count), 0) as tickets_sold
                from (
                    select i.invoice_id,
                           coalesce(p.created_at, i.booking_date) as sales_at,
                           coalesce(p.amount, i.total_money, 0) as amount,
                           count(inv_s.invoice_seat_id) as ticket_count
                    from invoice i
                    join payment p on p.invoice_id = i.invoice_id
                    join schedule s on s.schedule_id = i.schedule_id
                    left join invoice_seat inv_s on inv_s.invoice_id = i.invoice_id
                    where %s
                      and coalesce(p.created_at, i.booking_date) >= :startDateTime
                      and coalesce(p.created_at, i.booking_date) < :endDateTime
                      and (cast(:movieId as varchar) is null or s.movie_id = cast(:movieId as varchar))
                    group by i.invoice_id, p.created_at, i.booking_date, p.amount, i.total_money
                ) paid_invoice
                group by date_trunc('%s', sales_at)
                order by date_trunc('%s', sales_at)
                """.formatted(bucket, labelFormat, PAID_STATUS_SQL, bucket, bucket);

        return jdbcTemplate.query(sql, params, (rs, rowNum) ->
                DashboardDTO.Trend.builder()
                        .label(rs.getString("label"))
                        .revenue(defaultMoney(rs.getBigDecimal("revenue")))
                        .ticketsSold(rs.getLong("tickets_sold"))
                        .build());
    }

    private List<DashboardDTO.MovieRevenue> getRevenueByMovie(DashboardDTO.Filter filter) {
        String sql = """
                with sales as (
                    select s.movie_id,
                           coalesce(nullif(m.movie_name_vn, ''), m.movie_name_english, s.movie_id) as movie_name,
                           coalesce(sum(pi.ticket_count), 0) as tickets_sold,
                           coalesce(sum(pi.amount), 0) as total_revenue
                    from (
                        select i.invoice_id,
                               i.schedule_id,
                               coalesce(p.amount, i.total_money, 0) as amount,
                               count(inv_s.invoice_seat_id) as ticket_count
                        from invoice i
                        join payment p on p.invoice_id = i.invoice_id
                        left join invoice_seat inv_s on inv_s.invoice_id = i.invoice_id
                        where %s
                          and coalesce(p.created_at, i.booking_date) >= :startDateTime
                          and coalesce(p.created_at, i.booking_date) < :endDateTime
                        group by i.invoice_id, i.schedule_id, p.amount, i.total_money
                    ) pi
                    join schedule s on s.schedule_id = pi.schedule_id
                    join movie m on m.movie_id = s.movie_id
                    where (cast(:movieId as varchar) is null or s.movie_id = cast(:movieId as varchar))
                    group by s.movie_id, movie_name
                ),
                occupancy as (
                    select scheduled.movie_id,
                           coalesce(sold.seats_sold, 0) as seats_sold,
                           scheduled.available_seats
                    from (
                        select s.movie_id, count(se.seat_id) as available_seats
                        from schedule s
                        join seat se on se.cinema_room_id = s.cinema_room_id and se.status = 'ACTIVE'
                        where s.start_time >= :startDateTime
                          and s.start_time < :endDateTime
                          and (cast(:movieId as varchar) is null or s.movie_id = cast(:movieId as varchar))
                        group by s.movie_id
                    ) scheduled
                    left join (
                        select s.movie_id, count(inv_s.invoice_seat_id) as seats_sold
                        from invoice i
                        join payment p on p.invoice_id = i.invoice_id
                        join schedule s on s.schedule_id = i.schedule_id
                        join invoice_seat inv_s on inv_s.invoice_id = i.invoice_id
                        where %s
                          and s.start_time >= :startDateTime
                          and s.start_time < :endDateTime
                          and (cast(:movieId as varchar) is null or s.movie_id = cast(:movieId as varchar))
                        group by s.movie_id
                    ) sold on sold.movie_id = scheduled.movie_id
                )
                select sales.movie_id,
                       sales.movie_name,
                       sales.tickets_sold,
                       sales.total_revenue,
                       case when coalesce(occupancy.available_seats, 0) = 0
                            then 0
                            else round((coalesce(occupancy.seats_sold, 0)::numeric / occupancy.available_seats::numeric) * 100, 2)
                       end as average_occupancy_rate
                from sales
                left join occupancy on occupancy.movie_id = sales.movie_id
                order by sales.total_revenue desc, sales.tickets_sold desc, sales.movie_name
                """.formatted(PAID_STATUS_SQL, PAID_STATUS_SQL);

        return jdbcTemplate.query(sql, params(filter), (rs, rowNum) ->
                DashboardDTO.MovieRevenue.builder()
                        .movieId(rs.getString("movie_id"))
                        .movieName(rs.getString("movie_name"))
                        .ticketsSold(rs.getLong("tickets_sold"))
                        .totalRevenue(defaultMoney(rs.getBigDecimal("total_revenue")))
                        .averageOccupancyRate(defaultMoney(rs.getBigDecimal("average_occupancy_rate")))
                        .build());
    }

    private List<DashboardDTO.TimeSlot> getTicketSalesByTimeSlot(DashboardDTO.Filter filter) {
        String sql = """
                select
                    case
                        when extract(hour from s.start_time) between 5 and 11 then 'Sáng (5:00 - 11:59)'
                        when extract(hour from s.start_time) between 12 and 16 then 'Chiều (12:00 - 16:59)'
                        when extract(hour from s.start_time) between 17 and 20 then 'Tối (17:00 - 20:59)'
                        else 'Đêm (21:00 - 4:59)'
                    end as time_slot,
                    count(inv_s.invoice_seat_id) as tickets_sold,
                    case
                        when extract(hour from s.start_time) between 5 and 11 then 1
                        when extract(hour from s.start_time) between 12 and 16 then 2
                        when extract(hour from s.start_time) between 17 and 20 then 3
                        else 4
                    end as sort_order
                from invoice i
                join payment p on p.invoice_id = i.invoice_id
                join schedule s on s.schedule_id = i.schedule_id
                join invoice_seat inv_s on inv_s.invoice_id = i.invoice_id
                where %s
                  and s.start_time >= :startDateTime
                  and s.start_time < :endDateTime
                  and (cast(:movieId as varchar) is null or s.movie_id = cast(:movieId as varchar))
                group by time_slot, sort_order
                order by sort_order
                """.formatted(PAID_STATUS_SQL);

        return jdbcTemplate.query(sql, params(filter), (rs, rowNum) ->
                DashboardDTO.TimeSlot.builder()
                        .timeSlot(rs.getString("time_slot"))
                        .ticketsSold(rs.getLong("tickets_sold"))
                        .build());
    }

    private List<DashboardDTO.MovieRevenue> getTopRevenueMovies(DashboardDTO.Filter filter, int limit) {
        MapSqlParameterSource params = params(filter).addValue("limit", Math.max(1, Math.min(limit, 10)));

        String sql = """
                with sales as (
                    select s.movie_id,
                           coalesce(nullif(m.movie_name_vn, ''), m.movie_name_english, s.movie_id) as movie_name,
                           coalesce(sum(pi.amount), 0) as total_revenue,
                           coalesce(sum(pi.ticket_count), 0) as tickets_sold
                    from (
                        select i.invoice_id,
                               i.schedule_id,
                               coalesce(p.amount, i.total_money, 0) as amount,
                               count(inv_s.invoice_seat_id) as ticket_count
                        from invoice i
                        join payment p on p.invoice_id = i.invoice_id
                        left join invoice_seat inv_s on inv_s.invoice_id = i.invoice_id
                        where %s
                          and coalesce(p.created_at, i.booking_date) >= :startDateTime
                          and coalesce(p.created_at, i.booking_date) < :endDateTime
                        group by i.invoice_id, i.schedule_id, p.amount, i.total_money
                    ) pi
                    join schedule s on s.schedule_id = pi.schedule_id
                    join movie m on m.movie_id = s.movie_id
                    where (cast(:movieId as varchar) is null or s.movie_id = cast(:movieId as varchar))
                    group by s.movie_id, movie_name
                ),
                occupancy as (
                    select scheduled.movie_id,
                           coalesce(sold.seats_sold, 0) as seats_sold,
                           scheduled.available_seats
                    from (
                        select s.movie_id, count(se.seat_id) as available_seats
                        from schedule s
                        join seat se on se.cinema_room_id = s.cinema_room_id and se.status = 'ACTIVE'
                        where s.start_time >= :startDateTime
                          and s.start_time < :endDateTime
                          and (cast(:movieId as varchar) is null or s.movie_id = cast(:movieId as varchar))
                        group by s.movie_id
                    ) scheduled
                    left join (
                        select s.movie_id, count(inv_s.invoice_seat_id) as seats_sold
                        from invoice i
                        join payment p on p.invoice_id = i.invoice_id
                        join schedule s on s.schedule_id = i.schedule_id
                        join invoice_seat inv_s on inv_s.invoice_id = i.invoice_id
                        where %s
                          and s.start_time >= :startDateTime
                          and s.start_time < :endDateTime
                          and (cast(:movieId as varchar) is null or s.movie_id = cast(:movieId as varchar))
                        group by s.movie_id
                    ) sold on sold.movie_id = scheduled.movie_id
                )
                select sales.movie_id,
                       sales.movie_name,
                       sales.tickets_sold,
                       sales.total_revenue,
                       case when coalesce(occupancy.available_seats, 0) = 0
                            then 0
                            else round((coalesce(occupancy.seats_sold, 0)::numeric / occupancy.available_seats::numeric) * 100, 2)
                       end as average_occupancy_rate
                from sales
                left join occupancy on occupancy.movie_id = sales.movie_id
                order by sales.total_revenue desc, sales.tickets_sold desc, sales.movie_name
                limit :limit
                """.formatted(PAID_STATUS_SQL, PAID_STATUS_SQL);

        return jdbcTemplate.query(sql, params, (rs, rowNum) ->
                DashboardDTO.MovieRevenue.builder()
                        .movieId(rs.getString("movie_id"))
                        .movieName(rs.getString("movie_name"))
                        .ticketsSold(rs.getLong("tickets_sold"))
                        .totalRevenue(defaultMoney(rs.getBigDecimal("total_revenue")))
                        .averageOccupancyRate(defaultMoney(rs.getBigDecimal("average_occupancy_rate")))
                        .build());
    }

    private DashboardDTO.Filter buildFilter(String timeFilter, LocalDate startDate, LocalDate endDate, String movieId) {
        String normalizedFilter = StringUtils.hasText(timeFilter)
                ? timeFilter.trim().toUpperCase(Locale.ROOT)
                : "THIS_MONTH";
        LocalDate today = LocalDate.now();
        LocalDate resolvedStart;
        LocalDate resolvedEnd;

        switch (normalizedFilter) {
            case "TODAY" -> {
                resolvedStart = today;
                resolvedEnd = today;
            }
            case "THIS_WEEK" -> {
                resolvedStart = today.with(DayOfWeek.MONDAY);
                resolvedEnd = resolvedStart.plusDays(6);
            }
            case "THIS_QUARTER" -> {
                int firstMonthOfQuarter = ((today.getMonthValue() - 1) / 3) * 3 + 1;
                resolvedStart = LocalDate.of(today.getYear(), firstMonthOfQuarter, 1);
                resolvedEnd = resolvedStart.plusMonths(3).minusDays(1);
            }
            case "THIS_YEAR" -> {
                resolvedStart = LocalDate.of(today.getYear(), 1, 1);
                resolvedEnd = LocalDate.of(today.getYear(), 12, 31);
            }
            case "CUSTOM" -> {
                if (startDate == null || endDate == null) {
                    throw new IllegalArgumentException("Custom Date Range cần có startDate và endDate.");
                }
                resolvedStart = startDate;
                resolvedEnd = endDate;
            }
            case "THIS_MONTH" -> {
                resolvedStart = today.withDayOfMonth(1);
                resolvedEnd = resolvedStart.plusMonths(1).minusDays(1);
            }
            default -> throw new IllegalArgumentException("timeFilter không hợp lệ.");
        }

        if (resolvedEnd.isBefore(resolvedStart)) {
            throw new IllegalArgumentException("endDate phải lớn hơn hoặc bằng startDate.");
        }

        if (ChronoUnit.DAYS.between(resolvedStart, resolvedEnd) + 1 > 366) {
            throw new IllegalArgumentException("Khoảng thời gian báo cáo không được vượt quá 1 năm.");
        }

        String normalizedMovieId = StringUtils.hasText(movieId) ? movieId.trim() : null;

        return DashboardDTO.Filter.builder()
                .timeFilter(normalizedFilter)
                .startDate(resolvedStart)
                .endDate(resolvedEnd)
                .startDateTime(resolvedStart.atStartOfDay())
                .endDateTime(resolvedEnd.plusDays(1).atStartOfDay())
                .movieId(normalizedMovieId)
                .build();
    }

    private MapSqlParameterSource params(DashboardDTO.Filter filter) {
        return new MapSqlParameterSource()
                .addValue("startDateTime", Timestamp.valueOf(filter.getStartDateTime()))
                .addValue("endDateTime", Timestamp.valueOf(filter.getEndDateTime()))
                .addValue("movieId", filter.getMovieId());
    }

    private String trendBucket(DashboardDTO.Filter filter) {
        long days = ChronoUnit.DAYS.between(filter.getStartDate(), filter.getEndDate()) + 1;
        if (days <= 31) {
            return "day";
        }
        if (days <= 120) {
            return "week";
        }
        return "month";
    }

    private String trendLabelFormat(DashboardDTO.Filter filter) {
        return switch (trendBucket(filter)) {
            case "day" -> "YYYY-MM-DD";
            case "week" -> "\"Week\" IW/YYYY";
            default -> "YYYY-MM";
        };
    }

    private BigDecimal percent(BigDecimal numerator, BigDecimal denominator) {
        BigDecimal safeNumerator = numerator == null ? BigDecimal.ZERO : numerator;
        BigDecimal safeDenominator = denominator == null ? BigDecimal.ZERO : denominator;
        if (safeDenominator.compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO;
        }
        return safeNumerator
                .multiply(BigDecimal.valueOf(100))
                .divide(safeDenominator, 2, RoundingMode.HALF_UP);
    }

    private BigDecimal defaultMoney(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }
}