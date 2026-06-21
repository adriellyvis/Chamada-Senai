package com.eyecount.dto.turma;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalTime;
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TurmaDTO {
    private Integer id;
    private String nome;
    private String descricao;
    private String professor;
    private Integer professorId;
    private String disciplina;
    private Integer disciplinaId;
    private String sala;
    private LocalTime horarioInicio;
    private LocalTime  horarioFim;
    private Boolean ativo;


}