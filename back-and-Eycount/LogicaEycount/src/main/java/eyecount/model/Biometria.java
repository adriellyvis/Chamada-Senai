package eyecount.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
/*
 * Entidade Biometria. Entidade que representa dados persistidos no banco e seus
 * relacionamentos.
 */

@Entity
@Table(name = "biometria")
public class Biometria {
    // Identificador unico do registro.

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    // Usuario relacionado a este registro.

    @lombok.Setter
    @ManyToOne
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;
    // Representacao numerica usada na biometria facial.

    @Column(name = "embedding_facial", nullable = false, columnDefinition = "TEXT")
    private String embeddingFacial;
    // Tipo usado para classificar o registro.

    @Column(nullable = false)
    private String tipo = "face";

    // Indica se o registro esta ativo no sistema.
    private Boolean ativo = true;
    // Data relacionada a este campo.

    @Column(name = "data_cadastro")
    private LocalDateTime dataCadastro;

    /*
     * Construtor usado para criar a classe e receber suas dependencias ou dados.
     */
    public Biometria() {}

    /*
     * Metodo prePersist responsavel por executar esta operacao.
     */
    @PrePersist
    public void prePersist() {
        if (dataCadastro == null) {
            dataCadastro = LocalDateTime.now();
        }
    }

    // getters e setters

    public Integer getId() {
        return id;
    }

    /*
     * Atualiza o valor armazenado no campo Id.
     */
    public void setId(Integer id) {
        this.id = id;
    }

    /*
     * Retorna o valor armazenado no campo Usuario.
     */
    public Usuario getUsuario() {
        return usuario;
    }

    /*
     * Retorna o valor armazenado no campo EmbeddingFacial.
     */
    public String getEmbeddingFacial() {
        return embeddingFacial;
    }

    /*
     * Atualiza o valor armazenado no campo EmbeddingFacial.
     */
    public void setEmbeddingFacial(String embeddingFacial) {
        this.embeddingFacial = embeddingFacial;
    }

    /*
     * Retorna o valor armazenado no campo Tipo.
     */
    public String getTipo() {
        return tipo;
    }

    /*
     * Atualiza o valor armazenado no campo Tipo.
     */
    public void setTipo(String tipo) {
        this.tipo = tipo;
    }

    /*
     * Retorna o valor armazenado no campo Ativo.
     */
    public Boolean getAtivo() {
        return ativo;
    }

    /*
     * Atualiza o valor armazenado no campo Ativo.
     */
    public void setAtivo(Boolean ativo) {
        this.ativo = ativo;
    }

    /*
     * Retorna o valor armazenado no campo DataCadastro.
     */
    public LocalDateTime getDataCadastro() {
        return dataCadastro;
    }

    /*
     * Atualiza o valor armazenado no campo DataCadastro.
     */
    public void setDataCadastro(LocalDateTime dataCadastro) {
        this.dataCadastro = dataCadastro;
    }
}
