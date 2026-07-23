package eyecount.inutilizados;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
/*
 * Arquivo legado TurmaDisciplinaDTO. Classe antiga mantida apenas como referencia. Ela nao
 * participa do fluxo principal atual.
 */

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TurmaDisciplinaDTO {
    // Identificador unico do registro.
    private Integer id;
    // Turma relacionada a este registro.
    private String turma;
    // Disciplina relacionada a este registro.
    private String disciplina;
    // Professor relacionado a este registro.
    private String professor;

}
