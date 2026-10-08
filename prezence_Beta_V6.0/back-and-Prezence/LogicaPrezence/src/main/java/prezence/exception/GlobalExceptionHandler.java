package prezence.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;

import org.springframework.validation.FieldError;

import org.springframework.web.HttpRequestMethodNotSupportedException;

import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingRequestHeaderException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import org.springframework.web.server.ResponseStatusException;

import org.springframework.web.servlet.resource.NoResourceFoundException;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;
import lombok.extern.slf4j.Slf4j;


/*
 * Tratamento global e padronizado dos erros da API.
 */
@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {


    // =====================================================
    // VALIDAÇÃO DE DTO
    // =====================================================

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponseDTO> tratarValidacao(
            MethodArgumentNotValidException erro
    ) {

        FieldError fieldError =
                erro
                        .getBindingResult()
                        .getFieldError();


        String mensagem =
                fieldError != null
                        ? fieldError.getField()
                        + ": "
                        + fieldError.getDefaultMessage()
                        : "Dados inválidos.";


        ErrorResponseDTO resposta =
                new ErrorResponseDTO(
                        HttpStatus.BAD_REQUEST.value(),
                        HttpStatus.BAD_REQUEST.name(),
                        mensagem,
                        LocalDateTime.now()
                );


        return ResponseEntity
                .badRequest()
                .body(resposta);
    }


    // =====================================================
    // JSON INVÁLIDO
    // =====================================================

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Map<String, Object>> tratarJsonInvalido(
            HttpMessageNotReadableException erro
    ) {

        Map<String, Object> resposta =
                new LinkedHashMap<>();


        resposta.put(
                "status",
                HttpStatus.BAD_REQUEST.value()
        );

        resposta.put(
                "erro",
                HttpStatus.BAD_REQUEST.name()
        );

        resposta.put(
                "mensagem",
                "JSON inválido. Verifique datas, horários e valores enviados."
        );

        resposta.put(
                "data",
                LocalDateTime.now()
        );


        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(resposta);
    }


    // =====================================================
    // RESPONSE STATUS EXCEPTION
    //
    // Preserva corretamente 400, 403, 404 etc.
    // =====================================================

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, Object>> tratarResponseStatus(
            ResponseStatusException erro
    ) {

        Map<String, Object> resposta =
                new LinkedHashMap<>();


        resposta.put(
                "status",
                erro.getStatusCode().value()
        );

        resposta.put(
                "erro",
                erro.getStatusCode().toString()
        );

        resposta.put(
                "mensagem",
                erro.getReason() != null
                        ? erro.getReason()
                        : "Erro na requisição."
        );

        resposta.put(
                "data",
                LocalDateTime.now()
        );


        return ResponseEntity
                .status(erro.getStatusCode())
                .body(resposta);
    }


    // =====================================================
    // RECURSO NÃO ENCONTRADO - 404
    // =====================================================

    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<Map<String, Object>> tratarNaoEncontrado(
            NoResourceFoundException erro
    ) {

        Map<String, Object> resposta =
                new LinkedHashMap<>();


        resposta.put(
                "status",
                HttpStatus.NOT_FOUND.value()
        );

        resposta.put(
                "erro",
                HttpStatus.NOT_FOUND.name()
        );

        resposta.put(
                "mensagem",
                "Recurso não encontrado."
        );

        resposta.put(
                "data",
                LocalDateTime.now()
        );


        return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(resposta);
    }


    // =====================================================
    // MÉTODO HTTP NÃO PERMITIDO - 405
    // =====================================================

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<Map<String, Object>> tratarMetodoNaoPermitido(
            HttpRequestMethodNotSupportedException erro
    ) {

        Map<String, Object> resposta =
                new LinkedHashMap<>();


        resposta.put(
                "status",
                HttpStatus.METHOD_NOT_ALLOWED.value()
        );

        resposta.put(
                "erro",
                HttpStatus.METHOD_NOT_ALLOWED.name()
        );

        resposta.put(
                "mensagem",
                "Método HTTP não permitido para este recurso."
        );

        resposta.put(
                "data",
                LocalDateTime.now()
        );


        return ResponseEntity
                .status(HttpStatus.METHOD_NOT_ALLOWED)
                .body(resposta);
    }


    // =====================================================
    // HEADER OBRIGATÓRIO AUSENTE - 400
    // =====================================================

    @ExceptionHandler(MissingRequestHeaderException.class)
    public ResponseEntity<Map<String, Object>> tratarHeaderAusente(
            MissingRequestHeaderException erro
    ) {

        Map<String, Object> resposta =
                new LinkedHashMap<>();


        resposta.put(
                "status",
                HttpStatus.BAD_REQUEST.value()
        );

        resposta.put(
                "erro",
                HttpStatus.BAD_REQUEST.name()
        );

        resposta.put(
                "mensagem",
                "Cabeçalho obrigatório ausente: "
                        + erro.getHeaderName()
        );

        resposta.put(
                "data",
                LocalDateTime.now()
        );


        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(resposta);
    }


    // =====================================================
    // ERRO INTERNO NÃO PREVISTO - 500
    // =====================================================

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponseDTO> tratarErroInterno(
            Exception erro
    ) {

        /*
         * Mantemos o stack trace no console durante
         * o desenvolvimento para conseguirmos diagnosticar
         * erros inesperados.
         */
        log.error("Erro interno não tratado pela API", erro);


        ErrorResponseDTO resposta =
                new ErrorResponseDTO(
                        HttpStatus.INTERNAL_SERVER_ERROR.value(),
                        HttpStatus.INTERNAL_SERVER_ERROR.name(),
                        "Erro interno do servidor.",
                        LocalDateTime.now()
                );


        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(resposta);
    }
}