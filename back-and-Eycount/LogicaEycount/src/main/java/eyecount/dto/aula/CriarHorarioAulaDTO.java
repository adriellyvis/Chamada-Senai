package eyecount.dto.aula;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
/*
 * DTO CriarHorarioAulaDTO. DTO usado para transportar somente os dados necessarios entre o
 * backend e o front.
 */

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CriarHorarioAulaDTO {

    @NotNull(message = "O vínculo entre turma, disciplina e professor é obrigatório")
    private Integer turmaDisciplinaId;

    @NotNull(message = "O dia da semana é obrigatório")
    private DayOfWeek diaSemana;

    @NotNull(message = "O horário de início é obrigatório")
    private LocalTime horaInicio;

    @NotNull(message = "O horário de término é obrigatório")
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
}
