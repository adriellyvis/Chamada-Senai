package com.eyecount.dto.professor;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class PresencaAlunoProfessorDTO {
    private Integer alunoId;
    private String alunoNome;
    private String status;
    private String metodo;
    private Boolean validacaoBiometrica;
}