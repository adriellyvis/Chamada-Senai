package prezence.dto.biometria;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BiometriaAmostraDTO {

    private Integer ordemAmostra;

    private String etapa;

    /*
     * JPEG/PNG convertido para Base64 pelo Python.
     *
     * Não precisa conter:
     * data:image/jpeg;base64,...
     *
     * Pode enviar somente o Base64.
     */
    private String imagemBase64;
}