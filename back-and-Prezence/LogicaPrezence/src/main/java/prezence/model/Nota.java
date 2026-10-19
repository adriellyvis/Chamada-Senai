package prezence.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(
        name = "notas",
        indexes = {
                @Index(name = "idx_nota_aluno", columnList = "aluno_id"),
                @Index(name = "idx_nota_vinculo", columnList = "turma_disciplina_id"),
                @Index(name = "idx_nota_bimestre", columnList = "bimestre")
        }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Nota {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "aluno_id", nullable = false)
    private Aluno aluno;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "turma_disciplina_id", nullable = false)
    private TurmaDisciplina turmaDisciplina;

    @Column(nullable = false, length = 100)
    private String titulo;

    @Column(nullable = false)
    private Double nota;

    @Column(name = "nota_maxima", nullable = false)
    private Double notaMaxima = 10.0;

    @Column
    private Integer bimestre;

    @Column(length = 500)
    private String observacao;

    @Column(name = "data_avaliacao")
    private LocalDate dataAvaliacao;

    @Column(
            name = "data_criacao",
            nullable = false,
            updatable = false
    )
    private LocalDateTime dataCriacao;

    @PrePersist
    private void prePersist() {

        if (notaMaxima == null) {
            notaMaxima = 10.0;
        }

        if (dataCriacao == null) {
            dataCriacao = LocalDateTime.now();
        }
    }
}