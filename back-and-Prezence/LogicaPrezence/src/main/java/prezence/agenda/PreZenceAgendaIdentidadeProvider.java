package prezence.agenda;

import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestAttributes;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import prezence.model.Usuario;
import prezence.repository.UsuarioRepository;

import java.util.Locale;

/**
 * Usa SOMENTE os atributos confiáveis inseridos pelo JwtFilter após verificar
 * assinatura/validade do JWT e a conta ativa. Nunca lê ID ou perfil do JSON/headers.
 */
@Component
public class PreZenceAgendaIdentidadeProvider implements AgendaIdentidadeProvider {

    private final UsuarioRepository usuarioRepository;

    public PreZenceAgendaIdentidadeProvider(UsuarioRepository usuarioRepository) {
        this.usuarioRepository = usuarioRepository;
    }

    @Override
    public AgendaIdentidade usuarioAutenticado() {
        RequestAttributes atributos = RequestContextHolder.getRequestAttributes();
        if (!(atributos instanceof ServletRequestAttributes servlet)) {
            throw new AgendaApiException(401, "Autenticação necessária.");
        }

        // Atributos inseridos no servidor pelo JwtFilter SOMENTE após validação.
        Object id = servlet.getRequest().getAttribute("usuarioId");
        Object perfilJwt = servlet.getRequest().getAttribute("perfil");
        if (!(id instanceof Integer usuarioId) || usuarioId <= 0 ||
            !(perfilJwt instanceof String perfilDoFiltro)) {
            throw new AgendaApiException(401, "Autenticação necessária.");
        }

        // Nova verificação no banco: não usar identidade/role vindo do navegador.
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new AgendaApiException(401, "Usuário não encontrado."));
        if (!Boolean.TRUE.equals(usuario.getAtivo())) {
            throw new AgendaApiException(401, "Conta inativa.");
        }
        if (usuario.getPerfil() == null || usuario.getPerfil().getNome() == null) {
            throw new AgendaApiException(403, "Usuário sem perfil válido.");
        }

        String perfilAtual = usuario.getPerfil().getNome().trim().toUpperCase(Locale.ROOT);
        if (!perfilAtual.equals(perfilDoFiltro.trim().toUpperCase(Locale.ROOT))) {
            throw new AgendaApiException(403, "Perfil autenticado inconsistente.");
        }
        AgendaPerfil perfil;
        try {
            perfil = AgendaPerfil.valueOf(perfilAtual);
        } catch (IllegalArgumentException erro) {
            throw new AgendaApiException(403, "Este perfil não pode acessar a agenda.");
        }

        return new AgendaIdentidade(usuarioId.longValue(), perfil, usuario.getNome());
    }
}
