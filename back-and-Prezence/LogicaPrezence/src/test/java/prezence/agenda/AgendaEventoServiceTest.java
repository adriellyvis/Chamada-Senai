package prezence.agenda;

import org.junit.jupiter.api.Test;
import prezence.agenda.AgendaEventoRepository;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class AgendaEventoServiceTest {
    private final AgendaEventoRepository repositorio = mock(AgendaEventoRepository.class);
    private final AgendaIdentidadeProvider provedor = mock(AgendaIdentidadeProvider.class);
    private final AgendaEventoService service = new AgendaEventoService(repositorio, provedor);

    private final AgendaIdentidade gestor = new AgendaIdentidade(1L, AgendaPerfil.GESTOR, "Gestor");
    private final AgendaIdentidade professor = new AgendaIdentidade(2L, AgendaPerfil.PROFESSOR, "Professor");

    private AgendaEventoDados dados(AgendaVisibilidade visibilidade) {
        LocalDateTime inicio = LocalDateTime.of(2026, 11, 20, 10, 0);
        return new AgendaEventoDados("Reunião de teste", "", AgendaTipo.REUNIAO,
                inicio, inicio.plusHours(1), "Sala 1", visibilidade);
    }

    @Test
    void professorNaoPodeCriarEventoParaTodos() {
        when(provedor.usuarioAutenticado()).thenReturn(professor);
        AgendaApiException erro = assertThrows(AgendaApiException.class,
                () -> service.criar(dados(AgendaVisibilidade.TODOS)));
        assertEquals(403, erro.getStatus());
        verifyNoInteractions(repositorio);
    }

    @Test
    void professorNaoPodeAlterarEventoDoGestor() {
        when(provedor.usuarioAutenticado()).thenReturn(professor);
        AgendaEvento evento = new AgendaEvento();
        evento.atribuirCriador(gestor);
        when(repositorio.findById(42L)).thenReturn(Optional.of(evento));
        AgendaApiException erro = assertThrows(AgendaApiException.class,
                () -> service.editar(42L, dados(AgendaVisibilidade.PRIVADO)));
        assertEquals(403, erro.getStatus());
        verify(repositorio, never()).saveAndFlush(any());
    }

    @Test
    void professorNaoPodeExcluirEventoDoGestor() {
        when(provedor.usuarioAutenticado()).thenReturn(professor);
        AgendaEvento evento = new AgendaEvento();
        evento.atribuirCriador(gestor);
        when(repositorio.findById(42L)).thenReturn(Optional.of(evento));
        AgendaApiException erro = assertThrows(AgendaApiException.class, () -> service.excluir(42L));
        assertEquals(403, erro.getStatus());
        verify(repositorio, never()).delete(any());
    }

    @Test
    void rejeitaConsultaDePeriodoInvalido() {
        when(provedor.usuarioAutenticado()).thenReturn(gestor);
        AgendaApiException erro = assertThrows(AgendaApiException.class,
                () -> service.listar(java.time.LocalDate.of(2026, 1, 1), java.time.LocalDate.of(2026, 7, 1)));
        assertEquals(400, erro.getStatus());
        verifyNoInteractions(repositorio);
    }
}
