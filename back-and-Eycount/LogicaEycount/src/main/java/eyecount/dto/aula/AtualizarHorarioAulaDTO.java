package eyecount.dto.aula;

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

    // Identificador usado para relacionar ou filtrar turmaDisciplina.
    private Integer turmaDisciplinaId;
    // Dia da semana em que a aula acontece.
    private DayOfWeek diaSemana;

    // Horario de inicio.
    private LocalTime horaInicio;
    // Horario de termino.
    private LocalTime horaFim;

    @Min(value = 0, message = "A tolerância não pode ser negativa")
    @Max(value = 180, message = "A tolerância não pode ultrapassar 180 minutos")
    private Integer toleranciaMinutos;

    // Indica se a chamada deve abrir automaticamente.
    private Boolean aberturaAutomatica;
    // Indica se a chamada deve encerrar automaticamente.
    private Boolean encerramentoAutomatico;

    // Data em que o horario comeca a valer.
    private LocalDate dataInicioVigencia;
    // Data em que o horario deixa de valer.
    private LocalDate dataFimVigencia;

    // Indica se o registro esta ativo no sistema.
    private Boolean ativo;
}
