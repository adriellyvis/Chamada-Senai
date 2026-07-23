package eyecount.dto.biometria;

import lombok.Data;
/*
 * DTO BiometriaCadastroDTO. DTO usado para transportar somente os dados necessarios entre o
 * backend e o front.
 */

@Data
public class BiometriaCadastroDTO {

    // Identificador usado para relacionar ou filtrar usuario.
    private Integer usuarioId;
    // Representacao numerica usada na biometria facial.
    private String embeddingFacial;
}
