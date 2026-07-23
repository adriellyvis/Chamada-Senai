package eyecount.dto.aluno;

import lombok.AllArgsConstructor;
import lombok.Getter;
/*
 * DTO AlunoDesempenhoDisciplinaDTO. DTO usado para transportar somente os dados necessarios
 * entre o backend e o front.
 */

@Getter
@AllArgsConstructor
public class AlunoDesempenhoDisciplinaDTO {

    // Disciplina relacionada a este registro.
    private String disciplina;
    // Quantidade de registros com presenca.
    private Long presencas;
    // Quantidade de registros com ausencia.
    private Long faltas;
    // Quantidade de registros com atraso.
    private Long atrasos;
    // Valor de frequencia calculado para o indicador.
    private Double frequencia;
}
