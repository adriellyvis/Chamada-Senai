package com.eyecount.dto.biometria;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class BiometriaResponseDTO {

    private Integer id;
    private Integer usuarioId;
    private String nomeUsuario;
    private String perfil;
    private String embeddingFacial;
    private Boolean ativo;
}