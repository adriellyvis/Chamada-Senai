package eyecount.dto.alerta;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
/*
 * DTO AlertaEvasaoDTO. DTO usado para transportar somente os dados necessarios entre o
 * backend e o front.
 */

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AlertaEvasaoDTO {
    // Identificador usado para relacionar ou filtrar aluno.
    private Integer alunoId;
    // Nome exibido ou usado para identificar o dado.
    private String nomeAluno;
    // Matricula academica do aluno.
    private String matricula;
    // Turma relacionada a este registro.
    private String turma;
    // Valor de frequencia calculado para o indicador.
    private Double frequencia;
    // Campo nivelRisco usado por esta classe.
    private String nivelRisco;
}
