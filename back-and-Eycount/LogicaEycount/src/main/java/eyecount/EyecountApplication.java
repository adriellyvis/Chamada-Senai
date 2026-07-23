package eyecount;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;
/*
 * Classe principal responsavel por iniciar a aplicacao Spring Boot.
 */

@SpringBootApplication
@EnableScheduling //ativa o agendador de tarefas do Spring.
public class EyecountApplication {
    public static void main(String[] args) {
        SpringApplication.run(EyecountApplication.class, args);
    }
}
