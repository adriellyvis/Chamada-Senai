package prezence.exception;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDateTime;
/*
 * Classe usada no tratamento e na padronizacao dos erros retornados pela API.
 */

@Data
@AllArgsConstructor
public class ErrorResponseDTO {
    private Integer status;
    private String erro;
    private String mensagem;
    private LocalDateTime data;

}
