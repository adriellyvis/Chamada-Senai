package eyecount.dto.aluno;

import lombok.AllArgsConstructor;
import lombok.Getter;
/*
 * DTO AlunoPerfilDTO. DTO usado para transportar somente os dados necessarios entre o
 * backend e o front.
 */

@Getter
@AllArgsConstructor
public class AlunoPerfilDTO {

    // Identificador unico do registro.
    private Integer id;
    // Identificador usado para relacionar ou filtrar usuario.
    private Integer usuarioId;
    // Nome usado para identificar o registro.
    private String nome;
    // Email usado para contato ou autenticacao.
    private String email;
    // Perfil de acesso relacionado ao usuario.
    private String perfil;

    // Matricula academica do aluno.
    private String matricula;
    // Turma relacionada a este registro.
    private String turma;
    // Valor de frequencia calculado para o indicador.
    private Double frequencia;

    // Indica se o registro esta ativo no sistema.
    private Boolean ativo;
}
