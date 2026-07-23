package eyecount.dto.frequencia;


import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
/*
 * DTO FrequenciaAlunoDTO. DTO usado para transportar somente os dados necessarios entre o
 * backend e o front.
 */

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FrequenciaAlunoDTO {
    // Identificador usado para relacionar ou filtrar aluno.
    private Integer alunoId;
    // Nome usado para identificar o registro.
    private String nome;
    // Matricula academica do aluno.
    private String matricula;
    // Quantidade total usada nos indicadores.
    private Integer totalAulas;
    // Quantidade de registros com presenca.
    private Integer presencas;
    // Valor de frequencia calculado para o indicador.
    private Double frequencia;
    // Classificacao do nivel de risco.
    private String risco;

}
