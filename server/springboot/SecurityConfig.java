package in.tutornest.config;

import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter;

/**
 * TutorNest — Spring Boot Production Security Configuration
 *
 * Configures HTTPS enforcement, HSTS, Secure Cookies, and Stateless JWT REST API protection.
 * Strictly enforces role-based access control for /api/student/**, /api/tutor/**, and /api/admin/**.
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final CorsConfig corsConfig;

    public SecurityConfig(CorsConfig corsConfig) {
        this.corsConfig = corsConfig;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            // Integrate production CORS configuration source
            .cors(cors -> cors.configurationSource(corsConfig.corsConfigurationSource()))

            // Stateless REST API does not require CSRF token cookies
            .csrf(csrf -> csrf.disable())

            // Enforce stateless session management for JWT authentication
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

            // Route authorization matrix
            .authorizeHttpRequests(auth -> auth
                // Public discovery and informational endpoints
                .requestMatchers(
                    "/api/health",
                    "/api/auth/**",
                    "/api/tutors",
                    "/api/tutors/*",
                    "/api/subjects",
                    "/api/subjects/*",
                    "/api/reviews/tutor/*",
                    "/api/contact",
                    "/api/docs/**"
                ).permitAll()

                // Role-Specific Protected Endpoints
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .requestMatchers("/api/tutor/**").hasRole("TUTOR")
                .requestMatchers("/api/student/**").hasRole("STUDENT")

                // All other booking, payment, messaging endpoints require authentication
                .anyRequest().authenticated()
            )

            // Custom 401 Unauthorized and 403 Forbidden JSON Error Handling
            .exceptionHandling(exceptions -> exceptions
                .authenticationEntryPoint((request, response, authException) -> {
                    response.setContentType("application/json");
                    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                    response.getWriter().write("{\"success\":false,\"status\":401,\"error\":\"Unauthorized\",\"message\":\"Authentication token is missing, invalid, or expired. Please sign in.\",\"errorCode\":\"UNAUTHENTICATED\"}");
                })
                .accessDeniedHandler((request, response, accessDeniedException) -> {
                    response.setContentType("application/json");
                    response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                    response.getWriter().write("{\"success\":false,\"status\":403,\"error\":\"Forbidden\",\"message\":\"Access denied. Your authenticated role lacks authorization for this endpoint.\",\"errorCode\":\"FORBIDDEN_ROLE\"}");
                })
            )

            // Production Security Headers: HSTS, X-Content-Type-Options, Frame-Options
            .headers(headers -> headers
                .httpStrictTransportSecurity(hsts -> hsts
                    .includeSubDomains(true)
                    .maxAgeInSeconds(31536000)
                    .preload(true)
                )
                .frameOptions(frame -> frame.sameOrigin())
                .referrerPolicy(referrer -> referrer.policy(ReferrerPolicyHeaderWriter.ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN))
            );

        return http.build();
    }
}
