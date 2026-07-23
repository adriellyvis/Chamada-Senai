package eyecount.dto.usuario;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
/*
 * DTO UsuarioDTO. DTO usado para transportar somente os dados necessarios entre o backend e
 * o front.
 */

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UsuarioDTO {
    // Identificador unico do registro.
    private Integer id;
    // Nome usado para identificar o registro.
    private String nome;
    // Email usado para contato ou autenticacao.
    private String email;
    // Perfil de acesso relacionado ao usuario.
    private String perfil;
    // Indica se o registro esta ativo no sistema.
    private Boolean ativo;
    // Identificador usado para relacionar ou filtrar turma.
    private Integer turmaId;

}
