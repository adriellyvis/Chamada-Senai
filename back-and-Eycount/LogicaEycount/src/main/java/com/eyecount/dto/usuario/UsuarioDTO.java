package com.eyecount.dto.usuario;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UsuarioDTO {
    private Integer id;
    private String nome;
    private String email;
    private String perfil;
    private Boolean ativo;
    private Integer turmaId;

}