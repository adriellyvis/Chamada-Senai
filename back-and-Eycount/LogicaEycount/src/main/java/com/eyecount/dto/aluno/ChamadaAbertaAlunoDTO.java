package com.eyecount.dto.aluno;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChamadaAbertaAlunoDTO {

    private Integer alunoId;
    private Integer aulaId;

    private String disciplina;
    private String professor;
    private String turma;

    private String dataAula;
    private String horaInicio;
    private String horaFim;

    private String status;
}