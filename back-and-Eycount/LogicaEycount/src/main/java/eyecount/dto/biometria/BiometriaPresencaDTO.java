package eyecount.dto.biometria;

import lombok.Data;
/*
 * DTO BiometriaPresencaDTO. DTO usado para transportar somente os dados necessarios entre o
 * backend e o front.
 */

@Data
public class BiometriaPresencaDTO {
    // Identificador usado para relacionar ou filtrar aluno.
    private Integer alunoId;
    // Identificador usado para relacionar ou filtrar aula.
    private Integer aulaId;

}
