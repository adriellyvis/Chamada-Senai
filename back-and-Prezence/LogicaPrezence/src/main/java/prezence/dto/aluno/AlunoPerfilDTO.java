package prezence.dto.aluno;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class AlunoPerfilDTO {

    private Integer id;
    private Integer usuarioId;
    private String nome;
    private String email;
    private String perfil;

    private String matricula;
    private String turma;
    private Double frequencia;

    private Boolean ativo;
}
