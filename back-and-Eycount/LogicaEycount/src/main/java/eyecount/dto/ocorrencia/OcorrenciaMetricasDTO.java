package eyecount.dto.ocorrencia;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
/*
 * DTO OcorrenciaMetricasDTO. DTO usado para transportar somente os dados necessarios entre
 * o backend e o front.
 */

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OcorrenciaMetricasDTO {
    // Quantidade total usada nos indicadores.
    private Long total;
    // Quantidade de ocorrencias pendentes.
    private Long pendentes;
    // Quantidade de ocorrencias resolvidas.
    private Long resolvidas;
    // Quantidade de ocorrencias de gravidade alta.
    private Long graves;
    // Quantidade de ocorrencias de gravidade media.
    private Long medias;
    // Quantidade de ocorrencias de gravidade baixa.
    private Long leves;

}
