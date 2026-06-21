package com.eyecount.dto.disciplina;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DisciplinaDTO {
    private Integer id;

    @NotBlank(message = "Nome da disciplina obrigatório")
    @Size(max = 100, message = "Nome da disciplina muito longo")
    private String nome;
}