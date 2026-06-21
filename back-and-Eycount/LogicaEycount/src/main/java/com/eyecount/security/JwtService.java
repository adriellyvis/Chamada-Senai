package com.eyecount.security;

import com.eyecount.model.Usuario;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Service;

import java.security.Key;
import java.util.Date;

@Service
public class JwtService {
    private static final String SECRET = "eyecount-secret-key-eyecount-secret-key";

    private final Key key = Keys.hmacShaKeyFor(SECRET.getBytes());

    public String gerarToken(Usuario usuario) {
        return Jwts.builder()
                .setSubject(usuario.getEmail())
                .claim("id", usuario.getId())
                .claim("perfil", usuario.getPerfil().getNome())
                .setIssuedAt(new Date())
                .setExpiration(
                        new Date(System.currentTimeMillis()
                                + 1000 * 60 * 60 * 24
                        )).signWith(key, SignatureAlgorithm.HS256).compact();
    }

    public Claims extrairClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    public String extrairEmail(String token) {
        return extrairClaims(token).getSubject();
    }

    public Integer extrairUsuarioId(String token) {
        return extrairClaims(token).get("id", Integer.class);
    }

    public boolean tokenValido(String token) {
        try {
            extrairClaims(token);

            return true;
        } catch (Exception e) {
            return false;
        }
    }
}