package eyecount.config;

import jakarta.annotation.PostConstruct;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;
/*
 * Classe de configuracao do Spring usada para definir o comportamento geral da aplicacao.
 */

@Configuration
public class SecurityConfig {

    /*
     * Metodo init responsavel por executar esta operacao.
     */
    @PostConstruct
    public void init() {
        // Aplica as configuracoes definidas para este componente do Spring.
        System.out.println("SECURITY CONFIG CARREGOU - TUDO LIBERADO");
    }

    /*
     * Configura as regras de seguranca aplicadas as requisicoes HTTP.
     */
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        // Aplica as configuracoes definidas para este componente do Spring.
        http
                .csrf(csrf -> csrf.disable())
                .cors(Customizer.withDefaults())
                .authorizeHttpRequests(auth -> auth
                        .anyRequest().permitAll()
                )
                .formLogin(form -> form.disable())
                .httpBasic(basic -> basic.disable());

        return http.build();
    }
}
