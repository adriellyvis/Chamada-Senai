package com.eyecount.controller;

import com.eyecount.dto.LoginDTO;
import com.eyecount.model.Usuario;
import com.eyecount.repository.UsuarioRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
public class LoginController {

    private final UsuarioRepository usuarioRepository;

    public LoginController(UsuarioRepository usuarioRepository) {
        this.usuarioRepository = usuarioRepository;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginDTO dto) {

        Optional<Usuario> usuarioOpt = usuarioRepository.findByEmail(dto.getEmail());

        if (usuarioOpt.isEmpty()) {
            return ResponseEntity.status(401).body("Usuário não encontrado");
        }

        Usuario usuario = usuarioOpt.get();

        if (!usuario.getSenha().equals(dto.getSenha())) {
            return ResponseEntity.status(401).body("Senha incorreta");
        }

        if (usuario.getAtivo() == null || !usuario.getAtivo()) {
            return ResponseEntity.status(403).body("Usuário desativado");
        }

        String perfilUsuario = usuario.getPerfil().getNome();

        // 🔒 valida se o usuário está tentando entrar na tela correta
        if (!perfilUsuario.equalsIgnoreCase(dto.getTipo())) {
            return ResponseEntity.status(403).body("Acesso negado para este tipo de login");
        }

        return ResponseEntity.ok(new Object() {
            public final Integer id = usuario.getId();
            public final String nome = usuario.getNome();
            public final String email = usuario.getEmail();
            public final Integer perfil_id = usuario.getPerfil().getId();
            public final String perfil = usuario.getPerfil().getNome();
        });
    }
}