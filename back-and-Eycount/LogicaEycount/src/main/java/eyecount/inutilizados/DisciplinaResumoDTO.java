package eyecount.inutilizados;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
/*
 * Arquivo legado DisciplinaResumoDTO. Classe antiga mantida apenas como referencia. Ela nao
 * participa do fluxo principal atual.
 */

@Data
@NoArgsConstructor
@AllArgsConstructor

public class DisciplinaResumoDTO {
    // Identificador unico do registro.
    private Integer id;
    // Nome usado para identificar o registro.
    private String nome;

}
