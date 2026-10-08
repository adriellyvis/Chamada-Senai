package prezence.dto.professor;

import java.util.List;

public record ProfessorPerfilDTO(
        Integer usuarioId,
        Integer professorId,
        String nome,
        String email,
        String especialidade,
        String perfil,
        Boolean ativo,
        Integer totalTurmas,
        Integer totalDisciplinas,
        Integer totalAlunos,
        Integer totalAulas,
        List<ProfessorVinculoPerfilDTO> vinculos
) {
}