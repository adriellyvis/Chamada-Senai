package eyecount.dto.aula;


import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
/*
 * DTO AlunoChamadaDTO. DTO usado para transportar somente os dados necessarios entre o
 * backend e o front.
 */

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AlunoChamadaDTO {
    // Identificador usado para relacionar ou filtrar aluno.
    private Integer alunoId;
    // Nome usado para identificar o registro.
    private String nome;
    // Status atual do registro.
    private String status;

}
