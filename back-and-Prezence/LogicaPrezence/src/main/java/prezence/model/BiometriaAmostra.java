package prezence.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "biometria_amostras",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_biometria_ordem_amostra",
                        columnNames = {
                                "biometria_id",
                                "ordem_amostra"
                        }
                )
        },
        indexes = {
                @Index(
                        name = "idx_biometria_amostras_biometria",
                        columnList = "biometria_id"
                )
        }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class BiometriaAmostra {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;


    // =====================================================
    // BIOMETRIA DO USUÁRIO
    // =====================================================

    @ManyToOne(
            fetch = FetchType.LAZY,
            optional = false
    )
    @JoinColumn(
            name = "biometria_id",
            nullable = false
    )
    private Biometria biometria;


    // =====================================================
    // POSIÇÃO ENTRE AS 5 AMOSTRAS
    // =====================================================

    @Column(
            name = "ordem_amostra",
            nullable = false
    )
    private Integer ordemAmostra;


    /*
     * Exemplos:
     *
     * FRENTE
     * ESQUERDA
     * DIREITA
     * DISTANCIA
     * VARIACAO
     */
    @Column(
            name = "etapa",
            length = 40
    )
    private String etapa;


    // =====================================================
    // ROSTO NORMALIZADO
    // =====================================================

    @Lob
    @Column(
            name = "imagem_face",
            nullable = false,
            columnDefinition = "LONGBLOB"
    )
    private byte[] imagemFace;


    // =====================================================
    // DATA
    // =====================================================

    @Column(
            name = "data_cadastro",
            nullable = false,
            updatable = false
    )
    private LocalDateTime dataCadastro;


    @PrePersist
    private void prePersist() {

        if (dataCadastro == null) {
            dataCadastro =
                    LocalDateTime.now();
        }
    }
}