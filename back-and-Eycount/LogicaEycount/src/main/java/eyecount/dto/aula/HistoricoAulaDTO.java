package eyecount.dto.aula;

import eyecount.model.StatusAula;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;
/*
 * DTO HistoricoAulaDTO. DTO usado para transportar somente os dados necessarios entre o
 * backend e o front.
 */

@Data
@NoArgsConstructor
@AllArgsConstructor
public class HistoricoAulaDTO {
    // Identificador unico do registro.
    private Integer id;
    // Turma relacionada a este registro.
    private String turma;
    // Data relacionada ao registro.
    private LocalDate data;
    // Horario de inicio.
    private LocalTime horaInicio;
    // Horario de termino.
    private LocalTime horaFim;
    // Status atual do registro.
    private StatusAula status;

}
