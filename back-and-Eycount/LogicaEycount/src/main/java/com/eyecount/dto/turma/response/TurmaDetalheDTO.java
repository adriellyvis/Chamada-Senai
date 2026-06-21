package com.eyecount.dto.turma.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TurmaDetalheDTO {
    private Integer id;
    private String nome;
    private String descricao;
    private Integer totalAlunos;
    private Integer totalProfessores;
    private Integer totalDisciplinas;
    private Boolean ativa;
    private String professor;
    private String disciplina;

}