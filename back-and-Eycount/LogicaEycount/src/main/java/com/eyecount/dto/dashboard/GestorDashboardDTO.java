package com.eyecount.dto.dashboard;

import com.eyecount.dto.alerta.AlertaEvasaoDTO;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class GestorDashboardDTO {
    private Integer alunosRisco;

    private Integer ocorrenciasPendentes;
    private Integer ocorrenciasEmAnalise;
    private Integer ocorrenciasResolvidas;
    private Integer ocorrenciasCanceladas;

    private Double frequenciaGlobal;

    private List<AlertaEvasaoDTO> alertasEvasao;
    private List<AtividadeRecenteDTO> atividadesRecentes;
    private List<FrequenciaTurmaDTO> frequenciaTurmas;
}