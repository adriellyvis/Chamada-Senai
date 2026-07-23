package eyecount.dto.professor;
/*
 * DTO DesempenhoTurmaDTO. DTO usado para transportar somente os dados necessarios entre o
 * backend e o front.
 */

public record DesempenhoTurmaDTO(
        Integer turmaId,
        String turma,
        Long presencas,
        Long atrasos,
        Long faltas
) {
}
