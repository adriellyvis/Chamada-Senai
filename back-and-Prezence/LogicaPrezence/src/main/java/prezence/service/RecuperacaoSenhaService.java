package prezence.service;

import prezence.dto.auth.RecuperacaoSenhaIniciarDTO;
import prezence.dto.auth.RecuperacaoSenhaInicioResponseDTO;

import prezence.model.RecuperacaoSenha;
import prezence.model.StatusRecuperacaoSenha;
import prezence.model.Usuario;

import prezence.repository.RecuperacaoSenhaRepository;
import prezence.repository.UsuarioRepository;

import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import prezence.dto.auth.RecuperacaoBiometriaResponseDTO;
import prezence.dto.biometria.BiometriaPythonValidacaoResponseDTO;

import org.springframework.web.multipart.MultipartFile;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Locale;
import java.util.UUID;


@Service
@RequiredArgsConstructor
public class RecuperacaoSenhaService {
    private final BiometriaPythonClient
            biometriaPythonClient;
    private static final int MAX_TENTATIVAS_BIOMETRIA =
            3;

    private static final ZoneId FUSO_HORARIO =
            ZoneId.of("America/Sao_Paulo");

    private static final int MINUTOS_EXPIRACAO =
            10;


    private final UsuarioRepository
            usuarioRepository;

    private final RecuperacaoSenhaRepository
            recuperacaoSenhaRepository;

    private final BiometriaBancoService
            biometriaBancoService;


    @Transactional
    public RecuperacaoSenhaInicioResponseDTO iniciar(
            RecuperacaoSenhaIniciarDTO dto
    ) {

        if (
                dto == null
                        || dto.getEmail() == null
                        || dto.getEmail().isBlank()
                        || dto.getPerfil() == null
                        || dto.getPerfil().isBlank()
        ) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "E-mail e perfil são obrigatórios"
            );
        }


        String email =
                dto.getEmail()
                        .trim()
                        .toLowerCase(
                                Locale.ROOT
                        );


        String perfilInformado =
                dto.getPerfil()
                        .trim()
                        .toLowerCase(
                                Locale.ROOT
                        );


        Usuario usuario =
                usuarioRepository
                        .findByEmailIgnoreCase(
                                email
                        )
                        .orElseThrow(() ->
                                dadosRecuperacaoInvalidos()
                        );


        if (
                !Boolean.TRUE.equals(
                        usuario.getAtivo()
                )
        ) {

            throw dadosRecuperacaoInvalidos();
        }


        if (
                usuario.getPerfil() == null
                        || usuario.getPerfil().getNome() == null
        ) {

            throw dadosRecuperacaoInvalidos();
        }


        String perfilUsuario =
                usuario
                        .getPerfil()
                        .getNome()
                        .trim()
                        .toLowerCase(
                                Locale.ROOT
                        );


        if (
                !perfilUsuario.equals(
                        perfilInformado
                )
        ) {

            throw dadosRecuperacaoInvalidos();
        }


        boolean possuiBiometria =
                biometriaBancoService
                        .possuiBiometria(
                                usuario.getId()
                        );


        if (!possuiBiometria) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Não foi possível iniciar a recuperação automática. "
                            + "Procure a instituição para regularizar o acesso."
            );
        }


        LocalDateTime agora =
                LocalDateTime.now(
                        FUSO_HORARIO
                );


        RecuperacaoSenha recuperacao =
                new RecuperacaoSenha();


        recuperacao.setChallengeId(
                UUID.randomUUID()
                        .toString()
        );


        recuperacao.setUsuario(
                usuario
        );


        recuperacao.setStatus(
                StatusRecuperacaoSenha
                        .AGUARDANDO_BIOMETRIA
        );


        recuperacao.setTentativas(
                0
        );


        recuperacao.setCriadoEm(
                agora
        );


        recuperacao.setExpiraEm(
                agora.plusMinutes(
                        MINUTOS_EXPIRACAO
                )
        );


        RecuperacaoSenha salva =
                recuperacaoSenhaRepository
                        .save(
                                recuperacao
                        );


        return new RecuperacaoSenhaInicioResponseDTO(

                salva.getChallengeId(),

                salva.getExpiraEm(),

                "Validação inicial concluída. "
                        + "Continue com o Face Scan."
        );
    }


    private ResponseStatusException
    dadosRecuperacaoInvalidos() {

        /*
         * Mensagem propositalmente genérica.
         *
         * Evita revelar publicamente se determinado
         * e-mail está ou não cadastrado.
         */
        return new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Não foi possível confirmar uma conta ativa "
                        + "com os dados informados. "
                        + "Confira os dados ou procure a instituição."
        );
    }

    @Transactional(
            noRollbackFor = ResponseStatusException.class
    )
    public RecuperacaoBiometriaResponseDTO validarBiometria(

            String challengeId,

            MultipartFile imagem
    ) {

        // =====================================================
        // VALIDAR ENTRADA
        // =====================================================

        if (
                challengeId == null
                        ||
                        challengeId.isBlank()
        ) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Challenge inválido"
            );
        }


        if (
                imagem == null
                        ||
                        imagem.isEmpty()
        ) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "A imagem é obrigatória"
            );
        }


        // =====================================================
        // BUSCAR RECUPERAÇÃO
        // =====================================================

        RecuperacaoSenha recuperacao =
                recuperacaoSenhaRepository
                        .findByChallengeId(
                                challengeId.trim()
                        )
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.BAD_REQUEST,
                                        "Solicitação de recuperação inválida"
                                )
                        );


        LocalDateTime agora =
                LocalDateTime.now(
                        FUSO_HORARIO
                );


        // =====================================================
        // EXPIRAÇÃO
        // =====================================================

        if (
                recuperacao.getExpiraEm() == null
                        ||
                        agora.isAfter(
                                recuperacao.getExpiraEm()
                        )
        ) {

            recuperacao.setStatus(
                    StatusRecuperacaoSenha.EXPIRADA
            );


            recuperacaoSenhaRepository.save(
                    recuperacao
            );


            throw new ResponseStatusException(
                    HttpStatus.GONE,
                    "Esta solicitação expirou. Inicie a recuperação novamente."
            );
        }


        // =====================================================
        // STATUS
        // =====================================================

        if (
                recuperacao.getStatus()
                        ==
                        StatusRecuperacaoSenha.BIOMETRIA_VALIDADA
        ) {

            return new RecuperacaoBiometriaResponseDTO(

                    true,

                    Math.max(
                            0,
                            MAX_TENTATIVAS_BIOMETRIA
                                    -
                                    recuperacao.getTentativas()
                    ),

                    "Identidade já confirmada."
            );
        }


        if (
                recuperacao.getStatus()
                        !=
                        StatusRecuperacaoSenha.AGUARDANDO_BIOMETRIA
        ) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Esta solicitação não pode mais realizar validação biométrica"
            );
        }


        // =====================================================
        // TENTATIVAS
        // =====================================================

        int tentativasAtuais =
                recuperacao.getTentativas() == null
                        ?
                        0
                        :
                        recuperacao.getTentativas();


        if (
                tentativasAtuais
                        >=
                        MAX_TENTATIVAS_BIOMETRIA
        ) {

            recuperacao.setStatus(
                    StatusRecuperacaoSenha.BLOQUEADA
            );


            recuperacaoSenhaRepository.save(
                    recuperacao
            );


            throw new ResponseStatusException(
                    HttpStatus.TOO_MANY_REQUESTS,
                    "Limite de tentativas biométricas excedido"
            );
        }


        // =====================================================
        // USUÁRIO
        // =====================================================

        Usuario usuario =
                recuperacao.getUsuario();


        if (
                usuario == null
                        ||
                        usuario.getId() == null
                        ||
                        !Boolean.TRUE.equals(
                                usuario.getAtivo()
                        )
        ) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Não foi possível continuar a recuperação"
            );
        }


        // =====================================================
        // CHAMAR SERVIÇO PYTHON
        // =====================================================

        BiometriaPythonValidacaoResponseDTO respostaPython =
                biometriaPythonClient
                        .validar(
                                usuario.getId(),
                                imagem
                        );


        // Conta somente uma tentativa que realmente chegou
        // ao mecanismo biométrico.

        int novasTentativas =
                tentativasAtuais + 1;


        recuperacao.setTentativas(
                novasTentativas
        );


        // =====================================================
        // ROSTO NÃO CONFIRMADO
        // =====================================================

        if (!respostaPython.isValido()) {

            int restantes =
                    MAX_TENTATIVAS_BIOMETRIA
                            -
                            novasTentativas;


            if (restantes <= 0) {

                recuperacao.setStatus(
                        StatusRecuperacaoSenha.BLOQUEADA
                );
            }


            recuperacaoSenhaRepository.save(
                    recuperacao
            );


            if (restantes <= 0) {

                throw new ResponseStatusException(
                        HttpStatus.TOO_MANY_REQUESTS,
                        "Limite de tentativas biométricas excedido"
                );
            }


            return new RecuperacaoBiometriaResponseDTO(

                    false,

                    restantes,

                    "Não foi possível confirmar sua identidade. "
                            + "Tente novamente."
            );
        }


        // =====================================================
        // BIOMETRIA CONFIRMADA
        // =====================================================

        recuperacao.setStatus(
                StatusRecuperacaoSenha
                        .BIOMETRIA_VALIDADA
        );


        recuperacao.setBiometriaValidadaEm(
                agora
        );


        recuperacaoSenhaRepository.save(
                recuperacao
        );


        return new RecuperacaoBiometriaResponseDTO(

                true,

                MAX_TENTATIVAS_BIOMETRIA
                        -
                        novasTentativas,

                "Identidade confirmada."
        );
    }
}