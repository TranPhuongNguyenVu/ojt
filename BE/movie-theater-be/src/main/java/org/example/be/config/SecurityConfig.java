package org.example.be.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
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

                        // 2. PHÂN QUYỀN ADMIN & SYSTEM ADMIN: Các API quản trị hệ thống
                        .requestMatchers("/api/admin/**").hasAnyAuthority("ROLE_Admin", "ROLE_SystemAdmin")
                        .requestMatchers("/api/system-admin/**").hasAuthority("ROLE_SystemAdmin")
                        .requestMatchers("/api/employees/**").hasAnyAuthority("ROLE_Admin", "ROLE_SystemAdmin")

                        // 3. PHÂN QUYỀN EMPLOYEE & ADMIN & SYSTEM ADMIN: Các API nghiệp vụ quầy vé
                        .requestMatchers("/api/employee/**").hasAnyAuthority("ROLE_Employee", "ROLE_Admin", "ROLE_SystemAdmin")
                        .requestMatchers("/api/members/**").hasAnyAuthority("ROLE_Admin", "ROLE_SystemAdmin", "ROLE_Employee")

                        // 4. Upload & Profile API — bắt buộc đăng nhập
                        .requestMatchers("/api/upload/**").authenticated()
                        .requestMatchers("/api/profile/**").authenticated()

                        // 5. User Booking Protected Endpoints — bắt buộc đăng nhập
                        .requestMatchers("/api/booking/history", "/api/booking/points-history", "/api/booking/member-score", "/api/booking/invoice/*/cancel").authenticated()

                        .anyRequest().permitAll()
                )
                // Đặt máy quét JWT ra trước cổng
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(Arrays.asList(
                "http://localhost:5173"
        ));
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