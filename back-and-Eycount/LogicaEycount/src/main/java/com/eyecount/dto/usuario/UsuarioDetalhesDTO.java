package com.eyecount.dto.usuario;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class UsuarioDetalhesDTO {
    private Integer id;
    private String nome;
    private String email;
    private String perfil;

    // pro aluno
    private String turma;
    private String matricula;
    private Double frequencia;

    // pro professor
    private String especialidade;

    // pro gerais
    private Integer ocorrencias;

}