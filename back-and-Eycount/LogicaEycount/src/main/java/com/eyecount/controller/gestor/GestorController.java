package com.eyecount.controller.gestor;

import com.eyecount.dto.dashboard.ResumoInstitucionalDTO;
import com.eyecount.dto.alerta.AlertaEvasaoDTO;
import com.eyecount.dto.dashboard.DesempenhoDashboardDTO;
import com.eyecount.dto.dashboard.GestorDashboardDTO;
import com.eyecount.dto.disciplina.DisciplinaDTO;
import com.eyecount.dto.frequencia.FrequenciaAlunoDTO;
import com.eyecount.dto.ocorrencia.OcorrenciaDTO;
import com.eyecount.dto.turma.TurmaResumoDTO;
import com.eyecount.dto.turma.request.AtualizarTurmaDTO;
import com.eyecount.dto.turma.request.CriarTurmaDTO;
import com.eyecount.dto.turma.response.TurmaDetalheDTO;
import com.eyecount.dto.turma.response.TurmaDetalhesCompletosDTO;
import com.eyecount.dto.usuario.*;
import com.eyecount.model.Usuario;
import com.eyecount.service.FrequenciaService;
import com.eyecount.service.GestorService;
import com.eyecount.service.OcorrenciaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/gestor")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
@PreAuthorize("hasRole('GESTOR')")
public class GestorController {
    private final GestorService gestorService;
    private final FrequenciaService frequenciaService;
    private final OcorrenciaService ocorrenciaService;

    // =====================================================
    // DASHBOARD
    // ====================================================
    @GetMapping("/dashboard")
    public ResponseEntity<GestorDashboardDTO> dashboard() {

        return ResponseEntity.ok(
                gestorService.dashboard()
        );
    }

    @GetMapping("/dashboard/desempenho")
    public ResponseEntity<List<DesempenhoDashboardDTO>> desempenhoDashboard(
            @RequestParam String tipo,
            @RequestParam String indicador,
            @RequestParam(required = false) Integer turmaId
    ) {
        return ResponseEntity.ok(
                gestorService.desempenhoDashboard(
                        tipo,
                        indicador,
                        turmaId
                )
        );
    }

    // =====================================================
    // ALERTAS
    // =====================================================
    @GetMapping("/alertas-evasao")
    public ResponseEntity<List<AlertaEvasaoDTO>> listarAlertasEvasao() {
        return ResponseEntity.ok(
                gestorService.listarAlertas()
        );
    }

    // =====================================================
    // USUÁRIOS
    // =====================================================
    @GetMapping("/usuarios")
    public ResponseEntity<List<UsuarioDTO>> listarUsuarios() {
        return ResponseEntity.ok(
                gestorService.listarUsuarios()
        );
    }

    @PostMapping("/usuarios")
    public ResponseEntity<UsuarioDTO> cadastrarUsuario(
            @Valid @RequestBody CriarUsuarioDTO dto) {

        return ResponseEntity.status(
                HttpStatus.CREATED
        ).body(gestorService.cadastrarUsuario(dto));
    }

    @PostMapping("/usuarios/completo")
    public ResponseEntity<UsuarioDTO> cadastrarUsuarioCompleto(
            @Valid @RequestBody CriarUsuarioCompletoDTO dto) {
        return ResponseEntity.status(
                HttpStatus.CREATED
        ).body(gestorService.cadastrarUsuarioCompleto(dto));
    }

    @PutMapping("/usuarios/{id}")
    public ResponseEntity<Usuario> editarUsuario(
            @PathVariable Integer id,
            @Valid @RequestBody UsuarioEditarDTO dto) {
        return ResponseEntity.ok(
                gestorService.editarUsuario(id, dto)
        );
    }

    @PatchMapping("/usuarios/{id}/status")
    public ResponseEntity<Usuario> alterarStatusUsuario(
            @PathVariable Integer id
    ) {
        return ResponseEntity.ok(
                gestorService.alterarStatusUsuario(id)
        );
    }

    @GetMapping("/usuarios/{id}/detalhes")
    public ResponseEntity<UsuarioDetalhesDTO> detalhesUsuario(
            @PathVariable Integer id
    ) {
        return ResponseEntity.ok(
                gestorService.detalhesUsuario(id)
        );
    }

    // =====================================================
    // PROFESSORES
    // =====================================================
    @GetMapping("/professores")
    public ResponseEntity<List<ProfessorResumoDTO>> listarProfessores() {
        return ResponseEntity.ok(
                gestorService.listarProfessores()
        );
    }

    @GetMapping("/professores/resumo")
    public ResponseEntity<List<ProfessorResumoDTO>> listarProfessoresResumo() {
        return ResponseEntity.ok(
                gestorService.listarProfessores()
        );
    }
    // =====================================================
    // FREQUÊNCIA
    // =====================================================
    @GetMapping("/turmas/{turmaId}/frequencia")
    public ResponseEntity<List<FrequenciaAlunoDTO>> listarFrequenciaTurma(
            @PathVariable Integer turmaId) {
        return ResponseEntity.ok(
                frequenciaService.calcularPorTurma(turmaId)
        );
    }

    // =====================================================
    // OCORRÊNCIAS
    // =====================================================
    @GetMapping("/ocorrencias")
    public ResponseEntity<List<OcorrenciaDTO>> listarOcorrencias() {
        return ResponseEntity.ok(
                ocorrenciaService.listar()
        );
    }

    @GetMapping("/ocorrencias/status/{status}")
    public ResponseEntity<List<OcorrenciaDTO>> listarOcorrenciasPorStatus(
            @PathVariable String status) {
        return ResponseEntity.ok(
                ocorrenciaService.listarPorStatus(status)
        );
    }

    @PatchMapping("/ocorrencias/{id}/status")
    public ResponseEntity<OcorrenciaDTO> alterarStatusOcorrencia(
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

    @GetMapping("/turmas")
    public ResponseEntity<List<TurmaDetalheDTO>> listarTurmas() {
        return ResponseEntity.ok(
                gestorService.listarTurmas()
        );
    }

    @GetMapping("/turmas/resumo")
    public ResponseEntity<List<TurmaResumoDTO>> listarTurmasResumo() {
        return ResponseEntity.ok(
                gestorService.listarTurmasResumo()
        );
    }

    @PostMapping("/turmas")
    public ResponseEntity<TurmaDetalheDTO> cadastrarTurma(
            @Valid @RequestBody CriarTurmaDTO dto
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(gestorService.cadastrarTurma(dto));
    }

    @PutMapping("/turmas/{id}")
    public ResponseEntity<TurmaDetalheDTO> atualizarTurma(
            @PathVariable Integer id,
            @RequestBody AtualizarTurmaDTO dto
    ) {
        return ResponseEntity.ok(
                gestorService.atualizarTurma(id, dto)
        );
    }

    @GetMapping("/disciplinas/resumo")
    public ResponseEntity<List<DisciplinaDTO>> listarDisciplinasResumo() {
        return ResponseEntity.ok(
                gestorService.listarDisciplinasDTO()
        );
    }

    @GetMapping("/turmas/{id}/detalhes")
    public ResponseEntity<TurmaDetalhesCompletosDTO> detalhesTurma(
            @PathVariable Integer id
    ) {
        return ResponseEntity.ok(
                gestorService.detalhesTurma(id)
        );
    }

    @GetMapping("/dashboard/resumo-institucional")
    public ResponseEntity<ResumoInstitucionalDTO> resumoInstitucional() {
        return ResponseEntity.ok(
                gestorService.resumoInstitucional()
        );
    }

    //===============================
    //DICIPLINAS
    //===============================
    @GetMapping("/disciplinas")
    public ResponseEntity<List<DisciplinaDTO>> listarDisciplinas() {
        return ResponseEntity.ok(
                gestorService.listarDisciplinasDTO()
        );
    }

    @PostMapping("/disciplinas")
    public ResponseEntity<DisciplinaDTO> cadastrarDisciplina(
            @RequestBody DisciplinaDTO dto
    ) {
        return ResponseEntity.ok(
                gestorService.cadastrarDisciplina(dto)
        );
    }

    @PutMapping("/disciplinas/{id}")
    public ResponseEntity<DisciplinaDTO> editarDisciplina(
            @PathVariable Integer id,
            @RequestBody DisciplinaDTO dto
    ) {
        return ResponseEntity.ok(
                gestorService.editarDisciplina(id, dto)
        );
    }
}