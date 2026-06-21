package com.eyecount.filter;

import com.eyecount.model.Usuario;
import com.eyecount.repository.UsuarioRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Optional;

@Component
public class AuthFilter extends OncePerRequestFilter {
    private final UsuarioRepository usuarioRepository;

    public AuthFilter(UsuarioRepository usuarioRepository) {
        this.usuarioRepository = usuarioRepository;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        String path = request.getRequestURI();
        System.out.println("AUTH FILTER PATH: " + path);

        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            filterChain.doFilter(request, response);
            return;
        }

        // ROTAS PÚBLICAS / TEMPORÁRIAS
        if (
                path.startsWith("/auth") ||
                        path.startsWith("/login") ||
                        path.startsWith("/public") ||
                        path.startsWith("/aluno/chamada-aberta") ||
                        path.startsWith("/presencas")
        ) {
            filterChain.doFilter(request, response);
            return;
        }

        String userIdHeader = request.getHeader("usuario-id");

        if (userIdHeader == null) {
            response.setStatus(401);
            response.getWriter().write("Não autenticado");
            return;
        }

        Integer userId;

        try {
            userId = Integer.parseInt(userIdHeader);
        } catch (NumberFormatException e) {
            response.setStatus(401);
            response.getWriter().write("Usuário inválido");
            return;
        }

        Optional<Usuario> usuarioOpt = usuarioRepository.findById(userId);

        if (usuarioOpt.isEmpty()) {
            response.setStatus(401);
            response.getWriter().write("Usuário inválido");
            return;
        }

        Usuario usuario = usuarioOpt.get();
        String perfil = usuario.getPerfil().getNome();

        if (path.startsWith("/professor") && !perfil.equals("professor")) {
            response.setStatus(403);
            response.getWriter().write("Acesso negado para aluno/gestor");
            return;
        }

        if (path.startsWith("/aluno") && !perfil.equals("aluno")) {
            response.setStatus(403);
            response.getWriter().write("Acesso negado");
            return;
        }

        if (path.startsWith("/gestor") && !perfil.equals("gestor")) {
            response.setStatus(403);
            response.getWriter().write("Acesso negado");
            return;
        }

        filterChain.doFilter(request, response);
    }
}