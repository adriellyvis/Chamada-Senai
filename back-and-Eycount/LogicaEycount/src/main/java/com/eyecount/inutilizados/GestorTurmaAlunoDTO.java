package com.eyecount.inutilizados;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class GestorTurmaAlunoDTO {
    private Integer id;
    private String nome;
    private String matricula;
    private Double frequencia;
    private String status;

}
