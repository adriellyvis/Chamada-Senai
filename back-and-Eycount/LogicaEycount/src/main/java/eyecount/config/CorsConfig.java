package eyecount.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
/*
 * Classe de configuracao do Spring usada para definir o comportamento geral da aplicacao.
 */

@Configuration
public class CorsConfig {

    /*
     * Configura as origens, metodos e cabecalhos aceitos pelo CORS.
     */
    @Bean
    public WebMvcConfigurer corsConfigurer() {
        // Aplica as configuracoes definidas para este componente do Spring.
        return new WebMvcConfigurer() {
            /*
             * Metodo addCorsMappings responsavel por executar esta operacao.
             */
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                // Aplica as configuracoes definidas para este componente do Spring.
                registry
                        .addMapping("/**")
                        .allowedOriginPatterns("*")
                        .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                        .allowedHeaders("*");
            }
        };
    }
}
