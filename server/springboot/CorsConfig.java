package in.tutornest.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.Arrays;
import java.util.List;

/**
 * TutorNest — Spring Boot Production CORS Configuration
 *
 * Configures Cross-Origin Resource Sharing (CORS) between:
 * Frontend Domain: https://tutornest.in (and https://www.tutornest.in)
 * Backend REST API: https://api.tutornest.in
 */
@Configuration
public class CorsConfig implements WebMvcConfigurer {

    @Value("${tutornest.cors.allowed-origins:https://tutornest.in,https://www.tutornest.in}")
    private String allowedOriginsConfig;

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        List<String> origins = Arrays.asList(allowedOriginsConfig.split(","));

        registry.addMapping("/api/**")
                .allowedOrigins(origins.toArray(new String[0]))
                .allowedMethods("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS")
                .allowedHeaders(
                        "Authorization",
                        "Content-Type",
                        "Accept",
                        "Origin",
                        "X-Requested-With",
                        "X-Request-Id"
                )
                .exposedHeaders("X-Request-Id", "Authorization")
                .allowCredentials(true) // Enables transmission of secure auth cookies & tokens
                .maxAge(3600);          // Cache preflight OPTIONS responses for 1 hour
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        List<String> origins = Arrays.asList(allowedOriginsConfig.split(","));

        configuration.setAllowedOrigins(origins);
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList(
                "Authorization",
                "Content-Type",
                "Accept",
                "Origin",
                "X-Requested-With",
                "X-Request-Id"
        ));
        configuration.setExposedHeaders(Arrays.asList("X-Request-Id", "Authorization"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", configuration);
        return source;
    }
}
