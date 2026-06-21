package com.eyecount.dto.usuario;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProfessorResumoDTO {
    private Integer id;
    private String nome;
    private String email;
    private String especialidade;

}
