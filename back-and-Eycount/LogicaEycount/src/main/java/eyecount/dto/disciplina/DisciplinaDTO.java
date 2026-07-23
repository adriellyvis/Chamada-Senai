package eyecount.dto.disciplina;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
/*
 * DTO DisciplinaDTO. DTO usado para transportar somente os dados necessarios entre o
 * backend e o front.
 */

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DisciplinaDTO {
    // Identificador unico do registro.
    private Integer id;

    @NotBlank(message = "Nome da disciplina obrigatório")
    @Size(max = 100, message = "Nome da disciplina muito longo")
    private String nome;
}
