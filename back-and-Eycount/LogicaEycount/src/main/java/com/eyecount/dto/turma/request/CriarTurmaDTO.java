package com.eyecount.dto.turma.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CriarTurmaDTO {

    @NotBlank(message = "Nome da turma obrigatório")
    @Size(max = 100, message = "Nome da turma muito longo")
    private String nome;

    @NotBlank(message = "Descrição obrigatória")
    @Size(max = 255, message = "Descrição muito longa")
    private String descricao;
}