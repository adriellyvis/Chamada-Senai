package com.eyecount.dto.aluno;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AlunoDashboardDTO {
    private String nome;
    private String turma;
    private String matricula;
    private Double frequencia;
    private Integer totalPresencas;
    private Integer totalFaltas;
    private Integer totalOcorrencias;
    private String statusRisco;

}