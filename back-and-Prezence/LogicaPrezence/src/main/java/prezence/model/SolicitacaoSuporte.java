package prezence.model;

import jakarta.persistence.*;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;


@Entity
@Table(name = "solicitacoes_suporte")
@Getter
@Setter
@NoArgsConstructor
public class SolicitacaoSuporte {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;


    @Column(
            nullable = false,
            length = 120
    )
    private String nome;


    @Column(
            nullable = false,
            length = 160
    )
    private String email;


    @Column(
            nullable = false,
            length = 30
    )
    private String perfil;


    @Column(
            nullable = false,
            length = 120
    )
    private String assunto;


    @Column(
            nullable = false,
            columnDefinition = "TEXT"
    )
    private String mensagem;


    @Enumerated(EnumType.STRING)
    @Column(
            nullable = false,
            length = 20
    )
    private StatusSolicitacaoSuporte status;


    @Column(
            name = "resposta_gestor",
            columnDefinition = "TEXT"
    )
    private String respostaGestor;


    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "gestor_usuario_id")
    private Usuario gestorResponsavel;


    @Column(
            name = "data_criacao",
            nullable = false
    )
    private LocalDateTime dataCriacao;


    @Column(name = "data_atualizacao")
    private LocalDateTime dataAtualizacao;
}