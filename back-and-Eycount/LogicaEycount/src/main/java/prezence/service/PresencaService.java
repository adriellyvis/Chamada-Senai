package prezence.service;

import prezence.dto.presenca.PresencaDTO;
import prezence.model.Aluno;
import prezence.model.Aula;
import prezence.model.HorarioAula;
import prezence.model.MetodoPresenca;
import prezence.model.Presenca;
import prezence.model.StatusAula;
import prezence.model.StatusPresenca;
import prezence.repository.AlunoRepository;
import prezence.repository.AulaRepository;
import prezence.repository.PresencaRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Optional;


@Service
@RequiredArgsConstructor
public class PresencaService {

    /*
     * Fuso horário oficial utilizado pelo Prezence.
     */
    private static final ZoneId FUSO_HORARIO =
            ZoneId.of("America/Sao_Paulo");

    /*
     * Tolerância usada temporariamente quando uma chamada manual
     * não estiver vinculada a um HorarioAula.
     *
     * Depois, o AulaService será ajustado para vincular a chamada
     * manual ao horário cadastrado sempre que possível.
     */
    private static final int TOLERANCIA_PADRAO_MINUTOS = 30;

    private final PresencaRepository presencaRepository;
    private final AulaRepository aulaRepository;
    private final AlunoRepository alunoRepository;

    /*
     * Registra a presença de um aluno.

     * Campos necessários:
     * - alunoId;
     * - aulaId;
     * - metodo.

     * O status é calculado pelo próprio backend.
     */
    public Presenca registrar(PresencaDTO dto) {

        validarDadosObrigatorios(dto);

        if (dto.getMetodo() == MetodoPresenca.BIOMETRIA) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "A presença biométrica deve ser confirmada pelo professor"
            );
        }

        Aluno aluno =
                buscarAluno(dto.getAlunoId());

        Aula aula =
                buscarAula(dto.getAulaId());

        LocalDateTime horarioRegistro =
                LocalDateTime.now(FUSO_HORARIO);

        validarAlunoPertenceTurma(
                aluno,
                aula
        );

        validarAulaAceitaRegistro(
                aula,
                horarioRegistro
        );

        /*
         * Verifica se o aluno já possui presença nessa aula.
         *
         * O primeiro registro deve ser preservado.
         *
         * Exemplo:
         * - aluno registra às 12:45 e fica PRESENTE;
         * - tenta registrar novamente às 13:10;
         * - continua PRESENTE.
         */
        StatusPresenca statusCalculado =
                calcularStatusPresenca(
                        aula,
                        horarioRegistro
                );

        Optional<Presenca> presencaExistente =
                presencaRepository
                        .findByAluno_IdAndAula_Id(
                                aluno.getId(),
                                aula.getId()
                        );

        if (presencaExistente.isPresent()) {

            Presenca presenca =
                    presencaExistente.get();

            /*
             * Uma biometria válida pode substituir uma marcação manual
             * feita anteriormente pelo professor.
             */
            if (
                    dto.getMetodo() == MetodoPresenca.BIOMETRIA &&
                            presenca.getMetodo() == MetodoPresenca.MANUAL
            ) {

                presenca.setStatus(
                        statusCalculado
                );

                presenca.setMetodo(
                        MetodoPresenca.BIOMETRIA
                );

                presenca.setValidacaoBiometrica(
                        true
                );

                presenca.setHorarioRegistro(
                        horarioRegistro
                );

                return presencaRepository.save(
                        presenca
                );
            }

            return presenca;
        }

        Presenca presenca = new Presenca();

        presenca.setAluno(aluno);
        presenca.setAula(aula);
        presenca.setStatus(statusCalculado);
        presenca.setMetodo(dto.getMetodo());
        presenca.setHorarioRegistro(horarioRegistro);

        presenca.setValidacaoBiometrica(
                dto.getMetodo() == MetodoPresenca.BIOMETRIA
        );

        return presencaRepository.save(presenca);
    }

    @Transactional
    public Presenca registrarManual(
            PresencaDTO dto,
            Integer usuarioProfessorId
    ) {

        if (
                dto == null ||
                        dto.getAlunoId() == null ||
                        dto.getAulaId() == null ||
                        dto.getStatus() == null ||
                        usuarioProfessorId == null
        ) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Professor, aluno, aula e status da presença são obrigatórios"
            );
        }

        Aluno aluno =
                buscarAluno(
                        dto.getAlunoId()
                );

        Aula aula =
                buscarAula(
                        dto.getAulaId()
                );

        validarProfessorResponsavelPelaAula(
                usuarioProfessorId,
                aula
        );

        LocalDateTime horarioRegistro =
                LocalDateTime.now(
                        FUSO_HORARIO
                );

        validarAlunoPertenceTurma(
                aluno,
                aula
        );

        validarAulaAceitaRegistro(
                aula,
                horarioRegistro
        );

        Optional<Presenca> presencaExistente =
                presencaRepository.findByAluno_IdAndAula_Id(
                        aluno.getId(),
                        aula.getId()
                );

        if (presencaExistente.isPresent()) {

            Presenca presenca =
                    presencaExistente.get();

            if (
                    Boolean.TRUE.equals(
                            presenca.getValidacaoBiometrica()
                    )
            ) {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "Uma presença biométrica não pode ser alterada manualmente"
                );
            }

            presenca.setStatus(
                    dto.getStatus()
            );

            presenca.setMetodo(
                    MetodoPresenca.MANUAL
            );

            presenca.setHorarioRegistro(
                    horarioRegistro
            );

            presenca.setValidacaoBiometrica(
                    false
            );

            return presencaRepository.save(
                    presenca
            );
        }

        Presenca presenca =
                new Presenca();

        presenca.setAluno(
                aluno
        );

        presenca.setAula(
                aula
        );

        presenca.setStatus(
                dto.getStatus()
        );

        presenca.setMetodo(
                MetodoPresenca.MANUAL
        );

        presenca.setHorarioRegistro(
                horarioRegistro
        );

        presenca.setValidacaoBiometrica(
                false
        );

        return presencaRepository.save(
                presenca
        );
    }

    /*
     * Valida os dados necessários para registrar a presença.
     *
     * O status não é obrigatório porque será calculado
     * automaticamente pelo backend.
     */
    private void validarDadosObrigatorios(
            PresencaDTO dto
    ) {

        if (
                dto == null ||
                        dto.getAlunoId() == null ||
                        dto.getAulaId() == null ||
                        dto.getMetodo() == null
        ) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Aluno, aula e método da presença são obrigatórios"
            );
        }
    }

    private Aluno buscarAluno(
            Integer alunoId
    ) {

        return alunoRepository
                .findById(alunoId)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Aluno não encontrado"
                        )
                );
    }

    private Aula buscarAula(
            Integer aulaId
    ) {

        return aulaRepository
                .findById(aulaId)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Aula não encontrada"
                        )
                );
    }

    private void validarProfessorResponsavelPelaAula(
            Integer usuarioProfessorId,
            Aula aula
    ) {

        if (
                aula.getTurmaDisciplina() == null ||
                        aula.getTurmaDisciplina().getProfessor() == null ||
                        aula.getTurmaDisciplina().getProfessor().getUsuario() == null
        ) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "A aula não possui professor responsável"
            );
        }

        Integer usuarioResponsavelId =
                aula.getTurmaDisciplina()
                        .getProfessor()
                        .getUsuario()
                        .getId();

        if (!usuarioResponsavelId.equals(usuarioProfessorId)) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Você não pode registrar presença em uma aula de outro professor"
            );
        }
    }

    /*
     * Verifica se o aluno pertence à turma da aula.
     */
    private void validarAlunoPertenceTurma(
            Aluno aluno,
            Aula aula
    ) {

        if (aluno.getTurma() == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Aluno não está vinculado a uma turma"
            );
        }

        if (
                aula.getTurmaDisciplina() == null ||
                        aula.getTurmaDisciplina().getTurma() == null
        ) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "A aula não está vinculada corretamente a uma turma"
            );
        }

        Integer turmaDoAlunoId =
                aluno.getTurma().getId();

        Integer turmaDaAulaId =
                aula.getTurmaDisciplina()
                        .getTurma()
                        .getId();

        if (!turmaDoAlunoId.equals(turmaDaAulaId)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Aluno não pertence à turma desta aula"
            );
        }
    }

    /*
     * Verifica se a aula ainda pode receber presença.
     */
    private void validarAulaAceitaRegistro(
            Aula aula,
            LocalDateTime horarioRegistro
    ) {

        if (aula.getStatus() != StatusAula.EM_ANDAMENTO) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Não é possível registrar presença em uma aula encerrada ou cancelada"
            );
        }

        if (
                aula.getDataAula() == null ||
                        aula.getHoraInicio() == null
        ) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "A aula não possui data ou horário de início"
            );
        }

        /*
         * Impede que uma chamada antiga permaneça aberta
         * e aceite registros em outro dia.
         */
        if (
                !horarioRegistro
                        .toLocalDate()
                        .equals(aula.getDataAula())
        ) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "A aula não corresponde à data atual"
            );
        }

        LocalDateTime inicioAula =
                LocalDateTime.of(
                        aula.getDataAula(),
                        aula.getHoraInicio()
                );

        if (horarioRegistro.isBefore(inicioAula)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "A aula ainda não começou"
            );
        }

        LocalDateTime fimProgramado =
                obterFimProgramado(aula);

        /*
         * Exatamente no horário final a aula já não aceita registro.
         */
        if (
                fimProgramado != null &&
                        !horarioRegistro.isBefore(fimProgramado)
        ) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "O horário da aula já foi encerrado"
            );
        }
    }

    /*
     * Calcula PRESENTE ou Atrasado.
     */
    private StatusPresenca calcularStatusPresenca(
            Aula aula,
            LocalDateTime horarioRegistro
    ) {

        LocalDateTime inicioAula =
                LocalDateTime.of(
                        aula.getDataAula(),
                        aula.getHoraInicio()
                );

        int toleranciaMinutos =
                obterToleranciaMinutos(aula);

        LocalDateTime limitePresenca =
                inicioAula.plusMinutes(
                        toleranciaMinutos
                );

        if (horarioRegistro.isAfter(limitePresenca)) {
            return StatusPresenca.ATRASADO;
        }

        return StatusPresenca.PRESENTE;
    }

    /*
     * Obtém a tolerância cadastrada no HorarioAula.
     *
     * Para chamadas ainda não vinculadas a uma grade,
     * utiliza temporariamente 30 minutos.
     */
    private int obterToleranciaMinutos(
            Aula aula
    ) {

        HorarioAula horarioAula =
                aula.getHorarioAula();

        if (
                horarioAula == null ||
                        horarioAula.getToleranciaMinutos() == null
        ) {
            return TOLERANCIA_PADRAO_MINUTOS;
        }

        /*
         * Proteção contra dados antigos inválidos no banco.
         */
        return Math.max(
                horarioAula.getToleranciaMinutos(),
                0
        );
    }

    /*
     * Descobre o horário final programado da aula.
     *
     * Prioridade:
     * 1. horário final da grade;
     * 2. horário final registrado diretamente na aula.
     */
    private LocalDateTime obterFimProgramado(
            Aula aula
    ) {

        if (
                aula.getHorarioAula() != null &&
                        aula.getHorarioAula().getHoraFim() != null
        ) {
            return LocalDateTime.of(
                    aula.getDataAula(),
                    aula.getHorarioAula().getHoraFim()
            );
        }

        if (aula.getHoraFim() != null) {
            return LocalDateTime.of(
                    aula.getDataAula(),
                    aula.getHoraFim()
            );
        }

        /*
         * Chamadas manuais ainda abertas podem não possuir
         * horário final definido.
         */
        return null;
    }

    @Transactional
    public Presenca registrarBiometriaConfirmada(
            Integer alunoId,
            Integer aulaId,
            StatusPresenca statusSugerido,
            LocalDateTime horarioBiometria
    ) {

        if (
                alunoId == null ||
                        aulaId == null ||
                        statusSugerido == null ||
                        horarioBiometria == null
        ) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Dados da confirmação biométrica incompletos"
            );
        }

        Aluno aluno =
                buscarAluno(alunoId);

        Aula aula =
                buscarAula(aulaId);

        validarAlunoPertenceTurma(
                aluno,
                aula
        );

        Optional<Presenca> presencaExistente =
                presencaRepository
                        .findByAluno_IdAndAula_Id(
                                alunoId,
                                aulaId
                        );

        if (presencaExistente.isPresent()) {

            Presenca presenca =
                    presencaExistente.get();

            /*
             * Se já existe uma biometria oficial,
             * não precisamos criar outra.
             */
            if (
                    presenca.getMetodo() == MetodoPresenca.BIOMETRIA
                            &&
                            Boolean.TRUE.equals(
                                    presenca.getValidacaoBiometrica()
                            )
            ) {
                return presenca;
            }

            /*
             * Uma confirmação biométrica pode substituir
             * uma marcação manual anterior.
             */
            presenca.setStatus(
                    statusSugerido
            );

            presenca.setMetodo(
                    MetodoPresenca.BIOMETRIA
            );

            presenca.setValidacaoBiometrica(
                    true
            );

            /*
             * IMPORTANTE:
             * horário da biometria, não o horário
             * em que o professor clicou em confirmar.
             */
            presenca.setHorarioRegistro(
                    horarioBiometria
            );

            return presencaRepository.save(
                    presenca
            );
        }

        Presenca presenca =
                new Presenca();

        presenca.setAluno(
                aluno
        );

        presenca.setAula(
                aula
        );

        presenca.setStatus(
                statusSugerido
        );

        presenca.setMetodo(
                MetodoPresenca.BIOMETRIA
        );

        presenca.setValidacaoBiometrica(
                true
        );

        presenca.setHorarioRegistro(
                horarioBiometria
        );

        return presencaRepository.save(
                presenca
        );
    }
}