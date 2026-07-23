package eyecount.dto.usuario;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
/*
 * DTO UsuarioEditarDTO. DTO usado para transportar somente os dados necessarios entre o
 * backend e o front.
 */

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UsuarioEditarDTO {

    @NotBlank(message = "Nome obrigatório")
    @Size(max = 100, message = "Nome muito longo")
    private String nome;

    @NotBlank(message = "Email obrigatório")
    @Email(message = "Email inválido")
    @Size(max = 100, message = "Email muito longo")
    private String email;

    // Indica se o registro esta ativo no sistema.
    private Boolean ativo;
    // Identificador usado para relacionar ou filtrar turma.
    private Integer turmaId;
    // Especialidade informada para o professor.
    private String especialidade;

}
