package org.example.be.config;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
@EnableMethodSecurity
public class SecurityConfig {

    // Kéo cái máy quét JWT vào đây
    private final JwtAuthFilter jwtAuthFilter;

    @Value("${app.cors.allowed-origins}")
    private String allowedOrigins;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(csrf -> csrf.disable())
                .authorizeHttpRequests(auth -> auth
                        // 1. THẢ CỬA TỰ DO: Ai cũng vào được để Đăng nhập, Đăng ký, Quên mật khẩu
                        .requestMatchers("/api/auth/**").permitAll()

                        // WebSocket STOMP handshake (realtime seat map)
                        .requestMatchers("/ws-seats", "/ws-seats/**").permitAll()

                        .requestMatchers("/api/test/hello", "/api/versions").permitAll()

                        // Form liên hệ công khai → vào hộp thư hỗ trợ admin
                        .requestMatchers(HttpMethod.POST, "/api/support").permitAll()

                        .requestMatchers(HttpMethod.GET,
                                "/api/movies/**",
                                "/api/schedules/**",
                                "/api/cinema-rooms/**",
                                "/api/combos/**",
                                "/api/drinks/**",
                                "/api/foods/**",
                                "/api/promotions/**",
                                "/api/types/**"
                        ).permitAll()

                        .requestMatchers(HttpMethod.GET, "/api/booking/showtime/*/seats").permitAll()
                        .requestMatchers(HttpMethod.POST,
                                "/api/booking/showtime/*/confirm",
                                "/api/booking/showtime/*/release"
                        ).permitAll()

                        .requestMatchers(
                                "/api/payment/momo/ipn",
                                "/api/payment/momo/verify-redirect",
                                "/api/payment/vnpay/verify-return"
                        ).permitAll()

                        // 2. PHÂN QUYỀN ADMIN & SYSTEM ADMIN: Các API quản trị hệ thống
                        .requestMatchers("/api/admin/**").hasAnyAuthority("ROLE_Admin", "ROLE_SystemAdmin")
                        .requestMatchers("/api/system-admin/**").hasAuthority("ROLE_SystemAdmin")
                        .requestMatchers("/api/employees/**").hasAnyAuthority("ROLE_Admin", "ROLE_SystemAdmin")

                        // 3. PHÂN QUYỀN EMPLOYEE & ADMIN & SYSTEM ADMIN: Các API nghiệp vụ quầy vé
                        .requestMatchers("/api/employee/**").hasAnyAuthority("ROLE_Employee", "ROLE_Admin", "ROLE_SystemAdmin")

                        // API riêng để Member tự xem/sửa thông tin của chính mình — chỉ cần đăng nhập,
                        // phải khai báo TRƯỚC rule "/api/members/**" bên dưới (đang giới hạn theo role) để không bị chặn nhầm
                        .requestMatchers(HttpMethod.GET, "/api/members/me").authenticated()
                        .requestMatchers(HttpMethod.PUT, "/api/members/me").authenticated()
                        .requestMatchers("/api/members/**").hasAnyAuthority("ROLE_Admin", "ROLE_SystemAdmin", "ROLE_Employee")

                        // 4. Upload & Profile API — bắt buộc đăng nhập
                        .requestMatchers("/api/upload/**").authenticated()
                        .requestMatchers("/api/profile/**").authenticated()

                        // 5. User Booking Protected Endpoints — bắt buộc đăng nhập
                        .requestMatchers("/api/booking/history", "/api/booking/points-history", "/api/booking/member-score").authenticated()

                        .anyRequest().authenticated()
                )
                // Đặt máy quét JWT ra trước cổng
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(Arrays.asList(allowedOrigins.split(",")));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public org.springframework.security.crypto.password.PasswordEncoder passwordEncoder() {
        return new org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder();
    }
}