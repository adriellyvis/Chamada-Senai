package prezence.security;

import prezence.model.Usuario;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Date;

@Service
public class JwtService {

    private static final long DURACAO_TOKEN =
            1000L * 60 * 60 * 8; // 8 horas

    private final Key key;


    public JwtService(
            @Value("${jwt.secret}") String secret
    ) {

        if (
                secret == null
                        || secret.isBlank()
        ) {
            throw new IllegalStateException(
                    "JWT_SECRET não foi configurada."
            );
        }

        byte[] bytes =
                secret.getBytes(
                        StandardCharsets.UTF_8
                );

        if (bytes.length < 32) {
            throw new IllegalStateException(
                    "JWT_SECRET precisa possuir pelo menos 32 caracteres."
            );
        }

        this.key =
                Keys.hmacShaKeyFor(
                        bytes
                );
    }


    // =====================================================
    // GERAR TOKEN
    // =====================================================

    public String gerarToken(
            Usuario usuario
    ) {

        Date agora =
                new Date();

        Date expiracao =
                new Date(
                        agora.getTime()
                                + DURACAO_TOKEN
                );


        return Jwts.builder()

                .setSubject(
                        usuario.getEmail()
                )

                .claim(
                        "id",
                        usuario.getId()
                )

                .claim(
                        "nome",
                        usuario.getNome()
                )

                .claim(
                        "perfil",
                        usuario
                                .getPerfil()
                                .getNome()
                )

                .setIssuedAt(
                        agora
                )

                .setExpiration(
                        expiracao
                )

                .signWith(
                        key,
                        SignatureAlgorithm.HS256
                )

                .compact();
    }


    // =====================================================
    // CLAIMS
    // =====================================================

    public Claims extrairClaims(
            String token
    ) {

        return Jwts
                .parserBuilder()

                .setSigningKey(
                        key
                )

                .build()

                .parseClaimsJws(
                        token
                )

                .getBody();
    }


    public Integer extrairUsuarioId(
            String token
    ) {

        Number id =
                extrairClaims(token)
                        .get(
                                "id",
                                Number.class
                        );

        return id.intValue();
    }


    public String extrairEmail(
            String token
    ) {

        return extrairClaims(
                token
        ).getSubject();
    }


    public String extrairPerfil(
            String token
    ) {

        return extrairClaims(
                token
        ).get(
                "perfil",
                String.class
        );
    }


    // =====================================================
    // VALIDAÇÃO
    // =====================================================

    public boolean tokenValido(
            String token
    ) {

        try {

            Claims claims =
                    extrairClaims(
                            token
                    );

            Date expiracao =
                    claims.getExpiration();

            return expiracao != null
                    && expiracao.after(
                    new Date()
            );

        } catch (Exception erro) {

            return false;
        }
    }
}