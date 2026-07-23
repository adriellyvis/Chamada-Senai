package eyecount.inutilizados.resumo;

import lombok.AllArgsConstructor;
import lombok.Data;
/*
 * Arquivo legado ResumoDTO. Classe antiga mantida apenas como referencia. Ela nao participa
 * do fluxo principal atual.
 */

@Data
@AllArgsConstructor
public class ResumoDTO {
    // Identificador unico do registro.
    private Integer id;
    // Nome usado para identificar o registro.
    private String nome;

}
