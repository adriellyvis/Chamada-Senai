package com.eyecount.dto.aluno;

import com.eyecount.model.MetodoPresenca;
import com.eyecount.model.StatusPresenca;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class HistoricoPresencaDTO {
    private Integer aulaId;
    private String disciplina;
    private LocalDate dataAula;
    private StatusPresenca status;
    private MetodoPresenca metodo;
    private LocalDateTime horarioRegistro;

}