package com.eyecount.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;

@RestControllerAdvice
public class GlobalExceptionHandler {

    // =====================================================
    // VALIDAÇÃO DTO
    // =====================================================
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponseDTO> handleValidation(
            MethodArgumentNotValidException ex
    ) {
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
}