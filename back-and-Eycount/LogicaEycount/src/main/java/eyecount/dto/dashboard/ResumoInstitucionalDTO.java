package eyecount.dto.dashboard;
/*
 * DTO ResumoInstitucionalDTO. DTO usado para transportar somente os dados necessarios entre
 * o backend e o front.
 */

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
