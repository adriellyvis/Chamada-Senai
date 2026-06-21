package com.eyecount.dto.professor;

import com.eyecount.dto.alerta.AlertaEvasaoDTO;
import com.eyecount.dto.aula.HistoricoAulaDTO;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProfessorDashboardDTO {
    private Integer totalTurmas;
    private Integer totalAlunos;
    private Double frequenciaMedia;
    private Integer aulasRealizadas;

    private List<HistoricoAulaDTO> aulasRecentes;
    private List<AlertaEvasaoDTO> alunosRisco;
}