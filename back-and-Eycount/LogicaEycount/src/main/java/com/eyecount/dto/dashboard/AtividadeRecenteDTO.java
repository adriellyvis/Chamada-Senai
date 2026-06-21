package com.eyecount.dto.dashboard;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AtividadeRecenteDTO {
    private String titulo;
    private String descricao;
    private String tipo;
    private LocalDateTime data;


}