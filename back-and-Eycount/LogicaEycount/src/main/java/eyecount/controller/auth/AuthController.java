package eyecount.controller.auth;

import eyecount.dto.auth.LoginDTO;
import eyecount.dto.auth.LoginResponseDTO;
import eyecount.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
/*
 * Controller da area Auth. Controller responsavel por receber requisicoes HTTP, validar os
 * dados de entrada e encaminhar as operacoes para os services.
 */

@RestController
@RequestMapping("/auth")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class AuthController {
    // Dependencia que executa as regras de negocio desta operacao.
    private final AuthService authService;

    /*
     * Recebe as credenciais e solicita a autenticacao do usuario.
     */
    @PostMapping("/login")
    public ResponseEntity<LoginResponseDTO> login(
            @Valid @RequestBody LoginDTO dto
    ) {
        // Encaminha a solicitacao para o service responsavel e monta a resposta HTTP.
        System.out.println("CHEGOU NO CONTROLLER");

        return ResponseEntity.ok(
                authService.login(dto)
        );
    }
}
