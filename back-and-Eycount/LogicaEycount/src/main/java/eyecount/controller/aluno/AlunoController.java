package eyecount.controller.aluno;

import eyecount.dto.aluno.*;
import eyecount.dto.ocorrencia.OcorrenciaDTO;

import eyecount.service.AlunoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
/*
 * Controller da area Aluno. Controller responsavel por receber requisicoes HTTP, validar os
 * dados de entrada e encaminhar as operacoes para os services.
 */

@RestController
@RequestMapping("/aluno")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class AlunoController {
    // Dependencia que executa as regras de negocio desta operacao.
    private final AlunoService alunoService;

    /*
     * Recebe uma requisicao GET e devolve os dados fornecidos pelo service.
     */
    @GetMapping("/dashboard/{usuarioId}")
    public ResponseEntity<AlunoDashboardDTO> dashboard(
            @PathVariable Integer usuarioId
    ) {
        // Encaminha a solicitacao para o service responsavel e monta a resposta HTTP.
        return ResponseEntity.ok(
                alunoService.dashboard(usuarioId)
        );
    }

    /*
     * Recebe uma requisicao GET e devolve os dados fornecidos pelo service.
     */
    @GetMapping("/presencas/{usuarioId}")
    public ResponseEntity<List<HistoricoPresencaDTO>> historico(
            @PathVariable Integer usuarioId
    ) {
        // Encaminha a solicitacao para o service responsavel e monta a resposta HTTP.
        return ResponseEntity.ok(
                alunoService.historico(usuarioId)
        );
    }

    /*
     * Recebe uma requisicao GET e devolve os dados fornecidos pelo service.
     */
    @GetMapping("/ocorrencias/{usuarioId}")
    public ResponseEntity<List<OcorrenciaDTO>> ocorrencias(
            @PathVariable Integer usuarioId
    ) {
        // Encaminha a solicitacao para o service responsavel e monta a resposta HTTP.
        return ResponseEntity.ok(
                alunoService.ocorrencias(usuarioId)
        );
    }

    /*
     * Busca os registros que atendem aos filtros definidos neste metodo.
     */
    @GetMapping("/chamada-aberta/{usuarioId}")
    public ResponseEntity<ChamadaAbertaAlunoDTO> buscarChamadaAberta(
            @PathVariable Integer usuarioId
    ) {
        // Encaminha a solicitacao para o service responsavel e monta a resposta HTTP.
        return ResponseEntity.ok(
                alunoService.buscarChamadaAberta(usuarioId)
        );
    }

    /*
     * Recebe uma requisicao GET e devolve os dados fornecidos pelo service.
     */
    @GetMapping("/perfil/{usuarioId}")
    public ResponseEntity<AlunoPerfilDTO> perfil(
            @PathVariable Integer usuarioId
    ) {
        // Encaminha a solicitacao para o service responsavel e monta a resposta HTTP.
        return ResponseEntity.ok(
                alunoService.perfil(usuarioId)
        );
    }

    /*
     * Recebe uma requisicao GET e devolve os dados fornecidos pelo service.
     */
    @GetMapping("/desempenho-disciplinas/{usuarioId}")
    public ResponseEntity<List<AlunoDesempenhoDisciplinaDTO>> desempenhoPorDisciplina(
            @PathVariable Integer usuarioId
    ) {
        // Encaminha a solicitacao para o service responsavel e monta a resposta HTTP.
        return ResponseEntity.ok(
                alunoService.desempenhoPorDisciplina(usuarioId)
        );
    }
}
