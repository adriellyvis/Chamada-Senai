package com.eyecount.dto.turma.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AtualizarTurmaDTO {
    private String nome;
    private String descricao;
    private Boolean ativa;
    private Integer professorId;
    private Integer disciplinaId;

}