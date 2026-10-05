package prezence.service;

import prezence.dto.frequencia.FrequenciaAlunoDTO;
import prezence.model.Aluno;
import prezence.model.Presenca;
import prezence.model.StatusPresenca;
import prezence.repository.AlunoRepository;
import prezence.repository.PresencaRepository;
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

    private final AlunoRepository alunoRepository;
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
            int presentes = (int) presencas.stream()
                    .filter(p ->
                            p.getStatus() == StatusPresenca.PRESENTE
                    )
                    .count();

            int atrasos = (int) presencas.stream()
                    .filter(p ->
                            p.getStatus() == StatusPresenca.ATRASADO
                    )
                    .count();

            int faltas = (int) presencas.stream()
                    .filter(p ->
                            p.getStatus() == StatusPresenca.AUSENTE
                    )
                    .count();

            int totalAulas =
                    presentes + atrasos + faltas;

            int presencasComputadas =
                    presentes + atrasos;

            double frequencia = 0.0;

            if (totalAulas > 0) {
                frequencia =
                        (presencasComputadas * 100.0) /
                                totalAulas;
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
                            presencasComputadas,
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