package prezence.service;

import prezence.dto.alerta.AlertaEvasaoDTO;
import prezence.dto.dashboard.*;
import prezence.dto.disciplina.DisciplinaDTO;
import prezence.dto.gestor.GestorPerfilDTO;
import prezence.dto.turma.TurmaResumoDTO;
import prezence.dto.turma.request.AtualizarTurmaDTO;
import prezence.dto.turma.request.CriarTurmaDTO;
import prezence.dto.turma.response.ItemDetalheDTO;
import prezence.dto.turma.response.TurmaDetalheDTO;
import prezence.dto.turma.response.TurmaDetalhesCompletosDTO;
import prezence.dto.turma.response.TurmaVinculoDTO;
import prezence.dto.usuario.*;
import prezence.model.*;
import prezence.repository.*;
import jakarta.transaction.Transactional;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;import org.springframework.security.crypto.password.PasswordEncoder;

/*
 * Servico principal da area do gestor.
 *
 * Esta classe concentra regras relacionadas a:
 * - seguranca do perfil gestor;
 * - dashboard institucional;
 * - desempenho de turmas, alunos e professores;
 * - usuarios;
 * - professores;
 * - alunos;
 * - turmas;
 * - disciplinas;
 * - alertas;
 * - ocorrencias;
 * - resumo institucional.
 */
@Service
@AllArgsConstructor
public class GestorService {

    private final UsuarioRepository usuarioRepository;
    private final PresencaRepository presencaRepository;
    private final ProfessorRepository professorRepository;
    private final DisciplinaRepository disciplinaRepository;
    private final TurmaRepository turmaRepository;
    private final OcorrenciaRepository ocorrenciaRepository;
    private final AlunoRepository alunoRepository;
    private final PerfilRepository perfilRepository;
    private final TurmaDisciplinaRepository turmaDisciplinaRepository;
    private final PasswordEncoder passwordEncoder;
    private final AulaRepository aulaRepository;

    // =====================================================
    // SEGURANCA
    // =====================================================

    /*
     * Verifica se o usuario informado existe e possui perfil de gestor.
     *
     * O perfil de gestor possui ID 3 no banco de dados.
     */
    public void validarGestor(
            Integer usuarioId
    ) {
        buscarUsuarioGestor(usuarioId);
    }

    private Usuario buscarUsuarioGestor(
            Integer usuarioId
    ) {

        Usuario usuario =
                usuarioRepository
                        .findById(usuarioId)
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.UNAUTHORIZED,
                                        "Usuário não encontrado"
                                )
                        );

        if (
                usuario.getPerfil() == null ||
                        !Integer.valueOf(3).equals(
                                usuario.getPerfil().getId()
                        )
        ) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Acesso negado"
            );
        }

        return usuario;
    }

    // =====================================================
    // DASHBOARD
    // =====================================================

    /*
     * Monta os dados principais do dashboard do gestor.
     *
     * O metodo reune:
     * - alertas de evasao;
     * - frequencia global;
     * - quantidade de alunos em risco;
     * - contagem de ocorrencias por status;
     * - atividades recentes;
     * - frequencia por turma.
     */
    public GestorDashboardDTO dashboard() {

        // Busca alunos com frequencia abaixo da regra definida no repository.
        List<AlertaEvasaoDTO> alertas =
                presencaRepository.buscarAlertasEvasao();

        // Calcula a frequencia geral usando todas as presencas do sistema.
        Double frequenciaGlobal =
                calcularFrequenciaGeral();

        // A quantidade de alunos em risco corresponde ao tamanho da lista.
        Integer alunosRisco =
                alertas.size();

        // Conta somente ocorrencias com status PENDENTE.
        Integer ocorrenciasPendentes = Math.toIntExact(
                ocorrenciaRepository.countByStatus(
                        StatusOcorrencia.PENDENTE
                )
        );

        // Conta somente ocorrencias com status EM_ANALISE.
        Integer ocorrenciasEmAnalise = Math.toIntExact(
                ocorrenciaRepository.countByStatus(
                        StatusOcorrencia.EM_ANALISE
                )
        );

        // Conta somente ocorrencias com status RESOLVIDA.
        Integer ocorrenciasResolvidas = Math.toIntExact(
                ocorrenciaRepository.countByStatus(
                        StatusOcorrencia.RESOLVIDA
                )
        );

        // Conta somente ocorrencias com status CANCELADA.
        Integer ocorrenciasCanceladas = Math.toIntExact(
                ocorrenciaRepository.countByStatus(
                        StatusOcorrencia.CANCELADA
                )
        );

        // Monta a lista de atividades recentes exibidas no dashboard.
        List<AtividadeRecenteDTO> atividades =
                montarAtividadesRecentes();

        // Busca a frequencia agrupada por turma.
        List<FrequenciaTurmaDTO> frequenciaTurmas =
                presencaRepository.buscarFrequenciaTurmas();

        // Reune todos os indicadores em um unico DTO.
        return new GestorDashboardDTO(
                alunosRisco,
                ocorrenciasPendentes,
                ocorrenciasEmAnalise,
                ocorrenciasResolvidas,
                ocorrenciasCanceladas,
                frequenciaGlobal,
                alertas,
                atividades,
                frequenciaTurmas
        );
    }

    /*
     * Retorna dados de desempenho conforme o tipo escolhido no front.
     *
     * Tipos aceitos:
     * - turma;
     * - aluno;
     * - professor.
     *
     * O indicador muda conforme o tipo escolhido.
     */
    public List<DesempenhoDashboardDTO> desempenhoDashboard(
            String tipo,
            String indicador,
            Integer turmaId
    ) {

        /*
         * Converte o tipo para letras minusculas.
         * Quando o valor for nulo, usa texto vazio.
         */
        String tipoNormalizado =
                tipo == null ? "" : tipo.toLowerCase();

        // Normaliza o indicador da mesma forma.
        String indicadorNormalizado =
                indicador == null ? "" : indicador.toLowerCase();

        /*
         * Direciona o processamento para o metodo correto
         * conforme o tipo escolhido.
         */
        return switch (tipoNormalizado) {
            case "turma" ->
                    desempenhoPorTurma(indicadorNormalizado);

            case "aluno" ->
                    desempenhoPorAluno(
                            indicadorNormalizado,
                            turmaId
                    );

            case "professor" ->
                    desempenhoPorProfessor(indicadorNormalizado);

            default -> throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Tipo de desempenho inválido"
            );
        };
    }

    /*
     * Calcula o desempenho agrupado por turma.
     *
     * Indicadores aceitos:
     * - presenca;
     * - faltas;
     * - atrasos.
     */
    private List<DesempenhoDashboardDTO> desempenhoPorTurma(
            String indicador
    ) {

        // Busca a frequencia de todas as turmas.
        List<FrequenciaTurmaDTO> turmas =
                presencaRepository.buscarFrequenciaTurmas();

        return switch (indicador) {

            /*
             * Para presenca, usa diretamente a frequencia
             * calculada pelo repository.
             */
            case "presenca" -> turmas.stream()
                    .map(turma -> new DesempenhoDashboardDTO(
                            turma.getTurma(),
                            arredondar(turma.getFrequencia())
                    ))
                    .toList();

            /*
             * Para faltas, calcula o valor contrario da frequencia.
             *
             * Exemplo:
             * frequencia 80 por cento = faltas 20 por cento.
             */
            case "faltas" -> turmas.stream()
                    .map(turma -> {
                        Double frequencia =
                                turma.getFrequencia();

                        Double percentualFaltas =
                                frequencia == null
                                        ? 0.0
                                        : 100.0 - frequencia;

                        return new DesempenhoDashboardDTO(
                                turma.getTurma(),
                                arredondar(percentualFaltas)
                        );
                    })
                    .toList();

            /*
             * O indicador de atrasos por turma ainda nao possui
             * calculo real e retorna zero para todas as turmas.
             */
            case "atrasos" -> turmas.stream()
                    .map(turma -> new DesempenhoDashboardDTO(
                            turma.getTurma(),
                            0.0
                    ))
                    .toList();

            default -> throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Indicador inválido para turma"
            );
        };
    }

    /*
     * Calcula o desempenho individual dos alunos.
     *
     * Quando turmaId foi informado, filtra somente os alunos dessa turma.
     * Quando turmaId for nulo, considera todos os alunos.
     */
    private List<DesempenhoDashboardDTO> desempenhoPorAluno(
            String indicador,
            Integer turmaId
    ) {
        List<Aluno> alunos;

        // Aplica filtro por turma quando o ID foi recebido.
        if (turmaId != null) {
            alunos = alunoRepository.findByTurmaId(turmaId);
        } else {
            // Sem filtro, busca todos os alunos.
            alunos = alunoRepository.findAll();
        }

        return alunos.stream()
                .map(aluno -> {

                    // Busca todas as presencas do aluno atual.
                    List<Presenca> presencas =
                            presencaRepository.findByAlunoId(
                                    aluno.getId()
                            );

                    /*
                     * Calcula o indicador solicitado usando
                     * os registros de presenca encontrados.
                     */
                    double valor =
                            calcularIndicadorAluno(
                                    presencas,
                                    indicador
                            );

                    // Monta o nome e o valor exibidos no grafico.
                    return new DesempenhoDashboardDTO(
                            aluno.getUsuario().getNome(),
                            valor
                    );
                })
                .toList();
    }

    /*
     * Calcula um indicador de um aluno a partir de suas presencas.
     *
     * Indicadores aceitos:
     * - presenca;
     * - faltas;
     * - atrasos.
     */
    private double calcularIndicadorAluno(
            List<Presenca> presencas,
            String indicador
    ) {

        long presentes = presencas.stream()
                .filter(p ->
                        p.getStatus() == StatusPresenca.PRESENTE
                )
                .count();

        long faltas = presencas.stream()
                .filter(p ->
                        p.getStatus() == StatusPresenca.AUSENTE
                )
                .count();

        long atrasos = presencas.stream()
                .filter(p ->
                        p.getStatus() == StatusPresenca.ATRASADO
                )
                .count();

        long totalValido =
                presentes + faltas + atrasos;

        if (totalValido == 0) {
            return 0.0;
        }

        long comparecimentos =
                presentes + atrasos;

        return switch (indicador) {
            case "presenca" ->
                    arredondar(
                            (comparecimentos * 100.0) /
                                    totalValido
                    );

            case "faltas" ->
                    (double) faltas;

            case "atrasos" ->
                    (double) atrasos;

            default -> throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Indicador inválido para aluno"
            );
        };
    }

    /*
     * Arredonda um numero para uma casa decimal.
     *
     * Quando o valor for nulo, retorna zero.
     */
    private double arredondar(Double valor) {

        if (valor == null) {
            return 0.0;
        }

        return Math.round(valor * 10.0) / 10.0;
    }

    /*
     * Calcula o desempenho individual dos professores.
     *
     * Indicadores aceitos:
     * - aulas;
     * - turmas;
     * - ocorrencias.
     */
    private List<DesempenhoDashboardDTO> desempenhoPorProfessor(
            String indicador
    ) {

        // Busca todos os professores cadastrados.
        List<Professor> professores =
                professorRepository.findAll();

        return professores.stream()
                .map(professor -> {

                    /*
                     * Escolhe o calculo conforme o indicador recebido.
                     */
                    Double valor = switch (indicador) {
                        case "aulas" ->
                                contarAulasProfessor(professor);

                        case "turmas" ->
                                contarTurmasProfessor(professor);

                        case "ocorrencias" ->
                                contarOcorrenciasProfessor(professor);

                        default -> throw new ResponseStatusException(
                                HttpStatus.BAD_REQUEST,
                                "Indicador inválido para professor"
                        );
                    };

                    return new DesempenhoDashboardDTO(
                            professor.getUsuario().getNome(),
                            valor
                    );
                })
                .toList();
    }

    /*
     * Conta quantas aulas pertencem ao professor.
     *
     * O filtro percorre o vinculo TurmaDisciplina
     * ate chegar ao ID do professor.
     */
    private Double contarAulasProfessor(
            Professor professor
    ) {
        return aulaRepository
                .countByTurmaDisciplina_Professor_Id(
                        professor.getId()
                )
                .doubleValue();
    }

    /*
     * Conta quantos vinculos de turma o professor possui.
     *
     * O codigo atual usa o tamanho da lista de vinculos.
     */
    private Double contarTurmasProfessor(
            Professor professor
    ) {
        return (double) turmaDisciplinaRepository
                .findByProfessorId(professor.getId())
                .size();
    }

    /*
     * Conta quantas ocorrencias foram registradas pelo professor.
     */
    private Double contarOcorrenciasProfessor(
            Professor professor
    ) {
        return (double) ocorrenciaRepository
                .findByProfessor_Id(professor.getId())
                .size();
    }

    /*
     * Calcula a frequência geral do sistema.
     *
     * PRESENTE e ATRASADO contam como comparecimento.
     * AUSENTE conta como falta.
     * SAIDA_TEMPORARIA não participa do cálculo.
     */
    private double calcularFrequenciaGeral() {

        List<Presenca> presencas =
                presencaRepository.findAll();

        long presentes = presencas.stream()
                .filter(p ->
                        p.getStatus() == StatusPresenca.PRESENTE
                )
                .count();

        long atrasos = presencas.stream()
                .filter(p ->
                        p.getStatus() == StatusPresenca.ATRASADO
                )
                .count();

        long faltas = presencas.stream()
                .filter(p ->
                        p.getStatus() == StatusPresenca.AUSENTE
                )
                .count();

        long totalValido =
                presentes + atrasos + faltas;

        if (totalValido == 0) {
            return 0.0;
        }

        double frequencia =
                ((presentes + atrasos) * 100.0) /
                        totalValido;

        return Math.round(
                frequencia * 10.0
        ) / 10.0;
    }

    /*
     * Monta as atividades recentes do dashboard.
     *
     * O codigo atual utiliza as dez ocorrencias
     * mais recentes como atividades.
     */
    private List<AtividadeRecenteDTO> montarAtividadesRecentes() {

        // Cria a lista que recebera as atividades.
        List<AtividadeRecenteDTO> atividades =
                new ArrayList<>();

        /*
         * Busca as dez ocorrencias mais recentes
         * ordenadas pela data da ocorrencia.
         */
        ocorrenciaRepository
                .findTop10ByOrderByDataOcorrenciaDesc()
                .forEach(ocorrencia -> {
                    atividades.add(
                            new AtividadeRecenteDTO(
                                    ocorrencia.getTitulo(),
                                    ocorrencia.getDescricao(),
                                    "ocorrencia",
                                    ocorrencia.getDataOcorrencia()
                            )
                    );
                });

        /*
         * Quando nao existem ocorrencias, adiciona
         * uma atividade padrao do sistema.
         */
        if (atividades.isEmpty()) {
            atividades.add(
                    new AtividadeRecenteDTO(
                            "Sistema iniciado",
                            "Nenhuma atividade encontrada",
                            "sistema",
                            LocalDateTime.now()
                    )
            );
        }

        return atividades;
    }

    // =====================================================
    // USUARIOS
    // =====================================================

    /*
     * Lista todos os usuarios cadastrados.
     *
     * Cada entidade Usuario e convertida para UsuarioDTO.
     */
    public List<UsuarioDTO> listarUsuarios() {

        return usuarioRepository.findAll()
                .stream()
                .map(this::converterUsuarioDTO)
                .toList();
    }

    /*
     * Cadastra os dados basicos de um usuario.
     *
     * Este metodo nao cria o registro especifico
     * de Aluno ou Professor.
     */
    public UsuarioDTO cadastrarUsuario(
            CriarUsuarioDTO dto
    ) {

        // Impede o cadastro de outro gestor.
        if (dto.getPerfilId() == 3) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Não é permitido cadastrar outro gestor"
            );
        }

        // Impede email duplicado.
        if (
                usuarioRepository
                        .findByEmail(dto.getEmail())
                        .isPresent()
        ) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Email já cadastrado"
            );
        }

        // Busca o perfil informado.
        Perfil perfil = perfilRepository
                .findById(dto.getPerfilId())
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Perfil não encontrado"
                        )
                );

        // Cria o usuario ainda nao salvo.
        Usuario usuario = new Usuario();

        usuario.setNome(dto.getNome());
        usuario.setEmail(dto.getEmail());
        usuario.setSenha(
                passwordEncoder.encode(
                        dto.getSenha()
                )
        );
        usuario.setPerfil(perfil);
        usuario.setAtivo(true);
        usuario.setDataCriacao(LocalDateTime.now());

        Usuario salvo =
                usuarioRepository.save(usuario);

        // Converte o resultado para DTO.
        return converterUsuarioDTO(salvo);
    }

    /*
     * Cadastra um usuario completo.
     *
     * Alem do Usuario, cria:
     * - Aluno, quando perfilId for 1;
     * - Professor, quando perfilId for 2.
     */
    @Transactional
    public UsuarioDTO cadastrarUsuarioCompleto(
            CriarUsuarioCompletoDTO dto
    ) {

        /*
         * Primeiro cria o registro basico de Usuario
         * reutilizando cadastrarUsuario.
         */
        UsuarioDTO usuarioDTO = cadastrarUsuario(
                new CriarUsuarioDTO(
                        dto.getNome(),
                        dto.getEmail(),
                        dto.getSenha(),
                        dto.getPerfilId()
                )
        );

        // Busca novamente a entidade salva pelo ID retornado.
        Usuario usuario = usuarioRepository
                .findById(usuarioDTO.getId())
                .orElseThrow();

        // Perfil 1 representa aluno.
        if (dto.getPerfilId() == 1) {

            // Busca a turma escolhida.
            Turma turma = turmaRepository
                    .findById(dto.getTurmaId())
                    .orElseThrow(() ->
                            new ResponseStatusException(
                                    HttpStatus.NOT_FOUND,
                                    "Turma não encontrada"
                            )
                    );

            // Cria o registro academico do aluno.
            Aluno aluno = new Aluno();
            aluno.setUsuario(usuario);
            aluno.setTurma(turma);
            aluno.setMatricula(dto.getMatricula());

            alunoRepository.save(aluno);
        }

        // Perfil 2 representa professor.
        if (dto.getPerfilId() == 2) {

            // Cria o registro especifico do professor.
            Professor professor = new Professor();
            professor.setUsuario(usuario);
            professor.setEspecialidade(
                    dto.getEspecialidade()
            );

            professorRepository.save(professor);
        }

        return usuarioDTO;
    }

    /*
     * Edita os dados basicos de um usuario.
     *
     * Tambem pode alterar:
     * - turma do aluno;
     * - especialidade do professor.
     */
    public Usuario editarUsuario(
            Integer id,
            UsuarioEditarDTO dto
    ) {

        // Busca o usuario pelo ID.
        Usuario usuario = usuarioRepository
                .findById(id)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Usuário não encontrado"
                        )
                );

        // Impede a edicao de outro gestor.
        if (usuario.getPerfil().getId() == 3) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Não é permitido editar outro gestor"
            );
        }

        // Atualiza nome e email.
        usuario.setNome(dto.getNome());
        usuario.setEmail(dto.getEmail());

        // Salva as alteracoes basicas.
        Usuario usuarioSalvo =
                usuarioRepository.save(usuario);

        /*
         * Atualiza a turma somente quando:
         * - turmaId foi informado;
         * - o usuario pertence ao perfil aluno.
         */
        if (
                dto.getTurmaId() != null &&
                        usuario.getPerfil().getId() == 1
        ) {

            // Busca o registro academico do aluno.
            Aluno aluno = alunoRepository
                    .findByUsuarioId(usuario.getId())
                    .orElseThrow(() ->
                            new ResponseStatusException(
                                    HttpStatus.NOT_FOUND,
                                    "Aluno não encontrado"
                            )
                    );

            // Busca a nova turma.
            Turma turma = turmaRepository
                    .findById(dto.getTurmaId())
                    .orElseThrow(() ->
                            new ResponseStatusException(
                                    HttpStatus.NOT_FOUND,
                                    "Turma não encontrada"
                            )
                    );

            // Atualiza e salva a turma do aluno.
            aluno.setTurma(turma);
            alunoRepository.save(aluno);
        }

        /*
         * Atualiza a especialidade somente quando:
         * - o usuario e professor;
         * - a especialidade foi informada.
         */
        if (
                usuario.getPerfil().getId() == 2 &&
                        dto.getEspecialidade() != null
        ) {

            // Busca o registro especifico do professor.
            Professor professor =
                    professorRepository
                            .findByUsuarioId(usuario.getId())
                            .orElseThrow(() ->
                                    new ResponseStatusException(
                                            HttpStatus.NOT_FOUND,
                                            "Professor não encontrado"
                                    )
                            );

            // Atualiza e salva a especialidade.
            professor.setEspecialidade(
                    dto.getEspecialidade()
            );
            professorRepository.save(professor);
        }

        return usuarioSalvo;
    }

    /*
     * Alterna o status ativo do usuario.
     *
     * true vira false e false vira true.
     */
    public Usuario alterarStatusUsuario(
            Integer id
    ) {

        Usuario usuario = usuarioRepository
                .findById(id)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Usuário não encontrado"
                        )
                );

        /*
         * Gestores não podem ser ativados/desativados
         * por outro gestor.
         *
         * Usamos o nome do perfil em vez do ID,
         * pois o ID pode variar entre bancos.
         */
        if (
                usuario.getPerfil() != null
                        &&
                        usuario.getPerfil().getNome() != null
                        &&
                        usuario.getPerfil()
                                .getNome()
                                .equalsIgnoreCase("gestor")
        ) {

            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Não é permitido alterar o status de outro gestor"
            );
        }

        usuario.setAtivo(
                !Boolean.TRUE.equals(
                        usuario.getAtivo()
                )
        );

        return usuarioRepository.save(usuario);
    }

    /*
     * Monta os detalhes completos de um usuario.
     *
     * Para aluno, inclui matricula, turma e frequencia.
     * Para professor, inclui especialidade.
     */
    public UsuarioDetalhesDTO detalhesUsuario(
            Integer id
    ) {

        // Busca o usuario principal.
        Usuario usuario = usuarioRepository
                .findById(id)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Usuário não encontrado"
                        )
                );

        // Cria o DTO e preenche os dados comuns.
        UsuarioDetalhesDTO dto =
                new UsuarioDetalhesDTO();

        dto.setId(usuario.getId());
        dto.setNome(usuario.getNome());
        dto.setEmail(usuario.getEmail());
        dto.setPerfil(
                usuario.getPerfil().getNome()
        );

        // Perfil 1 representa aluno.
        if (usuario.getPerfil().getId() == 1) {

            /*
             * Busca o registro de aluno.
             * O bloco so executa quando o aluno existe.
             */
            alunoRepository
                    .findByUsuarioId(usuario.getId())
                    .ifPresent(aluno -> {

                        dto.setMatricula(
                                aluno.getMatricula()
                        );

                        // Preenche a turma somente quando existe vinculo.
                        if (aluno.getTurma() != null) {
                            dto.setTurma(
                                    aluno.getTurma().getNome()
                            );
                        }

                        // Busca todas as presencas do aluno.
                        List<Presenca> presencas =
                                presencaRepository.findByAlunoId(
                                        aluno.getId()
                                );

                        // Sem registros, a frequencia fica em zero.
                        long presentes = presencas.stream()
                                .filter(p ->
                                        p.getStatus() == StatusPresenca.PRESENTE
                                )
                                .count();

                        long atrasos = presencas.stream()
                                .filter(p ->
                                        p.getStatus() == StatusPresenca.ATRASADO
                                )
                                .count();

                        long faltas = presencas.stream()
                                .filter(p ->
                                        p.getStatus() == StatusPresenca.AUSENTE
                                )
                                .count();

                        long totalValido =
                                presentes + atrasos + faltas;

                        if (totalValido == 0) {
                            dto.setFrequencia(0.0);
                        } else {

                            double frequencia =
                                    ((presentes + atrasos) * 100.0) /
                                            totalValido;

                            dto.setFrequencia(
                                    Math.round(
                                            frequencia * 10.0
                                    ) / 10.0
                            );
                        }
                    });
        }

        // Perfil 2 representa professor.
        if (usuario.getPerfil().getId() == 2) {

            // Busca e preenche a especialidade do professor.
            professorRepository
                    .findByUsuarioId(usuario.getId())
                    .ifPresent(professor -> {
                        dto.setEspecialidade(
                                professor.getEspecialidade()
                        );
                    });
        }

        return dto;
    }

    /*
     * Lista todos os professores em formato resumido.
     */
    public List<ProfessorResumoDTO> listarProfessores() {

        return professorRepository.findAll()
                .stream()
                .map(professor ->
                        new ProfessorResumoDTO(
                                professor.getId(),
                                professor.getUsuario().getNome(),
                                professor.getUsuario().getEmail(),
                                professor.getEspecialidade()
                        )
                )
                .toList();
    }

    // =====================================================
    // DISCIPLINAS
    // =====================================================

    // Lista todas as disciplinas em formato de DTO.
    public List<DisciplinaDTO> listarDisciplinasDTO() {

        return disciplinaRepository.findAll()
                .stream()
                .map(disciplina ->
                        new DisciplinaDTO(
                                disciplina.getId(),
                                disciplina.getNome(),
                                disciplina.getSigla()
                        )
                )
                .toList();
    }

    // =====================================================
    // ALERTAS
    // =====================================================

    // Retorna a lista de alunos em risco de evasao.
    public List<AlertaEvasaoDTO> listarAlertas() {

        return presencaRepository.buscarAlertasEvasao();
    }

    // =====================================================
    // CONVERSORES
    // =====================================================

    /*
     * Converte Usuario em UsuarioDTO.
     *
     * Quando o usuario e aluno, tambem tenta incluir turmaId.
     */
    private UsuarioDTO converterUsuarioDTO(
            Usuario usuario
    ) {

        // Valor padrao para usuarios que nao sao alunos.
        Integer turmaId = null;

        // Perfil 1 representa aluno.
        if (usuario.getPerfil().getId() == 1) {

            /*
             * Busca o aluno pelo usuario e extrai o ID da turma.
             *
             * Caso o aluno nao exista, retorna null.
             */
            turmaId = alunoRepository
                    .findByUsuarioId(usuario.getId())
                    .map(aluno ->
                            aluno.getTurma().getId()
                    )
                    .orElse(null);
        }

        return new UsuarioDTO(
                usuario.getId(),
                usuario.getNome(),
                usuario.getEmail(),
                usuario.getPerfil().getNome(),
                usuario.getAtivo(),
                turmaId
        );
    }

    // =====================================================
    // TURMAS
    // =====================================================

    /*
     * Lista todas as turmas com informacoes resumidas.
     *
     * Para cada turma, calcula:
     * - total de alunos;
     * - total de professores distintos;
     * - total de disciplinas distintas;
     * - primeiro professor e primeira disciplina encontrados.
     */
    public List<TurmaDetalheDTO> listarTurmas() {

        return turmaRepository.findAll()
                .stream()
                .map(turma -> {

                    // Conta alunos vinculados a turma.
                    Integer totalAlunos =
                            alunoRepository
                                    .findByTurmaId(turma.getId())
                                    .size();

                    // Busca todos os vinculos da turma.
                    List<TurmaDisciplina> vinculos =
                            turmaDisciplinaRepository
                                    .findByTurmaId(turma.getId());

                    /*
                     * Extrai os professores, remove nulos,
                     * elimina repetidos e conta o resultado.
                     */
                    Integer totalProfessores =
                            (int) vinculos.stream()
                                    .map(TurmaDisciplina::getProfessor)
                                    .filter(java.util.Objects::nonNull)
                                    .distinct()
                                    .count();

                    /*
                     * Extrai as disciplinas, remove nulos,
                     * elimina repetidos e conta o resultado.
                     */
                    Integer totalDisciplinas =
                            (int) vinculos.stream()
                                    .map(TurmaDisciplina::getDisciplina)
                                    .filter(java.util.Objects::nonNull)
                                    .distinct()
                                    .count();

                    String professor = null;
                    String disciplina = null;

                    /*
                     * Seleciona apenas o primeiro vinculo encontrado
                     * para preencher os campos resumidos.
                     */
                    TurmaDisciplina vinculo =
                            vinculos.stream()
                                    .findFirst()
                                    .orElse(null);

                    if (vinculo != null) {

                        if (vinculo.getProfessor() != null) {
                            professor =
                                    vinculo.getProfessor()
                                            .getUsuario()
                                            .getNome();
                        }

                        if (vinculo.getDisciplina() != null) {
                            disciplina =
                                    vinculo.getDisciplina()
                                            .getNome();
                        }
                    }

                    return new TurmaDetalheDTO(
                            turma.getId(),
                            turma.getNome(),
                            turma.getDescricao(),

                            turma.getSala(),
                            turma.getDataInicio(),
                            turma.getDataFimPrevista(),
                            turma.getHorarioInicio(),
                            turma.getHorarioFim(),

                            totalAlunos,
                            totalProfessores,
                            totalDisciplinas,

                            turma.getAtivo(),
                            professor,
                            disciplina
                    );
                })
                .toList();
    }

    /*
     * Lista somente ID e nome de cada turma.
     *
     * Esse formato e usado em selects e filtros.
     */
    public List<TurmaResumoDTO> listarTurmasResumo() {

        return turmaRepository.findAll()
                .stream()
                .map(turma ->
                        new TurmaResumoDTO(
                                turma.getId(),
                                turma.getNome()
                        )
                )
                .toList();
    }

    /*
     * Cadastra uma nova turma.
     *
     * Antes de salvar, valida:
     * - periodo do curso;
     * - horario inicial e final.
     */
    @Transactional
    public TurmaDetalheDTO cadastrarTurma(
            CriarTurmaDTO dto
    ) {

        // =====================================================
        // VALIDAR DADOS DA TURMA
        // =====================================================

        validarHorarioTurma(
                dto.getHorarioInicio(),
                dto.getHorarioFim()
        );

        validarPeriodoCurso(
                dto.getDataInicio(),
                dto.getDataFimPrevista()
        );

        // =====================================================
        // BUSCAR PROFESSOR
        // =====================================================

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
         * Não deixa vincular um professor cujo
         * usuário esteja desativado.
         */
        if (
                professor.getUsuario() == null
                        ||
                        !Boolean.TRUE.equals(
                                professor
                                        .getUsuario()
                                        .getAtivo()
                        )
        ) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "O professor informado está inativo"
            );
        }

        // =====================================================
        // BUSCAR DISCIPLINA
        // =====================================================

        Disciplina disciplina =
                disciplinaRepository
                        .findById(dto.getDisciplinaId())
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Disciplina não encontrada"
                                )
                        );

        // =====================================================
        // CRIAR TURMA
        // =====================================================

        Turma turma = new Turma();

        turma.setNome(
                dto.getNome().trim()
        );

        turma.setDescricao(
                dto.getDescricao().trim()
        );

        turma.setSala(
                dto.getSala() != null
                        ? dto.getSala().trim()
                        : null
        );

        turma.setDataInicio(
                dto.getDataInicio()
        );

        turma.setDataFimPrevista(
                dto.getDataFimPrevista()
        );

        turma.setHorarioInicio(
                dto.getHorarioInicio()
        );

        turma.setHorarioFim(
                dto.getHorarioFim()
        );

        turma.setAtivo(true);

        Turma salva =
                turmaRepository.save(turma);

        // =====================================================
        // CRIAR VÍNCULO
        // TURMA + PROFESSOR + DISCIPLINA
        // =====================================================

        TurmaDisciplina vinculo =
                new TurmaDisciplina();

        vinculo.setTurma(salva);
        vinculo.setProfessor(professor);
        vinculo.setDisciplina(disciplina);

        turmaDisciplinaRepository.save(vinculo);

        // =====================================================
        // RETORNO
        // =====================================================

        return new TurmaDetalheDTO(
                salva.getId(),
                salva.getNome(),
                salva.getDescricao(),

                salva.getSala(),
                salva.getDataInicio(),
                salva.getDataFimPrevista(),
                salva.getHorarioInicio(),
                salva.getHorarioFim(),

                0, // alunos
                1, // professor
                1, // disciplina

                salva.getAtivo(),

                professor
                        .getUsuario()
                        .getNome(),

                disciplina.getNome()
        );
    }

    /*
     * Atualiza parcialmente uma turma.
     *
     * Somente os campos recebidos no DTO sao alterados.
     */
    public TurmaDetalheDTO atualizarTurma(
            Integer id,
            AtualizarTurmaDTO dto
    ) {

        // Busca a turma pelo ID.
        Turma turma = turmaRepository
                .findById(id)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Turma não encontrada"
                        )
                );

        // Atualiza o nome somente quando foi informado e nao esta vazio.
        if (
                dto.getNome() != null &&
                        !dto.getNome().isBlank()
        ) {
            turma.setNome(dto.getNome().trim());
        }

        // Atualiza a descricao quando foi informada.
        if (dto.getDescricao() != null) {
            turma.setDescricao(
                    dto.getDescricao().trim()
            );
        }

        // Atualiza a sala quando foi informada.
        if (dto.getSala() != null) {
            turma.setSala(
                    dto.getSala().trim()
            );
        }

        /*
         * Valida as datas quando pelo menos uma delas
         * foi enviada no DTO.
         */
        if (
                dto.getDataInicio() != null ||
                        dto.getDataFimPrevista() != null
        ) {

            /*
             * Usa a nova data inicial quando informada.
             * Caso contrario, preserva a data atual da turma.
             */
            LocalDate dataInicioFinal =
                    dto.getDataInicio() != null
                            ? dto.getDataInicio()
                            : turma.getDataInicio();

            /*
             * Usa a nova data final quando informada.
             * Caso contrario, preserva a data atual.
             */
            LocalDate dataFimFinal =
                    dto.getDataFimPrevista() != null
                            ? dto.getDataFimPrevista()
                            : turma.getDataFimPrevista();

            // Valida o conjunto final de datas.
            validarPeriodoCurso(
                    dataInicioFinal,
                    dataFimFinal
            );

            turma.setDataInicio(dataInicioFinal);
            turma.setDataFimPrevista(dataFimFinal);
        }

        /*
         * Valida os horarios quando pelo menos um deles
         * foi enviado no DTO.
         */
        if (
                dto.getHorarioInicio() != null ||
                        dto.getHorarioFim() != null
        ) {

            // Preserva o horario antigo quando o novo nao foi informado.
            LocalTime horarioInicioFinal =
                    dto.getHorarioInicio() != null
                            ? dto.getHorarioInicio()
                            : turma.getHorarioInicio();

            // Preserva o horario final antigo quando necessario.
            LocalTime horarioFimFinal =
                    dto.getHorarioFim() != null
                            ? dto.getHorarioFim()
                            : turma.getHorarioFim();

            // Valida o conjunto final de horarios.
            validarHorarioTurma(
                    horarioInicioFinal,
                    horarioFimFinal
            );

            turma.setHorarioInicio(
                    horarioInicioFinal
            );
            turma.setHorarioFim(
                    horarioFimFinal
            );
        }

        // Atualiza o status somente quando foi informado.
        if (dto.getAtiva() != null) {
            turma.setAtivo(dto.getAtiva());
        }

        // Salva as alteracoes principais da turma.
        turmaRepository.save(turma);

        /*
         * Atualiza ou cria o vinculo somente quando
         * professorId e disciplinaId foram enviados juntos.
         */
        if (
                dto.getProfessorId() != null &&
                        dto.getDisciplinaId() != null
        ) {

            // Busca o professor informado.
            Professor professor =
                    professorRepository
                            .findById(dto.getProfessorId())
                            .orElseThrow(() ->
                                    new ResponseStatusException(
                                            HttpStatus.NOT_FOUND,
                                            "Professor não encontrado"
                                    )
                            );

            // Busca a disciplina informada.
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
             * Procura o primeiro vinculo da turma.
             *
             * Quando nao existe, cria uma nova entidade.
             */
            TurmaDisciplina turmaDisciplina =
                    turmaDisciplinaRepository
                            .findFirstByTurmaId(id)
                            .orElse(new TurmaDisciplina());

            turmaDisciplina.setTurma(turma);
            turmaDisciplina.setProfessor(professor);
            turmaDisciplina.setDisciplina(disciplina);

            turmaDisciplinaRepository.save(
                    turmaDisciplina
            );
        }

        // Recalcula o total de alunos.
        Integer totalAlunos =
                alunoRepository
                        .findByTurmaId(turma.getId())
                        .size();

        // Busca novamente os vinculos atualizados.
        List<TurmaDisciplina> vinculos =
                turmaDisciplinaRepository
                        .findByTurmaId(turma.getId());

        // Conta professores distintos e nao nulos.
        Integer totalProfessores =
                (int) vinculos.stream()
                        .map(TurmaDisciplina::getProfessor)
                        .filter(java.util.Objects::nonNull)
                        .distinct()
                        .count();

        // Conta disciplinas distintas e nao nulas.
        Integer totalDisciplinas =
                (int) vinculos.stream()
                        .map(TurmaDisciplina::getDisciplina)
                        .filter(java.util.Objects::nonNull)
                        .distinct()
                        .count();

        String professor = null;
        String disciplina = null;

        // Seleciona somente o primeiro vinculo para o resumo.
        TurmaDisciplina primeiroVinculo =
                vinculos.stream()
                        .findFirst()
                        .orElse(null);

        if (primeiroVinculo != null) {

            // Preenche o nome do professor quando o relacionamento existe.
            if (
                    primeiroVinculo.getProfessor() != null &&
                            primeiroVinculo
                                    .getProfessor()
                                    .getUsuario() != null
            ) {
                professor =
                        primeiroVinculo
                                .getProfessor()
                                .getUsuario()
                                .getNome();
            }

            // Preenche o nome da disciplina quando existe.
            if (
                    primeiroVinculo.getDisciplina() != null
            ) {
                disciplina =
                        primeiroVinculo
                                .getDisciplina()
                                .getNome();
            }
        }

        // Monta a resposta final da turma atualizada.
        return new TurmaDetalheDTO(
                turma.getId(),
                turma.getNome(),
                turma.getDescricao(),

                turma.getSala(),
                turma.getDataInicio(),
                turma.getDataFimPrevista(),
                turma.getHorarioInicio(),
                turma.getHorarioFim(),

                totalAlunos,
                totalProfessores,
                totalDisciplinas,

                turma.getAtivo(),
                professor,
                disciplina
        );
    }

    /*
     * Retorna os detalhes completos de uma turma.
     *
     * Inclui:
     * - alunos;
     * - professores;
     * - disciplinas.
     */
    public TurmaDetalhesCompletosDTO detalhesTurma(
            Integer id
    ) {

        // Busca a turma pelo ID.
        Turma turma = turmaRepository
                .findById(id)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Turma não encontrada"
                        )
                );

        /*
         * Busca os alunos da turma e converte cada um
         * para ItemDetalheDTO.
         */
        List<ItemDetalheDTO> alunos =
                alunoRepository
                        .findByTurmaId(id)
                        .stream()
                        .map(aluno ->
                                new ItemDetalheDTO(
                                        aluno.getId(),
                                        aluno.getUsuario().getNome(),
                                        aluno.getUsuario().getAtivo()
                                                ? "Ativo"
                                                : "Inativo"
                                )
                        )
                        .toList();

        // Busca os vinculos da turma.
        List<TurmaDisciplina> vinculos =
                turmaDisciplinaRepository
                        .findByTurmaId(id);

        /*
         * Extrai professores, remove nulos,
         * converte para DTO e elimina repetidos.
         */
        List<ItemDetalheDTO> professores =
                vinculos.stream()
                        .map(v -> v.getProfessor())
                        .filter(professor ->
                                professor != null
                        )
                        .map(professor ->
                                new ItemDetalheDTO(
                                        professor.getId(),
                                        professor.getUsuario().getNome(),
                                        professor.getUsuario().getAtivo()
                                                ? "Ativo"
                                                : "Inativo"
                                )
                        )
                        .distinct()
                        .toList();

        /*
         * Extrai disciplinas, remove nulos,
         * converte para DTO e elimina repetidos.
         */
        List<ItemDetalheDTO> disciplinas =
                vinculos.stream()
                        .map(v -> v.getDisciplina())
                        .filter(disciplina ->
                                disciplina != null
                        )
                        .map(disciplina ->
                                new ItemDetalheDTO(
                                        disciplina.getId(),
                                        disciplina.getNome(),
                                        "Ativa"
                                )
                        )
                        .distinct()
                        .toList();

        return new TurmaDetalhesCompletosDTO(
                turma.getId(),
                turma.getNome(),
                turma.getDescricao(),
                Boolean.TRUE.equals(
                        turma.getAtivo()
                ),
                alunos,
                professores,
                disciplinas
        );
    }

    /*
     * Monta os indicadores institucionais do gestor.
     */
    public ResumoInstitucionalDTO resumoInstitucional() {

        // Conta todos os usuarios ativos.
        Integer usuariosAtivos =
                Math.toIntExact(
                        usuarioRepository.countByAtivoTrue()
                );

        // Conta usuarios ativos com perfil professor.
        Integer professoresAtivos =
                Math.toIntExact(
                        usuarioRepository
                                .countByAtivoTrueAndPerfil_Id(2)
                );

        // Conta usuarios ativos com perfil aluno.
        Integer alunosAtivos =
                Math.toIntExact(
                        usuarioRepository
                                .countByAtivoTrueAndPerfil_Id(1)
                );

        // Conta turmas ativas.
        Integer turmasAtivas =
                Math.toIntExact(
                        turmaRepository.countByAtivoTrue()
                );

        // Conta turmas sem nenhum professor vinculado.
        Integer turmasSemProfessor =
                calcularTurmasSemProfessor();

        // Conta aulas criadas na data atual.
        Integer chamadasHoje =
                Math.toIntExact(
                        aulaRepository.countByDataAula(
                                LocalDate.now()
                        )
                );

        // Conta chamadas que ainda estao abertas.
        Integer chamadasAbertas =
                Math.toIntExact(
                        aulaRepository.countByStatus(
                                StatusAula.EM_ANDAMENTO
                        )
                );

        // Conta chamadas encerradas na data atual.
        Integer chamadasEncerradasHoje =
                Math.toIntExact(
                        aulaRepository
                                .countByDataAulaAndStatus(
                                        LocalDate.now(),
                                        StatusAula.ENCERRADA
                                )
                );

        // Conta presencas registradas hoje.
        Integer presencasHoje =
                Math.toIntExact(
                        presencaRepository
                                .countPresencasHoje()
                );

        // Conta alunos ausentes hoje.
        Integer alunosAusentesHoje =
                Math.toIntExact(
                        presencaRepository
                                .countAusentesHoje()
                );

        // Usa a quantidade de alertas como baixa frequencia.
        Integer baixaFrequencia =
                presencaRepository
                        .buscarAlertasEvasao()
                        .size();

        return new ResumoInstitucionalDTO(
                usuariosAtivos,
                professoresAtivos,
                alunosAtivos,
                turmasAtivas,
                turmasSemProfessor,
                chamadasHoje,
                chamadasAbertas,
                chamadasEncerradasHoje,
                presencasHoje,
                alunosAusentesHoje,
                baixaFrequencia
        );
    }

    /*
     * Conta quantas turmas nao possuem professor vinculado.
     */
    private Integer calcularTurmasSemProfessor() {

        return Math.toIntExact(
                turmaRepository.findAll()
                        .stream()

                        /*
                         * Mantem somente turmas em que nenhum vinculo
                         * possui professor preenchido.
                         */
                        .filter(turma ->
                                turmaDisciplinaRepository
                                        .findByTurmaId(
                                                turma.getId()
                                        )
                                        .stream()
                                        .noneMatch(vinculo ->
                                                vinculo.getProfessor() != null
                                        )
                        )
                        .count()
        );
    }

    // =====================================================
    // DISCIPLINAS
    // =====================================================

    /*
     * Cadastra uma nova disciplina.
     *
     * Valida nome vazio e duplicidade ignorando maiusculas.
     */
    public DisciplinaDTO cadastrarDisciplina(
            DisciplinaDTO dto
    ) {

        String nome =
                validarNomeDisciplina(
                        dto.getNome()
                );

        String sigla =
                validarSiglaDisciplina(
                        dto.getSigla()
                );

        disciplinaRepository
                .findByNomeIgnoreCase(nome)
                .ifPresent(disciplina -> {
                    throw new ResponseStatusException(
                            HttpStatus.BAD_REQUEST,
                            "Disciplina já cadastrada"
                    );
                });

        disciplinaRepository
                .findBySiglaIgnoreCase(sigla)
                .ifPresent(disciplina -> {
                    throw new ResponseStatusException(
                            HttpStatus.BAD_REQUEST,
                            "Já existe uma disciplina com essa sigla"
                    );
                });

        Disciplina disciplina =
                new Disciplina();

        disciplina.setNome(nome);
        disciplina.setSigla(sigla);

        Disciplina salva =
                disciplinaRepository.save(
                        disciplina
                );

        return new DisciplinaDTO(
                salva.getId(),
                salva.getNome(),
                salva.getSigla()
        );
    }

    /*
     * Edita uma disciplina existente.
     *
     * Alem de validar o nome, impede duplicidade.
     */
    public DisciplinaDTO editarDisciplina(
            Integer id,
            DisciplinaDTO dto
    ) {

        Disciplina disciplina =
                disciplinaRepository
                        .findById(id)
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Disciplina não encontrada"
                                )
                        );

        String nome =
                validarNomeDisciplina(
                        dto.getNome()
                );

        String sigla =
                validarSiglaDisciplina(
                        dto.getSigla()
                );

        disciplinaRepository
                .findByNomeIgnoreCase(nome)
                .ifPresent(disciplinaExistente -> {
                    if (
                            !disciplinaExistente
                                    .getId()
                                    .equals(id)
                    ) {
                        throw new ResponseStatusException(
                                HttpStatus.BAD_REQUEST,
                                "Já existe uma disciplina com esse nome"
                        );
                    }
                });

        disciplinaRepository
                .findBySiglaIgnoreCase(sigla)
                .ifPresent(disciplinaExistente -> {
                    if (
                            !disciplinaExistente
                                    .getId()
                                    .equals(id)
                    ) {
                        throw new ResponseStatusException(
                                HttpStatus.BAD_REQUEST,
                                "Já existe uma disciplina com essa sigla"
                        );
                    }
                });

        disciplina.setNome(nome);
        disciplina.setSigla(sigla);

        Disciplina salva =
                disciplinaRepository.save(
                        disciplina
                );

        return new DisciplinaDTO(
                salva.getId(),
                salva.getNome(),
                salva.getSigla()
        );
    }

    /*
     * Valida o nome da disciplina.
     *
     * O nome nao pode ser nulo nem vazio.
     */
    private String validarNomeDisciplina(
            String nome
    ) {

        if (
                nome == null ||
                        nome.isBlank()
        ) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Nome da disciplina é obrigatório"
            );
        }

        // Remove espacos antes e depois do nome.
        return nome.trim();
    }

    private String validarSiglaDisciplina(
            String sigla
    ) {

        if (
                sigla == null ||
                        sigla.isBlank()
        ) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Sigla da disciplina é obrigatória"
            );
        }

        String siglaNormalizada =
                sigla.trim()
                        .toUpperCase();

        if (siglaNormalizada.length() > 10) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "A sigla deve possuir no máximo 10 caracteres"
            );
        }

        return siglaNormalizada;
    }



    /*
     * Valida o periodo de inicio e fim da turma.
     *
     * As duas datas podem estar ausentes,
     * mas nao e permitido informar apenas uma.
     */
    private void validarPeriodoCurso(
            LocalDate dataInicio,
            LocalDate dataFimPrevista
    ) {

        // Quando as duas datas estao vazias, nao existe periodo para validar.
        if (
                dataInicio == null &&
                        dataFimPrevista == null
        ) {
            return;
        }

        // Impede o envio de apenas uma das datas.
        if (
                dataInicio == null ||
                        dataFimPrevista == null
        ) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Informe a data de início e a data prevista de término"
            );
        }

        // A data final precisa ser posterior a data inicial.
        if (
                !dataFimPrevista.isAfter(dataInicio)
        ) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "A data prevista de término deve ser posterior à data de início"
            );
        }
    }

    /*
     * Valida o horario inicial e final da turma.
     *
     * Os dois horarios podem estar ausentes,
     * mas nao e permitido informar apenas um.
     */
    private void validarHorarioTurma(
            LocalTime horarioInicio,
            LocalTime horarioFim
    ) {

        // Quando os dois horarios estao vazios, nao existe horario para validar.
        if (
                horarioInicio == null &&
                        horarioFim == null
        ) {
            return;
        }

        // Impede o envio de apenas um dos horarios.
        if (
                horarioInicio == null ||
                        horarioFim == null
        ) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Informe o horário de início e o horário de término"
            );
        }

        // O horario final precisa ser posterior ao inicial.
        if (
                !horarioFim.isAfter(horarioInicio)
        ) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "O horário de término deve ser posterior ao horário de início"
            );
        }
    }

    // =====================================================
// PERFIL
// =====================================================

    public GestorPerfilDTO buscarPerfil(
            Integer usuarioId
    ) {

        Usuario usuario =
                buscarUsuarioGestor(usuarioId);

        Integer totalUsuariosAtivos =
                Math.toIntExact(
                        usuarioRepository.countByAtivoTrue()
                );

        Integer totalAlunosAtivos =
                Math.toIntExact(
                        usuarioRepository
                                .countByAtivoTrueAndPerfil_Id(1)
                );

        Integer totalProfessoresAtivos =
                Math.toIntExact(
                        usuarioRepository
                                .countByAtivoTrueAndPerfil_Id(2)
                );

        Integer totalTurmasAtivas =
                Math.toIntExact(
                        turmaRepository.countByAtivoTrue()
                );

        Integer totalDisciplinas =
                Math.toIntExact(
                        disciplinaRepository.count()
                );

        Integer ocorrenciasPendentes =
                Math.toIntExact(
                        ocorrenciaRepository.countByStatus(
                                StatusOcorrencia.PENDENTE
                        )
                );

        String perfil =
                usuario.getPerfil() != null
                        ? usuario.getPerfil().getNome()
                        : "gestor";

        return new GestorPerfilDTO(
                usuario.getId(),
                usuario.getNome(),
                usuario.getEmail(),
                perfil,
                Boolean.TRUE.equals(usuario.getAtivo()),
                totalUsuariosAtivos,
                totalAlunosAtivos,
                totalProfessoresAtivos,
                totalTurmasAtivas,
                totalDisciplinas,
                ocorrenciasPendentes
        );
    }

    public List<TurmaVinculoDTO> listarVinculosTurma(
            Integer turmaId
    ) {

        Turma turma =
                turmaRepository
                        .findById(turmaId)
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Turma não encontrada"
                                )
                        );

        return turmaDisciplinaRepository
                .findByTurmaId(turma.getId())
                .stream()
                .map(vinculo -> {

                    Professor professor =
                            vinculo.getProfessor();

                    Disciplina disciplina =
                            vinculo.getDisciplina();

                    return new TurmaVinculoDTO(
                            vinculo.getId(),

                            turma.getId(),
                            turma.getNome(),

                            disciplina != null
                                    ? disciplina.getId()
                                    : null,

                            disciplina != null
                                    ? disciplina.getNome()
                                    : "Disciplina não informada",

                            professor != null
                                    ? professor.getId()
                                    : null,

                            professor != null
                                    && professor.getUsuario() != null
                                    ? professor.getUsuario().getNome()
                                    : "Professor não informado"
                    );
                })
                .toList();
    }
}