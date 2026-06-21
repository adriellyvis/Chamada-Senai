package com.eyecount.dto.alerta;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AlertaEvasaoDTO {
    private Integer alunoId;
    private String nomeAluno;
    private String matricula;
    private String turma;
    private Double frequencia;
    private String nivelRisco;
}