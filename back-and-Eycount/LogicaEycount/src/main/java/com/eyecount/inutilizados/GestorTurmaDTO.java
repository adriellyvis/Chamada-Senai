package com.eyecount.inutilizados;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class GestorTurmaDTO {
    private Integer id;
    private String nome;
    private String curso;
    private Integer totalAlunos;
    private String professorResponsavel;

}
