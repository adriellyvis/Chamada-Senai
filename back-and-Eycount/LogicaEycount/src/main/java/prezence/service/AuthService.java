package prezence.service;

import prezence.dto.auth.LoginDTO;
import prezence.dto.auth.LoginResponseDTO;

import prezence.model.Aluno;
import prezence.model.Usuario;

import prezence.repository.AlunoRepository;
import prezence.repository.UsuarioRepository;

import prezence.security.JwtService;

import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.Locale;


@Service
@RequiredArgsConstructor
public class AuthService {

    private final UsuarioRepository usuarioRepository;

    private final AlunoRepository alunoRepository;

    private final PasswordEncoder passwordEncoder;

    private final JwtService jwtService;


    // =====================================================
    // LOGIN
    // =====================================================

    public LoginResponseDTO login(
            LoginDTO dto
    ) {

        // =====================================================
        // VALIDAR DADOS BÁSICOS
        // =====================================================

        if (
                dto == null
                        ||
                        dto.getIdentificador() == null
                        ||
                        dto.getIdentificador().isBlank()
                        ||
                        dto.getSenha() == null
                        ||
                        dto.getSenha().isBlank()
        ) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "E-mail ou RA e senha são obrigatórios"
            );
        }


        String senhaInformada =
                dto.getSenha();


        // =====================================================
        // BUSCAR USUÁRIO
        // =====================================================

        Usuario usuario =
                buscarUsuarioPorIdentificador(
                        dto
                );


        // =====================================================
        // VALIDAR SENHA
        // =====================================================

        String senhaBanco =
                usuario.getSenha();


        boolean senhaValida;


        /*
         * Usuário já utiliza BCrypt.
         */
        if (
                senhaEhBCrypt(
                        senhaBanco
                )
        ) {

            senhaValida =
                    passwordEncoder
                            .matches(
                                    senhaInformada,
                                    senhaBanco
                            );
        }

        /*
         * Usuário antigo com senha em texto puro.
         */
        else {

            senhaValida =
                    senhaBanco != null
                            &&
                            senhaBanco.equals(
                                    senhaInformada
                            );


            /*
             * Migração automática para BCrypt.
             */
            if (senhaValida) {

                usuario.setSenha(
                        passwordEncoder
                                .encode(
                                        senhaInformada
                                )
                );


                usuarioRepository.save(
                        usuario
                );
            }
        }


        // =====================================================
        // SENHA INVÁLIDA
        // =====================================================

        if (!senhaValida) {

            throw credenciaisInvalidas();
        }


        // =====================================================
        // USUÁRIO ATIVO
        // =====================================================

        if (
                !Boolean.TRUE.equals(
                        usuario.getAtivo()
                )
        ) {

            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Usuário inativo"
            );
        }


        // =====================================================
        // PERFIL
        // =====================================================

        if (
                usuario.getPerfil() == null
                        ||
                        usuario
                                .getPerfil()
                                .getNome() == null
                        ||
                        usuario
                                .getPerfil()
                                .getNome()
                                .isBlank()
        ) {

            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Usuário não possui perfil configurado"
            );
        }


        // =====================================================
        // GERAR TOKEN JWT
        // =====================================================

        String token =
                jwtService
                        .gerarToken(
                                usuario
                        );


        // =====================================================
        // RESPOSTA
        // =====================================================

        return new LoginResponseDTO(
                usuario.getId(),
                usuario.getNome(),
                usuario.getEmail(),
                usuario.getPerfil().getNome(),
                token
        );
    }


    // =====================================================
    // BUSCAR POR E-MAIL OU RA
    // =====================================================

    private Usuario buscarUsuarioPorIdentificador(
            LoginDTO dto
    ) {

        String identificador =
                dto.getIdentificador()
                        .trim();


        // =====================================================
        // LOGIN POR E-MAIL
        // =====================================================

        if (
                identificador.contains(
                        "@"
                )
        ) {

            String email =
                    identificador
                            .toLowerCase(
                                    Locale.ROOT
                            );


            return usuarioRepository
                    .findByEmailIgnoreCase(
                            email
                    )
                    .orElseThrow(
                            this::credenciaisInvalidas
                    );
        }


        // =====================================================
        // LOGIN POR RA
        // =====================================================

        String digitoRa =
                dto.getDigitoRa() == null
                        ?
                        ""
                        :
                        dto.getDigitoRa()
                                .trim();


        String uf =
                dto.getUf() == null
                        ?
                        ""
                        :
                        dto.getUf()
                                .trim()
                                .toUpperCase(
                                        Locale.ROOT
                                );


        /*
         * Se o usuário escolheu login por RA,
         * os três componentes são obrigatórios:
         *
         * RA + Dígito RA + UF
         */
        if (
                digitoRa.isBlank()
                        ||
                        uf.isBlank()
        ) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "RA, dígito do RA e UF são obrigatórios"
            );
        }


        /*
         * Mantém o dígito como String.
         *
         * Isso preserva valores como:
         *
         * 01
         * 02
         * 09
         */
        Aluno aluno =
                alunoRepository
                        .findByMatriculaAndDigitoRaAndUfIgnoreCase(
                                identificador,
                                digitoRa,
                                uf
                        )
                        .orElseThrow(
                                this::credenciaisInvalidas
                        );


        if (
                aluno.getUsuario() == null
        ) {

            throw credenciaisInvalidas();
        }


        return aluno.getUsuario();
    }


    // =====================================================
    // CREDENCIAIS INVÁLIDAS
    // =====================================================

    private ResponseStatusException credenciaisInvalidas() {

        /*
         * Mensagem genérica para não revelar
         * se determinado usuário está cadastrado.
         */
        return new ResponseStatusException(
                HttpStatus.UNAUTHORIZED,
                "E-mail, RA ou senha inválidos"
        );
    }


    // =====================================================
    // VERIFICAR BCrypt
    // =====================================================

    private boolean senhaEhBCrypt(
            String senha
    ) {

        if (senha == null) {

            return false;
        }


        return senha.startsWith(
                "$2a$"
        )
                ||
                senha.startsWith(
                        "$2b$"
                )
                ||
                senha.startsWith(
                        "$2y$"
                );
    }
}