package com.eyecount.controller.ocorrencia;

import com.eyecount.dto.ocorrencia.OcorrenciaDTO;
import com.eyecount.dto.ocorrencia.OcorrenciaMetricasDTO;
import com.eyecount.model.Professor;
import com.eyecount.service.OcorrenciaService;
import com.eyecount.service.ProfessorService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/ocorrencias")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
@PreAuthorize("hasRole('GESTOR')")
public class OcorrenciaController {

    private final OcorrenciaService ocorrenciaService;
    private final ProfessorService professorService;

    // =====================================================
    // LISTAR TODAS
    // =====================================================
    @GetMapping
    public ResponseEntity<List<OcorrenciaDTO>> listar() {
        return ResponseEntity.ok(
                ocorrenciaService.listar()
        );
    }

    // =====================================================
    // LISTAR POR ALUNO
    // =====================================================
    @GetMapping("/aluno/{alunoId}")
    public ResponseEntity<List<OcorrenciaDTO>> listarPorAluno(
            @PathVariable Integer alunoId
    ) {
        return ResponseEntity.ok(
                ocorrenciaService.listarPorAluno(alunoId)
        );
    }

    // =====================================================
    // LISTAR POR PROFESSOR
    // =====================================================
    @GetMapping("/professor/{professorId}")
    public ResponseEntity<List<OcorrenciaDTO>> listarPorProfessor(
            @PathVariable Integer professorId
    ) {
        return ResponseEntity.ok(
                ocorrenciaService.listarPorProfessor(professorId)
        );
    }

    // =====================================================
    // ALTERAR STATUS
    // =====================================================
    @PatchMapping("/{id}/status")
    public ResponseEntity<OcorrenciaDTO> alterarStatus(
            @PathVariable Integer id,
            @RequestParam String status,
            @RequestBody(required = false) OcorrenciaDTO dto
    ) {
        String respostaGestor =
                dto != null
                        ? dto.getRespostaGestor()
                        : null;

        return ResponseEntity.ok(
                ocorrenciaService.alterarStatus(
                        id,
                        status,
                        respostaGestor
                )
        );
    }

    // =====================================================
    // LISTAR POR STATUS
    // =====================================================
    @GetMapping("/status/{status}")
    public ResponseEntity<List<OcorrenciaDTO>> listarPorStatus(
            @PathVariable String status
    ) {
        return ResponseEntity.ok(
                ocorrenciaService.listarPorStatus(status)
        );
    }

    // =====================================================
    // LISTAR POR TIPO
    // =====================================================
    @GetMapping("/tipo/{tipo}")
    public ResponseEntity<List<OcorrenciaDTO>> listarPorTipo(
            @PathVariable String tipo
    ) {
        return ResponseEntity.ok(
                ocorrenciaService.listarPorTipo(tipo)
        );
    }

    // =====================================================
    // MÉTRICAS
    // =====================================================
    @GetMapping("/metricas")
    public ResponseEntity<OcorrenciaMetricasDTO> metricas() {
        return ResponseEntity.ok(
                ocorrenciaService.metricas()
        );
    }
}