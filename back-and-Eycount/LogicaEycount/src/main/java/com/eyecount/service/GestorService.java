package com.eyecount.service;

import com.eyecount.dto.alerta.AlertaEvasaoDTO;
import com.eyecount.dto.dashboard.*;
import com.eyecount.dto.disciplina.DisciplinaDTO;
import com.eyecount.dto.turma.TurmaResumoDTO;
import com.eyecount.dto.turma.request.AtualizarTurmaDTO;
import com.eyecount.dto.turma.request.CriarTurmaDTO;
import com.eyecount.dto.turma.response.ItemDetalheDTO;
import com.eyecount.dto.turma.response.TurmaDetalheDTO;
import com.eyecount.dto.turma.response.TurmaDetalhesCompletosDTO;
import com.eyecount.dto.usuario.*;
import com.eyecount.model.*;
import com.eyecount.repository.*;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

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
    private final AulaRepository aulaRepository;

    // =====================================================
    // SEGURANÇA
    // =====================================================
    public void validarGestor(Integer usuarioId) {
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.UNAUTHORIZED,
                                "Usuário não encontrado"
                        )
                );

        if (usuario.getPerfil().getId() != 3) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Acesso negado"
            );
        }
    }

    // =====================================================
    // DASHBOARD
    // =====================================================
    public GestorDashboardDTO dashboard() {
        List<AlertaEvasaoDTO> alertas = presencaRepository.buscarAlertasEvasao();
        Double frequenciaGlobal = calcularFrequenciaGeral();
        Integer alunosRisco = alertas.size();
        
        Integer ocorrenciasPendentes = Math.toIntExact(
                        ocorrenciaRepository.countByStatus(
                                StatusOcorrencia.PENDENTE
                        ));

        Integer ocorrenciasEmAnalise = Math.toIntExact(
                ocorrenciaRepository.countByStatus(
                        StatusOcorrencia.EM_ANALISE
                ));

        Integer ocorrenciasResolvidas = Math.toIntExact(
                ocorrenciaRepository.countByStatus(
                                StatusOcorrencia.RESOLVIDA
                        ));

        Integer ocorrenciasCanceladas = Math.toIntExact(
                ocorrenciaRepository.countByStatus(
                                StatusOcorrencia.CANCELADA
                        ));

        List<AtividadeRecenteDTO> atividades = montarAtividadesRecentes();

        List<FrequenciaTurmaDTO> frequenciaTurmas = presencaRepository.buscarFrequenciaTurmas();

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

    public List<DesempenhoDashboardDTO> desempenhoDashboard(
            String tipo,
            String indicador,
            Integer turmaId
    ) {
        String tipoNormalizado =
                tipo == null ? "" : tipo.toLowerCase();

        String indicadorNormalizado =
                indicador == null ? "" : indicador.toLowerCase();

        return switch (tipoNormalizado) {
            case "turma" -> desempenhoPorTurma(indicadorNormalizado);
            case "aluno" -> desempenhoPorAluno(indicadorNormalizado, turmaId);
            case "professor" -> desempenhoPorProfessor(indicadorNormalizado);

            default -> throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Tipo de desempenho inválido"
            );
        };
    }

    private List<DesempenhoDashboardDTO> desempenhoPorTurma(
            String indicador
    ) {
        List<FrequenciaTurmaDTO> turmas =
                presencaRepository.buscarFrequenciaTurmas();

        return switch (indicador) {
            case "presenca" -> turmas.stream()
                    .map(turma -> new DesempenhoDashboardDTO(
                            turma.getTurma(),
                            arredondar(turma.getFrequencia())
                    ))
                    .toList();

            case "faltas" -> turmas.stream()
                    .map(turma -> {
                        Double frequencia = turma.getFrequencia();

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

    private List<DesempenhoDashboardDTO> desempenhoPorAluno(
            String indicador,
            Integer turmaId
    ) {
        List<Aluno> alunos;

        if (turmaId != null) {
            alunos = alunoRepository.findByTurmaId(turmaId);
        } else {
            alunos = alunoRepository.findAll();
        }

        return alunos.stream()
                .map(aluno -> {
                    List<Presenca> presencas =
                            presencaRepository.findByAlunoId(aluno.getId());

                    double valor =
                            calcularIndicadorAluno(
                                    presencas,
                                    indicador
                            );

                    return new DesempenhoDashboardDTO(
                            aluno.getUsuario().getNome(),
                            valor
                    );
                })
                .toList();
    }

    private double calcularIndicadorAluno(
            List<Presenca> presencas,
            String indicador
    ) {
        if (presencas.isEmpty()) {
            return 0.0;
        }

        long presentes = presencas.stream()
                .filter(p -> p.getStatus() == StatusPresenca.PRESENTE)
                .count();

        long faltas = presencas.stream()
                .filter(p -> p.getStatus() == StatusPresenca.AUSENTE)
                .count();

        long atrasos = presencas.stream()
                .filter(p -> p.getStatus() == StatusPresenca.ATRASADO)
                .count();

        return switch (indicador) {
            case "presenca" -> arredondar((presentes * 100.0) / presencas.size());

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
    private double arredondar(Double valor) {
        if (valor == null) {
            return 0.0;
        }

        return Math.round(valor * 10.0) / 10.0;
    }

    private List<DesempenhoDashboardDTO> desempenhoPorProfessor(
            String indicador
    ) {
        List<Professor> professores =
                professorRepository.findAll();

        return professores.stream()
                .map(professor -> {
                    Double valor = switch (indicador) {
                        case "aulas" -> contarAulasProfessor(professor);
                        case "turmas" -> contarTurmasProfessor(professor);
                        case "ocorrencias" -> contarOcorrenciasProfessor(professor);

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

    private Double contarAulasProfessor(Professor professor) {
        return aulaRepository
                .countByTurmaDisciplina_Professor_Id(professor.getId())
                .doubleValue();
    }

    private Double contarTurmasProfessor(Professor professor) {
        return (double) turmaDisciplinaRepository
                .findByProfessorId(professor.getId())
                .size();
    }

    private Double contarOcorrenciasProfessor(Professor professor) {
        return (double) ocorrenciaRepository
                .findByProfessor_Id(professor.getId())
                .size();
    }

    private double calcularFrequenciaGeral() {

        List<Presenca> presencas =
                presencaRepository.findAll();

        if (presencas.isEmpty()) {
            return 0.0;
        }

        long presentes = presencas.stream()
                .filter(p -> p.getStatus() == StatusPresenca.PRESENTE)
                .count();

        double frequencia =
                (presentes * 100.0) / presencas.size();

        return Math.round(frequencia * 10.0) / 10.0;
    }

    private List<AtividadeRecenteDTO> montarAtividadesRecentes() {
        List<AtividadeRecenteDTO> atividades = new ArrayList<>();

        // =====================================================
        // OCORRENCIAS REAIS
        // =====================================================
        ocorrenciaRepository.findTop10ByOrderByDataOcorrenciaDesc().forEach(ocorrencia -> {
                    atividades.add(
                            new AtividadeRecenteDTO(
                                    ocorrencia.getTitulo(),
                                    ocorrencia.getDescricao(),
                                    "ocorrencia",
                                    ocorrencia.getDataOcorrencia()
                      ));
                });
        if (atividades.isEmpty()) {
            atividades.add(new AtividadeRecenteDTO("Sistema iniciado", "Nenhuma atividade encontrada", "sistema", LocalDateTime.now())
            );
        }

        return atividades;
    }

    // =====================================================
    // USUARIOS
    // =====================================================
    public List<UsuarioDTO> listarUsuarios() {
        return usuarioRepository.findAll()
                .stream()
                .map(this::converterUsuarioDTO)
                .toList();
    }

    public UsuarioDTO cadastrarUsuario(
            CriarUsuarioDTO dto
    ) {
        if (dto.getPerfilId() == 3) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Não é permitido cadastrar outro gestor"
            );
        }

        if (usuarioRepository.findByEmail(dto.getEmail()).isPresent()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Email já cadastrado"
            );
        }

        Perfil perfil = perfilRepository.findById(dto.getPerfilId())
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Perfil não encontrado"
                        )
                );

        Usuario usuario = new Usuario();
        usuario.setNome(dto.getNome());
        usuario.setEmail(dto.getEmail());
        usuario.setSenha(dto.getSenha());
        usuario.setPerfil(perfil);
        usuario.setAtivo(true);

        Usuario salvo = usuarioRepository.save(usuario);
        return converterUsuarioDTO(salvo);
    }

    public UsuarioDTO cadastrarUsuarioCompleto(
            CriarUsuarioCompletoDTO dto
    ) {
        UsuarioDTO usuarioDTO = cadastrarUsuario( new CriarUsuarioDTO(
                dto.getNome(),
                dto.getEmail(),
                dto.getSenha(),
                dto.getPerfilId()
                )
        );

        Usuario usuario = usuarioRepository
                .findById(usuarioDTO.getId())
                .orElseThrow();

        if (dto.getPerfilId() == 1) {
            Turma turma = turmaRepository.findById(dto.getTurmaId())
                    .orElseThrow(() ->
                            new ResponseStatusException(
                                    HttpStatus.NOT_FOUND,
                                    "Turma não encontrada"
                            )
                    );

            Aluno aluno = new Aluno();
            aluno.setUsuario(usuario);
            aluno.setTurma(turma);
            aluno.setMatricula(dto.getMatricula());

            alunoRepository.save(aluno);
        }

        if (dto.getPerfilId() == 2) {
            Professor professor = new Professor();
            professor.setUsuario(usuario);
            professor.setEspecialidade(dto.getEspecialidade());

            professorRepository.save(professor);
        }

        return usuarioDTO;
    }

    public Usuario editarUsuario(
            Integer id,
            UsuarioEditarDTO dto
    ) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Usuário não encontrado"
                        )
                );

        if (usuario.getPerfil().getId() == 3) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Não é permitido editar outro gestor"
            );
        }

        usuario.setNome(dto.getNome());
        usuario.setEmail(dto.getEmail());
        Usuario usuarioSalvo = usuarioRepository.save(usuario);

        // ATUALIZA TURMA DO ALUNO
        if (dto.getTurmaId() != null && usuario.getPerfil().getId() == 1) {
            Aluno aluno = alunoRepository
                    .findByUsuarioId(usuario.getId())
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.NOT_FOUND,
                            "Aluno não encontrado"
                            )
                    );

            Turma turma = turmaRepository.findById(dto.getTurmaId())
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.NOT_FOUND,
                            "Turma não encontrada"
                            )
                    );

            aluno.setTurma(turma);
            alunoRepository.save(aluno);
        }

        // ATUALIZA ESPECIALIDADE DO PROFESSOR
        if (usuario.getPerfil().getId() == 2 && dto.getEspecialidade() != null) {
            Professor professor = professorRepository
                            .findByUsuarioId(usuario.getId())
                            .orElseThrow(() ->
                                    new ResponseStatusException(
                                            HttpStatus.NOT_FOUND,
                                            "Professor não encontrado"
                                    )
                            );

            professor.setEspecialidade(dto.getEspecialidade());
            professorRepository.save(professor);
        }

        return usuarioSalvo;
    }

    public Usuario alterarStatusUsuario(
            Integer id
    ) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Usuário não encontrado"
                        )
                );

        usuario.setAtivo(!usuario.getAtivo());
        return usuarioRepository.save(usuario);
    }

    public UsuarioDetalhesDTO detalhesUsuario(Integer id) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Usuário não encontrado"
                ));

        UsuarioDetalhesDTO dto = new UsuarioDetalhesDTO();
        dto.setId(usuario.getId());
        dto.setNome(usuario.getNome());
        dto.setEmail(usuario.getEmail());
        dto.setPerfil(usuario.getPerfil().getNome());

        if (usuario.getPerfil().getId() == 1) {
            alunoRepository.findByUsuarioId(usuario.getId())
                    .ifPresent(aluno -> {
                        dto.setMatricula(aluno.getMatricula());

                        if (aluno.getTurma() != null) {
                            dto.setTurma(aluno.getTurma().getNome());
                        }

                        List<Presenca> presencas =
                                presencaRepository.findByAlunoId(aluno.getId());

                        if (presencas.isEmpty()) {
                            dto.setFrequencia(0.0);
                        } else {
                            long presentes = presencas.stream()
                                    .filter(p -> p.getStatus() == StatusPresenca.PRESENTE)
                                    .count();

                            double frequencia = (presentes * 100.0) / presencas.size();

                            dto.setFrequencia(Math.round(frequencia * 10.0) / 10.0);
                        }
                    });
        }

        if (usuario.getPerfil().getId() == 2) {
            professorRepository.findByUsuarioId(usuario.getId())
                    .ifPresent(professor -> {
                        dto.setEspecialidade(professor.getEspecialidade());
                    });
        }

        return dto;
    }

    public List<ProfessorResumoDTO> listarProfessores() {
        return professorRepository.findAll()
                .stream()
                .map(professor -> new ProfessorResumoDTO(
                        professor.getId(),
                        professor.getUsuario().getNome(),
                        professor.getUsuario().getEmail(),
                        professor.getEspecialidade()
                ))
                .toList();
    }

    // =====================================================
    // DISCIPLINAS
    // =====================================================

    public List<DisciplinaDTO> listarDisciplinasDTO() {
        return disciplinaRepository.findAll()
                .stream()
                .map(disciplina -> new DisciplinaDTO(
                        disciplina.getId(),
                        disciplina.getNome()
                ))
                .toList();
    }

    // =====================================================
    // ALERTAS
    // =====================================================
    public List<AlertaEvasaoDTO> listarAlertas() {
        return presencaRepository.buscarAlertasEvasao();
    }

    // =====================================================
    // CONVERSORES
    // =====================================================
    private UsuarioDTO converterUsuarioDTO(
            Usuario usuario
    ) {
        Integer turmaId = null;
        if (usuario.getPerfil().getId() == 1) {
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

    public List<TurmaDetalheDTO> listarTurmas() {
        return turmaRepository.findAll()
                .stream()
                .map(turma -> {

                    Integer totalAlunos =
                            alunoRepository.findByTurmaId(
                                    turma.getId()
                            ).size();

                    List<TurmaDisciplina> vinculos =
                            turmaDisciplinaRepository.findByTurmaId(
                                    turma.getId()
                            );

                    Integer totalProfessores =
                            (int) vinculos.stream()
                                    .map(TurmaDisciplina::getProfessor)
                                    .filter(java.util.Objects::nonNull)
                                    .distinct()
                                    .count();

                    Integer totalDisciplinas =
                            (int) vinculos.stream()
                                    .map(TurmaDisciplina::getDisciplina)
                                    .filter(java.util.Objects::nonNull)
                                    .distinct()
                                    .count();

                    String professor = null;
                    String disciplina = null;

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
                            totalAlunos,
                            totalProfessores,
                            totalDisciplinas,
                            true,
                            professor,
                            disciplina
                    );
                })
                .toList();
    }

    public List<TurmaResumoDTO> listarTurmasResumo() {
        return turmaRepository.findAll()
                .stream()
                .map(turma -> new TurmaResumoDTO(
                        turma.getId(),
                        turma.getNome()
                ))
                .toList();
    }


    public TurmaDetalheDTO cadastrarTurma(CriarTurmaDTO dto) {
        Turma turma = new Turma();

        turma.setNome(dto.getNome());
        turma.setDescricao(dto.getDescricao());

        Turma salva = turmaRepository.save(turma);

        return new TurmaDetalheDTO(
                salva.getId(),
                salva.getNome(),
                salva.getDescricao(),
                0,
                0,
                0,
                true,
                null,
                null
        );
    }

    public TurmaDetalheDTO atualizarTurma(
            Integer id,
            AtualizarTurmaDTO dto
    ) {
        Turma turma = turmaRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Turma não encontrada"
                ));

        turma.setNome(dto.getNome());
        turma.setDescricao(dto.getDescricao());

        turmaRepository.save(turma);

        // VÍNCULO
        if (dto.getProfessorId() != null && dto.getDisciplinaId() != null) {
            Professor professor = professorRepository.findById(dto.getProfessorId()).orElseThrow();

            Disciplina disciplina = disciplinaRepository.findById(dto.getDisciplinaId()).orElseThrow();

            TurmaDisciplina turmaDisciplina = turmaDisciplinaRepository.findFirstByTurmaId(id).orElse(new TurmaDisciplina());

            turmaDisciplina.setTurma(turma);
            turmaDisciplina.setProfessor(professor);
            turmaDisciplina.setDisciplina(disciplina);
            turmaDisciplinaRepository.save(turmaDisciplina);
        }

        Integer totalAlunos = alunoRepository.findByTurmaId(turma.getId()).size();

        List<TurmaDisciplina> vinculos = turmaDisciplinaRepository.findByTurmaId(turma.getId());

        Integer totalProfessores = (int) vinculos.stream()
                        .map(TurmaDisciplina::getProfessor)
                        .filter(java.util.Objects::nonNull)
                        .distinct()
                        .count();

        Integer totalDisciplinas = (int) vinculos.stream()
                        .map(TurmaDisciplina::getDisciplina)
                        .filter(java.util.Objects::nonNull)
                        .distinct()
                        .count();

        String professor = null;
        String disciplina = null;

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
                totalAlunos,
                totalProfessores,
                totalDisciplinas,
                true,
                professor,
                disciplina
        );
    }

    public TurmaDetalhesCompletosDTO detalhesTurma(Integer id) {
        Turma turma = turmaRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Turma não encontrada"
                ));

        List<ItemDetalheDTO> alunos = alunoRepository.findByTurmaId(id)
                .stream()
                .map(aluno -> new ItemDetalheDTO(
                        aluno.getId(),
                        aluno.getUsuario().getNome(),
                        aluno.getUsuario().getAtivo() ? "Ativo" : "Inativo"
                ))
                .toList();

        List<TurmaDisciplina> vinculos = turmaDisciplinaRepository.findByTurmaId(id);

        List<ItemDetalheDTO> professores = vinculos.stream()
                .map(v -> v.getProfessor())
                .filter(professor -> professor != null)
                .map(professor -> new ItemDetalheDTO(
                        professor.getId(),
                        professor.getUsuario().getNome(),
                        professor.getUsuario().getAtivo() ? "Ativo" : "Inativo"
                ))
                .distinct()
                .toList();

        List<ItemDetalheDTO> disciplinas = vinculos.stream()
                .map(v -> v.getDisciplina())
                .filter(disciplina -> disciplina != null)
                .map(disciplina -> new ItemDetalheDTO(
                        disciplina.getId(),
                        disciplina.getNome(),
                        "Ativa"
                ))
                .distinct().toList();

        return new TurmaDetalhesCompletosDTO(
                turma.getId(),
                turma.getNome(),
                turma.getDescricao(),
                true,
                alunos,
                professores,
                disciplinas
        );
    }

    public ResumoInstitucionalDTO resumoInstitucional() {
        Integer usuariosAtivos =
                Math.toIntExact(usuarioRepository.countByAtivoTrue());

        Integer professoresAtivos =
                Math.toIntExact(usuarioRepository.countByAtivoTrueAndPerfil_Id(2));

        Integer alunosAtivos =
                Math.toIntExact(usuarioRepository.countByAtivoTrueAndPerfil_Id(1));

        Integer turmasAtivas =
                Math.toIntExact(turmaRepository.count());

        Integer turmasSemProfessor =
                calcularTurmasSemProfessor();

        Integer chamadasHoje =
                Math.toIntExact(
                        aulaRepository.countByDataAula(
                                java.time.LocalDate.now()
                        )
                );

        Integer chamadasAbertas =
                Math.toIntExact(
                        aulaRepository.countByStatus(
                                StatusAula.EM_ANDAMENTO
                        )
                );

        Integer chamadasEncerradasHoje =
                Math.toIntExact(
                        aulaRepository.countByDataAulaAndStatus(
                                java.time.LocalDate.now(),
                                StatusAula.ENCERRADA
                        )
                );

        Integer presencasHoje =
                Math.toIntExact(presencaRepository.countPresencasHoje());

        Integer alunosAusentesHoje =
                Math.toIntExact(presencaRepository.countAusentesHoje());

        Integer baixaFrequencia =
                presencaRepository.buscarAlertasEvasao().size();

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

    private Integer calcularTurmasSemProfessor() {
        return Math.toIntExact(
                turmaRepository.findAll()
                        .stream()
                        .filter(turma ->
                                turmaDisciplinaRepository
                                        .findByTurmaId(turma.getId())
                                        .stream()
                                        .noneMatch(vinculo ->
                                                vinculo.getProfessor() != null
                                        )
                        )
                        .count()
        );
    }

    //==========================================
    //DISCIPLINAS
    //==========================================
    public DisciplinaDTO cadastrarDisciplina(DisciplinaDTO dto) {
        String nome = validarNomeDisciplina(dto.getNome());

        disciplinaRepository.findByNomeIgnoreCase(nome)
                .ifPresent(disciplina -> {
                    throw new ResponseStatusException(
                            HttpStatus.BAD_REQUEST,
                            "Disciplina já cadastrada"
                    );
                });

        Disciplina disciplina = new Disciplina();
        disciplina.setNome(nome);

        Disciplina salva = disciplinaRepository.save(disciplina);

        return new DisciplinaDTO(
                salva.getId(),
                salva.getNome()
        );
    }

    public DisciplinaDTO editarDisciplina(
            Integer id,
            DisciplinaDTO dto
    ) {
        Disciplina disciplina = disciplinaRepository.findById(id)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Disciplina não encontrada"
                        )
                );

        String nome = validarNomeDisciplina(dto.getNome());

        disciplinaRepository.findByNomeIgnoreCase(nome)
                .ifPresent(disciplinaExistente -> {
                    if (!disciplinaExistente.getId().equals(id)) {
                        throw new ResponseStatusException(
                                HttpStatus.BAD_REQUEST,
                                "Já existe uma disciplina com esse nome"
                        );
                    }
                });

        disciplina.setNome(nome);

        Disciplina salva = disciplinaRepository.save(disciplina);

        return new DisciplinaDTO(
                salva.getId(),
                salva.getNome()
        );
    }

    private String validarNomeDisciplina(String nome) {
        if (nome == null || nome.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Nome da disciplina é obrigatório"
            );
        }

        return nome.trim();
    }
}