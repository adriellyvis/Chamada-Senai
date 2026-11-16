package prezence.agenda;

/** Regras puras, também verificadas nos filtros do banco e nas operações. */
public final class AgendaPermissoes {
    private AgendaPermissoes() { }

    public static boolean podeVisualizar(AgendaIdentidade leitor, long criadorId,
                                        AgendaPerfil criadorPerfil, AgendaVisibilidade visibilidade) {
        if (leitor == null || criadorPerfil == null || visibilidade == null) return false;
        if (visibilidade == AgendaVisibilidade.PRIVADO) {
            return leitor.usuarioId() == criadorId && leitor.perfil() == criadorPerfil;
        }
        if (criadorPerfil != AgendaPerfil.GESTOR) return false;
        return switch (leitor.perfil()) {
            case GESTOR -> true;
            case PROFESSOR -> visibilidade == AgendaVisibilidade.TODOS ||
                               visibilidade == AgendaVisibilidade.PROFESSORES;
            case ALUNO -> visibilidade == AgendaVisibilidade.TODOS ||
                          visibilidade == AgendaVisibilidade.ALUNOS;
        };
    }

    public static boolean podeCriar(AgendaIdentidade autor, AgendaVisibilidade visibilidade) {
        if (autor == null || visibilidade == null) return false;
        return switch (autor.perfil()) {
            case GESTOR -> true;
            case PROFESSOR -> visibilidade == AgendaVisibilidade.PRIVADO;
            case ALUNO -> false;
        };
    }

    public static boolean podeGerenciar(AgendaIdentidade autor, long criadorId,
                                       AgendaPerfil criadorPerfil) {
        return autor != null && autor.perfil() != AgendaPerfil.ALUNO &&
               autor.usuarioId() == criadorId && autor.perfil() == criadorPerfil;
    }
}
