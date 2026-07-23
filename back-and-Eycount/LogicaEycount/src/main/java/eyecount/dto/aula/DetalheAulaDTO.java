package eyecount.dto.aula;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
/*
 * DTO DetalheAulaDTO. DTO usado para transportar somente os dados necessarios entre o
 * backend e o front.
 */

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DetalheAulaDTO {
    // Identificador usado para relacionar ou filtrar aluno.
    private Integer alunoId;
    // Nome exibido ou usado para identificar o dado.
    private String nomeAluno;
    // Status atual do registro.
    private String status;
    // Data e hora em que a presenca foi registrada.
    private LocalDateTime horarioRegistro;
    // Metodo usado para realizar o registro.
    private String metodo;

}
