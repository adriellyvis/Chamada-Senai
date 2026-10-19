package prezence.dto.professor;

public record DesempenhoTurmaDTO(
        Integer turmaId,
        String turma,
        Long presencas,
        Long atrasos,
        Long faltas
) {
}
