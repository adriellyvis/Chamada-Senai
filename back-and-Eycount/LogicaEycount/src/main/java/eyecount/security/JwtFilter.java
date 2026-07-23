package eyecount.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/*
 * Filtro responsavel por analisar o token JWT recebido nas requisicoes.
 *
 * Esta classe:
 * - le o cabecalho Authorization;
 * - verifica se o token usa o formato Bearer;
 * - valida o token;
 * - extrai o ID do usuario;
 * - adiciona o usuarioId como atributo da requisicao;
 * - permite que a requisicao continue para os proximos filtros.
 */
@Component
public class JwtFilter extends OncePerRequestFilter {

    // Servico usado para validar o token e extrair os dados do usuario.
    private final JwtService jwtService;

    /*
     * Construtor usado pelo Spring para injetar o JwtService.
     *
     * Como existe apenas este construtor,
     * nao e necessario usar a anotacao @Autowired.
     */
    public JwtFilter(
            JwtService jwtService
    ) {
        this.jwtService = jwtService;
    }

    /*
     * Metodo executado uma vez para cada requisicao HTTP.
     *
     * O filtro tenta localizar e validar um token JWT.
     * Mesmo quando nao existe token, a requisicao continua.
     */
    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        /*
         * Le o cabecalho Authorization da requisicao.
         *
         * O formato esperado e:
         * Bearer TOKEN_JWT
         */
        String auth =
                request.getHeader("Authorization");

        /*
         * O bloco so executa quando:
         * - o cabecalho existe;
         * - o valor comeca com "Bearer ".
         */
        if (
                auth != null &&
                        auth.startsWith("Bearer ")
        ) {

            /*
             * Remove o prefixo "Bearer "
             * e mantem somente o token.
             */
            String token =
                    auth.replace("Bearer ", "");

            /*
             * Valida o token antes de tentar extrair informacoes.
             *
             * A regra de validade fica dentro do JwtService.
             */
            if (jwtService.tokenValido(token)) {

                // Extrai o ID do usuario armazenado no token.
                Integer usuarioId =
                        jwtService.extrairUsuarioId(token);

                /*
                 * Adiciona o usuarioId como atributo da requisicao.
                 *
                 * Controllers ou outros filtros podem recuperar
                 * esse valor durante o restante do processamento.
                 */
                request.setAttribute(
                        "usuarioId",
                        usuarioId
                );
            }
        }

        /*
         * Continua a requisicao para o proximo filtro
         * ou para o controller correspondente.
         *
         * O codigo atual nao bloqueia a requisicao
         * quando o token e ausente ou invalido.
         */
        filterChain.doFilter(
                request,
                response
        );
    }
}