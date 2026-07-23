package eyecount.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;
/*
 * Classe usada no tratamento e na padronizacao dos erros retornados pela API.
 */

@RestControllerAdvice
public class GlobalExceptionHandler {

    // =====================================================
    // VALIDAÇÃO DTO
    // =====================================================
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponseDTO> handleValidation(
            MethodArgumentNotValidException ex
    ) {
        // Monta os dados do erro e devolve a resposta HTTP correspondente.
        FieldError fieldError = ex.getBindingResult().getFieldError();

        String mensagem = fieldError != null
                        ? fieldError.getDefaultMessage()
                        : "Dados inválidos";

        ErrorResponseDTO erro = new ErrorResponseDTO(
                HttpStatus.BAD_REQUEST.value(),
                HttpStatus.BAD_REQUEST.name(),
                mensagem,
                LocalDateTime.now()
        );

        return ResponseEntity
                .badRequest()
                .body(erro);
    }

    // =====================================================
    // RESPONSE STATUS
    // =====================================================
    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<ErrorResponseDTO> handleResponseStatus(
            ResponseStatusException ex
    ) {
        // Monta os dados do erro e devolve a resposta HTTP correspondente.
        ErrorResponseDTO erro = new ErrorResponseDTO(
                ex.getStatusCode().value(),
                ex.getStatusCode().toString(),
                ex.getReason(),
                LocalDateTime.now()
        );

        return ResponseEntity
                .status(ex.getStatusCode())
                .body(erro);
    }

    // =====================================================
    // ERRO GENÉRICO
    // =====================================================

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponseDTO> handleGeneric(
            Exception ex
    ) {
        // Monta os dados do erro e devolve a resposta HTTP correspondente.
        ErrorResponseDTO erro = new ErrorResponseDTO(
                HttpStatus.INTERNAL_SERVER_ERROR.value(),
                HttpStatus.INTERNAL_SERVER_ERROR.name(),
                "Erro interno do servidor",
                LocalDateTime.now()
        );
        ex.printStackTrace();

        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(erro);
    }

    /*
     * Interpreta a excecao e monta uma resposta de erro padronizada.
     */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Map<String, Object>> tratarJsonInvalido(
            HttpMessageNotReadableException exception
    ) {
        // Monta os dados do erro e devolve a resposta HTTP correspondente.
        Map<String, Object> resposta = new LinkedHashMap<>();

        resposta.put("status", 400);
        resposta.put("erro", "BAD_REQUEST");
        resposta.put(
                "mensagem",
                "JSON inválido. Verifique datas, horários e valores enviados"
        );
        resposta.put("data", LocalDateTime.now());

        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(resposta);
    }
}
