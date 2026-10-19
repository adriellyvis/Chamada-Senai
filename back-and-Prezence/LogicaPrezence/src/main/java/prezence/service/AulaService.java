package prezence.service;

import prezence.dto.aula.AlunoChamadaDTO;
import prezence.dto.aula.ChamadaAbertaProfessorDTO;
import prezence.dto.aula.DetalheAulaDTO;
import prezence.model.Aluno;
import prezence.model.Aula;
import prezence.model.HorarioAula;
import prezence.model.MetodoPresenca;
import prezence.model.Presenca;
import prezence.model.StatusAula;
import prezence.model.StatusPresenca;
import prezence.model.TurmaDisciplina;
import prezence.repository.AlunoRepository;
import prezence.repository.AulaRepository;
import prezence.repository.HorarioAulaRepository;
import prezence.repository.PresencaRepository;
import prezence.repository.TurmaDisciplinaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.List;
import java.util.Optional;

/*
 * Serviço responsável pelas regras de negócio das aulas e chamadas.
 *
 * Esta classe permite:
 * - abrir ou retomar uma chamada manual;
 * - vincular uma chamada manual ao horário vigente da grade;
 * - buscar a chamada aberta de um professor;
 * - listar alunos e os seus status;
 * - consultar detalhes de uma aula;
 * - encerrar chamadas;
 * - registrar ausências automaticamente;
 * - abrir e encerrar chamadas programadas.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AulaService {

    /*
     * Fuso horário oficial usado pelo Prezence.
     */
    private static final ZoneId FUSO_HORARIO =
            ZoneId.of("America/Sao_Paulo");

    private final AulaRepository aulaRepository;
    private final TurmaDisciplinaRepository turmaDisciplinaRepository;
    private final AlunoRepository alunoRepository;
    private final PresencaRepository presencaRepository;

    /*
     * Novo repository necessário para localizar o horário
     * correspondente à chamada aberta manualmente.
     */
    private final HorarioAulaRepository horarioAulaRepository;

    /*
     * Abre uma nova chamada manual ou retoma uma chamada já aberta.
     *
     * Quando existe um HorarioAula vigente para o momento atual,
     * a chamada manual é vinculada a ele.
     *
     * Com esse vínculo, o PresencaService consegue utilizar:
     * - o início programado;
     * - o fim programado;
     * - a tolerância configurada.
     */
    @Transactional
    public Aula abrirOuRetomarChamada(
            Integer turmaDisciplinaId,
            Integer usuarioId
    ) {

        TurmaDisciplina turmaDisciplina =
                turmaDisciplinaRepository
                        .findById(turmaDisciplinaId)
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Turma/Disciplina não encontrada"
                                )
                        );

        /*
         * Evita NullPointerException caso o vínculo esteja
         * sem professor ou sem usuário relacionado.
         */
        if (
                turmaDisciplina.getProfessor() == null ||
                        turmaDisciplina.getProfessor().getUsuario() == null
        ) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "A turma/disciplina não possui professor responsável"
            );
        }

        Integer usuarioProfessorId =
                turmaDisciplina
                        .getProfessor()
                        .getUsuario()
                        .getId();

        if (!usuarioProfessorId.equals(usuarioId)) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Você não possui acesso a esta turma/disciplina"
            );
        }

        /*
         * Verifica se o professor já possui outra chamada aberta.
         */
        Optional<Aula> chamadaAbertaProfessor =
                buscarEntidadeChamadaAbertaProfessor(usuarioId);

        if (chamadaAbertaProfessor.isPresent()) {

            Aula aulaAberta =
                    chamadaAbertaProfessor.get();

            /*
             * Se a chamada encontrada for do mesmo vínculo,
             * apenas retorna a aula existente.
             */
            if (
                    aulaAberta
                            .getTurmaDisciplina()
                            .getId()
                            .equals(turmaDisciplinaId)
            ) {
                return aulaAberta;
            }

            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Você já possui uma chamada aberta. Encerre ou retome a chamada atual antes de iniciar outra."
            );
        }

        /*
         * Obtém data e hora a partir do mesmo instante.
         */
        ZonedDateTime momentoAtual =
                ZonedDateTime.now(FUSO_HORARIO);

        LocalDate hoje =
                momentoAtual.toLocalDate();

        LocalTime agora =
                momentoAtual.toLocalTime();

        /*
         * Procura um horário ativo e vigente da grade
         * para essa turma/disciplina e para o momento atual.
         */
        Optional<HorarioAula> horarioVigente =
                buscarHorarioVigente(
                        turmaDisciplinaId,
                        hoje,
                        agora
                );

        /*
         * Se o agendador já tiver criado a aula correspondente,
         * retorna a mesma aula em vez de criar uma duplicação.
         */
        if (horarioVigente.isPresent()) {

            Optional<Aula> aulaDoHorario =
                    aulaRepository
                            .findByHorarioAula_IdAndDataAula(
                                    horarioVigente.get().getId(),
                                    hoje
                            );

            if (aulaDoHorario.isPresent()) {

                Aula aula =
                        aulaDoHorario.get();

                if (
                        aula.getStatus() ==
                                StatusAula.EM_ANDAMENTO
                ) {
                    return aula;
                }

                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "A chamada deste horário já foi encerrada ou cancelada"
                );
            }
        }

        Aula novaAula = new Aula();

        novaAula.setTurmaDisciplina(
                turmaDisciplina
        );

        novaAula.setDataAula(
                hoje
        );

        novaAula.setStatus(
                StatusAula.EM_ANDAMENTO
        );

        /*
         * Quando existe uma grade vigente, vincula a aula
         * manual ao HorarioAula.
         */
        if (horarioVigente.isPresent()) {

            HorarioAula horario =
                    horarioVigente.get();

            novaAula.setHorarioAula(
                    horario
            );

            /*
             * Usa o início programado.
             *
             * Exemplo:
             *
             * Aula começa às 12:30.
             * Professor abre a tela às 12:40.
             *
             * A tolerância continua sendo calculada desde 12:30,
             * e não desde 12:40.
             */
            novaAula.setHoraInicio(
                    horario.getHoraInicio()
            );

        } else {

            /*
             * Quando não existe grade vigente, mantém o
             * funcionamento anterior da chamada manual.
             */
            novaAula.setHoraInicio(
                    agora.withNano(0)
            );
        }

        return aulaRepository.save(
                novaAula
        );
    }

    /*
     * Busca a chamada aberta de um professor e converte
     * a entidade para o DTO usado pelo front-end.
     */
    public Optional<ChamadaAbertaProfessorDTO>
    buscarChamadaAbertaProfessor(
            Integer usuarioId
    ) {

        return buscarEntidadeChamadaAbertaProfessor(
                usuarioId
        ).map(aula ->
                new ChamadaAbertaProfessorDTO(
                        aula.getId(),
                        aula.getTurmaDisciplina().getId(),
                        aula.getTurmaDisciplina().getTurma().getId(),
                        aula.getTurmaDisciplina().getTurma().getNome(),
                        aula.getTurmaDisciplina().getDisciplina().getNome(),
                        aula.getDataAula(),
                        aula.getHoraInicio(),
                        aula.getHoraFim(),
                        aula.getStatus()
                )
        );
    }

    /*
     * Busca a chamada aberta mais recente do professor.
     */
    private Optional<Aula> buscarEntidadeChamadaAbertaProfessor(
            Integer usuarioId
    ) {

        LocalDate hoje =
                LocalDate.now(FUSO_HORARIO);

        return aulaRepository
                .findFirstByTurmaDisciplina_Professor_Usuario_IdAndStatusAndDataAulaOrderByHoraInicioDesc(
                        usuarioId,
                        StatusAula.EM_ANDAMENTO,
                        hoje
                );
    }

    /*
     * Lista os alunos relacionados à chamada.
     */
    public List<AlunoChamadaDTO> listarAlunosDaChamada(
            Integer aulaId,
            Integer usuarioId
    ) {

        Aula aula =
                buscarAulaDoProfessor(
                        aulaId,
                        usuarioId
                );

        Integer turmaId =
                aula.getTurmaDisciplina()
                        .getTurma()
                        .getId();

        List<Aluno> alunos =
                alunoRepository.findByTurmaId(
                        turmaId
                );

        return alunos.stream()
                .map(aluno -> {

                    Optional<Presenca> presenca =
                            presencaRepository
                                    .findByAluno_IdAndAula_Id(
                                            aluno.getId(),
                                            aulaId
                                    );

                    String status =
                            presenca
                                    .map(p -> p.getStatus().name())
                                    .orElse(
                                            StatusPresenca.AUSENTE.name()
                                    );

                    return new AlunoChamadaDTO(
                            aluno.getId(),
                            aluno.getUsuario().getNome(),
                            status
                    );
                })
                .toList();
    }

    /*
     * Lista somente as presenças realmente salvas para uma aula.
     */
    @Transactional(readOnly = true)
    public List<DetalheAulaDTO> listarDetalhesAula(
            Integer aulaId,
            Integer usuarioId
    ) {

        Aula aula =
                buscarAulaDoProfessor(
                        aulaId,
                        usuarioId
                );

        return presencaRepository
                .findByAula_Id(
                        aula.getId()
                )
                .stream()
                .map(p ->
                        new DetalheAulaDTO(
                                p.getAluno().getId(),
                                p.getAluno().getUsuario().getNome(),
                                p.getStatus().name(),
                                p.getHorarioRegistro(),
                                p.getMetodo().name()
                        )
                )
                .toList();
    }

    /*
     * Encerra manualmente uma chamada.
     *
     * A operação é transacional:
     * se ocorrer erro ao criar as ausências ou salvar a aula,
     * nenhuma parte do encerramento será mantida isoladamente.
     */
    @Transactional
    public Aula encerrarChamada(
            Integer aulaId,
            Integer usuarioId
    ) {

        Aula aula =
                buscarAulaDoProfessor(
                        aulaId,
                        usuarioId
                );

        if (aula.getStatus() == StatusAula.ENCERRADA) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Essa chamada já foi encerrada"
            );
        }

        if (aula.getStatus() == StatusAula.CANCELADA) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Essa aula foi cancelada"
            );
        }

        LocalDateTime horarioEncerramento =
                LocalDateTime
                        .now(FUSO_HORARIO)
                        .withNano(0);

        registrarAusenciasDosAlunosSemRegistro(
                aula,
                horarioEncerramento
        );

        aula.setStatus(
                StatusAula.ENCERRADA
        );

        aula.setHoraFim(
                horarioEncerramento.toLocalTime()
        );

        return aulaRepository.save(
                aula
        );
    }

    /*
     * Registra ausência para os alunos sem presença.
     *
     * Agora o horário do encerramento também é armazenado
     * no campo horarioRegistro.
     */
    private void registrarAusenciasDosAlunosSemRegistro(
            Aula aula,
            LocalDateTime horarioEncerramento
    ) {

        Integer turmaId =
                aula.getTurmaDisciplina()
                        .getTurma()
                        .getId();

        List<Aluno> alunos =
                alunoRepository.findByTurmaId(
                        turmaId
                );

        List<Presenca> ausencias =
                alunos.stream()

                        /*
                         * Mantém somente alunos que ainda não possuem
                         * qualquer registro para a aula.
                         */
                        .filter(aluno ->
                                !presencaRepository
                                        .existsByAluno_IdAndAula_Id(
                                                aluno.getId(),
                                                aula.getId()
                                        )
                        )

                        .map(aluno -> {

                            Presenca presenca =
                                    new Presenca();

                            presenca.setAluno(
                                    aluno
                            );

                            presenca.setAula(
                                    aula
                            );

                            presenca.setStatus(
                                    StatusPresenca.AUSENTE
                            );

                            /*
                             * O enum atual possui:
                             * MANUAL, BIOMETRIA e TOKEN.
                             *
                             * Como ainda não existe AUTOMATICO,
                             * a ausência permanece como MANUAL
                             * para manter compatibilidade.
                             */
                            presenca.setMetodo(
                                    MetodoPresenca.MANUAL
                            );

                            presenca.setValidacaoBiometrica(
                                    false
                            );

                            presenca.setHorarioRegistro(
                                    horarioEncerramento
                            );

                            return presenca;
                        })
                        .toList();

        if (!ausencias.isEmpty()) {
            presencaRepository.saveAll(
                    ausencias
            );
        }
    }

    /*
     * Abre uma chamada automaticamente pela grade.
     */
    @Transactional
    public Aula abrirChamadaAutomatica(
            HorarioAula horario,
            LocalDate dataAtual
    ) {

        Optional<Aula> aulaExistente =
                aulaRepository
                        .findByHorarioAula_IdAndDataAula(
                                horario.getId(),
                                dataAtual
                        );

        if (aulaExistente.isPresent()) {
            return aulaExistente.get();
        }

        Aula novaAula =
                new Aula();

        novaAula.setHorarioAula(
                horario
        );

        novaAula.setTurmaDisciplina(
                horario.getTurmaDisciplina()
        );

        novaAula.setDataAula(
                dataAtual
        );

        novaAula.setHoraInicio(
                horario.getHoraInicio()
        );

        novaAula.setStatus(
                StatusAula.EM_ANDAMENTO
        );

        return aulaRepository.save(
                novaAula
        );
    }

    /*
     * Encerra automaticamente uma chamada.
     */
    @Transactional
    public Optional<Aula> encerrarChamadaAutomatica(
            HorarioAula horario,
            LocalDate dataAtual
    ) {

        Optional<Aula> aulaAberta =
                aulaRepository
                        .findByHorarioAula_IdAndDataAulaAndStatus(
                                horario.getId(),
                                dataAtual,
                                StatusAula.EM_ANDAMENTO
                        );

        if (aulaAberta.isEmpty()) {
            return Optional.empty();
        }

        Aula aula =
                aulaAberta.get();

        /*
         * Para o encerramento automático, registra como horário  o fim definido na grade, e não o minuto em que o agendador conseguiu executar.
         */
        LocalDateTime horarioEncerramento =
                LocalDateTime.of(
                        dataAtual,
                        horario.getHoraFim()
                );

        registrarAusenciasDosAlunosSemRegistro(
                aula,
                horarioEncerramento
        );

        aula.setHoraFim(
                horario.getHoraFim()
        );

        aula.setStatus(
                StatusAula.ENCERRADA
        );

        return Optional.of(
                aulaRepository.save(aula)
        );
    }

    /*
     * Procura um HorarioAula correspondente ao momento
     * em que o professor está abrindo a chamada manual.
     */
    private Optional<HorarioAula> buscarHorarioVigente(
            Integer turmaDisciplinaId,
            LocalDate dataAtual,
            LocalTime horaAtual
    ) {

        return horarioAulaRepository
                .findByTurmaDisciplina_IdOrderByDiaSemanaAscHoraInicioAsc(
                        turmaDisciplinaId
                )
                .stream()

                /*
                 * O horário precisa estar ativo.
                 */
                .filter(horario ->
                        Boolean.TRUE.equals(
                                horario.getAtivo()
                        )
                )

                /*
                 * O dia da semana precisa corresponder à data atual.
                 */
                .filter(horario ->
                        horario.getDiaSemana() ==
                                dataAtual.getDayOfWeek()
                )

                /*
                 * A data precisa estar dentro da vigência.
                 */
                .filter(horario ->
                        estaVigente(
                                horario,
                                dataAtual
                        )
                )

                /*
                 * Proteção contra registros incompletos.
                 */
                .filter(horario ->
                        horario.getHoraInicio() != null &&
                                horario.getHoraFim() != null
                )

                /*
                 * O momento atual precisa estar dentro da aula:
                 *
                 * início inclusivo;
                 * fim exclusivo.
                 */
                .filter(horario ->
                        !horaAtual.isBefore(
                                horario.getHoraInicio()
                        ) &&
                                horaAtual.isBefore(
                                        horario.getHoraFim()
                                )
                )

                .findFirst();
    }

    /*
     * Verifica a vigência do horário na data informada.
     */
    private boolean estaVigente(
            HorarioAula horario,
            LocalDate dataAtual
    ) {

        boolean depoisDoInicio =
                horario.getDataInicioVigencia() == null ||
                        !dataAtual.isBefore(
                                horario.getDataInicioVigencia()
                        );

        boolean antesDoFim =
                horario.getDataFimVigencia() == null ||
                        !dataAtual.isAfter(
                                horario.getDataFimVigencia()
                        );

        return depoisDoInicio && antesDoFim;
    }

    private Aula buscarAulaDoProfessor(
            Integer aulaId,
            Integer usuarioId
    ) {

        if (usuarioId == null) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Professor não informado"
            );
        }

        if (aulaId == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Aula não informada"
            );
        }

        return aulaRepository
                .findByIdAndTurmaDisciplina_Professor_Usuario_Id(
                        aulaId,
                        usuarioId
                )
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.FORBIDDEN,
                                "Você não possui acesso a esta aula"
                        )
                );
    }
}