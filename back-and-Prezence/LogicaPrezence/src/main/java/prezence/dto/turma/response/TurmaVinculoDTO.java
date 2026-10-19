package prezence.dto.turma.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TurmaVinculoDTO {

    private Integer turmaDisciplinaId;

    private Integer turmaId;
    private String turmaNome;

    private Integer disciplinaId;
    private String disciplinaNome;

    private Integer professorId;
    private String professorNome;
}