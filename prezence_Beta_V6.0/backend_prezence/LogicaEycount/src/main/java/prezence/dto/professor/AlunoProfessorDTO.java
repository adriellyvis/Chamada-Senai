package prezence.dto.professor;

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
