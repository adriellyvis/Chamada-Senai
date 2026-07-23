package eyecount.inutilizados;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
/*
 * Arquivo legado AlunoPerfilDTO. Classe antiga mantida apenas como referencia. Ela nao
 * participa do fluxo principal atual.
 */

@Data
@AllArgsConstructor
@NoArgsConstructor
public class AlunoPerfilDTO {
    // Identificador unico do registro.
    private Integer id;
    // Nome usado para identificar o registro.
    private String nome;
    // Email usado para contato ou autenticacao.
    private String email;
    // Matricula academica do aluno.
    private String matricula;
    // Turma relacionada a este registro.
    private String turma;

}
