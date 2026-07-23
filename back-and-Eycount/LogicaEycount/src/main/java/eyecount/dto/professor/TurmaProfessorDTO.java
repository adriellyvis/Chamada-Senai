package eyecount.dto.professor;
/*
 * DTO TurmaProfessorDTO. DTO usado para transportar somente os dados necessarios entre o
 * backend e o front.
 */

public record TurmaProfessorDTO(
        Integer turmaDisciplinaId,
        Integer turmaId,
        String nomeTurma,
        String disciplina,
        Long totalAlunos,
        String sala
) {
}
