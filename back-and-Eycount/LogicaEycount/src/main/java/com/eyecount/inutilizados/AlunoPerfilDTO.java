package com.eyecount.inutilizados;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class AlunoPerfilDTO {
    private Integer id;
    private String nome;
    private String email;
    private String matricula;
    private String turma;

}