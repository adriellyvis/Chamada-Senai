package prezence.security;

import prezence.model.Usuario;
import prezence.repository.UsuarioRepository;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Locale;


@Component
public class JwtFilter extends OncePerRequestFilter {

    private final JwtService jwtService;

    private final UsuarioRepository usuarioRepository;

    private final String biometriaServiceKey;


    public JwtFilter(
            JwtService jwtService,
            UsuarioRepository usuarioRepository,

            @Value("${biometria.service-key:}")
            String biometriaServiceKey
    ) {

        this.jwtService =
                jwtService;

        this.usuarioRepository =
                usuarioRepository;

        this.biometriaServiceKey =
                biometriaServiceKey;
    }


    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        String path =
                request.getRequestURI();


        // =====================================================
        // ROTAS PÚBLICAS
        // =====================================================

        if (
                "OPTIONS".equalsIgnoreCase(
                        request.getMethod()
                )
                        || path.equals("/auth/login")
                        || path.equals("/error")
                        || path.equals("/suporte/acesso")
                        || path.equals("/auth/recuperacao/iniciar")
                        || path.equals("/auth/recuperacao/biometria")
                        || path.equals("/auth/recuperacao/redefinir")
        ) {

            filterChain.doFilter(
                    request,
                    response
            );

            return;
        }


        // =====================================================
        // COMUNICAÇÃO INTERNA PYTHON -> SPRING
        // =====================================================

        /*
         * Durante a recuperação de senha ainda não existe
         * JWT do usuário.
         *
         * O serviço Python precisa consultar as identidades
         * biométricas armazenadas no MySQL através do Spring.
         *
         * Essa exceção é permitida SOMENTE para:
         *
         * GET /biometria/identidades
         *
         * e somente quando a X-Prezence-Service-Key estiver
         * correta.
         */
        if (
                "GET".equalsIgnoreCase(
                        request.getMethod()
                )
                        &&
                        path.equals(
                                "/biometria/identidades"
                        )
                        &&
                        chaveInternaValida(
                                request
                        )
        ) {

            request.setAttribute(
                    "chamadaInternaBiometria",
                    true
            );


            filterChain.doFilter(
                    request,
                    response
            );

            return;
        }


        // =====================================================
        // AUTHORIZATION HEADER
        // =====================================================

        String authorization =
                request.getHeader(
                        "Authorization"
                );


        if (
                authorization == null
                        ||
                        !authorization.startsWith(
                                "Bearer "
                        )
        ) {

            responderNaoAutenticado(
                    response
            );

            return;
        }


        // =====================================================
        // EXTRAIR TOKEN
        // =====================================================

        String token =
                authorization
                        .substring(7)
                        .trim();


        if (token.isBlank()) {

            responderNaoAutenticado(
                    response
            );

            return;
        }


        // =====================================================
        // VALIDAR JWT
        // =====================================================

        try {

            if (
                    !jwtService.tokenValido(
                            token
                    )
            ) {

                responderNaoAutenticado(
                        response
                );

                return;
            }

        } catch (Exception erro) {

            responderNaoAutenticado(
                    response
            );

            return;
        }


        // =====================================================
        // USUÁRIO DO TOKEN
        // =====================================================

        Integer usuarioId;


        try {

            usuarioId =
                    jwtService
                            .extrairUsuarioId(
                                    token
                            );

        } catch (Exception erro) {

            responderNaoAutenticado(
                    response
            );

            return;
        }


        if (usuarioId == null) {

            responderNaoAutenticado(
                    response
            );

            return;
        }


        // =====================================================
        // BUSCAR USUÁRIO
        // =====================================================

        Usuario usuario =
                usuarioRepository
                        .findById(
                                usuarioId
                        )
                        .orElse(null);


        if (usuario == null) {

            responderNaoAutenticado(
                    response
            );

            return;
        }


        // =====================================================
        // USUÁRIO ATIVO
        // =====================================================

        if (
                !Boolean.TRUE.equals(
                        usuario.getAtivo()
                )
        ) {

            responderNaoAutenticado(
                    response
            );

            return;
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
        ) {

            responderAcessoNegado(
                    response
            );

            return;
        }


        String perfil =
                usuario
                        .getPerfil()
                        .getNome()
                        .trim()
                        .toLowerCase(
                                Locale.ROOT
                        );


        // =====================================================
        // GESTOR
        // =====================================================

        if (
                pertenceArea(
                        path,
                        "/gestor"
                )
                        &&
                        !perfil.equals(
                                "gestor"
                        )
        ) {

            responderAcessoNegado(
                    response
            );

            return;
        }


        // =====================================================
        // PROFESSOR
        // =====================================================

        if (
                pertenceArea(
                        path,
                        "/professor"
                )
                        &&
                        !perfil.equals(
                                "professor"
                        )
        ) {

            responderAcessoNegado(
                    response
            );

            return;
        }


        // =====================================================
        // ALUNO
        // =====================================================

        if (
                pertenceArea(
                        path,
                        "/aluno"
                )
                        &&
                        !perfil.equals(
                                "aluno"
                        )
        ) {

            responderAcessoNegado(
                    response
            );

            return;
        }


        // =====================================================
        // IDENTIDADE AUTENTICADA
        // =====================================================

        request.setAttribute(
                "usuarioId",
                usuarioId
        );


        request.setAttribute(
                "perfil",
                perfil
        );


        // =====================================================
        // CONTINUAR
        // =====================================================

        filterChain.doFilter(
                request,
                response
        );
    }


    // =====================================================
    // VALIDAR CHAVE INTERNA
    // =====================================================

    private boolean chaveInternaValida(
            HttpServletRequest request
    ) {

        if (
                biometriaServiceKey == null
                        ||
                        biometriaServiceKey.isBlank()
        ) {

            return false;
        }


        String chaveRecebida =
                request.getHeader(
                        "X-Prezence-Service-Key"
                );


        if (
                chaveRecebida == null
                        ||
                        chaveRecebida.isBlank()
        ) {

            return false;
        }


        byte[] chaveEsperadaBytes =
                biometriaServiceKey
                        .trim()
                        .getBytes(
                                StandardCharsets.UTF_8
                        );


        byte[] chaveRecebidaBytes =
                chaveRecebida
                        .trim()
                        .getBytes(
                                StandardCharsets.UTF_8
                        );


        return MessageDigest.isEqual(
                chaveEsperadaBytes,
                chaveRecebidaBytes
        );
    }


    // =====================================================
    // VERIFICAR ÁREA
    // =====================================================

    private boolean pertenceArea(
            String path,
            String area
    ) {

        return path.equals(
                area
        )
                ||
                path.startsWith(
                        area + "/"
                );
    }


    // =====================================================
    // 401
    // =====================================================

    private void responderNaoAutenticado(
            HttpServletResponse response
    ) throws IOException {

        response.setStatus(
                HttpServletResponse.SC_UNAUTHORIZED
        );


        response.setCharacterEncoding(
                "UTF-8"
        );


        response.setContentType(
                "application/json;charset=UTF-8"
        );


        response
                .getWriter()
                .write(
                        """
                        {
                          "status": 401,
                          "erro": "UNAUTHORIZED",
                          "mensagem": "Autenticação necessária ou token inválido."
                        }
                        """
                );
    }


    // =====================================================
    // 403
    // =====================================================

    private void responderAcessoNegado(
            HttpServletResponse response
    ) throws IOException {

        response.setStatus(
                HttpServletResponse.SC_FORBIDDEN
        );


        response.setCharacterEncoding(
                "UTF-8"
        );


        response.setContentType(
                "application/json;charset=UTF-8"
        );


        response
                .getWriter()
                .write(
                        """
                        {
                          "status": 403,
                          "erro": "FORBIDDEN",
                          "mensagem": "Você não possui permissão para acessar este recurso."
                        }
                        """
                );
    }
}