package com.eyecount.inutilizados.error;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class ErroDTO {
    private int status;
    private String mensagem;

}