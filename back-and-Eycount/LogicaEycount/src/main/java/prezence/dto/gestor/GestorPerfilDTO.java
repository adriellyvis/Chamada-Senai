package prezence.dto.gestor;

public record GestorPerfilDTO(
        Integer usuarioId,
        String nome,
        String email,
        String perfil,
        Boolean ativo,
        Integer totalUsuariosAtivos,
        Integer totalAlunosAtivos,
        Integer totalProfessoresAtivos,
        Integer totalTurmasAtivas,
        Integer totalDisciplinas,
        Integer ocorrenciasPendentes
) {
}