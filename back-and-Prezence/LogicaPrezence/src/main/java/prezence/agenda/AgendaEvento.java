package prezence.agenda;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "agenda_eventos", indexes = {
    @Index(name = "idx_agenda_intervalo", columnList = "inicio,fim"),
    @Index(name = "idx_agenda_autor", columnList = "criador_id,criador_perfil")
})
public class AgendaEvento {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, length = 120) private String titulo;
    @Column(nullable = false, length = 1500) private String descricao = "";
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 20)
    private AgendaTipo tipo;
    @Column(nullable = false) private LocalDateTime inicio;
    @Column(nullable = false) private LocalDateTime fim;
    @Column(name = "local_evento", nullable = false, length = 120)
    private String local = "";
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 20)
    private AgendaVisibilidade visibilidade;
    @Column(name = "criador_id", nullable = false, updatable = false) private Long criadorId;
    @Enumerated(EnumType.STRING) @Column(name = "criador_perfil", length = 20, nullable = false, updatable = false)
    private AgendaPerfil criadorPerfil;
    @Column(name = "criador_nome", nullable = false, length = 120, updatable = false)
    private String criadorNome = "";
    @Column(name = "criado_em", nullable = false, updatable = false) private LocalDateTime criadoEm;
    @Column(name = "atualizado_em", nullable = false) private LocalDateTime atualizadoEm;

    @PrePersist void antesDeCriar() {
        criadoEm = LocalDateTime.now(); atualizadoEm = criadoEm;
    }
    @PreUpdate void antesDeAtualizar() { atualizadoEm = LocalDateTime.now(); }

    public void atualizarDados(AgendaEventoDados d) {
        titulo = d.titulo(); descricao = d.descricao(); tipo = d.tipo();
        inicio = d.inicio(); fim = d.fim(); local = d.local(); visibilidade = d.visibilidade();
    }
    public void atribuirCriador(AgendaIdentidade autor) {
        if (criadorId != null) throw new IllegalStateException("Criador já atribuído");
        criadorId = autor.usuarioId(); criadorPerfil = autor.perfil();
        criadorNome = autor.nome().length() > 120 ? autor.nome().substring(0, 120) : autor.nome();
    }
    public Long getId() { return id; }
    public String getTitulo() { return titulo; }
    public String getDescricao() { return descricao; }
    public AgendaTipo getTipo() { return tipo; }
    public LocalDateTime getInicio() { return inicio; }
    public LocalDateTime getFim() { return fim; }
    public String getLocal() { return local; }
    public AgendaVisibilidade getVisibilidade() { return visibilidade; }
    public Long getCriadorId() { return criadorId; }
    public AgendaPerfil getCriadorPerfil() { return criadorPerfil; }
    public String getCriadorNome() { return criadorNome; }
    public LocalDateTime getCriadoEm() { return criadoEm; }
    public LocalDateTime getAtualizadoEm() { return atualizadoEm; }
}
