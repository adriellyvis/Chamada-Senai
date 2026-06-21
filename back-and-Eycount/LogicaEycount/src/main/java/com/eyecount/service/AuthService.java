package com.eyecount.service;

import com.eyecount.dto.auth.LoginDTO;
import com.eyecount.dto.auth.LoginResponseDTO;
import com.eyecount.model.Usuario;
import com.eyecount.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
@Service
@RequiredArgsConstructor
public class AuthService {
    private final UsuarioRepository usuarioRepository;

    public LoginResponseDTO login(LoginDTO dto) {
        String email = dto.getEmail().trim();
        String senha = dto.getSenha().trim();

        Usuario usuario = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED,
                        "Email ou senha inválidos"
                ));

        if (!usuario.getSenha().equals(senha)) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Email ou senha inválidos"
            );
        }

        if (!usuario.getAtivo()) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Usuário inativo"
            );
        }

        return new LoginResponseDTO(
                usuario.getId(),
                usuario.getNome(),
                usuario.getEmail(),
                usuario.getPerfil().getNome()
        );
  }
}