package eyecount.exception;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDateTime;
/*
 * Classe usada no tratamento e na padronizacao dos erros retornados pela API.
 */

@Data
@AllArgsConstructor
public class ErrorResponseDTO {
    // Status atual do registro.
    private Integer status;
    // Campo erro usado por esta classe.
    private String erro;
    // Campo mensagem usado por esta classe.
    private String mensagem;
    // Data relacionada ao registro.
    private LocalDateTime data;

}
