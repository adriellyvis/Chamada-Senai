package com.eyecount.exception;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
public class ErrorResponseDTO {
    private Integer status;
    private String erro;
    private String mensagem;
    private LocalDateTime data;

}