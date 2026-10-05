package prezence.controller.professor;

import prezence.dto.aula.AlunoChamadaDTO;
import prezence.dto.aula.ChamadaAbertaProfessorDTO;
import prezence.dto.aula.HistoricoAulaDTO;

import prezence.dto.aviso.AvisoDTO;

import prezence.dto.biometria.SolicitacaoPresencaBiometricaDTO;

import prezence.dto.dashboard.FrequenciaTurmaDTO;

import prezence.dto.nota.NotaDTO;

import prezence.dto.ocorrencia.OcorrenciaDTO;

import prezence.dto.presenca.PresencaDTO;

import prezence.dto.professor.AlunoProfessorDTO;
import prezence.dto.professor.DesempenhoTurmaDTO;
import prezence.dto.professor.PresencaAlunoProfessorDTO;
import prezence.dto.professor.ProfessorDashboardDTO;
import prezence.dto.professor.ProfessorPerfilDTO;
import prezence.dto.professor.TurmaProfessorDTO;

import prezence.model.Aula;
import prezence.model.MetodoPresenca;
import prezence.model.Professor;

import prezence.service.AulaService;
import prezence.service.AvisoService;
import prezence.service.NotaService;
import prezence.service.OcorrenciaService;
import prezence.service.PresencaService;
import prezence.service.ProfessorService;
import prezence.service.SolicitacaoPresencaBiometricaService;

import jakarta.validation.Valid;

import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestAttribute;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;


@RestController
@RequestMapping("/professor")
@RequiredArgsConstructor
public class ProfessorController {

    private final ProfessorService professorService;
    private final AulaService aulaService;
    private final OcorrenciaService ocorrenciaService;
    private final PresencaService presencaService;
    private final AvisoService avisoService;

    private final SolicitacaoPresencaBiometricaService
            solicitacaoPresencaBiometricaService;

    private final NotaService notaService;


    // =====================================================
    // DASHBOARD
    // =====================================================

    @GetMapping("/dashboard")
    public ResponseEntity<ProfessorDashboardDTO> dashboard(
            @RequestAttribute("usuarioId")
            Integer usuarioId
    ) {

        return ResponseEntity.ok(
                professorService.dashboard(
                        usuarioId
                )
        );
    }


    // =====================================================
    // TURMAS
    // =====================================================

    @GetMapping("/turmas")
    public ResponseEntity<List<TurmaProfessorDTO>> listarTurmas(
            @RequestAttribute("usuarioId")
            Integer usuarioId
    ) {

        return ResponseEntity.ok(
                professorService.listarTurmas(
                        usuarioId
                )
        );
    }


    @GetMapping(
            "/turma-disciplina/{turmaDisciplinaId}/alunos"
    )
    public ResponseEntity<List<?>> listarAlunos(

            @RequestAttribute("usuarioId")
            Integer usuarioId,

            @PathVariable
            Integer turmaDisciplinaId
    ) {

        return ResponseEntity.ok(
                professorService.listarAlunos(
                        usuarioId,
                        turmaDisciplinaId
                )
        );
    }


    @GetMapping("/alunos")
    public ResponseEntity<List<AlunoProfessorDTO>>
    listarAlunosProfessor(

            @RequestAttribute("usuarioId")
            Integer usuarioId,

            @RequestParam(required = false)
            Integer turmaId
    ) {

        return ResponseEntity.ok(
                professorService.listarAlunosProfessor(
                        usuarioId,
                        turmaId
                )
        );
    }


    @GetMapping("/frequencia-turmas")
    public ResponseEntity<List<FrequenciaTurmaDTO>>
    frequenciaTurmas(

            @RequestAttribute("usuarioId")
            Integer usuarioId
    ) {

        return ResponseEntity.ok(
                professorService.buscarFrequenciaTurmas(
                        usuarioId
                )
        );
    }


    // =====================================================
    // PRESENÇA MANUAL
    // =====================================================

    @PostMapping("/presenca")
    public ResponseEntity<Void> registrarPresenca(

            @RequestAttribute("usuarioId")
            Integer usuarioId,

            @RequestBody
            PresencaDTO dto
    ) {

        /*
         * A rota do professor é exclusivamente manual.
         *
         * Mesmo que o front envie outro método,
         * o backend força MANUAL.
         */
        PresencaDTO presencaDTO =
                new PresencaDTO();

        presencaDTO.setAlunoId(
                dto.getAlunoId()
        );

        presencaDTO.setAulaId(
                dto.getAulaId()
        );

        presencaDTO.setStatus(
                dto.getStatus()
        );

        presencaDTO.setMetodo(
                MetodoPresenca.MANUAL
        );


        presencaService.registrarManual(
                presencaDTO,
                usuarioId
        );


        return ResponseEntity
                .noContent()
                .build();
    }


    // =====================================================
    // AULAS / CHAMADA
    // =====================================================

    @PostMapping("/abrir")
    public ResponseEntity<Aula> abrirChamada(

            @RequestAttribute("usuarioId")
            Integer usuarioId,

            @RequestParam
            Integer turmaDisciplinaId
    ) {

        return ResponseEntity.ok(
                aulaService.abrirOuRetomarChamada(
                        turmaDisciplinaId,
                        usuarioId
                )
        );
    }


    @GetMapping("/chamada-aberta")
    public ResponseEntity<ChamadaAbertaProfessorDTO>
    buscarChamadaAberta(

            @RequestAttribute("usuarioId")
            Integer usuarioId
    ) {

        return aulaService
                .buscarChamadaAbertaProfessor(
                        usuarioId
                )
                .map(ResponseEntity::ok)
                .orElseGet(() ->
                        ResponseEntity
                                .noContent()
                                .build()
                );
    }


    @PostMapping("/aula/encerrar/{aulaId}")
    public ResponseEntity<Void> encerrarAula(

            @RequestAttribute("usuarioId")
            Integer usuarioId,

            @PathVariable
            Integer aulaId
    ) {

        aulaService.encerrarChamada(
                aulaId,
                usuarioId
        );

        return ResponseEntity
                .noContent()
                .build();
    }


    @GetMapping("/historico")
    public ResponseEntity<List<HistoricoAulaDTO>>
    listarHistorico(

            @RequestAttribute("usuarioId")
            Integer usuarioId
    ) {

        return ResponseEntity.ok(
                professorService.listarHistorico(
                        usuarioId
                )
        );
    }


    @GetMapping("/aula/{aulaId}/alunos")
    public ResponseEntity<List<AlunoChamadaDTO>>
    listarAlunosDaChamada(

            @RequestAttribute("usuarioId")
            Integer usuarioId,

            @PathVariable
            Integer aulaId
    ) {

        return ResponseEntity.ok(
                aulaService.listarAlunosDaChamada(
                        aulaId,
                        usuarioId
                )
        );
    }


    @GetMapping("/aula/{aulaId}/detalhes")
    public ResponseEntity<?> detalharAula(

            @RequestAttribute("usuarioId")
            Integer usuarioId,

            @PathVariable
            Integer aulaId
    ) {

        return ResponseEntity.ok(
                aulaService.listarDetalhesAula(
                        aulaId,
                        usuarioId
                )
        );
    }


    // =====================================================
    // PRESENÇAS DA AULA
    // =====================================================

    @GetMapping("/aulas/{aulaId}/presencas")
    public ResponseEntity<List<PresencaAlunoProfessorDTO>>
    listarPresencasDaAula(

            @RequestAttribute("usuarioId")
            Integer usuarioId,

            @PathVariable
            Integer aulaId
    ) {

        return ResponseEntity.ok(
                professorService.listarPresencasDaAula(
                        usuarioId,
                        aulaId
                )
        );
    }


    // =====================================================
    // BIOMETRIA - SOLICITAÇÕES PENDENTES
    // =====================================================

    @GetMapping("/biometria/pendentes")
    public ResponseEntity<List<SolicitacaoPresencaBiometricaDTO>>
    listarBiometriasPendentes(

            @RequestAttribute("usuarioId")
            Integer usuarioId
    ) {

        return ResponseEntity.ok(
                solicitacaoPresencaBiometricaService
                        .listarPendentesProfessor(
                                usuarioId
                        )
        );
    }


    // =====================================================
    // BIOMETRIA - PROFESSOR CONFIRMA
    // =====================================================

    @PatchMapping(
            "/biometria/{solicitacaoId}/confirmar"
    )
    public ResponseEntity<SolicitacaoPresencaBiometricaDTO>
    confirmarBiometria(

            @PathVariable
            Integer solicitacaoId,

            @RequestAttribute("usuarioId")
            Integer usuarioId
    ) {

        return ResponseEntity.ok(
                solicitacaoPresencaBiometricaService
                        .confirmar(
                                solicitacaoId,
                                usuarioId
                        )
        );
    }


    // =====================================================
    // BIOMETRIA - PROFESSOR RECUSA
    // =====================================================

    @PatchMapping(
            "/biometria/{solicitacaoId}/recusar"
    )
    public ResponseEntity<SolicitacaoPresencaBiometricaDTO>
    recusarBiometria(

            @PathVariable
            Integer solicitacaoId,

            @RequestAttribute("usuarioId")
            Integer usuarioId
    ) {

        return ResponseEntity.ok(
                solicitacaoPresencaBiometricaService
                        .recusar(
                                solicitacaoId,
                                usuarioId
                        )
        );
    }


    // =====================================================
    // OCORRÊNCIAS
    // =====================================================

    @PostMapping("/ocorrencias")
    public ResponseEntity<OcorrenciaDTO>
    criarOcorrencia(

            @RequestAttribute("usuarioId")
            Integer usuarioId,

            @Valid
            @RequestBody
            OcorrenciaDTO dto
    ) {

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(
                        ocorrenciaService
                                .cadastrarPorProfessor(
                                        usuarioId,
                                        dto
                                )
                );
    }


    @PutMapping("/ocorrencias/{id}")
    public ResponseEntity<OcorrenciaDTO>
    editarOcorrencia(

            @RequestAttribute("usuarioId")
            Integer usuarioId,

            @PathVariable
            Integer id,

            @Valid
            @RequestBody
            OcorrenciaDTO dto
    ) {

        return ResponseEntity.ok(
                ocorrenciaService
                        .editarPorProfessor(
                                usuarioId,
                                id,
                                dto
                        )
        );
    }


    @GetMapping("/ocorrencias")
    public ResponseEntity<List<OcorrenciaDTO>>
    listarOcorrenciasProfessor(

            @RequestAttribute("usuarioId")
            Integer usuarioId
    ) {

        Professor professor =
                professorService
                        .buscarProfessorPorUsuario(
                                usuarioId
                        );


        return ResponseEntity.ok(
                ocorrenciaService
                        .listarPorProfessor(
                                professor.getId()
                        )
        );
    }


    // =====================================================
    // DESEMPENHO DAS TURMAS
    // =====================================================

    @GetMapping("/desempenho-turmas")
    public ResponseEntity<List<DesempenhoTurmaDTO>>
    desempenhoTurmas(

            @RequestAttribute("usuarioId")
            Integer usuarioId,

            @RequestParam(required = false)
            Integer turmaId,

            @RequestParam(defaultValue = "mes")
            String periodo
    ) {

        return ResponseEntity.ok(
                professorService.desempenhoTurmas(
                        usuarioId,
                        turmaId,
                        periodo
                )
        );
    }


    // =====================================================
    // PERFIL
    // =====================================================

    @GetMapping("/perfil")
    public ResponseEntity<ProfessorPerfilDTO>
    buscarPerfil(

            @RequestAttribute("usuarioId")
            Integer usuarioId
    ) {

        return ResponseEntity.ok(
                professorService.buscarPerfil(
                        usuarioId
                )
        );
    }


    // =====================================================
    // AVISOS / FEEDBACK
    // =====================================================

    @PostMapping("/avisos")
    public ResponseEntity<AvisoDTO>
    enviarFeedbackAluno(

            @RequestAttribute("usuarioId")
            Integer usuarioId,

            @RequestBody
            AvisoDTO dto
    ) {

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(
                        avisoService.enviarPorProfessor(
                                usuarioId,
                                dto
                        )
                );
    }


    // =====================================================
    // NOTAS - CADASTRAR
    // =====================================================

    @PostMapping("/notas")
    public ResponseEntity<NotaDTO>
    cadastrarNota(

            @RequestAttribute("usuarioId")
            Integer usuarioId,

            @RequestBody
            NotaDTO dto
    ) {

        NotaDTO nota =
                notaService.cadastrar(
                        usuarioId,
                        dto
                );


        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(nota);
    }


    // =====================================================
    // NOTAS - ATUALIZAR
    // =====================================================

    @PutMapping("/notas/{notaId}")
    public ResponseEntity<NotaDTO>
    atualizarNota(

            @PathVariable
            Integer notaId,

            @RequestAttribute("usuarioId")
            Integer usuarioId,

            @RequestBody
            NotaDTO dto
    ) {

        return ResponseEntity.ok(
                notaService.atualizar(
                        usuarioId,
                        notaId,
                        dto
                )
        );
    }


    // =====================================================
    // NOTAS - EXCLUIR
    // =====================================================

    @DeleteMapping("/notas/{notaId}")
    public ResponseEntity<Void>
    excluirNota(

            @PathVariable
            Integer notaId,

            @RequestAttribute("usuarioId")
            Integer usuarioId
    ) {

        notaService.excluir(
                usuarioId,
                notaId
        );


        return ResponseEntity
                .noContent()
                .build();
    }


    // =====================================================
    // NOTAS - LISTAR POR VÍNCULO
    // =====================================================

    @GetMapping("/notas/vinculo/{turmaDisciplinaId}")
    public ResponseEntity<List<NotaDTO>>
    listarNotasPorVinculo(

            @PathVariable
            Integer turmaDisciplinaId,

            @RequestAttribute("usuarioId")
            Integer usuarioId
    ) {

        return ResponseEntity.ok(
                notaService.listarPorVinculo(
                        usuarioId,
                        turmaDisciplinaId
                )
        );
    }


    // =====================================================
    // NOTAS - ALUNO NO VÍNCULO
    // =====================================================

    @GetMapping(
            "/notas/aluno/{alunoId}/vinculo/{turmaDisciplinaId}"
    )
    public ResponseEntity<List<NotaDTO>>
    listarNotasAluno(

            @PathVariable
            Integer alunoId,

            @PathVariable
            Integer turmaDisciplinaId,

            @RequestAttribute("usuarioId")
            Integer usuarioId
    ) {

        return ResponseEntity.ok(
                notaService.listarAlunoNoVinculo(
                        usuarioId,
                        alunoId,
                        turmaDisciplinaId
                )
        );
    }
}