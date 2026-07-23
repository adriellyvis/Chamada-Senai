package eyecount.model;

import jakarta.persistence.*;

import java.time.LocalDate;
/*
 * Entidade Aluno. Entidade que representa dados persistidos no banco e seus
 * relacionamentos.
 */

@Entity
@Table(name = "alunos")
public class Aluno {
    // Identificador unico do registro.

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    // Usuario relacionado a este registro.

    @OneToOne
    @JoinColumn(name = "usuario_id", nullable = false, unique = true)
    private Usuario usuario;
    // Turma relacionada a este registro.

    @ManyToOne
    @JoinColumn(name = "turma_id", nullable = false)
    private Turma turma;
    // Matricula academica do aluno.

    @Column(nullable = false, unique = true, length = 50)
    private String matricula;
    // Data relacionada a este campo.

    @Column(name = "data_nascimento")
    private LocalDate dataNascimento;

    /*
     * Construtor usado para criar a classe e receber suas dependencias ou dados.
     */
    public Aluno() {}

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
     * Retorna o valor armazenado no campo Turma.
     */
    public Turma getTurma() {
        return turma;
    }

    /*
     * Atualiza o valor armazenado no campo Turma.
     */
    public void setTurma(Turma turma) {
        this.turma = turma;
    }

    /*
     * Retorna o valor armazenado no campo Matricula.
     */
    public String getMatricula() {
        return matricula;
    }

    /*
     * Atualiza o valor armazenado no campo Matricula.
     */
    public void setMatricula(String matricula) {
        this.matricula = matricula;
    }

    /*
     * Retorna o valor armazenado no campo DataNascimento.
     */
    public LocalDate getDataNascimento() {
        return dataNascimento;
    }

    /*
     * Atualiza o valor armazenado no campo DataNascimento.
     */
    public void setDataNascimento(LocalDate dataNascimento) {
        this.dataNascimento = dataNascimento;
    }

}
