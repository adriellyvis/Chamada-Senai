package prezence.agenda;

/** Os valores devem vir de autenticação já verificada NO SERVIDOR. Nunca da requisição ou do localStorage. */
public record AgendaIdentidade(Long usuarioId, AgendaPerfil perfil, String nome) {
    public AgendaIdentidade {
        if (usuarioId == null || usuarioId <= 0 || perfil == null) {
            throw new IllegalArgumentException("Identidade autenticada inválida");
        }
        nome = nome == null ? "" : nome.trim();
    }
}
