package eyecount.inutilizados;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
/*
 * Arquivo legado UsuarioResumoDTO. Classe antiga mantida apenas como referencia. Ela nao
 * participa do fluxo principal atual.
 */

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UsuarioResumoDTO {
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

}
