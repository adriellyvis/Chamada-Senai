package eyecount.dto.aluno;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
/*
 * DTO ChamadaAbertaAlunoDTO. DTO usado para transportar somente os dados necessarios entre
 * o backend e o front.
 */

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChamadaAbertaAlunoDTO {

    // Identificador usado para relacionar ou filtrar aluno.
    private Integer alunoId;
    // Identificador usado para relacionar ou filtrar aula.
    private Integer aulaId;

    // Disciplina relacionada a este registro.
    private String disciplina;
    // Professor relacionado a este registro.
    private String professor;
    // Turma relacionada a este registro.
    private String turma;

    // Data em que a aula acontece.
    private String dataAula;
    // Horario de inicio.
    private String horaInicio;
    // Horario de termino.
    private String horaFim;

    // Status atual do registro.
    private String status;
}
