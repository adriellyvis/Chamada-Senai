package com.eyecount.dto.frequencia;


import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FrequenciaAlunoDTO {
    private Integer alunoId;
    private String nome;
    private String matricula;
    private Integer totalAulas;
    private Integer presencas;
    private Double frequencia;
    private String risco;

}