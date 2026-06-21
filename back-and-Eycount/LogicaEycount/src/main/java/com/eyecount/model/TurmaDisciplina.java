package com.eyecount.model;

import jakarta.persistence.*;

@Entity
@Table(name = "turma_disciplina")
public class TurmaDisciplina {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne
    @JoinColumn(name = "turma_id", nullable = false)
    private Turma turma;

    @ManyToOne
    @JoinColumn(name = "disciplina_id", nullable = false)
    private Disciplina disciplina;

    @ManyToOne
    @JoinColumn(name = "professor_id", nullable = false)
    private Professor professor;

    public Integer getId() {
        return id;
    }

    public Turma getTurma() {
        return turma;
    }

    public Disciplina getDisciplina() {
        return disciplina;
    }


    public Professor getProfessor() {
        return professor;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public void setTurma(Turma turma) {
        this.turma = turma;
    }

    public void setDisciplina(Disciplina disciplina) {
        this.disciplina = disciplina;
    }

    public void setProfessor(Professor professor) {
        this.professor = professor;
    }

}