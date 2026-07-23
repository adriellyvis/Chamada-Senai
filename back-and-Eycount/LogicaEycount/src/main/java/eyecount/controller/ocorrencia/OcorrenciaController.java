package eyecount.controller.ocorrencia;

import eyecount.dto.ocorrencia.OcorrenciaDTO;
import eyecount.dto.ocorrencia.OcorrenciaMetricasDTO;
import eyecount.service.OcorrenciaService;
import eyecount.service.ProfessorService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
/*
 * Controller da area Ocorrencia. Controller responsavel por receber requisicoes HTTP,
 * validar os dados de entrada e encaminhar as operacoes para os services.
 */

@RestController
@RequestMapping("/ocorrencias")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
@PreAuthorize("hasRole('GESTOR')")
public class OcorrenciaController {

    // Dependencia que executa as regras de negocio desta operacao.
    private final OcorrenciaService ocorrenciaService;
    // Dependencia que executa as regras de negocio desta operacao.
    private final ProfessorService professorService;

    // =====================================================
    // LISTAR TODAS
    // =====================================================
    @GetMapping
    public ResponseEntity<List<OcorrenciaDTO>> listar() {
        // Encaminha a solicitacao para o service responsavel e monta a resposta HTTP.
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
        // Encaminha a solicitacao para o service responsavel e monta a resposta HTTP.
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
        // Encaminha a solicitacao para o service responsavel e monta a resposta HTTP.
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
        // Encaminha a solicitacao para o service responsavel e monta a resposta HTTP.
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
        // Encaminha a solicitacao para o service responsavel e monta a resposta HTTP.
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
        // Encaminha a solicitacao para o service responsavel e monta a resposta HTTP.
        return ResponseEntity.ok(
                ocorrenciaService.listarPorTipo(tipo)
        );
    }

    // =====================================================
    // MÉTRICAS
    // =====================================================
    @GetMapping("/metricas")
    public ResponseEntity<OcorrenciaMetricasDTO> metricas() {
        // Encaminha a solicitacao para o service responsavel e monta a resposta HTTP.
        return ResponseEntity.ok(
                ocorrenciaService.metricas()
        );
    }
}
