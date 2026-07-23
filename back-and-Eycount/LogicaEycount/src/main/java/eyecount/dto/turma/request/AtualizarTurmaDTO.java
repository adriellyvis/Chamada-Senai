package eyecount.dto.turma.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;
/*
 * DTO AtualizarTurmaDTO. DTO usado para transportar somente os dados necessarios entre o
 * backend e o front.
 */

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AtualizarTurmaDTO {

    // Nome usado para identificar o registro.
    private String nome;
    // Descricao detalhada do registro.
    private String descricao;
    // Sala associada a turma.
    private String sala;

    // Data inicial do periodo.
    private LocalDate dataInicio;
    // Data prevista para o encerramento.
    private LocalDate dataFimPrevista;

    // Horario geral de inicio.
    private LocalTime horarioInicio;
    // Horario geral de termino.
    private LocalTime horarioFim;

    // Campo ativa usado por esta classe.
    private Boolean ativa;

    // Identificador usado para relacionar ou filtrar professor.
    private Integer professorId;
    // Identificador usado para relacionar ou filtrar disciplina.
    private Integer disciplinaId;
}
