package eyecount.security;

import eyecount.model.Usuario;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Date;

/*
 * Servico responsavel pela criacao e leitura dos tokens JWT.
 *
 * Esta classe permite:
 * - gerar um token para o usuario autenticado;
 * - armazenar ID e perfil dentro do token;
 * - definir data de criacao e expiracao;
 * - validar a assinatura;
 * - extrair email, ID e outras informacoes.
 */
@Service
public class JwtService {
    private final Key key;

    public JwtService(@Value("${JWT_SECRET:}") String secret) {
        if (secret == null || secret.isBlank()) {
            throw new IllegalStateException(
                    "A variavel JWT_SECRET nao foi configurada."
            );
        }

        byte[] secretBytes =
                secret.getBytes(StandardCharsets.UTF_8);

        if (secretBytes.length < 32) {
            throw new IllegalStateException(
                    "A variavel JWT_SECRET deve possuir pelo menos 32 caracteres."
            );
        }

        this.key =
                Keys.hmacShaKeyFor(secretBytes);
    }

    /*
     * Gera um token JWT para o usuario informado.
     *
     * O token inclui:
     * - email como subject;
     * - ID do usuario;
     * - nome do perfil;
     * - data de criacao;
     * - data de expiracao;
     * - assinatura digital.
     */
    public String gerarToken(
            Usuario usuario
    ) {

        return Jwts.builder()

                /*
                 * Define o email do usuario como subject.
                 *
                 * O subject e a identificacao principal do token.
                 */
                .setSubject(
                        usuario.getEmail()
                )

                // Adiciona o ID do usuario como informacao extra.
                .claim(
                        "id",
                        usuario.getId()
                )

                // Adiciona o nome do perfil como informacao extra.
                .claim(
                        "perfil",
                        usuario.getPerfil().getNome()
                )

                // Registra a data e hora em que o token foi criado.
                .setIssuedAt(
                        new Date()
                )

                /*
                 * Define a expiracao para 24 horas depois
                 * do momento atual.
                 *
                 * Calculo:
                 * 1000 milissegundos
                 * x 60 segundos
                 * x 60 minutos
                 * x 24 horas.
                 */
                .setExpiration(
                        new Date(
                                System.currentTimeMillis()
                                        + 1000 * 60 * 60 * 24
                        )
                )

                /*
                 * Assina o token com a chave secreta
                 * usando o algoritmo HS256.
                 */
                .signWith(
                        key,
                        SignatureAlgorithm.HS256
                )

                /*
                 * Finaliza a construcao e converte
                 * o token para uma String.
                 */
                .compact();
    }

    /*
     * Extrai todas as informacoes armazenadas no token.
     *
     * O metodo tambem valida:
     * - assinatura;
     * - estrutura;
     * - data de expiracao.
     *
     * Quando o token e invalido, a biblioteca lanca uma excecao.
     */
    public Claims extrairClaims(
            String token
    ) {

        return Jwts.parserBuilder()

                // Define a chave usada para validar a assinatura.
                .setSigningKey(key)

                // Constroi o leitor de tokens.
                .build()

                // Analisa e valida o token recebido.
                .parseClaimsJws(token)

                // Recupera o corpo com os dados armazenados.
                .getBody();
    }

    /*
     * Extrai o email armazenado como subject do token.
     */
    public String extrairEmail(
            String token
    ) {

        return extrairClaims(token)
                .getSubject();
    }

    /*
     * Extrai o ID do usuario armazenado na claim "id".
     */
    public Integer extrairUsuarioId(
            String token
    ) {

        return extrairClaims(token)
                .get(
                        "id",
                        Integer.class
                );
    }

    /*
     * Verifica se um token e valido.
     *
     * Quando extrairClaims executa sem erro,
     * o token e considerado valido.
     *
     * Qualquer excecao faz o metodo retornar false.
     */
    public boolean tokenValido(
            String token
    ) {

        try {

            /*
             * Tenta validar a assinatura,
             * a estrutura e a expiracao.
             */
            extrairClaims(token);

            return true;

        } catch (Exception e) {

            /*
             * Retorna false quando o token:
             * - esta expirado;
             * - foi alterado;
             * - possui assinatura incorreta;
             * - esta malformado.
             */
            return false;
        }
    }
}