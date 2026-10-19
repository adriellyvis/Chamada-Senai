package prezence.controller.auth;

import prezence.dto.auth.LoginDTO;
import prezence.dto.auth.LoginResponseDTO;
import prezence.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import prezence.dto.auth.RecuperacaoSenhaIniciarDTO;
import prezence.dto.auth.RecuperacaoSenhaInicioResponseDTO;
import prezence.service.RecuperacaoSenhaService;
import prezence.dto.auth.RecuperacaoBiometriaResponseDTO;

import org.springframework.http.MediaType;
import org.springframework.web.multipart.MultipartFile;


/*
 * Controller da area Auth. Controller responsavel por receber requisicoes HTTP, validar os
 * dados de entrada e encaminhar as operacoes para os services.
 */

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {
    // Dependencia que executa as regras de negocio desta operacao.
    private final AuthService authService;
    private final RecuperacaoSenhaService recuperacaoSenhaService;

    /*
     * Recebe as credenciais e solicita a autenticacao do usuario.
     */
    @PostMapping("/login")
    public ResponseEntity<LoginResponseDTO> login(
            @Valid @RequestBody LoginDTO dto
    ) {

        return ResponseEntity.ok(
                authService.login(dto)
        );
    }

    @PostMapping("/recuperacao/iniciar")
    public ResponseEntity<RecuperacaoSenhaInicioResponseDTO>
    iniciarRecuperacao(

            @Valid
            @RequestBody
            RecuperacaoSenhaIniciarDTO dto
    ) {

        return ResponseEntity.ok(
                recuperacaoSenhaService
                        .iniciar(dto)
        );
    }

    @PostMapping(
            value = "/recuperacao/biometria",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public ResponseEntity<RecuperacaoBiometriaResponseDTO>
    validarBiometriaRecuperacao(

            @RequestParam("challengeId")
            String challengeId,

            @RequestPart("imagem")
            MultipartFile imagem
    ) {

        return ResponseEntity.ok(
                recuperacaoSenhaService
                        .validarBiometria(
                                challengeId,
                                imagem
                        )
        );
    }
}
