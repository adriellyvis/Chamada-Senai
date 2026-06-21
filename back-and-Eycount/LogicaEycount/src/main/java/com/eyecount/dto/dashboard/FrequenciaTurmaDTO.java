package com.eyecount.dto.dashboard;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FrequenciaTurmaDTO  {
    private Integer id;
    private String turma;
    private Long totalAlunos;
    private Double frequencia;
    private Long alunosEmRisco;
    private Double percentualRisco;

}