package eyecount.dto.turma.response;

import lombok.AllArgsConstructor;
import lombok.Data;
/*
 * DTO ItemDetalheDTO. DTO usado para transportar somente os dados necessarios entre o
 * backend e o front.
 */

@Data
@AllArgsConstructor
public class ItemDetalheDTO {
    // Identificador unico do registro.
    private Integer id;
    // Nome usado para identificar o registro.
    private String nome;
    // Status atual do registro.
    private String status;

}
