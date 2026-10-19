package prezence.dto.presenca;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import prezence.model.MetodoPresenca;
import prezence.model.StatusPresenca;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class PresencaDTO {

    private Integer alunoId;
    private Integer aulaId;
    private StatusPresenca status;
    private MetodoPresenca metodo;
}