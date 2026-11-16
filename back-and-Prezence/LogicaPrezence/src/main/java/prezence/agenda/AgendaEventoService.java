package prezence.agenda;

import org.springframework.data.domain.Sort;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import jakarta.persistence.criteria.Predicate;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
public class AgendaEventoService {
    private final AgendaEventoRepository repositorio;
    private final AgendaIdentidadeProvider identidade;

    public AgendaEventoService(AgendaEventoRepository repositorio, AgendaIdentidadeProvider identidade) {
        this.repositorio = repositorio;
        this.identidade = identidade;
    }

    private AgendaIdentidade usuario() {
        AgendaIdentidade usuario = identidade.usuarioAutenticado();
        if (usuario == null) throw new AgendaApiException(401, "Autenticação necessária.");
        return usuario;
    }

    @Transactional(readOnly = true)
    public List<AgendaEventoResposta> listar(LocalDate inicio, LocalDate fim) {
        AgendaIdentidade leitor = usuario();
        if (inicio == null || fim == null || fim.isBefore(inicio) ||
            ChronoUnit.DAYS.between(inicio, fim) > 93) {
            throw new AgendaApiException(400, "Intervalo inválido; limite de 93 dias.");
        }
        LocalDateTime inicioInclusive = inicio.atStartOfDay();
        LocalDateTime fimExclusivo = fim.plusDays(1).atStartOfDay();
        Specification<AgendaEvento> filtro = (root, query, cb) -> {
            Predicate calendario = cb.and(cb.lessThan(root.get("inicio"), fimExclusivo),
                                          cb.greaterThan(root.get("fim"), inicioInclusive));
            Predicate instituicao = cb.equal(root.get("criadorPerfil"), AgendaPerfil.GESTOR);
            Predicate proprio = cb.and(
                cb.equal(root.get("criadorId"), leitor.usuarioId()),
                cb.equal(root.get("criadorPerfil"), leitor.perfil()),
                cb.equal(root.get("visibilidade"), AgendaVisibilidade.PRIVADO));
            Predicate publico;
            switch (leitor.perfil()) {
                case GESTOR -> publico = cb.and(instituicao,
                     cb.notEqual(root.get("visibilidade"), AgendaVisibilidade.PRIVADO));
                case PROFESSOR -> publico = cb.and(instituicao, root.get("visibilidade")
                     .in(AgendaVisibilidade.TODOS, AgendaVisibilidade.PROFESSORES));
                case ALUNO -> publico = cb.and(instituicao, root.get("visibilidade")
                     .in(AgendaVisibilidade.TODOS, AgendaVisibilidade.ALUNOS));
                default -> throw new AgendaApiException(403, "Perfil não permitido.");
            }
            return cb.and(calendario,
                leitor.perfil() == AgendaPerfil.ALUNO ? publico : cb.or(publico, proprio));
        };
        List<AgendaEvento> lista = repositorio.findAll(filtro,
            PageRequest.of(0, 2001, Sort.by("inicio").ascending())).getContent();
        // Resposta limitada para impedir uso excessivo do serviço; sem truncar silenciosamente.
        if (lista.size() > 2000) throw new AgendaApiException(413, "Há eventos demais para este período. Reduza o intervalo.");
        return lista.stream().map(AgendaEventoResposta::de).toList();
    }

    @Transactional
    public AgendaEventoResposta criar(AgendaEventoDados entrada) {
        AgendaIdentidade autor = usuario();
        AgendaEventoDados dados = AgendaValidacao.validar(entrada, autor);
        AgendaEvento evento = new AgendaEvento();
        evento.atribuirCriador(autor);
        evento.atualizarDados(dados);
        return AgendaEventoResposta.de(repositorio.saveAndFlush(evento));
    }

    @Transactional
    public AgendaEventoResposta editar(long id, AgendaEventoDados entrada) {
        AgendaIdentidade autor = usuario();
        AgendaEvento evento = obterGerenciavel(id, autor);
        AgendaEventoDados dados = AgendaValidacao.validar(entrada, autor);
        evento.atualizarDados(dados);
        return AgendaEventoResposta.de(repositorio.saveAndFlush(evento));
    }

    @Transactional
    public void excluir(long id) {
        AgendaIdentidade autor = usuario();
        AgendaEvento evento = obterGerenciavel(id, autor);
        repositorio.delete(evento);
    }

    private AgendaEvento obterGerenciavel(long id, AgendaIdentidade autor) {
        if (id <= 0) throw new AgendaApiException(400, "ID de evento inválido.");
        AgendaEvento evento = repositorio.findById(id)
            .orElseThrow(() -> new AgendaApiException(404, "Evento não encontrado."));
        if (!AgendaPermissoes.podeGerenciar(autor, evento.getCriadorId(), evento.getCriadorPerfil()))
            throw new AgendaApiException(403, "Você só pode alterar eventos criados por você.");
        return evento;
    }
}
