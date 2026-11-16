package prezence.agenda;

import java.time.LocalDateTime;
import java.util.Locale;

/** Propriedades compatíveis com core/agenda-eventos-api.js. */
public record AgendaEventoResposta(
    Long id, String titulo, String descricao, AgendaTipo tipo,
    LocalDateTime inicio, LocalDateTime fim, String local,
    AgendaVisibilidade visibilidade, Long criadorId,
    String criadorPerfil, String criadorNome,
    LocalDateTime criadoEm, LocalDateTime atualizadoEm
) {
    public static AgendaEventoResposta de(AgendaEvento e) {
        return new AgendaEventoResposta(e.getId(), e.getTitulo(), e.getDescricao(), e.getTipo(),
            e.getInicio(), e.getFim(), e.getLocal(), e.getVisibilidade(), e.getCriadorId(),
            e.getCriadorPerfil().name().toLowerCase(Locale.ROOT), e.getCriadorNome(),
            e.getCriadoEm(), e.getAtualizadoEm());
    }
}
