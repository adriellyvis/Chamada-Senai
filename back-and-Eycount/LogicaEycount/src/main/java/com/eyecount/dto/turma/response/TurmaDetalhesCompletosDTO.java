package com.eyecount.dto.turma.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import java.util.List;

@Data
@AllArgsConstructor
public class TurmaDetalhesCompletosDTO {
    private Integer id;
    private String nome;
    private String descricao;
    private Boolean ativa;

    private List<ItemDetalheDTO> alunos;
    private List<ItemDetalheDTO> professores;
    private List<ItemDetalheDTO> disciplinas;
}