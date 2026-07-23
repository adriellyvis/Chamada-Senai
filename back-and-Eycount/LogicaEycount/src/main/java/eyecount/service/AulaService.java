package eyecount.service;

import eyecount.dto.aula.AlunoChamadaDTO;
import eyecount.dto.aula.ChamadaAbertaProfessorDTO;
import eyecount.dto.aula.DetalheAulaDTO;
import eyecount.model.*;
import eyecount.repository.AlunoRepository;
import eyecount.repository.AulaRepository;
import eyecount.repository.PresencaRepository;
import eyecount.repository.TurmaDisciplinaRepository;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

/*
 * Serviço responsavel pelas regras de negócio das aulas e chamadas.
 *
 * Esta classe permite:
 * - abrir ou retomar uma chamada manual;
 * - buscar a chamada aberta de um professor;
 * - listar alunos e os seus status;
 * - consultar detalhes de uma aula;
 * - encerrar chamadas;
 * - registrar ausencias automaticamente;
 * - abrir e encerrar chamadas programadas.
 */
@Service
@AllArgsConstructor
public class AulaService {

    // Acesso aos registros da tabela de aulas.
    private final AulaRepository aulaRepository;

    // Acesso aos vinculos entre turma, disciplina e professor.
    private final TurmaDisciplinaRepository turmaDisciplinaRepository;

    // Acesso aos alunos cadastrados e vinculados a uma turma.
    private final AlunoRepository alunoRepository;

    // Acesso aos registros de presenca dos alunos.
    private final PresencaRepository presencaRepository;

    /*
     * Abre uma nova chamada manual ou retoma uma chamada ja aberta.
     *
     * Antes de criar a aula, o metodo confirma se o professor informado
     * realmente pertence ao vinculo entre turma e disciplina.
     */
    public Aula abrirOuRetomarChamada(
            Integer turmaDisciplinaId,
            Integer usuarioId
    ) {

        /*
         * Busca o vinculo entre turma, disciplina e professor pelo ID.
         * Caso o vinculo nao exista, retorna erro 404.
         */
        TurmaDisciplina turmaDisciplina =
                turmaDisciplinaRepository
                        .findById(turmaDisciplinaId)
                        .orElseThrow(() -> new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Turma/Disciplina não encontrada"
                        ));

        /*
         * Recupera o ID do usuario relacionado ao professor
         * responsavel por esse vinculo.
         */
        Integer usuarioProfessorId =
                turmaDisciplina
                        .getProfessor()
                        .getUsuario()
                        .getId();

        /*
         * Bloqueia o acesso quando o usuario logado nao e o professor
         * responsavel pela turma e disciplina selecionadas.
         */
        if (!usuarioProfessorId.equals(usuarioId)) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Você não possui acesso a esta turma/disciplina"
            );
        }

        /*
         * Busca a chamada mais recente do professor
         * que ainda esteja com status EM_ANDAMENTO.
         */
        Optional<Aula> chamadaAbertaProfessor =
                buscarEntidadeChamadaAbertaProfessor(usuarioId);

        if (chamadaAbertaProfessor.isPresent()) {

            // Recupera a entidade Aula armazenada dentro do Optional.
            Aula aulaAberta = chamadaAbertaProfessor.get();

            /*
             * Se a chamada aberta pertence ao mesmo vinculo solicitado,
             * o sistema apenas retorna essa aula para o professor retomar.
             */
            if (
                    aulaAberta
                            .getTurmaDisciplina()
                            .getId()
                            .equals(turmaDisciplinaId)
            ) {
                return aulaAberta;
            }

            /*
             * Impede que o mesmo professor mantenha duas chamadas
             * abertas ao mesmo tempo em turmas ou disciplinas diferentes.
             */
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Você já possui uma chamada aberta. Encerre ou retome a chamada atual antes de iniciar outra."
            );
        }

        // Cria uma nova entidade de aula ainda nao salva no banco.
        Aula novaAula = new Aula();

        // Define a turma, a disciplina e o professor da nova aula.
        novaAula.setTurmaDisciplina(turmaDisciplina);

        // Registra a data atual como data da chamada manual.
        novaAula.setDataAula(LocalDate.now());

        // Registra o horario exato em que o professor abriu a chamada.
        novaAula.setHoraInicio(LocalTime.now());

        // Marca a aula como aberta e em andamento.
        novaAula.setStatus(StatusAula.EM_ANDAMENTO);

        // Salva a nova aula no banco e devolve a entidade criada.
        return aulaRepository.save(novaAula);
    }

    /*
     * Busca a chamada aberta de um professor e converte
     * a entidade Aula para ChamadaAbertaProfessorDTO.
     */
    public Optional<ChamadaAbertaProfessorDTO>
    buscarChamadaAbertaProfessor(Integer usuarioId) {

        return buscarEntidadeChamadaAbertaProfessor(usuarioId)

                /*
                 * O map so executa quando existe uma aula dentro do Optional.
                 * Ele transforma a entidade Aula no DTO enviado ao front.
                 */
                .map(aula -> new ChamadaAbertaProfessorDTO(
                        aula.getId(),
                        aula.getTurmaDisciplina().getId(),
                        aula.getTurmaDisciplina().getTurma().getId(),
                        aula.getTurmaDisciplina().getTurma().getNome(),
                        aula.getTurmaDisciplina().getDisciplina().getNome(),
                        aula.getDataAula(),
                        aula.getHoraInicio(),
                        aula.getHoraFim(),
                        aula.getStatus()
                ));
    }

    /*
     * Metodo interno que busca a chamada aberta mais recente
     * pertencente ao professor informado.
     */
    private Optional<Aula> buscarEntidadeChamadaAbertaProfessor(
            Integer usuarioId
    ) {

        /*
         * Filtra a aula por:
         * - usuario do professor;
         * - status EM_ANDAMENTO.
         *
         * Ordena por data e hora de inicio, da mais recente para a mais antiga,
         * e retorna somente o primeiro resultado.
         */
        return aulaRepository
                .findFirstByTurmaDisciplina_Professor_Usuario_IdAndStatusOrderByDataAulaDescHoraInicioDesc(
                        usuarioId,
                        StatusAula.EM_ANDAMENTO
                );
    }

    /*
     * Lista todos os alunos da turma relacionada a uma aula.
     *
     * Para cada aluno, procura um registro de presenca.
     * Quando nao existe registro, o aluno e exibido como AUSENTE.
     */
    public List<AlunoChamadaDTO> listarAlunosDaChamada(
            Integer aulaId
    ) {

        // Busca a aula pelo ID ou retorna erro 404.
        Aula aula = buscarAula(aulaId);

        // Recupera o ID da turma relacionada a aula.
        Integer turmaId =
                aula.getTurmaDisciplina()
                        .getTurma()
                        .getId();

        // Busca todos os alunos vinculados a essa turma.
        List<Aluno> alunos =
                alunoRepository.findByTurmaId(turmaId);

        /*
         * Converte cada aluno em AlunoChamadaDTO.
         * O resultado contem ID, nome e status de presenca.
         */
        return alunos.stream()
                .map(aluno -> {

                    /*
                     * Procura uma presenca usando:
                     * - ID do aluno atual;
                     * - ID da aula atual.
                     */
                    Optional<Presenca> presenca =
                            presencaRepository
                                    .findByAluno_IdAndAula_Id(
                                            aluno.getId(),
                                            aulaId
                                    );

                    /*
                     * Quando existe presenca, utiliza o status salvo.
                     * Quando nao existe, mostra AUSENTE apenas na resposta.
                     *
                     * Nesse momento, a ausencia ainda nao e salva no banco.
                     */
                    String status = presenca
                            .map(p -> p.getStatus().name())
                            .orElse(StatusPresenca.AUSENTE.name());

                    // Monta os dados usados na lista de chamada do professor.
                    return new AlunoChamadaDTO(
                            aluno.getId(),
                            aluno.getUsuario().getNome(),
                            status
                    );
                })
                .toList();
    }

    /*
     * Lista os registros de presenca salvos para uma aula.
     *
     * Diferente de listarAlunosDaChamada, este metodo retorna
     * apenas alunos que ja possuem uma Presenca registrada no banco.
     */
    public List<DetalheAulaDTO> listarDetalhesAula(
            Integer aulaId
    ) {

        // Confirma que a aula existe.
        Aula aula = buscarAula(aulaId);

        // Busca todas as presencas relacionadas ao ID da aula.
        List<Presenca> presencas =
                presencaRepository.findByAula_Id(aula.getId());

        /*
         * Converte cada entidade Presenca em DetalheAulaDTO.
         * O DTO inclui aluno, status, horario e metodo de registro.
         */
        return presencas.stream()
                .map(p -> new DetalheAulaDTO(
                        p.getAluno().getId(),
                        p.getAluno().getUsuario().getNome(),
                        p.getStatus().name(),
                        p.getHorarioRegistro(),
                        p.getMetodo().name()
                ))
                .toList();
    }

    /*
     * Encerra manualmente uma chamada.
     *
     * Antes de encerrar, o metodo registra como AUSENTE
     * todos os alunos que ainda nao possuem presenca.
     */
    public Aula encerrarChamada(Integer aulaId) {

        // Busca a aula ou retorna erro 404.
        Aula aula = buscarAula(aulaId);

        // Impede que uma chamada encerrada seja encerrada novamente.
        if (aula.getStatus() == StatusAula.ENCERRADA) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Essa chamada já foi encerrada"
            );
        }

        // Impede o encerramento de uma aula que foi cancelada.
        if (aula.getStatus() == StatusAula.CANCELADA) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Essa aula foi cancelada"
            );
        }

        // Cria registros de ausencia para alunos sem presenca.
        registrarAusenciasDosAlunosSemRegistro(aula);

        // Altera o status da aula para encerrada.
        aula.setStatus(StatusAula.ENCERRADA);

        // Registra o horario real em que o professor encerrou a chamada.
        aula.setHoraFim(LocalTime.now());

        // Atualiza a aula no banco.
        return aulaRepository.save(aula);
    }

    /*
     * Registra ausencia para todos os alunos da turma
     * que ainda nao possuem presenca na aula.
     */
    private void registrarAusenciasDosAlunosSemRegistro(
            Aula aula
    ) {

        // Recupera o ID da turma relacionada a aula.
        Integer turmaId =
                aula.getTurmaDisciplina()
                        .getTurma()
                        .getId();

        // Busca todos os alunos matriculados nessa turma.
        List<Aluno> alunos =
                alunoRepository.findByTurmaId(turmaId);

        /*
         * Primeiro filtra os alunos sem registro de presenca.
         * Depois transforma cada aluno filtrado em uma nova ausencia.
         */
        List<Presenca> ausencias = alunos.stream()

                /*
                 * Mantem somente alunos para os quais nao existe
                 * presenca com o mesmo aluno_id e aula_id.
                 */
                .filter(aluno -> presencaRepository
                        .findByAluno_IdAndAula_Id(
                                aluno.getId(),
                                aula.getId()
                        )
                        .isEmpty()
                )

                // Converte cada aluno sem registro em uma Presenca AUSENTE.
                .map(aluno -> {
                    Presenca presenca = new Presenca();

                    // Vincula a ausencia ao aluno atual.
                    presenca.setAluno(aluno);

                    // Vincula a ausencia a aula que esta sendo encerrada.
                    presenca.setAula(aula);

                    // Define o status automatico como AUSENTE.
                    presenca.setStatus(StatusPresenca.AUSENTE);

                    /*
                     * A ausencia automatica e registrada como MANUAL
                     * porque nao foi criada por reconhecimento facial.
                     */
                    presenca.setMetodo(MetodoPresenca.MANUAL);

                    // Indica que nao houve validacao biometrica.
                    presenca.setValidacaoBiometrica(false);

                    /*
                     * O codigo atual nao preenche horarioRegistro
                     * para as ausencias criadas no encerramento.
                     */
                    return presenca;
                })
                .toList();

        /*
         * Salva todas as ausencias de uma vez.
         * Quando a lista esta vazia, nenhuma operacao e enviada ao banco.
         */
        if (!ausencias.isEmpty()) {
            presencaRepository.saveAll(ausencias);
        }
    }

    /*
     * Busca uma aula pelo ID.
     *
     * Este metodo centraliza a validacao para evitar repetir
     * a mesma consulta e o mesmo tratamento de erro.
     */
    private Aula buscarAula(Integer aulaId) {

        return aulaRepository.findById(aulaId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Aula não encontrada"
                ));
    }

    /*
     * Abre uma chamada automaticamente a partir de um HorarioAula.
     *
     * O metodo impede que seja criada mais de uma aula
     * para o mesmo horario e para a mesma data.
     */
    public Aula abrirChamadaAutomatica(
            HorarioAula horario,
            LocalDate dataAtual
    ) {

        /*
         * Busca uma aula que tenha:
         * - o mesmo horario_aula_id;
         * - a mesma data da aula.
         */
        Optional<Aula> aulaExistente =
                aulaRepository
                        .findByHorarioAula_IdAndDataAula(
                                horario.getId(),
                                dataAtual
                        );

        /*
         * Se a aula ja foi criada anteriormente,
         * devolve o registro existente e evita duplicacao.
         */
        if (aulaExistente.isPresent()) {
            return aulaExistente.get();
        }

        // Cria uma nova aula ainda nao salva.
        Aula novaAula = new Aula();

        // Registra qual horario programado originou essa aula.
        novaAula.setHorarioAula(horario);

        // Copia o vinculo de turma, disciplina e professor.
        novaAula.setTurmaDisciplina(
                horario.getTurmaDisciplina()
        );

        // Define a data que esta sendo processada pelo agendador.
        novaAula.setDataAula(dataAtual);

        /*
         * Usa a hora programada no HorarioAula,
         * e nao a hora exata em que o agendador executou.
         */
        novaAula.setHoraInicio(
                horario.getHoraInicio()
        );

        // Marca a chamada automatica como aberta.
        novaAula.setStatus(
                StatusAula.EM_ANDAMENTO
        );

        // Salva e retorna a nova aula.
        return aulaRepository.save(novaAula);
    }

    /*
     * Encerra automaticamente uma chamada criada pelo agendador.
     *
     * O metodo procura somente uma aula:
     * - ligada ao horario informado;
     * - criada na data atual;
     * - ainda com status EM_ANDAMENTO.
     */
    public Optional<Aula> encerrarChamadaAutomatica(
            HorarioAula horario,
            LocalDate dataAtual
    ) {

        /*
         * Filtra a aula pelo horario, data e status.
         * Uma aula encerrada ou cancelada nao sera encontrada aqui.
         */
        Optional<Aula> aulaAberta =
                aulaRepository
                        .findByHorarioAula_IdAndDataAulaAndStatus(
                                horario.getId(),
                                dataAtual,
                                StatusAula.EM_ANDAMENTO
                        );

        /*
         * Quando não existe chamada aberta para esse horario,
         * devolve Optional vazio e nao faz nenhuma alteracao.
         */
        if (aulaAberta.isEmpty()) {
            return Optional.empty();
        }

        // Recupera a entidade Aula encontrada.
        Aula aula = aulaAberta.get();

        // Registra ausencias para alunos sem presenca.
        registrarAusenciasDosAlunosSemRegistro(aula);

        /*
         * Usa o horario final programado na grade,
         * e nao o minuto exato em que o agendador executou.
         */
        aula.setHoraFim(
                horario.getHoraFim()
        );

        // Altera o status da aula para encerrada.
        aula.setStatus(
                StatusAula.ENCERRADA
        );

        // Salva a aula e devolve o resultado dentro de um Optional.
        return Optional.of(
                aulaRepository.save(aula)
        );
    }
}