package prezence.dto.usuario;

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
    private Integer id;
    private String nome;
    private String email;
    private String perfil;

    private String turma;
    private String matricula;
    private Double frequencia;

    private String especialidade;

    private Integer ocorrencias;

}
