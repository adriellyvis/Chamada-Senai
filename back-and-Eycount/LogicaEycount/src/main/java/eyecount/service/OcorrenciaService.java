package eyecount.service;

import eyecount.dto.ocorrencia.OcorrenciaDTO;
import eyecount.dto.ocorrencia.OcorrenciaMetricasDTO;
import eyecount.model.*;
import eyecount.repository.AlunoRepository;
import eyecount.repository.OcorrenciaRepository;
import eyecount.repository.ProfessorRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

/*
 * Servico responsavel pelas regras de negocio das ocorrencias.
 *
 * Esta classe permite:
 * - cadastrar ocorrencias;
 * - cadastrar ocorrencias em nome do professor logado;
 * - listar ocorrencias;
 * - filtrar por aluno, professor, status e tipo;
 * - alterar o status;
 * - exigir resposta do gestor ao finalizar;
 * - calcular metricas;
 * - permitir edicao pelo professor responsavel.
 */
@Service
public class OcorrenciaService {

    // Repository usado para consultar, salvar e contar ocorrencias.
    private final OcorrenciaRepository ocorrenciaRepository;

    // Repository usado para buscar os alunos relacionados.
    private final AlunoRepository alunoRepository;

    // Repository usado para buscar os professores relacionados.
    private final ProfessorRepository professorRepository;

    /*
     * Construtor usado pelo Spring para injetar os repositories.
     *
     * Como existe apenas este construtor, nao e necessario
     * usar a anotacao @Autowired.
     */
    public OcorrenciaService(
            OcorrenciaRepository ocorrenciaRepository,
            AlunoRepository alunoRepository,
            ProfessorRepository professorRepository
    ) {
        this.ocorrenciaRepository = ocorrenciaRepository;
        this.alunoRepository = alunoRepository;
        this.professorRepository = professorRepository;
    }

    // =====================================================
    // CADASTRAR
    // =====================================================

    /*
     * Cadastra uma ocorrencia usando o professor logado.
     *
     * O metodo localiza o professor pelo usuarioId,
     * adiciona professorId no DTO e reutiliza cadastrar.
     */
    public OcorrenciaDTO cadastrarPorProfessor(
            Integer usuarioId,
            OcorrenciaDTO dto
    ) {

        /*
         * Busca o professor pelo ID do usuario logado.
         *
         * Caso nao exista professor vinculado ao usuario,
         * retorna erro 404.
         */
        Professor professor =
                professorRepository
                        .findByUsuarioId(usuarioId)
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Professor não encontrado"
                                )
                        );

        // Define no DTO qual professor esta criando a ocorrencia.
        dto.setProfessorId(professor.getId());

        // Reutiliza o metodo geral de cadastro.
        return cadastrar(dto);
    }

    /*
     * Cadastra uma nova ocorrencia.
     *
     * O aluno e o professor sao vinculados somente
     * quando seus IDs foram informados no DTO.
     */
    public OcorrenciaDTO cadastrar(
            OcorrenciaDTO dto
    ) {

        // Cria uma nova entidade ainda nao salva no banco.
        Ocorrencia ocorrencia = new Ocorrencia();

        /*
         * Quando alunoId foi informado,
         * busca o aluno e cria o relacionamento.
         */
        if (dto.getAlunoId() != null) {

            Aluno aluno =
                    alunoRepository
                            .findById(dto.getAlunoId())
                            .orElseThrow(() ->
                                    new ResponseStatusException(
                                            HttpStatus.NOT_FOUND,
                                            "Aluno não encontrado"
                                    )
                            );

            ocorrencia.setAluno(aluno);
        }

        /*
         * Quando professorId foi informado,
         * busca o professor e cria o relacionamento.
         */
        if (dto.getProfessorId() != null) {

            Professor professor =
                    professorRepository
                            .findById(dto.getProfessorId())
                            .orElseThrow(() ->
                                    new ResponseStatusException(
                                            HttpStatus.NOT_FOUND,
                                            "Professor não encontrado"
                                    )
                            );

            ocorrencia.setProfessor(professor);
        }

        // Define o titulo da ocorrencia.
        ocorrencia.setTitulo(dto.getTitulo());

        // Define a descricao detalhada.
        ocorrencia.setDescricao(dto.getDescricao());

        /*
         * Converte o texto recebido para o enum GravidadeOcorrencia.
         *
         * O texto precisa corresponder exatamente a um valor do enum.
         */
        ocorrencia.setGravidade(
                GravidadeOcorrencia.valueOf(
                        dto.getGravidade()
                )
        );

        /*
         * Converte o texto recebido para o enum TipoOcorrencia.
         *
         * O texto precisa corresponder exatamente a um valor do enum.
         */
        ocorrencia.setTipo(
                TipoOcorrencia.valueOf(
                        dto.getTipo()
                )
        );

        // Toda nova ocorrencia comeca com status PENDENTE.
        ocorrencia.setStatus(
                StatusOcorrencia.PENDENTE
        );

        // Salva a ocorrencia no banco.
        Ocorrencia salva =
                ocorrenciaRepository.save(ocorrencia);

        // Converte a entidade salva para DTO.
        return converter(salva);
    }

    // =====================================================
    // LISTAGENS
    // =====================================================

    /*
     * Lista todas as ocorrencias cadastradas.
     */
    public List<OcorrenciaDTO> listar() {

        return ocorrenciaRepository
                // Busca todas as ocorrencias.
                .findAll()

                // Transforma a lista em um fluxo.
                .stream()

                // Converte cada entidade em OcorrenciaDTO.
                .map(this::converter)

                // Monta a lista final.
                .toList();
    }

    /*
     * Lista ocorrencias de um aluno especifico.
     *
     * O filtro utiliza o ID do aluno relacionado.
     */
    public List<OcorrenciaDTO> listarPorAluno(
            Integer alunoId
    ) {

        return ocorrenciaRepository

                // Busca somente ocorrencias do aluno informado.
                .findByAluno_Id(alunoId)

                .stream()
                .map(this::converter)
                .toList();
    }

    /*
     * Lista ocorrencias criadas por um professor especifico.
     *
     * O filtro utiliza o ID do professor relacionado.
     */
    public List<OcorrenciaDTO> listarPorProfessor(
            Integer professorId
    ) {

        return ocorrenciaRepository

                // Busca somente ocorrencias do professor informado.
                .findByProfessor_Id(professorId)

                .stream()
                .map(this::converter)
                .toList();
    }

    /*
     * Lista ocorrencias por status.
     *
     * O texto recebido e convertido para StatusOcorrencia.
     */
    public List<OcorrenciaDTO> listarPorStatus(
            String status
    ) {

        return ocorrenciaRepository

                /*
                 * Converte o texto para enum e filtra
                 * somente ocorrencias com esse status.
                 */
                .findByStatus(
                        StatusOcorrencia.valueOf(status)
                )

                .stream()
                .map(this::converter)
                .toList();
    }

    // =====================================================
    // STATUS
    // =====================================================

    /*
     * Altera o status de uma ocorrencia.
     *
     * Quando o novo status for RESOLVIDA ou CANCELADA,
     * uma resposta do gestor passa a ser obrigatoria.
     */
    public OcorrenciaDTO alterarStatus(
            Integer id,
            String status,
            String respostaGestor
    ) {

        // Busca a ocorrencia pelo ID.
        Ocorrencia ocorrencia =
                ocorrenciaRepository
                        .findById(id)
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Ocorrência não encontrada"
                                )
                        );

        StatusOcorrencia novoStatus;

        /*
         * Tenta converter o texto recebido para o enum.
         *
         * Caso o texto nao exista no enum,
         * retorna erro 400 em vez de erro interno.
         */
        try {
            novoStatus =
                    StatusOcorrencia.valueOf(status);

        } catch (IllegalArgumentException error) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Status inválido"
            );
        }

        /*
         * Define se a ocorrencia esta sendo finalizada.
         *
         * Sao considerados finais:
         * - RESOLVIDA;
         * - CANCELADA.
         */
        boolean finalizando =
                novoStatus == StatusOcorrencia.RESOLVIDA ||
                        novoStatus == StatusOcorrencia.CANCELADA;

        /*
         * Exige uma resposta ou motivo quando o gestor
         * esta finalizando a ocorrencia.
         */
        if (
                finalizando &&
                        (
                                respostaGestor == null ||
                                        respostaGestor.isBlank()
                        )
        ) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Informe uma resposta/motivo para finalizar a ocorrência"
            );
        }

        // Atualiza o status.
        ocorrencia.setStatus(novoStatus);

        // Registra a data e hora da ultima atualizacao.
        ocorrencia.setDataAtualizacao(
                LocalDateTime.now()
        );

        /*
         * Atualiza a resposta do gestor somente
         * quando existe texto preenchido.
         */
        if (
                respostaGestor != null &&
                        !respostaGestor.isBlank()
        ) {
            ocorrencia.setRespostaGestor(
                    respostaGestor.trim()
            );
        }

        // Salva a alteracao e converte para DTO.
        return converter(
                ocorrenciaRepository.save(ocorrencia)
        );
    }

    // =====================================================
    // METRICAS
    // =====================================================

    /*
     * Retorna a quantidade total de ocorrencias.
     */
    public Long totalOcorrencias() {

        return ocorrenciaRepository.count();
    }

    /*
     * Conta somente ocorrencias com status PENDENTE.
     */
    public Long totalPendentes() {

        return ocorrenciaRepository.countByStatus(
                StatusOcorrencia.PENDENTE
        );
    }

    /*
     * Conta somente ocorrencias com status RESOLVIDA.
     */
    public Long totalResolvidas() {

        return ocorrenciaRepository.countByStatus(
                StatusOcorrencia.RESOLVIDA
        );
    }

    // =====================================================
    // CONVERSOR
    // =====================================================

    /*
     * Converte a entidade Ocorrencia para OcorrenciaDTO.
     *
     * O metodo protege os relacionamentos de aluno
     * e professor contra valores nulos.
     */
    private OcorrenciaDTO converter(
            Ocorrencia ocorrencia
    ) {

        return new OcorrenciaDTO(
                // ID da ocorrencia.
                ocorrencia.getId(),

                // ID do aluno, quando existe relacionamento.
                ocorrencia.getAluno() != null
                        ? ocorrencia.getAluno().getId()
                        : null,

                // Nome do aluno, quando existe relacionamento.
                ocorrencia.getAluno() != null
                        ? ocorrencia.getAluno()
                        .getUsuario()
                        .getNome()
                        : null,

                // ID do professor, quando existe relacionamento.
                ocorrencia.getProfessor() != null
                        ? ocorrencia.getProfessor().getId()
                        : null,

                // Nome do professor, quando existe relacionamento.
                ocorrencia.getProfessor() != null
                        ? ocorrencia.getProfessor()
                        .getUsuario()
                        .getNome()
                        : null,

                // Dados principais da ocorrencia.
                ocorrencia.getTitulo(),
                ocorrencia.getDescricao(),

                // Converte o enum de tipo para texto.
                ocorrencia.getTipo().name(),

                // Converte o enum de gravidade para texto.
                ocorrencia.getGravidade().name(),

                // Converte o enum de status para texto.
                ocorrencia.getStatus().name(),

                // Datas e resposta do gestor.
                ocorrencia.getDataOcorrencia(),
                ocorrencia.getRespostaGestor(),
                ocorrencia.getDataAtualizacao()
        );
    }

    /*
     * Lista ocorrencias por tipo.
     *
     * O texto recebido e convertido para TipoOcorrencia.
     */
    public List<OcorrenciaDTO> listarPorTipo(
            String tipo
    ) {

        return ocorrenciaRepository

                /*
                 * Filtra somente ocorrencias
                 * com o tipo recebido.
                 */
                .findByTipo(
                        TipoOcorrencia.valueOf(tipo)
                )

                .stream()
                .map(this::converter)
                .toList();
    }

    /*
     * Monta as metricas gerais das ocorrencias.
     *
     * O resultado inclui:
     * - total;
     * - pendentes;
     * - resolvidas;
     * - graves;
     * - medias;
     * - leves.
     */
    public OcorrenciaMetricasDTO metricas() {

        // Conta todas as ocorrencias.
        Long total =
                ocorrenciaRepository.count();

        // Conta ocorrencias pendentes.
        Long pendentes =
                ocorrenciaRepository.countByStatus(
                        StatusOcorrencia.PENDENTE
                );

        // Conta ocorrencias resolvidas.
        Long resolvidas =
                ocorrenciaRepository.countByStatus(
                        StatusOcorrencia.RESOLVIDA
                );

        // Conta ocorrencias com gravidade ALTA.
        Long graves =
                ocorrenciaRepository.countByGravidade(
                        GravidadeOcorrencia.ALTA
                );

        // Conta ocorrencias com gravidade MEDIA.
        Long medias =
                ocorrenciaRepository.countByGravidade(
                        GravidadeOcorrencia.MEDIA
                );

        // Conta ocorrencias com gravidade BAIXA.
        Long leves =
                ocorrenciaRepository.countByGravidade(
                        GravidadeOcorrencia.BAIXA
                );

        // Monta o DTO com todas as contagens.
        return new OcorrenciaMetricasDTO(
                total,
                pendentes,
                resolvidas,
                graves,
                medias,
                leves
        );
    }

    /*
     * Permite que um professor edite uma ocorrencia criada por ele.
     *
     * A edicao so e permitida quando:
     * - a ocorrencia pertence ao professor logado;
     * - o status ainda e PENDENTE.
     */
    public OcorrenciaDTO editarPorProfessor(
            Integer usuarioId,
            Integer ocorrenciaId,
            OcorrenciaDTO dto
    ) {

        /*
         * Busca o professor pelo usuarioId.
         *
         * Caso nao exista, retorna erro 404.
         */
        Professor professor =
                professorRepository
                        .findByUsuarioId(usuarioId)
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Professor não encontrado"
                                )
                        );

        // Busca a ocorrencia que sera editada.
        Ocorrencia ocorrencia =
                ocorrenciaRepository
                        .findById(ocorrenciaId)
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Ocorrência não encontrada"
                                )
                        );

        /*
         * Compara o professor da ocorrencia
         * com o professor atualmente logado.
         *
         * Quando sao diferentes, bloqueia a edicao.
         */
        if (
                !ocorrencia
                        .getProfessor()
                        .getId()
                        .equals(professor.getId())
        ) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Você não pode editar uma ocorrência de outro professor"
            );
        }

        /*
         * Permite edicao somente enquanto
         * a ocorrencia estiver PENDENTE.
         */
        if (
                ocorrencia.getStatus() !=
                        StatusOcorrencia.PENDENTE
        ) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Só é possível editar ocorrências pendentes"
            );
        }

        /*
         * Busca o aluno informado no DTO.
         *
         * A ocorrencia pode ser movida para outro aluno
         * durante a edicao.
         */
        Aluno aluno =
                alunoRepository
                        .findById(dto.getAlunoId())
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Aluno não encontrado"
                                )
                        );

        // Atualiza o aluno relacionado.
        ocorrencia.setAluno(aluno);

        // Atualiza os dados principais.
        ocorrencia.setTitulo(dto.getTitulo());
        ocorrencia.setDescricao(dto.getDescricao());

        /*
         * Converte e atualiza o tipo.
         * O texto precisa existir no enum.
         */
        ocorrencia.setTipo(
                TipoOcorrencia.valueOf(
                        dto.getTipo()
                )
        );

        /*
         * Converte e atualiza a gravidade.
         * O texto precisa existir no enum.
         */
        ocorrencia.setGravidade(
                GravidadeOcorrencia.valueOf(
                        dto.getGravidade()
                )
        );

        // Salva as alteracoes e converte para DTO.
        return converter(
                ocorrenciaRepository.save(ocorrencia)
        );
    }
}