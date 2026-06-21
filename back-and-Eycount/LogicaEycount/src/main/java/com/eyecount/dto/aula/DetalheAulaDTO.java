package com.eyecount.dto.aula;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DetalheAulaDTO {
    private Integer alunoId;
    private String nomeAluno;
    private String status;
    private LocalDateTime horarioRegistro;
    private String metodo;

}