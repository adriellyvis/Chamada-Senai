package prezence.agenda;


public final class AgendaValidacao {
    private AgendaValidacao() { }

    public static AgendaEventoDados validar(AgendaEventoDados entrada, AgendaIdentidade autor) {
        if (entrada == null) throw new AgendaApiException(400, "Informe os dados do evento.");
        String titulo = entrada.titulo() == null ? "" : entrada.titulo().trim();
        String descricao = entrada.descricao() == null ? "" : entrada.descricao().trim();
        String local = entrada.local() == null ? "" : entrada.local().trim();
        if (titulo.length() < 3 || titulo.length() > 120)
            throw new AgendaApiException(400, "O título deve ter de 3 a 120 caracteres.");
        if (descricao.length() > 1500 || local.length() > 120)
            throw new AgendaApiException(400, "Descrição ou local excede o limite de tamanho.");
        if (entrada.tipo() == null || entrada.visibilidade() == null)
            throw new AgendaApiException(400, "Categoria ou público não informado.");
        if (entrada.inicio() == null || entrada.fim() == null || !entrada.fim().isAfter(entrada.inicio()))
            throw new AgendaApiException(400, "Data final deve ser posterior à data inicial.");
        if (entrada.fim().isAfter(entrada.inicio().plusDays(31)))
            throw new AgendaApiException(400, "Um evento não pode ultrapassar 31 dias.");
        if (!AgendaPermissoes.podeCriar(autor, entrada.visibilidade()))
            throw new AgendaApiException(403, "Perfil sem permissão para criar ou publicar este evento.");
        return new AgendaEventoDados(titulo, descricao, entrada.tipo(), entrada.inicio(),
                                     entrada.fim(), local, entrada.visibilidade());
    }
}
