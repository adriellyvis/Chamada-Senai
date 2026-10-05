package prezence.dto.aula;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
/*
 * DTO AtualizarHorarioAulaDTO. DTO usado para transportar somente os dados necessarios
 * entre o backend e o front.
 */

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AtualizarHorarioAulaDTO {

    private Integer turmaDisciplinaId;
    private DayOfWeek diaSemana;

    private LocalTime horaInicio;
    private LocalTime horaFim;

    @Min(value = 0, message = "A tolerância não pode ser negativa")
    @Max(value = 180, message = "A tolerância não pode ultrapassar 180 minutos")
    private Integer toleranciaMinutos;

    private Boolean aberturaAutomatica;
    private Boolean encerramentoAutomatico;

    private LocalDate dataInicioVigencia;
    private LocalDate dataFimVigencia;

    private Boolean ativo;
}
