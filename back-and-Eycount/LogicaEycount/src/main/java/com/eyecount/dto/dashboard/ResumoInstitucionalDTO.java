package com.eyecount.dto.dashboard;

public record ResumoInstitucionalDTO(
        Integer usuariosAtivos,
        Integer professoresAtivos,
        Integer alunosAtivos,
        Integer turmasAtivas,
        Integer turmasSemProfessor,
        Integer chamadasHoje,
        Integer chamadasAbertas,
        Integer chamadasEncerradasHoje,
        Integer presencasHoje,
        Integer alunosAusentesHoje,
        Integer baixaFrequencia
) {
}