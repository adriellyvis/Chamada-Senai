package prezence.config;

import prezence.security.JwtFilter;

import org.springframework.boot.web.servlet.FilterRegistrationBean;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import org.springframework.http.HttpMethod;

import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;


@Configuration
public class SecurityConfig {


    // =====================================================
    // PASSWORD ENCODER
    // =====================================================

    @Bean
    public PasswordEncoder passwordEncoder() {

        return new BCryptPasswordEncoder();
    }


    // =====================================================
    // EVITAR DUPLA EXECUÇÃO DO JWT FILTER
    // =====================================================

    /*
     * JwtFilter possui @Component.
     *
     * Como também será adicionado manualmente à cadeia
     * do Spring Security com addFilterBefore(),
     * desabilitamos o registro automático dele como
     * filtro comum do Servlet.
     */
    @Bean
    public FilterRegistrationBean<JwtFilter>
    jwtFilterRegistration(
            JwtFilter jwtFilter
    ) {

        FilterRegistrationBean<JwtFilter> registration =
                new FilterRegistrationBean<>(
                        jwtFilter
                );

        registration.setEnabled(
                false
        );

        return registration;
    }


    // =====================================================
    // SECURITY FILTER CHAIN
    // =====================================================

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http,
            JwtFilter jwtFilter
    ) throws Exception {

        http

                // API REST usando JWT.
                .csrf(csrf ->
                        csrf.disable()
                )

                .cors(
                        Customizer.withDefaults()
                )

                // Nenhuma sessão HTTP é mantida.
                .sessionManagement(session ->
                        session.sessionCreationPolicy(
                                SessionCreationPolicy.STATELESS
                        )
                )

                // Prezence não utiliza formulário
                // padrão do Spring Security.
                .formLogin(form ->
                        form.disable()
                )

                .httpBasic(basic ->
                        basic.disable()
                )

                .logout(logout ->
                        logout.disable()
                )


                // =====================================================
                // AUTORIZAÇÃO
                // =====================================================

                /*
                 * Neste projeto a validação de autenticação
                 * e de perfil continua sendo realizada
                 * diretamente pelo JwtFilter.
                 *
                 * Por isso usamos permitAll() aqui.
                 *
                 * O JwtFilter é responsável por devolver:
                 *
                 * 401 -> token ausente/inválido
                 * 403 -> perfil sem permissão
                 */
                .authorizeHttpRequests(auth ->
                        auth

                                // Preflight CORS.
                                .requestMatchers(
                                        HttpMethod.OPTIONS,
                                        "/**"
                                )
                                .permitAll()

                                // Rotas públicas.
                                .requestMatchers(
                                        "/auth/login",
                                        "/error"
                                )
                                .permitAll()

                                // Restante será validado
                                // pelo JwtFilter.
                                .anyRequest()
                                .permitAll()
                )


                // =====================================================
                // JWT FILTER
                // =====================================================

                .addFilterBefore(
                        jwtFilter,
                        UsernamePasswordAuthenticationFilter.class
                );


        return http.build();
    }

    // =====================================================
// CORS GLOBAL
// =====================================================

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {

        CorsConfiguration configuration =
                new CorsConfiguration();

        /*
         * Durante o desenvolvimento, o front pode ser servido
         * por Live Server/Vite em diferentes portas locais.
         *
         * Em produção, substituir pelos domínios exatos
         * onde o Prezence será hospedado.
         */
        configuration.setAllowedOriginPatterns(
                List.of(
                        "http://localhost:*",
                        "http://127.0.0.1:*"
                )
        );

        configuration.setAllowedMethods(
                List.of(
                        "GET",
                        "POST",
                        "PUT",
                        "PATCH",
                        "DELETE",
                        "OPTIONS"
                )
        );

        configuration.setAllowedHeaders(
                List.of(
                        "Authorization",
                        "Content-Type",
                        "Accept"
                )
        );

        /*
         * O Prezence utiliza JWT no header Authorization,
         * não cookies de autenticação.
         */
        configuration.setAllowCredentials(
                false
        );

        configuration.setMaxAge(
                3600L
        );

        UrlBasedCorsConfigurationSource source =
                new UrlBasedCorsConfigurationSource();

        source.registerCorsConfiguration(
                "/**",
                configuration
        );

        return source;
    }
}