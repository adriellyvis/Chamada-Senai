package prezence.dto.aluno;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class AlunoDashboardDTO {

    private String nome;
    private String turma;
    private String matricula;

    private Double frequencia;
    private Integer presencas;
    private Integer faltas;
    private Integer atrasos;
    private Integer aulasAssistidas;
    private Integer totalAulas;
    private Integer faltasMes;
    private Integer presencasMes;
    private Integer ocorrencias;
    private String risco;
}
