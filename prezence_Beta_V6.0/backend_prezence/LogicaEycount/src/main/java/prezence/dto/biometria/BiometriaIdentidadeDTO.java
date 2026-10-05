package prezence.dto.biometria;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BiometriaIdentidadeDTO {

    private Integer usuarioId;

    private String nome;

    private String perfil;

    private List<BiometriaAmostraDTO> amostras;
}