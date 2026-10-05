package prezence.model;

import jakarta.persistence.*;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;


@Entity
@Table(name = "recuperacoes_senha")
@Getter
@Setter
@NoArgsConstructor
public class RecuperacaoSenha {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;


    @Column(
            name = "challenge_id",
            nullable = false,
            unique = true,
            length = 64
    )
    private String challengeId;


    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "usuario_id",
            nullable = false
    )
    private Usuario usuario;


    @Enumerated(EnumType.STRING)
    @Column(
            nullable = false,
            length = 30
    )
    private StatusRecuperacaoSenha status;


    @Column(
            nullable = false
    )
    private Integer tentativas = 0;


    @Column(
            name = "criado_em",
            nullable = false
    )
    private LocalDateTime criadoEm;


    @Column(
            name = "expira_em",
            nullable = false
    )
    private LocalDateTime expiraEm;


    @Column(
            name = "biometria_validada_em"
    )
    private LocalDateTime biometriaValidadaEm;


    @Column(
            name = "concluido_em"
    )
    private LocalDateTime concluidoEm;
}