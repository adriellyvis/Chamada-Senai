package eyecount.model;

import jakarta.persistence.*;
/*
 * Entidade Perfil. Entidade que representa dados persistidos no banco e seus
 * relacionamentos.
 */

@Entity
@Table(name = "perfis")
public class Perfil {
    // Identificador unico do registro.

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false, unique = true, length = 50)
    private String nome; // Todos aluno, professor, gestor


    /*
     * Construtor usado para criar a classe e receber suas dependencias ou dados.
     */
    public Perfil() {}

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

}
