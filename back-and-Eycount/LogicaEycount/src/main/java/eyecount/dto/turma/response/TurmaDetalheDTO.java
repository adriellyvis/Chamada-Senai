package eyecount.dto.turma.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;
/*
 * DTO TurmaDetalheDTO. DTO usado para transportar somente os dados necessarios entre o
 * backend e o front.
 */

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TurmaDetalheDTO {

    // Identificador unico do registro.
    private Integer id;
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

    // Quantidade total usada nos indicadores.
    private Integer totalAlunos;
    // Quantidade total usada nos indicadores.
    private Integer totalProfessores;
    // Quantidade total usada nos indicadores.
    private Integer totalDisciplinas;

    // Campo ativa usado por esta classe.
    private Boolean ativa;
    // Professor relacionado a este registro.
    private String professor;
    // Disciplina relacionada a este registro.
    private String disciplina;
}
