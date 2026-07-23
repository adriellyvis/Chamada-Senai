package eyecount.model;

import jakarta.persistence.*;
/*
 * Entidade TurmaDisciplina. Entidade que representa dados persistidos no banco e seus
 * relacionamentos.
 */

@Entity
@Table(name = "turma_disciplina")
public class TurmaDisciplina {
    // Identificador unico do registro.

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    // Turma relacionada a este registro.

    @ManyToOne
    @JoinColumn(name = "turma_id", nullable = false)
    private Turma turma;
    // Disciplina relacionada a este registro.

    @ManyToOne
    @JoinColumn(name = "disciplina_id", nullable = false)
    private Disciplina disciplina;
    // Professor relacionado a este registro.

    @ManyToOne
    @JoinColumn(name = "professor_id", nullable = false)
    private Professor professor;

    /*
     * Retorna o valor armazenado no campo Id.
     */
    public Integer getId() {
        return id;
    }

    /*
     * Retorna o valor armazenado no campo Turma.
     */
    public Turma getTurma() {
        return turma;
    }

    /*
     * Retorna o valor armazenado no campo Disciplina.
     */
    public Disciplina getDisciplina() {
        return disciplina;
    }


    /*
     * Retorna o valor armazenado no campo Professor.
     */
    public Professor getProfessor() {
        return professor;
    }

    /*
     * Atualiza o valor armazenado no campo Id.
     */
    public void setId(Integer id) {
        this.id = id;
    }

    /*
     * Atualiza o valor armazenado no campo Turma.
     */
    public void setTurma(Turma turma) {
        this.turma = turma;
    }

    /*
     * Atualiza o valor armazenado no campo Disciplina.
     */
    public void setDisciplina(Disciplina disciplina) {
        this.disciplina = disciplina;
    }

    /*
     * Atualiza o valor armazenado no campo Professor.
     */
    public void setProfessor(Professor professor) {
        this.professor = professor;
    }

}
