package com.eyecount.controller.turma;

import com.eyecount.dto.disciplina.DisciplinaDTO;
import com.eyecount.model.Disciplina;
import com.eyecount.service.DisciplinaService;
import com.eyecount.service.GestorService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/disciplinas")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class DisciplinaController {

    private final GestorService gestorService;
    private final DisciplinaService disciplinaService;

    // =====================================================
    // METODO AUXILIAR
    // =====================================================
    private Integer obterUsuarioId(HttpServletRequest request) {
        return (Integer) request.getAttribute("usuarioId");
    }

    // =====================================================
    // LISTAR
    // =====================================================
    @GetMapping
    public ResponseEntity<List<DisciplinaDTO>> listarDisciplinas(
            HttpServletRequest request
    ) {
        Integer usuarioId = obterUsuarioId(request);
        gestorService.validarGestor(usuarioId);

        return ResponseEntity.ok(
                disciplinaService.listar()
        );
    }

    // =====================================================
    // CADASTRAR
    // =====================================================
    @PostMapping
    public ResponseEntity<Disciplina> cadastrarDisciplina(
            @Valid @RequestBody DisciplinaDTO dto,
            HttpServletRequest request
    ) {
        Integer usuarioId = obterUsuarioId(request);
        gestorService.validarGestor(usuarioId);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(disciplinaService.cadastrar(dto));
    }

    // =====================================================
    // EDITAR
    // =====================================================
    @PutMapping("/{id}")
    public ResponseEntity<Disciplina> editarDisciplina(
            @PathVariable Integer id,
            @Valid @RequestBody DisciplinaDTO dto,
            HttpServletRequest request
    ) {
        Integer usuarioId = obterUsuarioId(request);
        gestorService.validarGestor(usuarioId);

        return ResponseEntity.ok(
                disciplinaService.editar(id, dto)
        );
    }

    // =====================================================
    // DELETAR
    // =====================================================
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletarDisciplina(
            @PathVariable Integer id,
            HttpServletRequest request
    ) {
        Integer usuarioId = obterUsuarioId(request);
        gestorService.validarGestor(usuarioId);
        disciplinaService.deletar(id);

        return ResponseEntity.noContent().build();
    }

}