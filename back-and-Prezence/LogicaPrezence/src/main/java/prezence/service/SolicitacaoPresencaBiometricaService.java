package prezence.service;

import prezence.dto.biometria.SolicitacaoPresencaBiometricaDTO;
import prezence.model.*;
import prezence.repository.*;

import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.time.ZoneId;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SolicitacaoPresencaBiometricaService {

    private final SolicitacaoPresencaBiometricaRepository solicitacaoRepository;
    private final AlunoRepository alunoRepository;
    private final AulaRepository aulaRepository;
    private final PresencaRepository presencaRepository;
    private final PresencaService presencaService;
    private static final ZoneId FUSO_HORARIO =
            ZoneId.of("America/Sao_Paulo");

    private static final int TOLERANCIA_PADRAO_MINUTOS = 30;


    // =====================================================
    // ALUNO - CRIAR SOLICITAÇÃO
    // =====================================================

    @Transactional
    public SolicitacaoPresencaBiometricaDTO solicitar(
            Integer alunoUsuarioId,
            Integer alunoIdInformado,
            Integer aulaId
    ) {

        // =====================================================
        // VALIDAR DADOS RECEBIDOS
        // =====================================================

        if (alunoUsuarioId == null) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Usuário não informado"
            );
        }

        if (alunoIdInformado == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Aluno não informado"
            );
        }

        if (aulaId == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Aula não informada"
            );
        }


        // =====================================================
        // BUSCAR ALUNO AUTENTICADO
        // =====================================================

        Aluno aluno =
                alunoRepository
                        .findByUsuarioId(alunoUsuarioId)
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Aluno não encontrado"
                                )
                        );


        // =====================================================
        // GARANTIR QUE O ALUNO DO BODY É O ALUNO LOGADO
        // =====================================================

        if (!aluno.getId().equals(alunoIdInformado)) {

            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "O aluno informado não corresponde ao usuário autenticado"
            );
        }


        // =====================================================
        // BUSCAR AULA
        // =====================================================

        Aula aula =
                aulaRepository
                        .findById(aulaId)
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Aula não encontrada"
                                )
                        );


        // =====================================================
        // HORÁRIO EXATO DA BIOMETRIA
        // =====================================================

        LocalDateTime horarioSolicitacao =
                LocalDateTime.now(FUSO_HORARIO);


        // =====================================================
        // VALIDAR SE A AULA ACEITA BIOMETRIA AGORA
        // =====================================================

        validarAulaParaSolicitacao(
                aula,
                horarioSolicitacao
        );


        // =====================================================
        // VALIDAR TURMA
        // =====================================================

        if (
                aluno.getTurma() == null
                        ||
                        aula.getTurmaDisciplina() == null
                        ||
                        aula.getTurmaDisciplina().getTurma() == null
        ) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Turma da aula ou do aluno não encontrada"
            );
        }

        Integer turmaAlunoId =
                aluno
                        .getTurma()
                        .getId();

        Integer turmaAulaId =
                aula
                        .getTurmaDisciplina()
                        .getTurma()
                        .getId();

        if (!turmaAlunoId.equals(turmaAulaId)) {

            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Esta aula não pertence à turma do aluno"
            );
        }


        // =====================================================
        // VERIFICAR SE A PRESENÇA JÁ FOI REGISTRADA
        // =====================================================

        boolean jaPossuiPresenca =
                presencaRepository
                        .findByAluno_IdAndAula_Id(
                                aluno.getId(),
                                aula.getId()
                        )
                        .isPresent();

        if (jaPossuiPresenca) {

            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "A presença deste aluno já foi registrada"
            );
        }


        // =====================================================
        // VERIFICAR SOLICITAÇÃO PENDENTE
        // =====================================================

        var solicitacaoPendente =
                solicitacaoRepository
                        .findByAluno_IdAndAula_IdAndStatus(
                                aluno.getId(),
                                aula.getId(),
                                StatusSolicitacaoBiometrica.PENDENTE
                        );

        /*
         * Se o aluno clicar novamente enquanto ainda
         * estiver aguardando o professor, não criamos
         * outra solicitação.
         */
        if (solicitacaoPendente.isPresent()) {

            return converterParaDTO(
                    solicitacaoPendente.get()
            );
        }


        // =====================================================
        // CALCULAR STATUS SUGERIDO
        // =====================================================

        /*
         * O status é calculado no momento da biometria
         * e depois permanece registrado.
         *
         * Exemplo:
         *
         * dentro da tolerância -> PRESENTE
         * depois da tolerância -> ATRASADO
         */
        StatusPresenca statusSugerido =
                calcularStatusSugerido(
                        aula,
                        horarioSolicitacao
                );


        // =====================================================
        // CRIAR SOLICITAÇÃO
        // =====================================================

        SolicitacaoPresencaBiometrica solicitacao =
                new SolicitacaoPresencaBiometrica();

        solicitacao.setAluno(
                aluno
        );

        solicitacao.setAula(
                aula
        );

        solicitacao.setStatus(
                StatusSolicitacaoBiometrica.PENDENTE
        );

        solicitacao.setStatusSugerido(
                statusSugerido
        );

        solicitacao.setHorarioSolicitacao(
                horarioSolicitacao
        );

        /*
         * Ainda não existe professor responsável
         * pela decisão porque ele ainda não confirmou.
         */
        solicitacao.setProfessorUsuario(
                null
        );

        solicitacao.setHorarioDecisao(
                null
        );

        solicitacao.setMotivoRecusa(
                null
        );


        // =====================================================
        // SALVAR
        // =====================================================

        SolicitacaoPresencaBiometrica salva =
                solicitacaoRepository.save(
                        solicitacao
                );


        // =====================================================
        // RETORNAR PARA O FRONT
        // =====================================================

        return converterParaDTO(
                salva
        );
    }


    // =====================================================
    // ALUNO - STATUS DA SOLICITAÇÃO
    // =====================================================

    @Transactional(readOnly = true)
    public SolicitacaoPresencaBiometricaDTO buscarStatus(
            Integer alunoUsuarioId,
            Integer aulaId
    ) {

        if (alunoUsuarioId == null) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Usuário não informado"
            );
        }

        Aluno aluno =
                alunoRepository
                        .findByUsuarioId(alunoUsuarioId)
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Aluno não encontrado"
                                )
                        );

        /*
         * Se ainda não houve nenhuma tentativa,
         * retornamos null.
         *
         * O Controller responderá 200 com corpo vazio.
         */
        return solicitacaoRepository
                .findFirstByAluno_IdAndAula_IdOrderByHorarioSolicitacaoDesc(
                        aluno.getId(),
                        aulaId
                )
                .map(this::converterParaDTO)
                .orElse(null);
    }


    // =====================================================
    // STATUS SUGERIDO
    // ====================================================

    private StatusPresenca calcularStatusSugerido(
            Aula aula,
            LocalDateTime horarioSolicitacao
    ) {
        return StatusPresenca.PRESENTE;
    }


    // =====================================================
    // CONVERTER DTO
    // =====================================================

    private SolicitacaoPresencaBiometricaDTO converterParaDTO(
            SolicitacaoPresencaBiometrica solicitacao
    ) {

        SolicitacaoPresencaBiometricaDTO dto =
                new SolicitacaoPresencaBiometricaDTO();

        dto.setId(
                solicitacao.getId()
        );

        if (solicitacao.getAluno() != null) {

            dto.setAlunoId(
                    solicitacao
                            .getAluno()
                            .getId()
            );

            if (
                    solicitacao
                            .getAluno()
                            .getUsuario() != null
            ) {

                dto.setAlunoUsuarioId(
                        solicitacao
                                .getAluno()
                                .getUsuario()
                                .getId()
                );

                dto.setAlunoNome(
                        solicitacao
                                .getAluno()
                                .getUsuario()
                                .getNome()
                );
            }
        }

        if (solicitacao.getAula() != null) {

            Aula aula =
                    solicitacao.getAula();

            dto.setAulaId(
                    aula.getId()
            );

            if (
                    aula.getTurmaDisciplina() != null
            ) {

                TurmaDisciplina td =
                        aula.getTurmaDisciplina();

                if (td.getTurma() != null) {

                    dto.setTurmaId(
                            td.getTurma().getId()
                    );

                    dto.setTurmaNome(
                            td.getTurma().getNome()
                    );
                }

                if (td.getDisciplina() != null) {

                    dto.setDisciplinaId(
                            td.getDisciplina().getId()
                    );

                    dto.setDisciplinaNome(
                            td.getDisciplina().getNome()
                    );
                }

                if (
                        td.getProfessor() != null
                                &&
                                td.getProfessor().getUsuario() != null
                ) {

                    dto.setProfessorUsuarioId(
                            td
                                    .getProfessor()
                                    .getUsuario()
                                    .getId()
                    );

                    dto.setProfessorNome(
                            td
                                    .getProfessor()
                                    .getUsuario()
                                    .getNome()
                    );
                }
            }
        }

        dto.setStatus(
                solicitacao
                        .getStatus()
                        .name()
        );

        dto.setStatusSugerido(
                solicitacao
                        .getStatusSugerido()
                        .name()
        );

        dto.setHorarioSolicitacao(
                solicitacao.getHorarioSolicitacao()
        );

        dto.setHorarioDecisao(
                solicitacao.getHorarioDecisao()
        );

        dto.setMotivoRecusa(
                solicitacao.getMotivoRecusa()
        );

        return dto;
    }

    // =====================================================
// VALIDAR AULA PARA SOLICITAÇÃO BIOMÉTRICA
// =====================================================

    private void validarAulaParaSolicitacao(
            Aula aula,
            LocalDateTime horarioSolicitacao
    ) {

        if (aula == null) {

            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Aula não encontrada"
            );
        }


        // =====================================================
        // AULA PRECISA ESTAR EM ANDAMENTO
        // =====================================================

        if (aula.getStatus() != StatusAula.EM_ANDAMENTO) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "A chamada desta aula não está aberta"
            );
        }


        // =====================================================
        // VALIDAR DATA E HORA
        // =====================================================

        if (
                aula.getDataAula() == null
                        ||
                        aula.getHoraInicio() == null
        ) {

            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "A aula não possui data ou horário de início"
            );
        }


        // =====================================================
        // GARANTIR QUE É A AULA DE HOJE
        // =====================================================

        if (
                !horarioSolicitacao
                        .toLocalDate()
                        .equals(aula.getDataAula())
        ) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Esta aula não corresponde à data atual"
            );
        }


        // =====================================================
        // VERIFICAR SE A AULA JÁ COMEÇOU
        // =====================================================

        LocalDateTime inicioAula =
                LocalDateTime.of(
                        aula.getDataAula(),
                        aula.getHoraInicio()
                );

        if (horarioSolicitacao.isBefore(inicioAula)) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "A aula ainda não começou"
            );
        }


        // =====================================================
        // VERIFICAR SE A AULA JÁ TERMINOU
        // =====================================================

        if (aula.getHoraFim() != null) {

            LocalDateTime fimAula =
                    LocalDateTime.of(
                            aula.getDataAula(),
                            aula.getHoraFim()
                    );

            if (!horarioSolicitacao.isBefore(fimAula)) {

                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "O horário desta aula já foi encerrado"
                );
            }
        }
    }
    @Transactional(readOnly = true)
    public List<SolicitacaoPresencaBiometricaDTO>
    listarPendentesProfessor(
            Integer professorUsuarioId
    ) {

        if (professorUsuarioId == null) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Professor não informado"
            );
        }

        return solicitacaoRepository
                .findByStatusAndAula_TurmaDisciplina_Professor_Usuario_IdOrderByHorarioSolicitacaoDesc(
                        StatusSolicitacaoBiometrica.PENDENTE,
                        professorUsuarioId
                )
                .stream()
                .map(this::converterParaDTO)
                .toList();
    }

    @Transactional
    public SolicitacaoPresencaBiometricaDTO confirmar(
            Integer solicitacaoId,
            Integer professorUsuarioId
    ) {

        if (solicitacaoId == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Solicitação não informada"
            );
        }

        if (professorUsuarioId == null) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Professor não informado"
            );
        }

        SolicitacaoPresencaBiometrica solicitacao =
                solicitacaoRepository
                        .findById(solicitacaoId)
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Solicitação biométrica não encontrada"
                                )
                        );


        // =====================================================
        // PRECISA ESTAR PENDENTE
        // =====================================================

        if (
                solicitacao.getStatus()
                        != StatusSolicitacaoBiometrica.PENDENTE
        ) {

            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Esta solicitação já foi processada"
            );
        }


        // =====================================================
        // VALIDAR PROFESSOR RESPONSÁVEL
        // =====================================================

        Usuario professorUsuario =
                obterProfessorResponsavel(
                        solicitacao,
                        professorUsuarioId
                );


        // =====================================================
        // CRIAR PRESENÇA OFICIAL
        // =====================================================

        presencaService.registrarBiometriaConfirmada(
                solicitacao.getAluno().getId(),
                solicitacao.getAula().getId(),
                solicitacao.getStatusSugerido(),
                solicitacao.getHorarioSolicitacao()
        );


        // =====================================================
        // FINALIZAR SOLICITAÇÃO
        // =====================================================

        solicitacao.setStatus(
                StatusSolicitacaoBiometrica.CONFIRMADA
        );

        solicitacao.setHorarioDecisao(
                LocalDateTime.now(FUSO_HORARIO)
        );

        solicitacao.setProfessorUsuario(
                professorUsuario
        );

        solicitacao.setMotivoRecusa(
                null
        );

        SolicitacaoPresencaBiometrica salva =
                solicitacaoRepository.save(
                        solicitacao
                );

        return converterParaDTO(
                salva
        );
    }

    @Transactional
    public SolicitacaoPresencaBiometricaDTO recusar(
            Integer solicitacaoId,
            Integer professorUsuarioId
    ) {

        if (solicitacaoId == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Solicitação não informada"
            );
        }

        if (professorUsuarioId == null) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Professor não informado"
            );
        }

        SolicitacaoPresencaBiometrica solicitacao =
                solicitacaoRepository
                        .findById(solicitacaoId)
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Solicitação biométrica não encontrada"
                                )
                        );


        if (
                solicitacao.getStatus()
                        != StatusSolicitacaoBiometrica.PENDENTE
        ) {

            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Esta solicitação já foi processada"
            );
        }


        Usuario professorUsuario =
                obterProfessorResponsavel(
                        solicitacao,
                        professorUsuarioId
                );


        /*
         * RECUSAR NÃO CRIA PRESENÇA.
         */
        solicitacao.setStatus(
                StatusSolicitacaoBiometrica.RECUSADA
        );

        solicitacao.setHorarioDecisao(
                LocalDateTime.now(FUSO_HORARIO)
        );

        solicitacao.setProfessorUsuario(
                professorUsuario
        );

        solicitacao.setMotivoRecusa(
                null
        );

        SolicitacaoPresencaBiometrica salva =
                solicitacaoRepository.save(
                        solicitacao
                );

        return converterParaDTO(
                salva
        );
    }

    private Usuario obterProfessorResponsavel(
            SolicitacaoPresencaBiometrica solicitacao,
            Integer professorUsuarioId
    ) {

        if (
                solicitacao.getAula() == null
                        ||
                        solicitacao.getAula().getTurmaDisciplina() == null
                        ||
                        solicitacao
                                .getAula()
                                .getTurmaDisciplina()
                                .getProfessor() == null
                        ||
                        solicitacao
                                .getAula()
                                .getTurmaDisciplina()
                                .getProfessor()
                                .getUsuario() == null
        ) {

            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "A aula não possui professor responsável"
            );
        }

        Usuario professorUsuario =
                solicitacao
                        .getAula()
                        .getTurmaDisciplina()
                        .getProfessor()
                        .getUsuario();

        if (
                !professorUsuario
                        .getId()
                        .equals(professorUsuarioId)
        ) {

            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Esta solicitação não pertence ao professor autenticado"
            );
        }

        return professorUsuario;
    }
}