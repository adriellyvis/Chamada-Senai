package prezence.dto.auth;

import lombok.AllArgsConstructor;
import lombok.Getter;


@Getter
@AllArgsConstructor
public class RecuperacaoBiometriaResponseDTO {

    private boolean biometriaValidada;

    private Integer tentativasRestantes;

    private String mensagem;
}