package eyecount.dto.aluno;

import lombok.AllArgsConstructor;
import lombok.Getter;
/*
 * DTO AlunoDashboardDTO. DTO usado para transportar somente os dados necessarios entre o
 * backend e o front.
 */

@Getter
@AllArgsConstructor
public class AlunoDashboardDTO {

    // Nome usado para identificar o registro.
    private String nome;
    // Turma relacionada a este registro.
    private String turma;
    // Matricula academica do aluno.
    private String matricula;

    // Valor de frequencia calculado para o indicador.
    private Double frequencia;
    // Quantidade de registros com presenca.
    private Integer presencas;
    // Quantidade de registros com ausencia.
    private Integer faltas;
    // Quantidade de registros com atraso.
    private Integer atrasos;
    // Quantidade de aulas consideradas assistidas.
    private Integer aulasAssistidas;
    // Quantidade total usada nos indicadores.
    private Integer totalAulas;
    // Quantidade de faltas no mes atual.
    private Integer faltasMes;
    // Quantidade de presencas no mes atual.
    private Integer presencasMes;
    // Quantidade de ocorrencias relacionadas.
    private Integer ocorrencias;
    // Classificacao do nivel de risco.
    private String risco;
}
