package com.eyecount.controller.professor;

import com.eyecount.dto.aula.AlunoChamadaDTO;
import com.eyecount.dto.aula.HistoricoAulaDTO;
import com.eyecount.dto.dashboard.FrequenciaTurmaDTO;
import com.eyecount.dto.ocorrencia.OcorrenciaDTO;
import com.eyecount.dto.presenca.PresencaDTO;
import com.eyecount.dto.professor.*;
import com.eyecount.model.*;
import com.eyecount.service.AulaService;
import com.eyecount.service.OcorrenciaService;
import com.eyecount.service.PresencaService;
import com.eyecount.service.ProfessorService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/professor")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class ProfessorController {

    private final ProfessorService professorService;
    private final AulaService aulaService;
    private final OcorrenciaService ocorrenciaService;
    private final PresencaService presencaService;


    // =====================================================
    // DASHBOARD
    // =====================================================
    @GetMapping("/dashboard")
    public ResponseEntity<ProfessorDashboardDTO> dashboard(
            @RequestHeader("usuario-id") Integer usuarioId
    ) {
        return ResponseEntity.ok(
                professorService.dashboard(usuarioId)
        );
    }


    // =====================================================
    // TURMAS
    // =====================================================
    @GetMapping("/turmas")
    public ResponseEntity<List<TurmaProfessorDTO>> listarTurmas(
            @RequestHeader("usuario-id") Integer usuarioId
    ) {
        return ResponseEntity.ok(
                professorService.listarTurmas(usuarioId)
        );
    }

    @GetMapping("/turma-disciplina/{turmaDisciplinaId}/alunos")
    public ResponseEntity<List<?>> listarAlunos(
            @PathVariable Integer turmaDisciplinaId
    ) {
        return ResponseEntity.ok(
                professorService.listarAlunos(turmaDisciplinaId)
        );
    }

    @GetMapping("/alunos")
    public ResponseEntity<List<AlunoProfessorDTO>> listarAlunosProfessor(
            @RequestHeader("usuario-id") Integer usuarioId,
            @RequestParam(required = false) Integer turmaId
    ) {
        return ResponseEntity.ok(
                professorService.listarAlunosProfessor(
                        usuarioId,
                        turmaId
                )
        );
    }

    @GetMapping("/frequencia-turmas")
    public ResponseEntity<List<FrequenciaTurmaDTO>> frequenciaTurmas(
            @RequestHeader("usuario-id") Integer usuarioId
    ) {
        return ResponseEntity.ok(
                professorService.buscarFrequenciaTurmas(usuarioId)
        );
    }
    // =====================================================
    // PRESENÇA
    // =====================================================
    @PostMapping("/presenca")
    public ResponseEntity<Presenca> registrarPresenca(
            @Valid @RequestBody PresencaDTO dto
    ) {
        return ResponseEntity.ok(
                presencaService.registrar(dto)
        );
    }

    // =====================================================
    // AULAS
    // =====================================================
    @PostMapping("/abrir")
    public ResponseEntity<Aula> abrirChamada(
            @RequestParam Integer turmaDisciplinaId
    ) {
        return ResponseEntity.ok(
                aulaService.abrirOuRetomarChamada(turmaDisciplinaId)
        );
    }

    @PostMapping("/aula/encerrar/{aulaId}")
    public ResponseEntity<Aula> encerrarAula(
            @PathVariable Integer aulaId
    ) {
        return ResponseEntity.ok(
                professorService.encerrarAula(aulaId)
        );
    }

    @GetMapping("/historico")
    public ResponseEntity<List<HistoricoAulaDTO>> listarHistorico(
            @RequestHeader("usuario-id") Integer usuarioId
    ) {
        return ResponseEntity.ok(
                professorService.listarHistorico(usuarioId)
        );
    }

    @GetMapping("/aula/{aulaId}/alunos")
    public ResponseEntity<List<AlunoChamadaDTO>> listarAlunosDaChamada(
            @PathVariable Integer aulaId
    ) {
        return ResponseEntity.ok(
                aulaService.listarAlunosDaChamada(aulaId)
        );
    }

    @GetMapping("/aula/{aulaId}/detalhes")
    public ResponseEntity<?> detalharAula(
            @PathVariable Integer aulaId
    ) {
        return ResponseEntity.ok(
                aulaService.listarDetalhesAula(aulaId)
        );
    }


    // =====================================================
    // OCORRENCIAS
    // =====================================================
    @PostMapping("/ocorrencias")
    public ResponseEntity<OcorrenciaDTO> criarOcorrencia(
            @RequestHeader("usuario-id") Integer usuarioId,
            @Valid @RequestBody OcorrenciaDTO dto
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(
                        ocorrenciaService.cadastrarPorProfessor(
                                usuarioId,
                                dto
                        )
                );
    }

    @PutMapping("/ocorrencias/{id}")
    public ResponseEntity<OcorrenciaDTO> editarOcorrencia(
            @RequestHeader("usuario-id") Integer usuarioId,
            @PathVariable Integer id,
            @Valid @RequestBody OcorrenciaDTO dto
    ) {
        return ResponseEntity.ok(
                ocorrenciaService.editarPorProfessor(
                        usuarioId,
                        id,
                        dto
                )
        );
    }

    @GetMapping("/ocorrencias")
    public ResponseEntity<List<OcorrenciaDTO>> listarOcorrenciasProfessor(
            @RequestHeader("usuario-id") Integer usuarioId
    ) {
        Professor professor = professorService.buscarProfessorPorUsuario(usuarioId);

        return ResponseEntity.ok(
                ocorrenciaService.listarPorProfessor(professor.getId())
        );
    }


    // =====================================================
    // Grafico de Turams
    // =====================================================
    @GetMapping("/desempenho-turmas")
    public ResponseEntity<List<DesempenhoTurmaDTO>> desempenhoTurmas(
            @RequestHeader("usuario-id") Integer usuarioId,
            @RequestParam(required = false) Integer turmaId,
            @RequestParam(defaultValue = "mes") String periodo
    ) {
        return ResponseEntity.ok(
                professorService.desempenhoTurmas(
                        usuarioId,
                        turmaId,
                        periodo
                )
        );
    }

    @GetMapping("/aulas/{aulaId}/presencas")
    public ResponseEntity<List<PresencaAlunoProfessorDTO>> listarPresencasDaAula(
            @PathVariable Integer aulaId
    ) {
        return ResponseEntity.ok(
                professorService.listarPresencasDaAula(aulaId)
        );
    }

}