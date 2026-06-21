package com.eyecount.inutilizados;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UsuarioResumoDTO {
    private Integer id;
    private String nome;
    private String email;
    private String perfil;
    private Boolean ativo;

}