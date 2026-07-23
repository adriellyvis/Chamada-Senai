package eyecount.dto.presenca;

import eyecount.model.MetodoPresenca;
import eyecount.model.StatusPresenca;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
/*
 * DTO PresencaDTO. DTO usado para transportar somente os dados necessarios entre o backend
 * e o front.
 */

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PresencaDTO {

    // Identificador usado para relacionar ou filtrar aluno.
    private Integer alunoId;
    // Identificador usado para relacionar ou filtrar aula.
    private Integer aulaId;
    // Status atual do registro.
    private StatusPresenca status;
    // Metodo usado para realizar o registro.
    private MetodoPresenca metodo;

}
