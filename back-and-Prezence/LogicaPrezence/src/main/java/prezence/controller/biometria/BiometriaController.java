package prezence.controller.biometria;

import prezence.dto.biometria.BiometriaIdentidadeDTO;
import prezence.dto.biometria.CadastroBiometriaBancoDTO;
import prezence.dto.biometria.SolicitacaoPresencaBiometricaDTO;

import prezence.security.BiometriaInternalAuthService;

import prezence.service.BiometriaBancoService;
import prezence.service.SolicitacaoPresencaBiometricaService;

import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import org.springframework.web.bind.annotation.*;

import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;


@RestController
@RequestMapping("/biometria")
@RequiredArgsConstructor
public class BiometriaController {

    private final BiometriaBancoService biometriaBancoService;

    private final SolicitacaoPresencaBiometricaService
            solicitacaoPresencaBiometricaService;

    private final BiometriaInternalAuthService
            biometriaInternalAuthService;


    // =====================================================
    // ALUNO - SOLICITAR CONFIRMAÇÃO DE PRESENÇA
    // =====================================================

    @PostMapping("/presenca/solicitar")
    public ResponseEntity<SolicitacaoPresencaBiometricaDTO>
    solicitarConfirmacaoPresencaBiometrica(

            @RequestAttribute("usuarioId")
            Integer usuarioId,

            @RequestAttribute("perfil")
            String perfil,

            @RequestBody
            SolicitacaoPresencaBiometricaDTO dto
    ) {

        exigirAluno(perfil);

        SolicitacaoPresencaBiometricaDTO solicitacao =
                solicitacaoPresencaBiometricaService
                        .solicitar(
                                usuarioId,
                                dto.getAlunoId(),
                                dto.getAulaId()
                        );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(solicitacao);
    }


    // =====================================================
    // ALUNO - CONSULTAR STATUS DA SOLICITAÇÃO
    // =====================================================

    @GetMapping("/presenca/status")
    public ResponseEntity<SolicitacaoPresencaBiometricaDTO>
    consultarStatusPresencaBiometrica(

            @RequestAttribute("usuarioId")
            Integer usuarioId,

            @RequestAttribute("perfil")
            String perfil,

            @RequestParam
            Integer aulaId
    ) {

        exigirAluno(perfil);

        SolicitacaoPresencaBiometricaDTO solicitacao =
                solicitacaoPresencaBiometricaService
                        .buscarStatus(
                                usuarioId,
                                aulaId
                        );

        if (solicitacao == null) {

            return ResponseEntity
                    .noContent()
                    .build();
        }

        return ResponseEntity.ok(
                solicitacao
        );
    }


    // =====================================================
    // PYTHON - SALVAR / RECADASTRAR AS 5 AMOSTRAS
    // =====================================================

    @PostMapping("/amostras")
    public ResponseEntity<Void>
    salvarAmostrasBiometricas(

            @RequestAttribute("usuarioId")
            Integer usuarioAutenticadoId,

            @RequestAttribute("perfil")
            String perfil,

            @RequestHeader(
                    value = "X-Prezence-Service-Key",
                    required = false
            )
            String serviceKey,

            @RequestBody
            CadastroBiometriaBancoDTO dto
    ) {

        /*
         * Além do JWT, exige a chave conhecida
         * somente pelo Python e pelo Spring.
         */
        biometriaInternalAuthService
                .validar(serviceKey);


        /*
         * Aluno/professor:
         * somente a própria biometria.
         *
         * Gestor:
         * pode cadastrar a biometria de outro usuário.
         */
        validarAcessoAoUsuario(
                usuarioAutenticadoId,
                perfil,
                dto.getUsuarioId()
        );


        biometriaBancoService
                .salvarAmostras(dto);


        return ResponseEntity
                .noContent()
                .build();
    }


    // =====================================================
    // PYTHON - BUSCAR AS AMOSTRAS DE UM USUÁRIO
    // =====================================================

    @GetMapping("/amostras/{usuarioId}")
    public ResponseEntity<CadastroBiometriaBancoDTO>
    buscarAmostrasBiometricas(

            @RequestAttribute("usuarioId")
            Integer usuarioAutenticadoId,

            @RequestAttribute("perfil")
            String perfil,

            @RequestHeader(
                    value = "X-Prezence-Service-Key",
                    required = false
            )
            String serviceKey,

            @PathVariable
            Integer usuarioId
    ) {

        biometriaInternalAuthService
                .validar(serviceKey);


        validarAcessoAoUsuario(
                usuarioAutenticadoId,
                perfil,
                usuarioId
        );


        CadastroBiometriaBancoDTO biometria =
                biometriaBancoService
                        .buscarAmostras(usuarioId);


        return ResponseEntity.ok(
                biometria
        );
    }


    // =====================================================
    // FRONT - VERIFICAR SE POSSUI BIOMETRIA
    // =====================================================

    @GetMapping("/amostras/{usuarioId}/status")
    public ResponseEntity<Map<String, Object>>
    verificarAmostrasBiometricas(

            @RequestAttribute("usuarioId")
            Integer usuarioAutenticadoId,

            @RequestAttribute("perfil")
            String perfil,

            @PathVariable
            Integer usuarioId
    ) {

        validarAcessoAoUsuario(
                usuarioAutenticadoId,
                perfil,
                usuarioId
        );


        boolean cadastrada =
                biometriaBancoService
                        .possuiBiometria(usuarioId);


        return ResponseEntity.ok(
                Map.of(
                        "usuarioId", usuarioId,
                        "cadastrada", cadastrada
                )
        );
    }


    // =====================================================
    // PYTHON - LISTAR IDENTIDADES FACIAIS
    // =====================================================

    @GetMapping("/identidades")
    public ResponseEntity<List<BiometriaIdentidadeDTO>>
    listarIdentidadesBiometricas(

            @RequestHeader(
                    value = "X-Prezence-Service-Key",
                    required = false
            )
            String serviceKey
    ) {

        /*
         * Endpoint extremamente sensível.
         *
         * O JWT já foi validado pelo JwtFilter.
         * Aqui também exigimos a chave interna.
         */
        biometriaInternalAuthService
                .validar(serviceKey);


        return ResponseEntity.ok(
                biometriaBancoService
                        .listarIdentidadesFaciais()
        );
    }


    // =====================================================
    // VALIDAÇÃO DE ACESSO À BIOMETRIA
    // =====================================================

    private void validarAcessoAoUsuario(
            Integer usuarioAutenticadoId,
            String perfil,
            Integer usuarioAlvoId
    ) {

        if (
                usuarioAutenticadoId == null
                        || usuarioAlvoId == null
        ) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Usuário não informado"
            );
        }


        // Gestor pode administrar biometria de outros usuários.
        if (
                perfil != null
                        && perfil.equalsIgnoreCase("gestor")
        ) {

            return;
        }


        // Outros perfis somente a própria biometria.
        if (
                !usuarioAutenticadoId
                        .equals(usuarioAlvoId)
        ) {

            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Você não possui permissão para acessar "
                            + "a biometria deste usuário"
            );
        }
    }


    // =====================================================
    // PRESENÇA BIOMÉTRICA - SOMENTE ALUNO
    // =====================================================

    private void exigirAluno(
            String perfil
    ) {

        if (
                perfil == null
                        || !perfil.equalsIgnoreCase("aluno")
        ) {

            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Somente alunos podem utilizar "
                            + "a presença biométrica"
            );
        }
    }
}