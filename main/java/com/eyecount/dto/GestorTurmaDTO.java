package com.eyecount.dto;

public class GestorTurmaDTO {
    private Integer id;
    private String nome;
    private String curso;
    private Integer totalAlunos;
    private String professorResponsavel;

    public GestorTurmaDTO(Integer id, String nome, String curso, Integer totalAlunos, String professorResponsavel) {
        this.id = id;
        this.nome = nome;
        this.curso = curso;
        this.totalAlunos = totalAlunos;
        this.professorResponsavel = professorResponsavel;
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getNome() {
        return nome;
    }

    public void setNome(String nome) {
        this.nome = nome;
    }

    public String getCurso() {
        return curso;
    }

    public void setCurso(String curso) {
        this.curso = curso;
    }

    public Integer getTotalAlunos() {
        return totalAlunos;
    }

    public void setTotalAlunos(Integer totalAlunos) {
        this.totalAlunos = totalAlunos;
    }

    public String getProfessorResponsavel() {
        return professorResponsavel;
    }

    public void setProfessorResponsavel(String professorResponsavel) {
        this.professorResponsavel = professorResponsavel;
    }
}
