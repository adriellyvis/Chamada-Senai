package prezence.dto.professor;

import prezence.dto.alerta.AlertaEvasaoDTO;
import prezence.dto.aula.HistoricoAulaDTO;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProfessorDashboardDTO {
    private Integer totalTurmas;
    private Integer totalAlunos;
    private Double frequenciaMedia;
    private Integer aulasRealizadas;

    private List<HistoricoAulaDTO> aulasRecentes;
    private List<AlertaEvasaoDTO> alunosRisco;
}
