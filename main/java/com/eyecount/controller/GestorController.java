package com.eyecount.controller;

import com.eyecount.dto.AlertaEvasaoDTO;
import com.eyecount.dto.GestorDashboardDTO;
import com.eyecount.model.Usuario;
import com.eyecount.repository.PresencaRepository;
import com.eyecount.repository.UsuarioRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/gestor")
public class GestorController {

    private final UsuarioRepository usuarioRepository;
    private final PresencaRepository presencaRepository;

    public GestorController(UsuarioRepository usuarioRepository,
                            PresencaRepository presencaRepository) {
        this.usuarioRepository = usuarioRepository;
        this.presencaRepository = presencaRepository;
    }

    private void validarGestor(Integer usuarioId) {
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Usuário não encontrado"));

        if (usuario.getPerfil().getId() != 3) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Acesso negado");
        }
    }

    @GetMapping("/dashboard")
    public ResponseEntity<GestorDashboardDTO> dashboard(
            @RequestHeader("usuario-id") Integer headerUsuarioId
    ) {
        validarGestor(headerUsuarioId);

        GestorDashboardDTO dashboard = new GestorDashboardDTO(
                94.2,
                124,
                48,
                4,
                9,
                2,
                1
        );

        return ResponseEntity.ok(dashboard);
    }

    @GetMapping("/alertas-evasao")
    public ResponseEntity<List<AlertaEvasaoDTO>> listarAlertasEvasao(
            @RequestHeader("usuario-id") Integer headerUsuarioId
    ) {
        validarGestor(headerUsuarioId);
        return ResponseEntity.ok(presencaRepository.buscarAlertasEvasao());
    }

    @GetMapping("/usuarios")
    public ResponseEntity<List<Usuario>> listarUsuarios(
            @RequestHeader("usuario-id") Integer headerUsuarioId
    ) {
        validarGestor(headerUsuarioId);
        return ResponseEntity.ok(usuarioRepository.findAll());
    }

    @PostMapping("/usuarios")
    public ResponseEntity<Usuario> cadastrarUsuario(
            @RequestBody Usuario novoUsuario,
            @RequestHeader("usuario-id") Integer headerUsuarioId
    ) {
        validarGestor(headerUsuarioId);

        novoUsuario.setId(null);
        Usuario usuarioSalvo = usuarioRepository.save(novoUsuario);

        return ResponseEntity.status(HttpStatus.CREATED).body(usuarioSalvo);
    }

    @PutMapping("/usuarios/{id}")
    public ResponseEntity<Usuario> editarUsuario(
            @PathVariable Integer id,
            @RequestBody Usuario dadosAtualizados,
            @RequestHeader("usuario-id") Integer headerUsuarioId
    ) {
        validarGestor(headerUsuarioId);

        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuário não encontrado"));

        usuario.setNome(dadosAtualizados.getNome());
        usuario.setEmail(dadosAtualizados.getEmail());
        usuario.setSenha(dadosAtualizados.getSenha());
        usuario.setPerfil(dadosAtualizados.getPerfil());
        usuario.setAtivo(dadosAtualizados.getAtivo());

        Usuario usuarioAtualizado = usuarioRepository.save(usuario);

        return ResponseEntity.ok(usuarioAtualizado);
    }

    @PatchMapping("/usuarios/{id}/status")
    public ResponseEntity<Usuario> alterarStatusUsuario(
            @PathVariable Integer id,
            @RequestHeader("usuario-id") Integer headerUsuarioId
    ) {
        validarGestor(headerUsuarioId);

        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuário não encontrado"));

        usuario.setAtivo(!usuario.getAtivo());

        Usuario usuarioAtualizado = usuarioRepository.save(usuario);

        return ResponseEntity.ok(usuarioAtualizado);
    }
}