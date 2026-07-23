package eyecount.dto.dashboard;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
/*
 * DTO AtividadeRecenteDTO. DTO usado para transportar somente os dados necessarios entre o
 * backend e o front.
 */

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AtividadeRecenteDTO {
    // Titulo resumido do registro.
    private String titulo;
    // Descricao detalhada do registro.
    private String descricao;
    // Tipo usado para classificar o registro.
    private String tipo;
    // Data relacionada ao registro.
    private LocalDateTime data;


}
