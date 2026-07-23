package eyecount.dto.dashboard;

import eyecount.dto.alerta.AlertaEvasaoDTO;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
/*
 * DTO GestorDashboardDTO. DTO usado para transportar somente os dados necessarios entre o
 * backend e o front.
 */

@Data
@NoArgsConstructor
@AllArgsConstructor
public class GestorDashboardDTO {
    // Campo alunosRisco usado por esta classe.
    private Integer alunosRisco;

    // Colecao de dados relacionada a este objeto.
    private Integer ocorrenciasPendentes;
    // Campo ocorrenciasEmAnalise usado por esta classe.
    private Integer ocorrenciasEmAnalise;
    // Colecao de dados relacionada a este objeto.
    private Integer ocorrenciasResolvidas;
    // Colecao de dados relacionada a este objeto.
    private Integer ocorrenciasCanceladas;

    // Valor de frequencia calculado para o indicador.
    private Double frequenciaGlobal;

    // Campo alertasEvasao usado por esta classe.
    private List<AlertaEvasaoDTO> alertasEvasao;
    // Colecao de dados relacionada a este objeto.
    private List<AtividadeRecenteDTO> atividadesRecentes;
    // Valor de frequencia calculado para o indicador.
    private List<FrequenciaTurmaDTO> frequenciaTurmas;
}
