package eyecount.dto.aluno;

import eyecount.model.MetodoPresenca;
import eyecount.model.StatusPresenca;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
/*
 * DTO HistoricoPresencaDTO. DTO usado para transportar somente os dados necessarios entre o
 * backend e o front.
 */

@Data
@NoArgsConstructor
@AllArgsConstructor
public class HistoricoPresencaDTO {
    // Identificador usado para relacionar ou filtrar aula.
    private Integer aulaId;
    // Disciplina relacionada a este registro.
    private String disciplina;
    // Data em que a aula acontece.
    private LocalDate dataAula;
    // Status atual do registro.
    private StatusPresenca status;
    // Metodo usado para realizar o registro.
    private MetodoPresenca metodo;
    // Data e hora em que a presenca foi registrada.
    private LocalDateTime horarioRegistro;

}
