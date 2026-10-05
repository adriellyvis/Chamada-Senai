package prezence.dto.aluno;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class AlunoDesempenhoDisciplinaDTO {
    private String disciplina;
    private Long presencas;
    private Long faltas;
    private Long atrasos;
    private Double frequencia;
}
