package prezence.controller.aluno;

import prezence.dto.aluno.*;
import prezence.dto.aula.HorarioAulaDTO;
import prezence.dto.aviso.AvisoDTO;
import prezence.dto.nota.NotaDTO;
import prezence.dto.ocorrencia.OcorrenciaDTO;

import prezence.service.AlunoService;
import prezence.service.AvisoService;
import prezence.service.NotaService;

import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import org.springframework.web.bind.annotation.*;

import org.springframework.web.server.ResponseStatusException;

import java.util.List;


@RestController
@RequestMapping("/aluno")
@RequiredArgsConstructor
public class AlunoController {

    private final AlunoService alunoService;
    private final AvisoService avisoService;
    private final NotaService notaService;


    // =====================================================
    // DASHBOARD
    // =====================================================

    @GetMapping("/dashboard/{usuarioId}")
    public ResponseEntity<AlunoDashboardDTO> dashboard(

            @RequestAttribute("usuarioId")
            Integer usuarioAutenticadoId,

            @PathVariable
            Integer usuarioId
    ) {

        validarProprioUsuario(
                usuarioAutenticadoId,
                usuarioId
        );

        return ResponseEntity.ok(
                alunoService.dashboard(
                        usuarioAutenticadoId
                )
        );
    }


    // =====================================================
    // HISTÓRICO DE PRESENÇAS
    // =====================================================

    @GetMapping("/presencas/{usuarioId}")
    public ResponseEntity<List<HistoricoPresencaDTO>> historico(

            @RequestAttribute("usuarioId")
            Integer usuarioAutenticadoId,

            @PathVariable
            Integer usuarioId
    ) {

        validarProprioUsuario(
                usuarioAutenticadoId,
                usuarioId
        );

        return ResponseEntity.ok(
                alunoService.historico(
                        usuarioAutenticadoId
                )
        );
    }


    // =====================================================
    // OCORRÊNCIAS
    // =====================================================

    @GetMapping("/ocorrencias/{usuarioId}")
    public ResponseEntity<List<OcorrenciaDTO>> ocorrencias(

            @RequestAttribute("usuarioId")
            Integer usuarioAutenticadoId,

            @PathVariable
            Integer usuarioId
    ) {

        validarProprioUsuario(
                usuarioAutenticadoId,
                usuarioId
        );

        return ResponseEntity.ok(
                alunoService.ocorrencias(
                        usuarioAutenticadoId
                )
        );
    }


    // =====================================================
    // CHAMADA ABERTA
    // =====================================================

    @GetMapping("/chamada-aberta/{usuarioId}")
    public ResponseEntity<ChamadaAbertaAlunoDTO> buscarChamadaAberta(

            @RequestAttribute("usuarioId")
            Integer usuarioAutenticadoId,

            @PathVariable
            Integer usuarioId
    ) {

        validarProprioUsuario(
                usuarioAutenticadoId,
                usuarioId
        );

        return ResponseEntity.ok(
                alunoService.buscarChamadaAberta(
                        usuarioAutenticadoId
                )
        );
    }


    // =====================================================
    // PERFIL
    // =====================================================

    @GetMapping("/perfil/{usuarioId}")
    public ResponseEntity<AlunoPerfilDTO> perfil(

            @RequestAttribute("usuarioId")
            Integer usuarioAutenticadoId,

            @PathVariable
            Integer usuarioId
    ) {

        validarProprioUsuario(
                usuarioAutenticadoId,
                usuarioId
        );

        return ResponseEntity.ok(
                alunoService.perfil(
                        usuarioAutenticadoId
                )
        );
    }


    // =====================================================
    // DESEMPENHO
    // =====================================================

    @GetMapping("/desempenho-disciplinas/{usuarioId}")
    public ResponseEntity<List<AlunoDesempenhoDisciplinaDTO>>
    desempenhoPorDisciplina(

            @RequestAttribute("usuarioId")
            Integer usuarioAutenticadoId,

            @PathVariable
            Integer usuarioId
    ) {

        validarProprioUsuario(
                usuarioAutenticadoId,
                usuarioId
        );

        return ResponseEntity.ok(
                alunoService.desempenhoPorDisciplina(
                        usuarioAutenticadoId
                )
        );
    }


    // =====================================================
    // AGENDA
    // =====================================================

    @GetMapping("/agenda")
    public ResponseEntity<List<HorarioAulaDTO>> agenda(

            @RequestAttribute("usuarioId")
            Integer usuarioId
    ) {

        return ResponseEntity.ok(
                alunoService.agenda(
                        usuarioId
                )
        );
    }


    // =====================================================
    // AVISOS
    // =====================================================

    @GetMapping("/avisos/{usuarioId}")
    public ResponseEntity<List<AvisoDTO>> listarAvisos(

            @RequestAttribute("usuarioId")
            Integer usuarioAutenticadoId,

            @PathVariable
            Integer usuarioId
    ) {

        validarProprioUsuario(
                usuarioAutenticadoId,
                usuarioId
        );

        return ResponseEntity.ok(
                avisoService.listarPorAlunoUsuario(
                        usuarioAutenticadoId
                )
        );
    }


    @PatchMapping("/avisos/lidos/{usuarioId}")
    public ResponseEntity<Void> marcarTodosAvisosComoLidos(

            @RequestAttribute("usuarioId")
            Integer usuarioAutenticadoId,

            @PathVariable
            Integer usuarioId
    ) {

        validarProprioUsuario(
                usuarioAutenticadoId,
                usuarioId
        );

        avisoService.marcarTodosComoLidos(
                usuarioAutenticadoId
        );

        return ResponseEntity
                .noContent()
                .build();
    }


    @PatchMapping("/avisos/{avisoId}/lido")
    public ResponseEntity<Void> marcarAvisoComoLido(

            @RequestAttribute("usuarioId")
            Integer usuarioId,

            @PathVariable
            Integer avisoId
    ) {

        avisoService.marcarComoLido(
                usuarioId,
                avisoId
        );

        return ResponseEntity
                .noContent()
                .build();
    }


    // =====================================================
    // NOTAS
    // =====================================================

    @GetMapping("/notas")
    public ResponseEntity<List<NotaDTO>> listarMinhasNotas(

            @RequestAttribute("usuarioId")
            Integer usuarioId
    ) {

        return ResponseEntity.ok(
                notaService.listarPorAlunoUsuario(
                        usuarioId
                )
        );
    }


    // =====================================================
    // SEGURANÇA
    // =====================================================

    private void validarProprioUsuario(
            Integer usuarioAutenticadoId,
            Integer usuarioSolicitadoId
    ) {

        if (
                usuarioAutenticadoId == null
                        || usuarioSolicitadoId == null
        ) {

            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Usuário não autenticado"
            );
        }

        if (
                !usuarioAutenticadoId.equals(
                        usuarioSolicitadoId
                )
        ) {

            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Você não possui permissão para acessar dados de outro usuário"
            );
        }
    }
}