package com.eyecount.dto.aula;


import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AlunoChamadaDTO {
    private Integer alunoId;
    private String nome;
    private String status;

}
