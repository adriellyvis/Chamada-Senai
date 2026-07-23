package eyecount.model;

import jakarta.persistence.*;
/*
 * Entidade Professor. Entidade que representa dados persistidos no banco e seus
 * relacionamentos.
 */

@Entity
@Table(name = "professores")
public class Professor {
    // Identificador unico do registro.

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    // Usuario relacionado a este registro.

    @OneToOne
    @JoinColumn(name = "usuario_id", nullable = false, unique = true)
    private Usuario usuario;
    // Especialidade informada para o professor.

    @Column(length = 100)
    private String especialidade;

    /*
     * Construtor usado para criar a classe e receber suas dependencias ou dados.
     */
    public Professor() {}

    /*
     * Retorna o valor armazenado no campo Id.
     */
    public Integer getId() {
        return id;
    }

    /*
     * Retorna o valor armazenado no campo Usuario.
     */
    public Usuario getUsuario() {
        return usuario;
    }

    /*
     * Atualiza o valor armazenado no campo Usuario.
     */
    public void setUsuario(Usuario usuario) {
        this.usuario = usuario;
    }

    /*
     * Retorna o valor armazenado no campo Especialidade.
     */
    public String getEspecialidade() {
        return especialidade;
    }

    /*
     * Atualiza o valor armazenado no campo Especialidade.
     */
    public void setEspecialidade(String especialidade) {
        this.especialidade = especialidade;
    }

}
