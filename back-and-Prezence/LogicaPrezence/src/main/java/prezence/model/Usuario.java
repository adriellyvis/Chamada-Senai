package prezence.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;import com.fasterxml.jackson.annotation.JsonProperty;

@Entity
@Table(name = "usuarios")
public class Usuario {
    // Identificador unico do registro.

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    // Nome usado para identificar o registro.

    @Column(nullable = false, length = 100)
    private String nome;
    // Email usado para contato ou autenticacao.

    @Column(nullable = false, unique = true, length = 100)
    private String email;
    // Senha associada ao usuario.

    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    @Column(nullable = false, length = 255)
    private String senha;

    @Column(nullable = false)
    private Boolean ativo = true;
    // Data e hora de criacao do registro.

    @Column(
            name = "data_criacao",
            nullable = false,
            updatable = false
    )
    private LocalDateTime dataCriacao = LocalDateTime.now();
    // Perfil de acesso relacionado ao usuario.

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "perfil_id")
    private Perfil perfil;

    /*
     * Retorna o valor armazenado no campo Id.
     */
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
     * Retorna o valor armazenado no campo Nome.
     */
    public String getNome() {
        return nome;
    }

    /*
     * Atualiza o valor armazenado no campo Nome.
     */
    public void setNome(String nome) {
        this.nome = nome;
    }

    /*
     * Retorna o valor armazenado no campo Email.
     */
    public String getEmail() {
        return email;
    }

    /*
     * Atualiza o valor armazenado no campo Email.
     */
    public void setEmail(String email) {
        this.email = email;
    }

    /*
     * Retorna o valor armazenado no campo Senha.
     */
    public String getSenha() {
        return senha;
    }

    /*
     * Atualiza o valor armazenado no campo Senha.
     */
    public void setSenha(String senha) {
        this.senha = senha;
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
     * Retorna o valor armazenado no campo DataCriacao.
     */
    public LocalDateTime getDataCriacao() {
        return dataCriacao;
    }

    /*
     * Atualiza o valor armazenado no campo DataCriacao.
     */
    public void setDataCriacao(LocalDateTime dataCriacao) {
        this.dataCriacao = dataCriacao;
    }

    /*
     * Retorna o valor armazenado no campo Perfil.
     */
    public Perfil getPerfil() {
        return perfil;
    }

    /*
     * Atualiza o valor armazenado no campo Perfil.
     */
    public void setPerfil(Perfil perfil) {
        this.perfil = perfil;
    }

    @PrePersist
    private void prepararAntesDeSalvar() {

        if (dataCriacao == null) {
            dataCriacao = LocalDateTime.now();
        }

        if (ativo == null) {
            ativo = true;
        }
    }

}
