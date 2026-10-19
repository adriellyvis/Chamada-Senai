package prezence.dto.biometria;

import lombok.Data;

@Data
public class BiometriaPresencaDTO {
    // Identificador usado para relacionar ou filtrar aluno.
    private Integer alunoId;
    // Identificador usado para relacionar ou filtrar aula.
    private Integer aulaId;

}
