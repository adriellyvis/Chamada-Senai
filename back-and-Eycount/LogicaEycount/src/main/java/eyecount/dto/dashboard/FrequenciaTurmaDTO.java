package eyecount.dto.dashboard;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
/*
 * DTO FrequenciaTurmaDTO. DTO usado para transportar somente os dados necessarios entre o
 * backend e o front.
 */

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FrequenciaTurmaDTO  {
    // Identificador unico do registro.
    private Integer id;
    // Turma relacionada a este registro.
    private String turma;
    // Quantidade total usada nos indicadores.
    private Long totalAlunos;
    // Valor de frequencia calculado para o indicador.
    private Double frequencia;
    // Campo alunosEmRisco usado por esta classe.
    private Long alunosEmRisco;
    // Campo percentualRisco usado por esta classe.
    private Double percentualRisco;

}
