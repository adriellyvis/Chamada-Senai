package eyecount.service;

import eyecount.dto.frequencia.FrequenciaAlunoDTO;
import eyecount.model.Aluno;
import eyecount.model.Presenca;
import eyecount.model.StatusPresenca;
import eyecount.repository.AlunoRepository;
import eyecount.repository.PresencaRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

/*
 * Servico responsavel por calcular a frequencia dos alunos de uma turma.
 *
 * Esta classe:
 * - busca os alunos de uma turma;
 * - busca as presencas de cada aluno;
 * - calcula a porcentagem de frequencia;
 * - classifica o nivel de risco;
 * - monta uma lista de FrequenciaAlunoDTO.
 */
@Service
public class FrequenciaService {

    // Repository usado para buscar os alunos vinculados a uma turma.
    private final AlunoRepository alunoRepository;

    // Repository usado para buscar os registros de presenca dos alunos.
    private final PresencaRepository presencaRepository;

    /*
     * Construtor usado pelo Spring para injetar os repositories.
     *
     * Como existe apenas este construtor, nao e necessario
     * usar a anotacao @Autowired.
     */
    public FrequenciaService(
            AlunoRepository alunoRepository,
            PresencaRepository presencaRepository
    ) {
        this.alunoRepository = alunoRepository;
        this.presencaRepository = presencaRepository;
    }

    /*
     * Calcula a frequencia de todos os alunos de uma turma.
     *
     * O metodo:
     * - filtra os alunos pelo turmaId;
     * - calcula os dados individualmente;
     * - classifica o risco;
     * - devolve uma lista de DTOs.
     */
    public List<FrequenciaAlunoDTO> calcularPorTurma(
            Integer turmaId
    ) {

        // Busca somente os alunos vinculados a turma informada.
        List<Aluno> alunos =
                alunoRepository.findByTurmaId(turmaId);

        // Cria a lista que recebera o resultado final de cada aluno.
        List<FrequenciaAlunoDTO> lista =
                new ArrayList<>();

        // Percorre todos os alunos encontrados na turma.
        for (Aluno aluno : alunos) {

            /*
             * Busca todos os registros de presenca do aluno atual.
             *
             * O filtro utiliza somente o ID do aluno.
             * Nao existe filtro por periodo, turma ou disciplina neste metodo.
             */
            List<Presenca> presencas =
                    presencaRepository.findByAluno_Id(
                            aluno.getId()
                    );

            /*
             * Usa a quantidade de registros de presenca como total de aulas.
             *
             * Isso considera que cada aluno possui no maximo
             * um registro de presenca por aula.
             */
            int totalAulas = presencas.size();

            /*
             * Filtra somente os registros com status PRESENTE
             * e conta quantos foram encontrados.
             *
             * O status ATRASADO nao entra como presente neste calculo.
             */
            int presentes = (int) presencas
                    .stream()
                    .filter(p ->
                            p.getStatus() ==
                                    StatusPresenca.PRESENTE
                    )
                    .count();

            // Valor padrao quando o aluno ainda nao possui registros.
            double frequencia = 0;

            /*
             * Calcula a porcentagem somente quando existe
             * pelo menos um registro de presenca.
             *
             * Isso evita divisao por zero.
             */
            if (totalAulas > 0) {
                frequencia =
                        (presentes * 100.0) / totalAulas;
            }

            String risco;

            /*
             * Classifica o risco de acordo com a frequencia:
             * - abaixo de 50 por cento: alto;
             * - de 50 ate abaixo de 75 por cento: medio;
             * - 75 por cento ou mais: baixo.
             */
            if (frequencia < 50) {
                risco = "alto";
            } else if (frequencia < 75) {
                risco = "medio";
            } else {
                risco = "baixo";
            }

            /*
             * Cria o DTO do aluno atual e adiciona na lista final.
             *
             * A frequencia e arredondada para uma casa decimal.
             */
            lista.add(
                    new FrequenciaAlunoDTO(
                            aluno.getId(),
                            aluno.getUsuario().getNome(),
                            aluno.getMatricula(),
                            totalAulas,
                            presentes,
                            Math.round(
                                    frequencia * 10.0
                            ) / 10.0,
                            risco
                    )
            );
        }

        // Retorna a lista com o calculo de todos os alunos da turma.
        return lista;
    }
}