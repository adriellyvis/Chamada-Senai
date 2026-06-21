package com.eyecount.inutilizados;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TurmaDisciplinaDTO {
    private Integer id;
    private String turma;
    private String disciplina;
    private String professor;

}