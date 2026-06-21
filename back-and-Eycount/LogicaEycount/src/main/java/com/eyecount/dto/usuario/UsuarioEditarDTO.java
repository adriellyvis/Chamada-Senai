package com.eyecount.dto.usuario;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UsuarioEditarDTO {

    @NotBlank(message = "Nome obrigatório")
    @Size(max = 100, message = "Nome muito longo")
    private String nome;

    @NotBlank(message = "Email obrigatório")
    @Email(message = "Email inválido")
    @Size(max = 100, message = "Email muito longo")
    private String email;

    private Boolean ativo;
    private Integer turmaId;
    private String especialidade;

}