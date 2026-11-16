package prezence.agenda;

import java.time.LocalDateTime;

/** JSON recebido: deliberadamente SEM id/criadorId/criadorPerfil. */
public record AgendaEventoDados(
    String titulo, String descricao, AgendaTipo tipo,
    LocalDateTime inicio, LocalDateTime fim, String local,
    AgendaVisibilidade visibilidade
) { }
