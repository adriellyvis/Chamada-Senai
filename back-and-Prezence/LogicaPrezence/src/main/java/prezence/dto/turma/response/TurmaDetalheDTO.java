package prezence.dto.turma.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TurmaDetalheDTO {

    private Integer id;
    private String nome;
    private String descricao;

    private String sala;
    private LocalDate dataInicio;
    private LocalDate dataFimPrevista;
    private LocalTime horarioInicio;
    private LocalTime horarioFim;

    private Integer totalAlunos;
    private Integer totalProfessores;
    private Integer totalDisciplinas;

    private Boolean ativa;
    private String professor;
    private String disciplina;
}
