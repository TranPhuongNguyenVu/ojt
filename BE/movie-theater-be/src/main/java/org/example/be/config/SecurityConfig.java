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
                        // 1. THẢ CỬA TỰ DO: Ai cũng vào được để Đăng nhập, Đăng ký
                        .requestMatchers("/api/auth/**").permitAll()

                        // WebSocket STOMP handshake (realtime seat map)
                        .requestMatchers("/ws-seats", "/ws-seats/**").permitAll()

                        // 2. PHÂN QUYỀN ADMIN: Chỉ người có quyền Admin mới được đụng vào các link bắt đầu bằng /api/admin/
//                        .requestMatchers("/api/admin/**").hasAuthority("ROLE_Admin")

                        // 3. PHÂN QUYỀN STAFF: Chỉ nhân viên rạp phim mới được vào
                        .requestMatchers("/api/employee/**").hasAuthority("ROLE_Employee")

                        // 4. Employee management API — bắt buộc đăng nhập (chi tiết quyền ở @PreAuthorize)
                        .requestMatchers("/api/employees/**").authenticated()

                        // 5. Upload API — bắt buộc đăng nhập
                        .requestMatchers("/api/upload/**").authenticated()

                        // 6. System Admin API — yêu cầu quyền SystemAdmin (chi tiết ở @PreAuthorize)
                        .requestMatchers("/api/system-admin/**").hasAuthority("ROLE_SystemAdmin")

                        // 7. Profile API — bắt buộc đăng nhập (mọi role đều dùng được)
                        .requestMatchers("/api/profile/**").authenticated()

                        .anyRequest().permitAll()
                )
                // Đặt máy quét JWT ra trước cổng
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(Arrays.asList("http://localhost:5173"));
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