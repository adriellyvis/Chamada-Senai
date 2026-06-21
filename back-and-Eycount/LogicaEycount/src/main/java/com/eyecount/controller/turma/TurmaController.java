package com.eyecount.controller.turma;

import com.eyecount.dto.turma.TurmaDTO;
import com.eyecount.model.Turma;
import com.eyecount.service.GestorService;
import com.eyecount.service.TurmaService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/turmas")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class TurmaController {

    private final TurmaService turmaService;
    private final GestorService gestorService;

    // =====================================================
    // METODO AUXILIAR
    // =====================================================
    private Integer obterUsuarioId(HttpServletRequest request) {
        return (Integer) request.getAttribute("usuarioId");
    }

    // =====================================================
    // TURMAS
    // =====================================================
    @GetMapping
    public ResponseEntity<List<TurmaDTO>> listarTurmas(
            HttpServletRequest request
    ) {
        Integer usuarioId = obterUsuarioId(request);
        gestorService.validarGestor(usuarioId);

        return ResponseEntity.ok(
                turmaService.listar()
        );
    }

    @PostMapping
    public ResponseEntity<Turma> cadastrarTurma(
            @Valid @RequestBody TurmaDTO dto,
            HttpServletRequest request
    ) {
        Integer usuarioId = obterUsuarioId(request);
        gestorService.validarGestor(usuarioId);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(turmaService.cadastrar(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Turma> editarTurma(
            @PathVariable Integer id,
            @Valid @RequestBody TurmaDTO dto,
            HttpServletRequest request
    ) {
        Integer usuarioId = obterUsuarioId(request);
        gestorService.validarGestor(usuarioId);

        return ResponseEntity.ok(
                turmaService.editar(id, dto)
        );
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<Turma> alterarStatusTurma(
            @PathVariable Integer id,
            HttpServletRequest request
    ) {
        Integer usuarioId = obterUsuarioId(request);
        gestorService.validarGestor(usuarioId);

        return ResponseEntity.ok(
                turmaService.alterarStatus(id)
        );
    }

}