package eyecount.dto.biometria;

import lombok.AllArgsConstructor;
import lombok.Data;
/*
 * DTO BiometriaResponseDTO. DTO usado para transportar somente os dados necessarios entre o
 * backend e o front.
 */

@Data
@AllArgsConstructor
public class BiometriaResponseDTO {

    // Identificador unico do registro.
    private Integer id;
    // Identificador usado para relacionar ou filtrar usuario.
    private Integer usuarioId;
    // Nome exibido ou usado para identificar o dado.
    private String nomeUsuario;
    // Perfil de acesso relacionado ao usuario.
    private String perfil;
    // Representacao numerica usada na biometria facial.
    private String embeddingFacial;
    // Indica se o registro esta ativo no sistema.
    private Boolean ativo;
}
