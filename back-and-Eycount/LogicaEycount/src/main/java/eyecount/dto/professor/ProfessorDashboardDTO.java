package eyecount.dto.professor;

import eyecount.dto.alerta.AlertaEvasaoDTO;
import eyecount.dto.aula.HistoricoAulaDTO;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
/*
 * DTO ProfessorDashboardDTO. DTO usado para transportar somente os dados necessarios entre
 * o backend e o front.
 */

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProfessorDashboardDTO {
    // Quantidade total usada nos indicadores.
    private Integer totalTurmas;
    // Quantidade total usada nos indicadores.
    private Integer totalAlunos;
    // Valor de frequencia calculado para o indicador.
    private Double frequenciaMedia;
    // Colecao de dados relacionada a este objeto.
    private Integer aulasRealizadas;

    // Colecao de dados relacionada a este objeto.
    private List<HistoricoAulaDTO> aulasRecentes;
    // Campo alunosRisco usado por esta classe.
    private List<AlertaEvasaoDTO> alunosRisco;
}
