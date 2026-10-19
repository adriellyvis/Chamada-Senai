package prezence.dto.biometria;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CadastroBiometriaBancoDTO {

    private Integer usuarioId;

    private String tipo;

    private List<BiometriaAmostraDTO> amostras;
}
