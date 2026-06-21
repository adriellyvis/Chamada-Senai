package com.eyecount.dto.turma.response;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class ItemDetalheDTO {
    private Integer id;
    private String nome;
    private String status;

}