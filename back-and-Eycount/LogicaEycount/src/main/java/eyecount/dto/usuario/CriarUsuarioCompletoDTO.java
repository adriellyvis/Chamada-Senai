package eyecount.dto.usuario;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
/*
 * DTO CriarUsuarioCompletoDTO. DTO usado para transportar somente os dados necessarios
 * entre o backend e o front.
 */

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CriarUsuarioCompletoDTO {

    @NotBlank(message = "Nome obrigatório")
    @Size(max = 100, message = "Nome muito longo")
    private String nome;

    @NotBlank(message = "Email obrigatório")
    @Email(message = "Email inválido")
    @Size(max = 100, message = "Email muito longo")
    private String email;

    @NotBlank(message = "Senha obrigatória")
    @Size(min = 6, message = "Senha deve ter no mínimo 6 caracteres")
    private String senha;

    @NotNull(message = "Perfil obrigatório")
    private Integer perfilId;

    // pra aluno
    private Integer turmaId;

    @Size(max = 50, message = "Matrícula muito longa")
    private String matricula;

    // pra professor
    @Size(max = 100, message = "Especialidade muito longa")
    private String especialidade;

}
