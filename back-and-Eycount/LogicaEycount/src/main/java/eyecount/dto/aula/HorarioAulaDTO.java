package eyecount.dto.aula;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
/*
 * DTO HorarioAulaDTO. DTO usado para transportar somente os dados necessarios entre o
 * backend e o front.
 */

@Data
@NoArgsConstructor
@AllArgsConstructor
public class HorarioAulaDTO {

    // Identificador unico do registro.
    private Integer id;

    // Identificador usado para relacionar ou filtrar turmaDisciplina.
    private Integer turmaDisciplinaId;

    // Identificador usado para relacionar ou filtrar turma.
    private Integer turmaId;
    // Turma relacionada a este registro.
    private String turma;

    // Identificador usado para relacionar ou filtrar disciplina.
    private Integer disciplinaId;
    // Disciplina relacionada a este registro.
    private String disciplina;

    // Identificador usado para relacionar ou filtrar professor.
    private Integer professorId;
    // Professor relacionado a este registro.
    private String professor;

    // Dia da semana em que a aula acontece.
    private DayOfWeek diaSemana;

    // Horario de inicio.
    private LocalTime horaInicio;
    // Horario de termino.
    private LocalTime horaFim;

    // Quantidade de minutos de tolerancia para a presenca.
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
