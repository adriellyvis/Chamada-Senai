package eyecount.service;

import eyecount.dto.alerta.AlertaEvasaoDTO;
import eyecount.dto.aula.HistoricoAulaDTO;
import eyecount.dto.dashboard.FrequenciaTurmaDTO;
import eyecount.dto.professor.*;
import eyecount.model.Aluno;
import eyecount.model.Aula;
import eyecount.model.Professor;
import eyecount.model.StatusAula;
import eyecount.model.TurmaDisciplina;
import eyecount.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalTime;
import java.util.List;

/*
 * Servico responsavel pelas regras de negocio da area do professor.
 *
 * Esta classe permite:
 * - montar o dashboard do professor;
 * - localizar o professor pelo usuario logado;
 * - listar turmas e alunos;
 * - consultar frequencia das turmas;
 * - encerrar aulas;
 * - consultar historico;
 * - consultar desempenho;
 * - listar presencas de uma aula.
 */
@Service
@RequiredArgsConstructor
public class ProfessorService {

    // Repository usado para buscar os dados do professor.
    private final ProfessorRepository professorRepository;

    // Repository usado para consultar os vinculos entre turma, disciplina e professor.
    private final TurmaDisciplinaRepository turmaDisciplinaRepository;

    // Repository usado para buscar alunos das turmas do professor.
    private final AlunoRepository alunoRepository;

    // Repository usado para consultar e salvar aulas.
    private final AulaRepository aulaRepository;

    // Repository usado para consultar presencas e calcular frequencias.
    private final PresencaRepository presencaRepository;

    // =====================================================
    // PROFESSOR
    // =====================================================

    /*
     * Monta os indicadores exibidos no dashboard do professor.
     *
     * O metodo calcula:
     * - total de vinculos com turmas;
     * - total de alunos;
     * - quantidade de aulas realizadas;
     * - frequencia media;
     * - cinco aulas recentes;
     * - alunos em risco.
     */
    public ProfessorDashboardDTO dashboard(
            Integer usuarioId
    ) {

        // Busca o professor relacionado ao usuario logado.
        Professor professor =
                buscarProfessorPorUsuario(usuarioId);

        /*
         * Busca todos os vinculos em que o professor participa.
         *
         * Cada vinculo representa uma combinacao de:
         * - turma;
         * - disciplina;
         * - professor.
         */
        List<TurmaDisciplina> vinculos =
                turmaDisciplinaRepository
                        .findByProfessorId(
                                professor.getId()
                        );

        /*
         * Usa a quantidade de vinculos como total de turmas.
         *
         * Ponto de atencao:
         * se o professor tiver mais de uma disciplina na mesma turma,
         * essa turma pode ser contada mais de uma vez.
         */
        Integer totalTurmas =
                vinculos.size();

        /*
         * Para cada vinculo, busca os alunos da turma relacionada.
         *
         * Depois soma a quantidade de alunos encontrada
         * em todos os vinculos.
         */
        Integer totalAlunos = vinculos.stream()

                // Converte cada vinculo na quantidade de alunos da turma.
                .map(v ->
                        alunoRepository
                                .findByTurmaId(
                                        v.getTurma().getId()
                                )
                                .size()
                )

                /*
                 * Soma todas as quantidades.
                 *
                 * O valor inicial da soma e zero.
                 */
                .reduce(
                        0,
                        Integer::sum
                );

        /*
         * Busca o historico de aulas do professor.
         *
         * O filtro usa o usuarioId do professor.
         */
        List<HistoricoAulaDTO> historico =
                aulaRepository
                        .buscarHistoricoPorProfessor(
                                usuarioId
                        );

        // Usa o tamanho da lista como quantidade de aulas realizadas.
        Integer aulasRealizadas =
                historico.size();

        /*
         * Calcula a frequencia media das aulas do professor.
         *
         * O filtro usa o ID interno do professor.
         */
        Double frequenciaMedia =
                presencaRepository
                        .calcularFrequenciaPorProfessor(
                                professor.getId()
                        );

        // Quando a consulta nao retorna valor, usa zero.
        if (frequenciaMedia == null) {
            frequenciaMedia = 0.0;
        }

        /*
         * Seleciona somente os cinco primeiros itens do historico.
         *
         * O resultado depende da ordem definida
         * em buscarHistoricoPorProfessor.
         */
        List<HistoricoAulaDTO> aulasRecentes =
                historico.stream()
                        .limit(5)
                        .toList();

        /*
         * Busca alunos em risco relacionados ao professor.
         *
         * A regra de risco e definida na consulta do repository.
         */
        List<AlertaEvasaoDTO> alunosRisco =
                presencaRepository
                        .buscarAlunosRiscoProfessor(
                                professor.getId()
                        );

        /*
         * Monta o DTO final do dashboard.
         *
         * A frequencia e arredondada para uma casa decimal.
         */
        return new ProfessorDashboardDTO(
                totalTurmas,
                totalAlunos,
                Math.round(
                        frequenciaMedia * 10.0
                ) / 10.0,
                aulasRealizadas,
                aulasRecentes,
                alunosRisco
        );
    }

    /*
     * Busca o professor relacionado a um usuario.
     *
     * Caso nao exista professor vinculado,
     * retorna erro 404.
     */
    public Professor buscarProfessorPorUsuario(
            Integer usuarioId
    ) {

        return professorRepository
                .findByUsuarioId(usuarioId)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Professor não encontrado"
                        )
                );
    }

    // =====================================================
    // TURMAS
    // =====================================================

    /*
     * Lista as turmas vinculadas ao professor.
     *
     * A consulta do repository ja devolve os dados
     * no formato TurmaProfessorDTO.
     */
    public List<TurmaProfessorDTO> listarTurmas(
            Integer usuarioId
    ) {

        /*
         * Filtra as turmas pelo usuarioId do professor
         * e ja retorna um resumo de cada turma.
         */
        return turmaDisciplinaRepository
                .buscarTurmasDoProfessorComResumo(
                        usuarioId
                );
    }

    /*
     * Lista os alunos de uma turma relacionada
     * a um vinculo turma-disciplina.
     */
    public List<Aluno> listarAlunos(
            Integer turmaDisciplinaId
    ) {

        /*
         * Busca o vinculo pelo ID.
         *
         * Caso nao exista, retorna erro 404.
         */
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
         * Recupera a turma do vinculo
         * e busca todos os alunos matriculados nela.
         */
        return alunoRepository.findByTurmaId(
                turmaDisciplina
                        .getTurma()
                        .getId()
        );
    }

    /*
     * Busca a frequencia das turmas do professor.
     *
     * Primeiro localiza o professor pelo usuarioId
     * e depois filtra as turmas pelo ID do professor.
     */
    public List<FrequenciaTurmaDTO> buscarFrequenciaTurmas(
            Integer usuarioId
    ) {

        // Busca o professor relacionado ao usuario logado.
        Professor professor =
                buscarProfessorPorUsuario(usuarioId);

        /*
         * Busca a frequencia agrupada por turma
         * somente para o professor informado.
         */
        return presencaRepository
                .buscarFrequenciaTurmasProfessor(
                        professor.getId()
                );
    }

    // =====================================================
    // AULAS
    // =====================================================

    /*
     * Encerra uma aula manualmente.
     *
     * O metodo altera:
     * - hora final;
     * - status da aula.
     */
    public Aula encerrarAula(
            Integer aulaId
    ) {

        /*
         * Busca a aula pelo ID.
         *
         * Caso nao exista, retorna erro 404.
         */
        Aula aula =
                aulaRepository
                        .findById(aulaId)
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Aula não encontrada"
                                )
                        );

        // Registra o horario real do encerramento.
        aula.setHoraFim(
                LocalTime.now()
        );

        // Marca a aula como encerrada.
        aula.setStatus(
                StatusAula.ENCERRADA
        );

        // Salva e devolve a aula atualizada.
        return aulaRepository.save(aula);
    }

    /*
     * Lista o historico de aulas do professor.
     *
     * O filtro usa o usuarioId.
     */
    public List<HistoricoAulaDTO> listarHistorico(
            Integer usuarioId
    ) {

        return aulaRepository
                .buscarHistoricoPorProfessor(
                        usuarioId
                );
    }

    /*
     * Busca o desempenho das turmas do professor.
     *
     * O filtro utiliza:
     * - usuarioId do professor;
     * - turmaId, quando informado.
     *
     * Ponto de atencao:
     * o parametro periodo e recebido,
     * mas nao e usado na consulta atual.
     */
    public List<DesempenhoTurmaDTO> desempenhoTurmas(
            Integer usuarioId,
            Integer turmaId,
            String periodo
    ) {

        return presencaRepository
                .buscarDesempenhoTurmas(
                        usuarioId,
                        turmaId
                );
    }

    /*
     * Lista alunos relacionados ao professor.
     *
     * A consulta pode filtrar:
     * - pelo usuarioId do professor;
     * - por turmaId.
     */
    public List<AlunoProfessorDTO> listarAlunosProfessor(
            Integer usuarioId,
            Integer turmaId
    ) {

        return alunoRepository
                .buscarAlunosDoProfessor(
                        usuarioId,
                        turmaId
                );
    }

    /*
     * Lista todas as presencas salvas para uma aula.
     *
     * Para cada registro, devolve:
     * - ID e nome do aluno;
     * - status;
     * - metodo;
     * - validacao biometrica.
     */
    public List<PresencaAlunoProfessorDTO> listarPresencasDaAula(
            Integer aulaId
    ) {

        return presencaRepository

                // Busca somente presencas vinculadas ao aulaId informado.
                .findByAula_Id(aulaId)

                // Transforma a lista em um fluxo.
                .stream()

                /*
                 * Converte cada entidade Presenca
                 * em PresencaAlunoProfessorDTO.
                 */
                .map(p ->
                        new PresencaAlunoProfessorDTO(
                                p.getAluno().getId(),
                                p.getAluno()
                                        .getUsuario()
                                        .getNome(),

                                /*
                                 * Quando o status existe, usa o nome do enum.
                                 * Quando e nulo, devolve NAO_REGISTRADO.
                                 */
                                p.getStatus() != null
                                        ? p.getStatus().name()
                                        : "NAO_REGISTRADO",

                                /*
                                 * Quando o metodo existe, usa o nome do enum.
                                 * Quando e nulo, devolve NAO_INFORMADO.
                                 */
                                p.getMetodo() != null
                                        ? p.getMetodo().name()
                                        : "NAO_INFORMADO",

                                /*
                                 * Boolean.TRUE.equals evita erro
                                 * quando validacaoBiometrica e nulo.
                                 */
                                Boolean.TRUE.equals(
                                        p.getValidacaoBiometrica()
                                )
                        )
                )

                // Monta a lista final.
                .toList();
    }
}