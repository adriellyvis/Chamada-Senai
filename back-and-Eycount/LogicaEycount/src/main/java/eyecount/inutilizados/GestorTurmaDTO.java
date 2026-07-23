package eyecount.inutilizados;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
/*
 * Arquivo legado GestorTurmaDTO. Classe antiga mantida apenas como referencia. Ela nao
 * participa do fluxo principal atual.
 */

@Data
@NoArgsConstructor
@AllArgsConstructor
public class GestorTurmaDTO {
    // Identificador unico do registro.
    private Integer id;
    // Nome usado para identificar o registro.
    private String nome;
    // Campo curso usado por esta classe.
    private String curso;
    // Quantidade total usada nos indicadores.
    private Integer totalAlunos;
    // Campo professorResponsavel usado por esta classe.
    private String professorResponsavel;

}
