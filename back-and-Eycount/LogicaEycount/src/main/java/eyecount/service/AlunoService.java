package eyecount.service;

import eyecount.dto.aluno.*;
import eyecount.dto.ocorrencia.OcorrenciaDTO;
import eyecount.model.*;
import eyecount.repository.*;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;

/*
  Serviço responsável pelas regras de negócio da área do aluno.

  Esta classe:
  - valida se o usuário possui perfil de aluno;
  - localiza o registro de aluno a partir do usuário logado;
  - monta os dados do dashboard;
  - consulta histórico de presença;
  - lista ocorrências;
  - monta o perfil;
  - busca uma chamada aberta para a turma;
  - calcula desempenho por disciplina.

  A anotação @Service registra esta classe como um componente do Spring.
  A anotação @AllArgsConstructor cria um construtor com todas as dependências
  finais, permitindo que o Spring faça a injeção automaticamente.
 */
@Service
@AllArgsConstructor
public class AlunoService {

    /*
      Acesso aos dados da tabela usuarios.
      Usado principalmente para validar o perfil do usuário logado.
     */
    private final UsuarioRepository usuarioRepository;

    /*
      Acesso aos dados da tabela alunos.
      Permite localizar o aluno pelo usuario_id.
     */
    private final AlunoRepository alunoRepository;

    /*
      Acesso aos registros de presença.
      Usado nos cálculos de frequência, histórico e desempenho.
     */
    private final PresencaRepository presencaRepository;

    /*
      Acesso às ocorrências relacionadas ao aluno.
     */
    private final OcorrenciaRepository ocorrenciaRepository;

    /*
     Acesso às aulas.
      Usado para localizar chamadas abertas da turma do aluno.
     */
    private final AulaRepository aulaRepository;

    // =====================================================
    // SEGURANÇA
    // =====================================================

    /*
      Verifica se o usuário informado existe e possui perfil de aluno.
      @param usuarioId ID do usuário logado.

      @throws ResponseStatusException 401 quando o usuário não existe.
      @throws ResponseStatusException 403 quando o usuário existe, mas não pertence ao perfil de aluno.
     */
    public void validarAluno(Integer usuarioId) {

        // Procura o usuário pelo ID recebido no cabeçalho da requisição.
        // Caso não encontre, interrompe o fluxo com erro 401.
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED,
                        "Usuário não encontrado"
                ));

        // No banco atual, o perfil de aluno possui ID 1.
        // Qualquer outro perfil é impedido de acessar os recursos do aluno.
        if (usuario.getPerfil().getId() != 1) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Acesso negado"
            );
        }
    }

    // =====================================================
    // BUSCAS
    // =====================================================

    /*
      Localiza o registro de aluno vinculado a um usuário.

     O sistema possui uma separação entre:
      - Usuario: dados de autenticação e perfil;
      - Aluno: matrícula, turma e dados acadêmicos.

      @param usuarioId ID do usuário.
      @return entidade Aluno associada ao usuário.

      @throws ResponseStatusException 404 quando não existe um aluno vinculado ao usuário.
     */
    public Aluno buscarAlunoPorUsuario(
            Integer usuarioId
    ) {
        return alunoRepository.findByUsuarioId(usuarioId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Aluno não encontrado"
                ));
    }

    // =====================================================
    // DASHBOARD
    // =====================================================

    /*
      Monta os indicadores exibidos no dashboard do aluno.

      O metodo calcula:
      - total de presenças;
      - total de faltas;
      - total de atrasos;
      - frequência geral;
      - nível de risco;
      - presenças e faltas no mês atual;
      - quantidade de ocorrências;
      - dados de identificação do aluno.

      @param usuarioId ID do usuário logado.
      @return DTO completo do dashboard.
     */
    public AlunoDashboardDTO dashboard(Integer usuarioId) {

        // Converte o usuário logado em seu registro acadêmico de aluno.
        Aluno aluno = buscarAlunoPorUsuario(usuarioId);

        // Conta somente registros com status PRESENTE para este aluno.
        Long presencas = presencaRepository.countByAluno_IdAndStatus(
                aluno.getId(),
                StatusPresenca.PRESENTE
        );

        // Conta somente registros com status AUSENTE para este aluno.
        Long faltas = presencaRepository.countByAluno_IdAndStatus(
                aluno.getId(),
                StatusPresenca.AUSENTE
        );

        // Conta somente registros com status ATRASADO para este aluno.
        Long atrasos = presencaRepository.countByAluno_IdAndStatus(
                aluno.getId(),
                StatusPresenca.ATRASADO
        );

        // Soma os três status que participam do cálculo de frequência.
        // SAIDA_TEMPORARIA não entra neste cálculo.
        Long total = presencas + faltas + atrasos;

        // Valor padrão quando ainda não existem registros de presença.
        double frequencia = 0.0;

        if (total > 0) {
            /*
              A regra atual considera PRESENTE e ATRASADO como presença para o cálculo percentual.

              Exemplo:
              8 presentes + 1 atraso + 1 falta = 90% de frequência.
             */
            frequencia = ((presencas + atrasos) * 100.0) / total;
        }

        String risco;

        /*
          Classifica o risco acadêmico a partir da frequência calculada:
          - abaixo de 50%: alto;
          - de 50% até abaixo de 75%: médio;
          - 75% ou mais: baixo.
         */
        if (frequencia < 50) {
            risco = "alto";
        } else if (frequencia < 75) {
            risco = "medio";
        } else {
            risco = "baixo";
        }

        // Descobre o primeiro e o último dia do mês atual.
        // Essas datas serão usadas para filtrar os registros mensais.
        YearMonth mesAtual = YearMonth.now();
        LocalDate inicioMes = mesAtual.atDay(1);
        LocalDate fimMes = mesAtual.atEndOfMonth();

        /*
          Conta somente faltas:
          - do aluno atual;
          - com status AUSENTE;
          - em aulas cuja data está dentro do mês atual.
         */
        Long faltasMes =
                presencaRepository
                        .countByAluno_IdAndStatusAndAula_DataAulaBetween(
                                aluno.getId(),
                                StatusPresenca.AUSENTE,
                                inicioMes,
                                fimMes
                        );

        /*
          Conta somente presenças:
          - do aluno atual;
          - com status PRESENTE;
          - em aulas do mês atual.

          Observação: atrasos não entram em presencasMes.
         */
        Long presencasMes =
                presencaRepository
                        .countByAluno_IdAndStatusAndAula_DataAulaBetween(
                                aluno.getId(),
                                StatusPresenca.PRESENTE,
                                inicioMes,
                                fimMes
                        );

        // Busca todas as ocorrências do aluno e usa o tamanho da lista
        // para obter a quantidade total.
        int ocorrencias =
                ocorrenciaRepository
                        .findByAluno_Id(aluno.getId())
                        .size();

        // Texto padrão usado quando o aluno não possui turma vinculada.
        String nomeTurma = "Não informada";

        if (aluno.getTurma() != null) {
            nomeTurma = aluno.getTurma().getNome();
        }

        /*
          Monta o DTO enviado para o front.

          A frequência é arredondada para uma casa decimal.
          O campo "presenças computadas" soma presentes e atrasados,
          seguindo a mesma regra usada no cálculo da frequência geral.
         */
        return new AlunoDashboardDTO(
                aluno.getUsuario().getNome(),
                nomeTurma,
                aluno.getMatricula(),

                Math.round(frequencia * 10.0) / 10.0,

                presencas.intValue(),
                faltas.intValue(),
                atrasos.intValue(),

                presencas.intValue() + atrasos.intValue(),
                total.intValue(),

                faltasMes.intValue(),
                presencasMes.intValue(),

                ocorrencias,

                risco
        );
    }

    // =====================================================
    // HISTÓRICO
    // =====================================================

    /*
      Retorna o histórico de presença do aluno logado.

      A consulta do repository já monta os dados no formato
      HistoricoPresencaDTO, evitando expor diretamente as entidades.

      @param usuarioId ID do usuário logado.
      @return lista de registros de presença do aluno.
     */
    public List<HistoricoPresencaDTO> historico(
            Integer usuarioId
    ) {
        // Localiza o aluno correspondente ao usuário.
        Aluno aluno = buscarAlunoPorUsuario(usuarioId);

        // Filtra o histórico pelo ID acadêmico do aluno.
        return presencaRepository.buscarHistoricoAluno(
                aluno.getId()
        );
    }

    // =====================================================
    // OCORRÊNCIAS
    // =====================================================

    /*
      Lista todas as ocorrências associadas ao aluno logado.

      @param usuarioId ID do usuário logado.
      @return ocorrências convertidas para OcorrenciaDTO.
     */
    public List<OcorrenciaDTO> ocorrencias(
            Integer usuarioId
    ) {

        // Descobre qual aluno pertence ao usuário logado.
        Aluno aluno = buscarAlunoPorUsuario(usuarioId);

        return ocorrenciaRepository
                // Filtra somente ocorrências cujo aluno_id corresponde
                // ao aluno atualmente logado.
                .findByAluno_Id(aluno.getId())

                // Transforma a lista de entidades em um fluxo de dados.
                .stream()

                // Converte cada entidade Ocorrencia em OcorrenciaDTO.
                .map(this::converterOcorrencia)

                // Reconstrói o resultado final como uma lista.
                .toList();
    }

    // =====================================================
    // PERFIL
    // =====================================================

    /*
      Monta os dados exibidos no perfil do aluno.

      @param usuarioId ID do usuário logado.
      @return dados pessoais e acadêmicos do aluno.
     */
    public AlunoPerfilDTO perfil(Integer usuarioId) {

        /*
          Busca diretamente pelo relacionamento usuario.id.
          Apesar de ser semelhante a buscarAlunoPorUsuario(), este metodo
          utiliza outro nome de consulta existente no repository.
         */
        Aluno aluno = alunoRepository.findByUsuario_Id(usuarioId)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Aluno não encontrado para este usuário"
                        )
                );

        // Recupera os dados gerais de usuário ligados ao aluno.
        Usuario usuario = aluno.getUsuario();

        String nomeTurma = "Não informada";

        // Evita NullPointerException caso o aluno ainda não tenha turma.
        if (aluno.getTurma() != null) {
            nomeTurma = aluno.getTurma().getNome();
        }

        // Reutiliza o metodo interno de cálculo de frequência.
        Double frequencia =
                calcularFrequenciaAluno(aluno.getId());

        return new AlunoPerfilDTO(
                aluno.getId(),
                usuario.getId(),
                usuario.getNome(),
                usuario.getEmail(),
                usuario.getPerfil().getNome(),
                aluno.getMatricula(),
                nomeTurma,
                frequencia,

                /*
                 * Boolean.TRUE.equals evita erro caso o campo ativo
                 * esteja nulo. Nesse caso, o resultado será false.
                 */
                Boolean.TRUE.equals(usuario.getAtivo())
        );
    }

    // =====================================================
    // CONVERSOR
    // =====================================================

    /*
      Converte a entidade Ocorrencia para o DTO usado pelo front.

      O metodo protege alguns relacionamentos contra valores nulos.

      @param ocorrencia entidade carregada do banco.
      @return DTO com os dados necessários para a tela do aluno.
     */
    private OcorrenciaDTO converterOcorrencia(
            Ocorrencia ocorrencia
    ) {
        return new OcorrenciaDTO(
                ocorrencia.getId(),

                // Retorna o ID do aluno somente quando o relacionamento existe.
                ocorrencia.getAluno() != null
                        ? ocorrencia.getAluno().getId()
                        : null,

                // Retorna o nome do usuário vinculado ao aluno.
                ocorrencia.getAluno() != null
                        ? ocorrencia.getAluno()
                        .getUsuario()
                        .getNome()
                        : null,

                // Retorna o ID do professor responsável pela ocorrência.
                ocorrencia.getProfessor() != null
                        ? ocorrencia.getProfessor().getId()
                        : null,

                // Retorna o nome do professor quando o relacionamento existe.
                ocorrencia.getProfessor() != null
                        ? ocorrencia.getProfessor()
                        .getUsuario()
                        .getNome()
                        : null,

                ocorrencia.getTitulo(),
                ocorrencia.getDescricao(),

                // Converte o enum em texto para envio no JSON.
                ocorrencia.getTipo().name(),

                // Converte a gravidade em texto.
                ocorrencia.getGravidade().name(),

                // Converte o status em texto.
                ocorrencia.getStatus().name(),

                ocorrencia.getDataOcorrencia(),
                ocorrencia.getRespostaGestor(),
                ocorrencia.getDataAtualizacao()
        );
    }

    // =====================================================
    // CHAMADA ABERTA
    // =====================================================

    /*
      Busca uma chamada atualmente aberta para a turma do aluno.

      O metodo:
      - localiza o aluno pelo usuário;
      - identifica a turma;
      - busca aulas com status EM_ANDAMENTO;
      - seleciona a primeira aula encontrada;
      - monta os dados exibidos na tela de chamada.

      @param usuarioId ID do usuário logado.
      @return dados da chamada aberta.
     */
    public ChamadaAbertaAlunoDTO buscarChamadaAberta(
            Integer usuarioId
    ) {

        // Localiza o aluno vinculado ao usuário.
        Aluno aluno = alunoRepository.findByUsuario_Id(usuarioId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Aluno não encontrado para o usuário logado"
                ));

        /*
          Busca aulas:
          - pertencentes à turma do aluno;
          - com status EM_ANDAMENTO.

          Ponto de atenção:
          caso aluno.getTurma() seja nulo, este trecho pode gerar NullPointerException.
          O fluxo atual pressupoe que todo aluno esteja associado a uma turma.
         */
        List<Aula> aulasAbertas =
                aulaRepository.buscarAulaAbertaPorTurma(
                        aluno.getTurma().getId(),
                        StatusAula.EM_ANDAMENTO
                );

        // Quando nenhuma aula está aberta, retorna 404.
        // O front pode usar essa resposta para mostrar que não existe chamada.
        if (aulasAbertas.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Nenhuma chamada aberta para sua turma no momento"
            );
        }

        /*
         * Seleciona a primeira aula retornada.
         *
         * O ideal é a consulta do repository já garantir uma ordem clara
         * ou que só possa existir uma chamada aberta por turma.
         */
        Aula aula = aulasAbertas.get(0);

        // Monta a resposta com os dados da disciplina, professor,
        // turma, data, horários e status da chamada.
        return new ChamadaAbertaAlunoDTO(
                aluno.getId(),
                aula.getId(),
                aula.getTurmaDisciplina()
                        .getDisciplina()
                        .getNome(),
                aula.getTurmaDisciplina()
                        .getProfessor()
                        .getUsuario()
                        .getNome(),
                aula.getTurmaDisciplina()
                        .getTurma()
                        .getNome(),
                aula.getDataAula().toString(),
                aula.getHoraInicio().toString(),

                // Durante uma chamada aberta, horaFim normalmente é nula.
                aula.getHoraFim() != null
                        ? aula.getHoraFim().toString()
                        : null,

                aula.getStatus().name()
        );
    }

    // =====================================================
    // CÁLCULO DE FREQUÊNCIA
    // =====================================================

    /*
     * Calcula a frequência geral de um aluno.
     *
     * A regra considera:
     * - PRESENTE como frequência;
     * - ATRASADO como frequência;
     * - AUSENTE como falta.
     *
     * @param alunoId ID acadêmico do aluno.
     * @return percentual arredondado para uma casa decimal.
     */
    private Double calcularFrequenciaAluno(
            Integer alunoId
    ) {

        // Conta somente registros PRESENTE do aluno.
        Long presencas = presencaRepository.countByAluno_IdAndStatus(
                alunoId,
                StatusPresenca.PRESENTE
        );

        // Conta somente registros AUSENTE do aluno.
        Long faltas = presencaRepository.countByAluno_IdAndStatus(
                alunoId,
                StatusPresenca.AUSENTE
        );

        // Conta somente registros ATRASADO do aluno.
        Long atrasos = presencaRepository.countByAluno_IdAndStatus(
                alunoId,
                StatusPresenca.ATRASADO
        );

        // Soma os registros considerados no cálculo.
        Long total = presencas + faltas + atrasos;

        // Evita divisão por zero quando ainda não há presenças.
        if (total == 0) {
            return 0.0;
        }

        // Atrasos são contados junto com presenças na regra atual.
        double frequencia =
                ((presencas + atrasos) * 100.0) / total;

        // Arredonda o resultado para uma casa decimal.
        return Math.round(frequencia * 10.0) / 10.0;
    }

    // =====================================================
    // DESEMPENHO POR DISCIPLINA
    // =====================================================

    /*
      Retorna o desempenho do aluno separado por disciplina.

     A consulta é executada diretamente no repository e já devolve os dados no formato AlunoDesempenhoDisciplinaDTO.

      @param usuarioId ID do usuário logado.
      @return indicadores agrupados por disciplina.
     */
    public List<AlunoDesempenhoDisciplinaDTO> desempenhoPorDisciplina(
            Integer usuarioId
    ) {

        // Localiza o aluno vinculado ao usuário atual.
        Aluno aluno = buscarAlunoPorUsuario(usuarioId);

        /*
          Filtra os registros pelo aluno e agrupa os resultados
          conforme a consulta definida em buscarDesempenhoPorDisciplina.
         */
        return presencaRepository
                .buscarDesempenhoPorDisciplina(
                        aluno.getId()
                );
    }
}