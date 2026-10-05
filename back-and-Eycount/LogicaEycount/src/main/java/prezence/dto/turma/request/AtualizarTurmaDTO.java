package prezence.dto.turma.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AtualizarTurmaDTO {

    private String nome;
    private String descricao;
    private String sala;

    private LocalDate dataInicio;
    private LocalDate dataFimPrevista;

    private LocalTime horarioInicio;
    private LocalTime horarioFim;

    private Boolean ativa;

    private Integer professorId;
    private Integer disciplinaId;
}
