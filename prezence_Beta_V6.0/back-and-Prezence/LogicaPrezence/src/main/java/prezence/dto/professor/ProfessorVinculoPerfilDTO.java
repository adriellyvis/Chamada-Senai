package prezence.dto.professor;

public record ProfessorVinculoPerfilDTO(
        Integer turmaDisciplinaId,
        Integer turmaId,
        String turma,
        Integer disciplinaId,
        String disciplina
) {
}