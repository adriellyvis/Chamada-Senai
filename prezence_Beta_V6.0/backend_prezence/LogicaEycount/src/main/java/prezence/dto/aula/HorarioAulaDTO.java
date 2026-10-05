package prezence.dto.aula;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class HorarioAulaDTO {

    private Integer id;

    private Integer turmaDisciplinaId;

    private Integer turmaId;
    private String turma;
    private String sala;

    private Integer disciplinaId;
    private String disciplina;
    private String siglaDisciplina;

    private Integer professorId;
    private String professor;

    private DayOfWeek diaSemana;

    private LocalTime horaInicio;
    private LocalTime horaFim;

    private Integer toleranciaMinutos;

    private Boolean aberturaAutomatica;
    private Boolean encerramentoAutomatico;

    private LocalDate dataInicioVigencia;
    private LocalDate dataFimVigencia;

    private Boolean ativo;
}