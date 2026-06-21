package com.eyecount.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class JwtFilter extends OncePerRequestFilter {
    private final com.eyecount.security.JwtService jwtService;

    public JwtFilter(
            com.eyecount.security.JwtService jwtService
    ) {
        this.jwtService = jwtService;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        String auth = request.getHeader("Authorization");

        if (auth != null && auth.startsWith("Bearer ")) {
            String token = auth.replace("Bearer ", "");

            if (jwtService.tokenValido(token)) {
                Integer usuarioId = jwtService.extrairUsuarioId(token);
                request.setAttribute("usuarioId", usuarioId);
            }

        }

        filterChain.doFilter(request, response);
    }
}