package prezence.dto.biometria;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;


@Getter
@Setter
@NoArgsConstructor
public class BiometriaPythonValidacaoResponseDTO {

    private boolean valido;

    private Double similaridade;
}