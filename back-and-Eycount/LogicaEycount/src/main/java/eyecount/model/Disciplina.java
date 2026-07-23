package eyecount.model;

import jakarta.persistence.*;
/*
 * Entidade Disciplina. Entidade que representa dados persistidos no banco e seus
 * relacionamentos.
 */

@Entity
@Table(name = "disciplinas")
public class Disciplina {
    // Identificador unico do registro.

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    // Nome usado para identificar o registro.

    @Column(nullable = false, unique = true, length = 100)
    private String nome;

    /*
     * Construtor usado para criar a classe e receber suas dependencias ou dados.
     */
    public Disciplina() {}

    /*
     * Retorna o valor armazenado no campo Id.
     */
    public Integer getId() {
        return id;
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
