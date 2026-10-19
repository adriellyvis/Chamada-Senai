package prezence.dto.aula;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;

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

    private Boolean aberturaAutomatica;
    private Boolean encerramentoAutomatico;

    private LocalDate dataInicioVigencia;
    private LocalDate dataFimVigencia;
}
