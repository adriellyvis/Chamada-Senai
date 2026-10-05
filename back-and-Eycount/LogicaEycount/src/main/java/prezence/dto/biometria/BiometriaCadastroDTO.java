package prezence.dto.biometria;

import lombok.Data;

@Data
public class BiometriaCadastroDTO {

    // Identificador usado para relacionar ou filtrar usuario.
    private Integer usuarioId;
    // Representacao numerica usada na biometria facial.
    private String embeddingFacial;
}
