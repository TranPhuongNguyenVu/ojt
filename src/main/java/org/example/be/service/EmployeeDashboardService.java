package org.example.be.service;

import org.example.be.dto.EmployeeDashboardDTO;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class EmployeeDashboardService {
    private static final String PAID_STATUS_SQL = """
            upper(coalesce(p.payment_status, '')) in ('PAID', 'SUCCESS', 'SUCCESSFUL', 'COMPLETED')
            """;

    private final NamedParameterJdbcTemplate jdbcTemplate;

    public EmployeeDashboardService(NamedParameterJdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public EmployeeDashboardDTO.Overview getOverview() {
        return EmployeeDashboardDTO.Overview.builder()
                .operationalStats(getOperationalStats())
                .upcomingShowtimes(getUpcomingShowtimes())
                .build();
    }

    public EmployeeDashboardDTO.OperationalStats getOperationalStats() {
        LocalDateTime todayStart = LocalDate.now().atStartOfDay();
        LocalDateTime tomorrowStart = todayStart.plusDays(1);

        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("todayStart", Timestamp.valueOf(todayStart))
                .addValue("tomorrowStart", Timestamp.valueOf(tomorrowStart));

        String sql = """
                select
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
                       and coalesce(p.created_at, i.booking_date) < :tomorrowStart) as revenue_today
                """.formatted(PAID_STATUS_SQL, PAID_STATUS_SQL);

        return jdbcTemplate.queryForObject(sql, params, (rs, rowNum) ->
                EmployeeDashboardDTO.OperationalStats.builder()
                        .ticketsSoldToday(rs.getLong("tickets_sold_today"))
                        .revenueToday(defaultMoney(rs.getBigDecimal("revenue_today")))
                        .build());
    }

    public List<EmployeeDashboardDTO.UpcomingShowtime> getUpcomingShowtimes() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime windowEnd = now.plusHours(2);
        LocalDateTime reminderEnd = now.plusMinutes(15);

        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("now", Timestamp.valueOf(now))
                .addValue("windowEnd", Timestamp.valueOf(windowEnd))
                .addValue("reminderEnd", Timestamp.valueOf(reminderEnd));

        String sql = """
                select
                    s.schedule_id,
                    coalesce(nullif(m.movie_name_vn, ''), m.movie_name_english, s.movie_id) as movie_name,
                    coalesce(string_agg(distinct v.version_name, ', '), '') as movie_format,
                    s.start_time,
                    cr.cinema_room_name,
                    count(distinct se.seat_id) as total_seats,
                    count(distinct inv_s.invoice_seat_id) as sold_seats
                from schedule s
                                         join movie m
                                             on m.movie_id = s.movie_id
                                            and m.status is distinct from 'INACTIVE'
                                         join cinema_room cr
                                             on cr.cinema_room_id = s.cinema_room_id
                                            and cr.status = 'ACTIVE'
                                         left join movie_version mv
                                             on mv.movie_id = m.movie_id
                                         left join version v
                                             on v.version_id = mv.version_id
                                         left join seat se
                                             on se.cinema_room_id = s.cinema_room_id
                                            and se.status = 'ACTIVE'
                                         left join invoice i
                                             on i.schedule_id = s.schedule_id
                                         left join payment p
                                             on p.invoice_id = i.invoice_id
                                            and %s
                                         left join invoice_seat inv_s
                                             on inv_s.invoice_id = i.invoice_id
                                            and p.payment_id is not null
                                         where s.start_time >= :now
                                           and s.start_time <= :windowEnd
                                         group by s.schedule_id,
                                                  movie_name,
                                                  s.start_time,
                                                  cr.cinema_room_name
                                         order by s.start_time asc
                """.formatted(PAID_STATUS_SQL);

        return jdbcTemplate.query(sql, params, (rs, rowNum) -> {
            long totalSeats = rs.getLong("total_seats");
            long soldSeats = rs.getLong("sold_seats");
            long availableSeats = Math.max(totalSeats - soldSeats, 0);

            return EmployeeDashboardDTO.UpcomingShowtime.builder()
                    .scheduleId(rs.getInt("schedule_id"))
                    .movieName(rs.getString("movie_name"))
                    .movieFormat(rs.getString("movie_format"))
                    .showtime(rs.getTimestamp("start_time").toLocalDateTime())
                    .cinemaRoom(rs.getString("cinema_room_name"))
                    .totalSeats(totalSeats)
                    .soldSeats(soldSeats)
                    .availableSeats(availableSeats)
                    .occupancyRate(percent(BigDecimal.valueOf(soldSeats), BigDecimal.valueOf(totalSeats)))
                    .startsSoon(!rs.getTimestamp("start_time").toLocalDateTime().isAfter(reminderEnd))
                    .build();
        });
    }

    private BigDecimal percent(BigDecimal numerator, BigDecimal denominator) {
        if (denominator == null || denominator.compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO;
        }
        return numerator
                .multiply(BigDecimal.valueOf(100))
                .divide(denominator, 2, RoundingMode.HALF_UP);
    }

    private BigDecimal defaultMoney(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }
}
