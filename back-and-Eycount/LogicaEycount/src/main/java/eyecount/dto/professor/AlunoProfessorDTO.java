package eyecount.dto.professor;
/*
 * DTO AlunoProfessorDTO. DTO usado para transportar somente os dados necessarios entre o
 * backend e o front.
 */

public record AlunoProfessorDTO(
        Integer alunoId,
        String nome,
        String email,
        String matricula,
        Integer turmaId,
        String turma,
        Double frequencia
) {
}
