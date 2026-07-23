package eyecount.controller.gestor;

import eyecount.dto.dashboard.ResumoInstitucionalDTO;
import eyecount.dto.alerta.AlertaEvasaoDTO;
import eyecount.dto.dashboard.DesempenhoDashboardDTO;
import eyecount.dto.dashboard.GestorDashboardDTO;
import eyecount.dto.disciplina.DisciplinaDTO;
import eyecount.dto.frequencia.FrequenciaAlunoDTO;
import eyecount.dto.ocorrencia.OcorrenciaDTO;
import eyecount.dto.turma.TurmaResumoDTO;
import eyecount.dto.turma.request.AtualizarTurmaDTO;
import eyecount.dto.turma.request.CriarTurmaDTO;
import eyecount.dto.turma.response.TurmaDetalheDTO;
import eyecount.dto.turma.response.TurmaDetalhesCompletosDTO;
import eyecount.dto.usuario.*;
import eyecount.model.Usuario;
import eyecount.service.FrequenciaService;
import eyecount.service.GestorService;
import eyecount.service.OcorrenciaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
/*
 * Controller da area Gestor. Controller responsavel por receber requisicoes HTTP, validar
 * os dados de entrada e encaminhar as operacoes para os services.
 */

@RestController
@RequestMapping("/gestor")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
@PreAuthorize("hasRole('GESTOR')")
public class GestorController {
    // Dependencia que executa as regras de negocio desta operacao.
    private final GestorService gestorService;
    // Valor de frequencia calculado para o indicador.
    private final FrequenciaService frequenciaService;
    // Dependencia que executa as regras de negocio desta operacao.
    private final OcorrenciaService ocorrenciaService;

    // =====================================================
    // DASHBOARD
    // ====================================================
    @GetMapping("/dashboard")
    public ResponseEntity<GestorDashboardDTO> dashboard() {
        // Encaminha a solicitacao para o service responsavel e monta a resposta HTTP.

        return ResponseEntity.ok(
                gestorService.dashboard()
        );
    }

    /*
     * Recebe uma requisicao GET e devolve os dados fornecidos pelo service.
     */
    @GetMapping("/dashboard/desempenho")
    public ResponseEntity<List<DesempenhoDashboardDTO>> desempenhoDashboard(
            @RequestParam String tipo,
            @RequestParam String indicador,
            @RequestParam(required = false) Integer turmaId
    ) {
        // Encaminha a solicitacao para o service responsavel e monta a resposta HTTP.
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
        // Encaminha a solicitacao para o service responsavel e monta a resposta HTTP.
        return ResponseEntity.ok(
                gestorService.listarAlertas()
        );
    }

    // =====================================================
    // USUÁRIOS
    // =====================================================
    @GetMapping("/usuarios")
    public ResponseEntity<List<UsuarioDTO>> listarUsuarios() {
        // Encaminha a solicitacao para o service responsavel e monta a resposta HTTP.
        return ResponseEntity.ok(
                gestorService.listarUsuarios()
        );
    }

    /*
     * Recebe os dados, executa as validacoes e cadastra um novo registro.
     */
    @PostMapping("/usuarios")
    public ResponseEntity<UsuarioDTO> cadastrarUsuario(
            @Valid @RequestBody CriarUsuarioDTO dto) {
                // Encaminha a solicitacao para o service responsavel e monta a resposta HTTP.

        return ResponseEntity.status(
                HttpStatus.CREATED
        ).body(gestorService.cadastrarUsuario(dto));
    }

    /*
     * Recebe os dados, executa as validacoes e cadastra um novo registro.
     */
    @PostMapping("/usuarios/completo")
    public ResponseEntity<UsuarioDTO> cadastrarUsuarioCompleto(
            @Valid @RequestBody CriarUsuarioCompletoDTO dto) {
                // Encaminha a solicitacao para o service responsavel e monta a resposta HTTP.
        return ResponseEntity.status(
                HttpStatus.CREATED
        ).body(gestorService.cadastrarUsuarioCompleto(dto));
    }

    /*
     * Busca o registro, aplica as alteracoes recebidas e salva a atualizacao.
     */
    @PutMapping("/usuarios/{id}")
    public ResponseEntity<Usuario> editarUsuario(
            @PathVariable Integer id,
            @Valid @RequestBody UsuarioEditarDTO dto) {
                // Encaminha a solicitacao para o service responsavel e monta a resposta HTTP.
        return ResponseEntity.ok(
                gestorService.editarUsuario(id, dto)
        );
    }

    /*
     * Localiza o registro e altera seu status atual.
     */
    @PatchMapping("/usuarios/{id}/status")
    public ResponseEntity<Usuario> alterarStatusUsuario(
            @PathVariable Integer id
    ) {
        // Encaminha a solicitacao para o service responsavel e monta a resposta HTTP.
        return ResponseEntity.ok(
                gestorService.alterarStatusUsuario(id)
        );
    }

    /*
     * Recebe uma requisicao GET e devolve os dados fornecidos pelo service.
     */
    @GetMapping("/usuarios/{id}/detalhes")
    public ResponseEntity<UsuarioDetalhesDTO> detalhesUsuario(
            @PathVariable Integer id
    ) {
        // Encaminha a solicitacao para o service responsavel e monta a resposta HTTP.
        return ResponseEntity.ok(
                gestorService.detalhesUsuario(id)
        );
    }

    // =====================================================
    // PROFESSORES
    // =====================================================
    @GetMapping("/professores")
    public ResponseEntity<List<ProfessorResumoDTO>> listarProfessores() {
        // Encaminha a solicitacao para o service responsavel e monta a resposta HTTP.
        return ResponseEntity.ok(
                gestorService.listarProfessores()
        );
    }

    /*
     * Lista os registros conforme os filtros recebidos e devolve o resultado.
     */
    @GetMapping("/professores/resumo")
    public ResponseEntity<List<ProfessorResumoDTO>> listarProfessoresResumo() {
        // Encaminha a solicitacao para o service responsavel e monta a resposta HTTP.
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
                // Encaminha a solicitacao para o service responsavel e monta a resposta HTTP.
        return ResponseEntity.ok(
                frequenciaService.calcularPorTurma(turmaId)
        );
    }

    // =====================================================
    // OCORRÊNCIAS
    // =====================================================
    @GetMapping("/ocorrencias")
    public ResponseEntity<List<OcorrenciaDTO>> listarOcorrencias() {
        // Encaminha a solicitacao para o service responsavel e monta a resposta HTTP.
        return ResponseEntity.ok(
                ocorrenciaService.listar()
        );
    }

    /*
     * Lista os registros conforme os filtros recebidos e devolve o resultado.
     */
    @GetMapping("/ocorrencias/status/{status}")
    public ResponseEntity<List<OcorrenciaDTO>> listarOcorrenciasPorStatus(
            @PathVariable String status) {
                // Encaminha a solicitacao para o service responsavel e monta a resposta HTTP.
        return ResponseEntity.ok(
                ocorrenciaService.listarPorStatus(status)
        );
    }

    /*
     * Localiza o registro e altera seu status atual.
     */
    @PatchMapping("/ocorrencias/{id}/status")
    public ResponseEntity<OcorrenciaDTO> alterarStatusOcorrencia(
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

    /*
     * Lista os registros conforme os filtros recebidos e devolve o resultado.
     */
    @GetMapping("/turmas")
    public ResponseEntity<List<TurmaDetalheDTO>> listarTurmas() {
        // Encaminha a solicitacao para o service responsavel e monta a resposta HTTP.
        return ResponseEntity.ok(
                gestorService.listarTurmas()
        );
    }

    /*
     * Lista os registros conforme os filtros recebidos e devolve o resultado.
     */
    @GetMapping("/turmas/resumo")
    public ResponseEntity<List<TurmaResumoDTO>> listarTurmasResumo() {
        // Encaminha a solicitacao para o service responsavel e monta a resposta HTTP.
        return ResponseEntity.ok(
                gestorService.listarTurmasResumo()
        );
    }

    /*
     * Recebe os dados, executa as validacoes e cadastra um novo registro.
     */
    @PostMapping("/turmas")
    public ResponseEntity<TurmaDetalheDTO> cadastrarTurma(
            @Valid @RequestBody CriarTurmaDTO dto
    ) {
        // Encaminha a solicitacao para o service responsavel e monta a resposta HTTP.
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(gestorService.cadastrarTurma(dto));
    }

    /*
     * Busca o registro, aplica as alteracoes recebidas e salva a atualizacao.
     */
    @PutMapping("/turmas/{id}")
    public ResponseEntity<TurmaDetalheDTO> atualizarTurma(
            @PathVariable Integer id,
            @RequestBody AtualizarTurmaDTO dto
    ) {
        // Encaminha a solicitacao para o service responsavel e monta a resposta HTTP.
        return ResponseEntity.ok(
                gestorService.atualizarTurma(id, dto)
        );
    }

    /*
     * Lista os registros conforme os filtros recebidos e devolve o resultado.
     */
    @GetMapping("/disciplinas/resumo")
    public ResponseEntity<List<DisciplinaDTO>> listarDisciplinasResumo() {
        // Encaminha a solicitacao para o service responsavel e monta a resposta HTTP.
        return ResponseEntity.ok(
                gestorService.listarDisciplinasDTO()
        );
    }

    /*
     * Recebe uma requisicao GET e devolve os dados fornecidos pelo service.
     */
    @GetMapping("/turmas/{id}/detalhes")
    public ResponseEntity<TurmaDetalhesCompletosDTO> detalhesTurma(
            @PathVariable Integer id
    ) {
        // Encaminha a solicitacao para o service responsavel e monta a resposta HTTP.
        return ResponseEntity.ok(
                gestorService.detalhesTurma(id)
        );
    }

    /*
     * Recebe uma requisicao GET e devolve os dados fornecidos pelo service.
     */
    @GetMapping("/dashboard/resumo-institucional")
    public ResponseEntity<ResumoInstitucionalDTO> resumoInstitucional() {
        // Encaminha a solicitacao para o service responsavel e monta a resposta HTTP.
        return ResponseEntity.ok(
                gestorService.resumoInstitucional()
        );
    }

    //===============================
    //DICIPLINAS
    //===============================
    @GetMapping("/disciplinas")
    public ResponseEntity<List<DisciplinaDTO>> listarDisciplinas() {
        // Encaminha a solicitacao para o service responsavel e monta a resposta HTTP.
        return ResponseEntity.ok(
                gestorService.listarDisciplinasDTO()
        );
    }

    /*
     * Recebe os dados, executa as validacoes e cadastra um novo registro.
     */
    @PostMapping("/disciplinas")
    public ResponseEntity<DisciplinaDTO> cadastrarDisciplina(
            @RequestBody DisciplinaDTO dto
    ) {
        // Encaminha a solicitacao para o service responsavel e monta a resposta HTTP.
        return ResponseEntity.ok(
                gestorService.cadastrarDisciplina(dto)
        );
    }

    /*
     * Busca o registro, aplica as alteracoes recebidas e salva a atualizacao.
     */
    @PutMapping("/disciplinas/{id}")
    public ResponseEntity<DisciplinaDTO> editarDisciplina(
            @PathVariable Integer id,
            @RequestBody DisciplinaDTO dto
    ) {
        // Encaminha a solicitacao para o service responsavel e monta a resposta HTTP.
        return ResponseEntity.ok(
                gestorService.editarDisciplina(id, dto)
        );
    }
}
