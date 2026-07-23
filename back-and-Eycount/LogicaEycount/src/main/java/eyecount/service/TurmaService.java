package eyecount.service;

import eyecount.dto.turma.TurmaDTO;
import eyecount.model.Disciplina;
import eyecount.model.Professor;
import eyecount.model.Turma;
import eyecount.model.TurmaDisciplina;
import eyecount.repository.DisciplinaRepository;
import eyecount.repository.ProfessorRepository;
import eyecount.repository.TurmaDisciplinaRepository;
import eyecount.repository.TurmaRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;

/*
 * Servico responsavel pelas regras de negocio das turmas.
 *
 * Esta classe permite:
 * - cadastrar uma turma;
 * - vincular professor e disciplina;
 * - listar turmas;
 * - editar dados da turma;
 * - atualizar o vinculo da turma;
 * - ativar ou desativar uma turma;
 * - validar o periodo do curso.
 */
@Service
public class TurmaService {

    // Repository usado para consultar e salvar turmas.
    private final TurmaRepository turmaRepository;

    // Repository usado para consultar e salvar os vinculos da turma.
    private final TurmaDisciplinaRepository turmaDisciplinaRepository;

    // Repository usado para buscar professores.
    private final ProfessorRepository professorRepository;

    // Repository usado para buscar disciplinas.
    private final DisciplinaRepository disciplinaRepository;

    /*
     * Construtor usado pelo Spring para injetar os repositories.
     *
     * Como existe apenas este construtor, nao e necessario
     * usar a anotacao @Autowired.
     */
    public TurmaService(
            TurmaRepository turmaRepository,
            TurmaDisciplinaRepository turmaDisciplinaRepository,
            ProfessorRepository professorRepository,
            DisciplinaRepository disciplinaRepository
    ) {
        this.turmaRepository = turmaRepository;
        this.turmaDisciplinaRepository = turmaDisciplinaRepository;
        this.professorRepository = professorRepository;
        this.disciplinaRepository = disciplinaRepository;
    }

    /*
     * Cadastra uma nova turma.
     *
     * Depois de salvar a turma, o metodo:
     * - busca o professor informado;
     * - busca a disciplina informada;
     * - cria o vinculo TurmaDisciplina.
     */
    public Turma cadastrar(
            TurmaDTO dto
    ) {

        /*
         * Valida as datas do curso.
         *
         * A data final precisa ser posterior a data inicial.
         */
        validarPeriodoCurso(
                dto.getDataInicio(),
                dto.getDataFimPrevista()
        );

        // Cria uma nova entidade de turma ainda nao salva.
        Turma turma = new Turma();

        // Preenche os dados principais recebidos no DTO.
        turma.setNome(dto.getNome());
        turma.setDescricao(dto.getDescricao());
        turma.setSala(dto.getSala());

        // Preenche o periodo planejado para a turma.
        turma.setDataInicio(dto.getDataInicio());
        turma.setDataFimPrevista(
                dto.getDataFimPrevista()
        );

        // Preenche os horarios gerais da turma.
        turma.setHorarioInicio(
                dto.getHorarioInicio()
        );
        turma.setHorarioFim(
                dto.getHorarioFim()
        );

        // Toda nova turma comeca ativa.
        turma.setAtivo(true);

        // Salva a turma antes de criar os relacionamentos.
        Turma turmaSalva =
                turmaRepository.save(turma);

        /*
         * Busca o professor pelo ID informado no DTO.
         *
         * Caso nao exista, retorna erro 404.
         */
        Professor professor =
                professorRepository
                        .findById(dto.getProfessorId())
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Professor não encontrado"
                                )
                        );

        /*
         * Busca a disciplina pelo ID informado no DTO.
         *
         * Caso nao exista, retorna erro 404.
         */
        Disciplina disciplina =
                disciplinaRepository
                        .findById(dto.getDisciplinaId())
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Disciplina não encontrada"
                                )
                        );

        /*
         * Cria o vinculo que relaciona:
         * - turma;
         * - professor;
         * - disciplina.
         */
        TurmaDisciplina td =
                new TurmaDisciplina();

        td.setTurma(turmaSalva);
        td.setProfessor(professor);
        td.setDisciplina(disciplina);

        // Salva o vinculo no banco.
        turmaDisciplinaRepository.save(td);

        // Devolve a turma criada.
        return turmaSalva;
    }

    /*
     * Lista todas as turmas cadastradas.
     *
     * Para cada turma, busca o primeiro vinculo
     * com professor e disciplina.
     */
    public List<TurmaDTO> listar() {

        return turmaRepository

                // Busca todas as turmas do banco.
                .findAll()

                // Transforma a lista de entidades em um fluxo.
                .stream()

                // Converte cada entidade Turma em TurmaDTO.
                .map(turma -> {

                    /*
                     * Busca somente o primeiro vinculo da turma.
                     *
                     * Quando nao existe vinculo, usa null.
                     */
                    TurmaDisciplina td =
                            turmaDisciplinaRepository
                                    .findFirstByTurmaId(
                                            turma.getId()
                                    )
                                    .orElse(null);

                    // Cria o DTO que sera devolvido ao front.
                    TurmaDTO dto = new TurmaDTO();

                    // Preenche os dados principais da turma.
                    dto.setId(turma.getId());
                    dto.setNome(turma.getNome());
                    dto.setDescricao(
                            turma.getDescricao()
                    );

                    // Preenche sala, datas, horarios e status.
                    dto.setSala(turma.getSala());
                    dto.setDataInicio(
                            turma.getDataInicio()
                    );
                    dto.setDataFimPrevista(
                            turma.getDataFimPrevista()
                    );
                    dto.setHorarioInicio(
                            turma.getHorarioInicio()
                    );
                    dto.setHorarioFim(
                            turma.getHorarioFim()
                    );
                    dto.setAtivo(turma.getAtivo());

                    /*
                     * Preenche professor e disciplina
                     * somente quando existe um vinculo.
                     */
                    if (td != null) {

                        // Nome do professor relacionado.
                        dto.setProfessor(
                                td.getProfessor()
                                        .getUsuario()
                                        .getNome()
                        );

                        // ID interno do professor.
                        dto.setProfessorId(
                                td.getProfessor().getId()
                        );

                        // Nome da disciplina relacionada.
                        dto.setDisciplina(
                                td.getDisciplina().getNome()
                        );

                        // ID interno da disciplina.
                        dto.setDisciplinaId(
                                td.getDisciplina().getId()
                        );
                    }

                    return dto;
                })

                // Monta a lista final de DTOs.
                .toList();
    }

    /*
     * Edita os dados de uma turma existente.
     *
     * Tambem atualiza o professor e a disciplina
     * do primeiro vinculo encontrado para a turma.
     */
    public Turma editar(
            Integer id,
            TurmaDTO dto
    ) {

        // Valida as datas recebidas antes de atualizar.
        validarPeriodoCurso(
                dto.getDataInicio(),
                dto.getDataFimPrevista()
        );

        /*
         * Busca a turma pelo ID.
         *
         * Caso nao exista, retorna erro 404.
         */
        Turma turma =
                turmaRepository
                        .findById(id)
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Turma não encontrada"
                                )
                        );

        // Substitui os dados atuais pelos valores do DTO.
        turma.setNome(dto.getNome());
        turma.setDescricao(dto.getDescricao());
        turma.setSala(dto.getSala());

        turma.setDataInicio(dto.getDataInicio());
        turma.setDataFimPrevista(
                dto.getDataFimPrevista()
        );

        turma.setHorarioInicio(
                dto.getHorarioInicio()
        );
        turma.setHorarioFim(
                dto.getHorarioFim()
        );

        // Salva os dados atualizados da turma.
        Turma turmaAtualizada =
                turmaRepository.save(turma);

        /*
         * Busca o primeiro vinculo da turma.
         *
         * Neste metodo, a edicao exige que o vinculo ja exista.
         */
        TurmaDisciplina td =
                turmaDisciplinaRepository
                        .findFirstByTurmaId(id)
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Vínculo da turma não encontrado"
                                )
                        );

        /*
         * Busca o novo professor informado.
         *
         * Caso nao exista, retorna erro 404.
         */
        Professor professor =
                professorRepository
                        .findById(dto.getProfessorId())
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Professor não encontrado"
                                )
                        );

        /*
         * Busca a nova disciplina informada.
         *
         * Caso nao exista, retorna erro 404.
         */
        Disciplina disciplina =
                disciplinaRepository
                        .findById(dto.getDisciplinaId())
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Disciplina não encontrada"
                                )
                        );

        // Atualiza o professor do vinculo.
        td.setProfessor(professor);

        // Atualiza a disciplina do vinculo.
        td.setDisciplina(disciplina);

        // Salva as alteracoes do vinculo.
        turmaDisciplinaRepository.save(td);

        // Devolve a turma atualizada.
        return turmaAtualizada;
    }

    /*
     * Ativa ou desativa uma turma.
     *
     * O metodo inverte o valor atual do campo ativo.
     */
    public Turma alterarStatus(
            Integer id
    ) {

        /*
         * Busca a turma pelo ID.
         *
         * Caso nao exista, retorna erro 404.
         */
        Turma turma =
                turmaRepository
                        .findById(id)
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Turma não encontrada"
                                )
                        );

        /*
         * Inverte o status atual:
         * - true vira false;
         * - false vira true.
         */
        turma.setAtivo(
                !turma.getAtivo()
        );

        // Salva e devolve a turma atualizada.
        return turmaRepository.save(turma);
    }

    /*
     * Valida o periodo planejado para a turma.
     *
     * As duas datas podem estar vazias para manter
     * compatibilidade temporaria com o front antigo.
     */
    private void validarPeriodoCurso(
            LocalDate dataInicio,
            LocalDate dataFimPrevista
    ) {

        /*
         * Quando as duas datas sao nulas,
         * o metodo nao aplica validacao.
         */
        if (
                dataInicio == null &&
                        dataFimPrevista == null
        ) {
            return;
        }

        /*
         * Impede o envio de apenas uma das datas.
         *
         * Inicio e fim precisam ser informados juntos.
         */
        if (
                dataInicio == null ||
                        dataFimPrevista == null
        ) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Informe a data de início e a data prevista de término"
            );
        }

        /*
         * A data final precisa ser posterior a data inicial.
         *
         * Datas iguais tambem sao consideradas invalidas.
         */
        if (
                !dataFimPrevista.isAfter(dataInicio)
        ) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "A data prevista de término deve ser posterior à data de início"
            );
        }
    }
}