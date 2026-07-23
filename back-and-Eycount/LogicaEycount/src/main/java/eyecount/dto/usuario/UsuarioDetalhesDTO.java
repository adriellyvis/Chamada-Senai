package eyecount.dto.usuario;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
/*
 * DTO UsuarioDetalhesDTO. DTO usado para transportar somente os dados necessarios entre o
 * backend e o front.
 */

@Data
@AllArgsConstructor
@NoArgsConstructor
public class UsuarioDetalhesDTO {
    // Identificador unico do registro.
    private Integer id;
    // Nome usado para identificar o registro.
    private String nome;
    // Email usado para contato ou autenticacao.
    private String email;
    // Perfil de acesso relacionado ao usuario.
    private String perfil;

    // pro aluno
    private String turma;
    // Matricula academica do aluno.
    private String matricula;
    // Valor de frequencia calculado para o indicador.
    private Double frequencia;

    // pro professor
    private String especialidade;

    // pro gerais
    private Integer ocorrencias;

}
