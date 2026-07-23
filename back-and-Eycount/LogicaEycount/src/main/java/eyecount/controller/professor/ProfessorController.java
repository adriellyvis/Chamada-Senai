package eyecount.controller.professor;

import eyecount.dto.aula.AlunoChamadaDTO;
import eyecount.dto.aula.ChamadaAbertaProfessorDTO;
import eyecount.dto.aula.HistoricoAulaDTO;
import eyecount.dto.dashboard.FrequenciaTurmaDTO;
import eyecount.dto.ocorrencia.OcorrenciaDTO;
import eyecount.dto.presenca.PresencaDTO;
import eyecount.dto.professor.*;
import eyecount.model.*;
import eyecount.service.AulaService;
import eyecount.service.OcorrenciaService;
import eyecount.service.PresencaService;
import eyecount.service.ProfessorService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
/*
 * Controller da area Professor. Controller responsavel por receber requisicoes HTTP,
 * validar os dados de entrada e encaminhar as operacoes para os services.
 */

@RestController
@RequestMapping("/professor")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class ProfessorController {

    // Dependencia que executa as regras de negocio desta operacao.
    private final ProfessorService professorService;
    // Dependencia que executa as regras de negocio desta operacao.
    private final AulaService aulaService;
    // Dependencia que executa as regras de negocio desta operacao.
    private final OcorrenciaService ocorrenciaService;
    // Dependencia que executa as regras de negocio desta operacao.
    private final PresencaService presencaService;


    // =====================================================
    // DASHBOARD
    // =====================================================
    @GetMapping("/dashboard")
    public ResponseEntity<ProfessorDashboardDTO> dashboard(
            @RequestHeader("usuario-id") Integer usuarioId
    ) {
        // Encaminha a solicitacao para o service responsavel e monta a resposta HTTP.
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
        // Encaminha a solicitacao para o service responsavel e monta a resposta HTTP.
        return ResponseEntity.ok(
                professorService.listarTurmas(usuarioId)
        );
    }

    /*
     * Lista os registros conforme os filtros recebidos e devolve o resultado.
     */
    @GetMapping("/turma-disciplina/{turmaDisciplinaId}/alunos")
    public ResponseEntity<List<?>> listarAlunos(
            @PathVariable Integer turmaDisciplinaId
    ) {
        // Encaminha a solicitacao para o service responsavel e monta a resposta HTTP.
        return ResponseEntity.ok(
                professorService.listarAlunos(turmaDisciplinaId)
        );
    }

    /*
     * Lista os registros conforme os filtros recebidos e devolve o resultado.
     */
    @GetMapping("/alunos")
    public ResponseEntity<List<AlunoProfessorDTO>> listarAlunosProfessor(
            @RequestHeader("usuario-id") Integer usuarioId,
            @RequestParam(required = false) Integer turmaId
    ) {
        // Encaminha a solicitacao para o service responsavel e monta a resposta HTTP.
        return ResponseEntity.ok(
                professorService.listarAlunosProfessor(
                        usuarioId,
                        turmaId
                )
        );
    }

    /*
     * Recebe uma requisicao GET e devolve os dados fornecidos pelo service.
     */
    @GetMapping("/frequencia-turmas")
    public ResponseEntity<List<FrequenciaTurmaDTO>> frequenciaTurmas(
            @RequestHeader("usuario-id") Integer usuarioId
    ) {
        // Encaminha a solicitacao para o service responsavel e monta a resposta HTTP.
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
        // Encaminha a solicitacao para o service responsavel e monta a resposta HTTP.
        return ResponseEntity.ok(
                presencaService.registrar(dto)
        );
    }

    // =====================================================
    // AULAS
    // =====================================================
    @PostMapping("/abrir")
    public ResponseEntity<Aula> abrirChamada(
            @RequestHeader("usuario-id") Integer usuarioId,
            @RequestParam Integer turmaDisciplinaId
    ) {
        // Encaminha a solicitacao para o service responsavel e monta a resposta HTTP.
        return ResponseEntity.ok(
                aulaService.abrirOuRetomarChamada(turmaDisciplinaId, usuarioId)
        );
    }

    /*
     * Busca os registros que atendem aos filtros definidos neste metodo.
     */
    @GetMapping("/chamada-aberta")
    public ResponseEntity<ChamadaAbertaProfessorDTO> buscarChamadaAberta(
            @RequestHeader("usuario-id") Integer usuarioId
    ) {
        // Encaminha a solicitacao para o service responsavel e monta a resposta HTTP.
        return aulaService.buscarChamadaAbertaProfessor(usuarioId)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.noContent().build());
    }

    /*
     * Recebe uma requisicao POST, envia os dados ao service e devolve o registro criado.
     */
    @PostMapping("/aula/encerrar/{aulaId}")
    public ResponseEntity<Aula> encerrarAula(
            @PathVariable Integer aulaId
    ) {
        // Encaminha a solicitacao para o service responsavel e monta a resposta HTTP.
        return ResponseEntity.ok(
                aulaService.encerrarChamada(aulaId)
        );
    }

    /*
     * Lista os registros conforme os filtros recebidos e devolve o resultado.
     */
    @GetMapping("/historico")
    public ResponseEntity<List<HistoricoAulaDTO>> listarHistorico(
            @RequestHeader("usuario-id") Integer usuarioId
    ) {
        // Encaminha a solicitacao para o service responsavel e monta a resposta HTTP.
        return ResponseEntity.ok(
                professorService.listarHistorico(usuarioId)
        );
    }

    /*
     * Lista os registros conforme os filtros recebidos e devolve o resultado.
     */
    @GetMapping("/aula/{aulaId}/alunos")
    public ResponseEntity<List<AlunoChamadaDTO>> listarAlunosDaChamada(
            @PathVariable Integer aulaId
    ) {
        // Encaminha a solicitacao para o service responsavel e monta a resposta HTTP.
        return ResponseEntity.ok(
                aulaService.listarAlunosDaChamada(aulaId)
        );
    }

    /*
     * Recebe uma requisicao GET e devolve os dados fornecidos pelo service.
     */
    @GetMapping("/aula/{aulaId}/detalhes")
    public ResponseEntity<?> detalharAula(
            @PathVariable Integer aulaId
    ) {
        // Encaminha a solicitacao para o service responsavel e monta a resposta HTTP.
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
        // Encaminha a solicitacao para o service responsavel e monta a resposta HTTP.
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(
                        ocorrenciaService.cadastrarPorProfessor(
                                usuarioId,
                                dto
                        )
                );
    }

    /*
     * Busca o registro, aplica as alteracoes recebidas e salva a atualizacao.
     */
    @PutMapping("/ocorrencias/{id}")
    public ResponseEntity<OcorrenciaDTO> editarOcorrencia(
            @RequestHeader("usuario-id") Integer usuarioId,
            @PathVariable Integer id,
            @Valid @RequestBody OcorrenciaDTO dto
    ) {
        // Encaminha a solicitacao para o service responsavel e monta a resposta HTTP.
        return ResponseEntity.ok(
                ocorrenciaService.editarPorProfessor(
                        usuarioId,
                        id,
                        dto
                )
        );
    }

    /*
     * Lista os registros conforme os filtros recebidos e devolve o resultado.
     */
    @GetMapping("/ocorrencias")
    public ResponseEntity<List<OcorrenciaDTO>> listarOcorrenciasProfessor(
            @RequestHeader("usuario-id") Integer usuarioId
    ) {
        // Encaminha a solicitacao para o service responsavel e monta a resposta HTTP.
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
        // Encaminha a solicitacao para o service responsavel e monta a resposta HTTP.
        return ResponseEntity.ok(
                professorService.desempenhoTurmas(
                        usuarioId,
                        turmaId,
                        periodo
                )
        );
    }

    /*
     * Lista os registros conforme os filtros recebidos e devolve o resultado.
     */
    @GetMapping("/aulas/{aulaId}/presencas")
    public ResponseEntity<List<PresencaAlunoProfessorDTO>> listarPresencasDaAula(
            @PathVariable Integer aulaId
    ) {
        // Encaminha a solicitacao para o service responsavel e monta a resposta HTTP.
        return ResponseEntity.ok(
                professorService.listarPresencasDaAula(aulaId)
        );
    }

}
