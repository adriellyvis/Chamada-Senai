package prezence.agenda;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import prezence.model.Perfil;
import prezence.model.Usuario;
import prezence.repository.UsuarioRepository;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/** Testa a identidade da agenda sem acessar o banco real. */
class PreZenceAgendaIdentidadeProviderTest {
    private final UsuarioRepository repositorio = mock(UsuarioRepository.class);
    private final PreZenceAgendaIdentidadeProvider provider =
            new PreZenceAgendaIdentidadeProvider(repositorio);

    @AfterEach
    void limparContexto() {
        RequestContextHolder.resetRequestAttributes();
    }

    private MockHttpServletRequest prepararRequisicao(Integer id, String perfil) {
        MockHttpServletRequest request = new MockHttpServletRequest();
        if (id != null) request.setAttribute("usuarioId", id);
        if (perfil != null) request.setAttribute("perfil", perfil);
        RequestContextHolder.setRequestAttributes(new ServletRequestAttributes(request));
        return request;
    }

    private Usuario usuario(Integer id, String nomeDoPerfil, boolean ativo) {
        Usuario usuario = new Usuario();
        usuario.setId(id);
        usuario.setNome("Pessoa de teste");
        usuario.setAtivo(ativo);
        Perfil perfil = new Perfil();
        perfil.setNome(nomeDoPerfil);
        usuario.setPerfil(perfil);
        return usuario;
    }

    @Test
    void recebeIdentidadeValidaInseridaPeloFiltro() {
        prepararRequisicao(5, "gestor");
        when(repositorio.findById(5)).thenReturn(Optional.of(usuario(5, "GESTOR", true)));
        AgendaIdentidade identidade = provider.usuarioAutenticado();
        assertEquals(5L, identidade.usuarioId());
        assertEquals(AgendaPerfil.GESTOR, identidade.perfil());
        assertEquals("Pessoa de teste", identidade.nome());
    }

    @Test
    void exigeAtributosDoFiltroNaoHeaderDeUsuario() {
        MockHttpServletRequest request = prepararRequisicao(null, null);
        request.addHeader("X-User-Id", "5");
        request.addHeader("X-Perfil", "gestor");
        AgendaApiException erro = assertThrows(AgendaApiException.class, provider::usuarioAutenticado);
        assertEquals(401, erro.getStatus());
        verifyNoInteractions(repositorio);
    }

    @Test
    void rejeitaUsuarioInativo() {
        prepararRequisicao(5, "gestor");
        when(repositorio.findById(5)).thenReturn(Optional.of(usuario(5, "gestor", false)));
        assertEquals(401, assertThrows(AgendaApiException.class, provider::usuarioAutenticado).getStatus());
    }

    @Test
    void rejeitaPerfilInconsistente() {
        prepararRequisicao(5, "gestor");
        when(repositorio.findById(5)).thenReturn(Optional.of(usuario(5, "professor", true)));
        assertEquals(403, assertThrows(AgendaApiException.class, provider::usuarioAutenticado).getStatus());
    }

    @Test
    void rejeitaPerfilDesconhecido() {
        prepararRequisicao(5, "suporte");
        when(repositorio.findById(5)).thenReturn(Optional.of(usuario(5, "suporte", true)));
        assertEquals(403, assertThrows(AgendaApiException.class, provider::usuarioAutenticado).getStatus());
    }
}
