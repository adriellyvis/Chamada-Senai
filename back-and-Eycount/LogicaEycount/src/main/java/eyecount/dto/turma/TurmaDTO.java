package eyecount.dto.turma;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;
/*
 * DTO TurmaDTO. DTO usado para transportar somente os dados necessarios entre o backend e o
 * front.
 */

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TurmaDTO {
    // Identificador unico do registro.
    private Integer id;
    // Nome usado para identificar o registro.
    private String nome;
    // Descricao detalhada do registro.
    private String descricao;
    // Professor relacionado a este registro.
    private String professor;
    // Identificador usado para relacionar ou filtrar professor.
    private Integer professorId;
    // Disciplina relacionada a este registro.
    private String disciplina;
    // Identificador usado para relacionar ou filtrar disciplina.
    private Integer disciplinaId;
    // Sala associada a turma.
    private String sala;
    // Data inicial do periodo.
    private LocalDate dataInicio;
    // Data prevista para o encerramento.
    private LocalDate dataFimPrevista;
    // Horario geral de inicio.
    private LocalTime horarioInicio;
    // Horario geral de termino.
    private LocalTime  horarioFim;
    // Indica se o registro esta ativo no sistema.
    private Boolean ativo;


}
