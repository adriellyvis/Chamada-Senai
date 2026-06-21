package com.eyecount.dto.biometria;

import lombok.Data;

@Data
public class BiometriaCadastroDTO {

    private Integer usuarioId;
    private String embeddingFacial;
}