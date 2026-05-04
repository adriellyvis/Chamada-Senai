package com.eyecount.dto;

public class GestorTurmaDetalheDTO {
    private Integer id;
    private String nome;
    private String curso;
    private String professorResponsavel;
    private Integer totalAlunos;
    private Double frequenciaMedia;
    private Integer alunosEmRisco;

    public GestorTurmaDetalheDTO(Integer id, String nome, String curso, String professorResponsavel, Integer totalAlunos, Double frequenciaMedia, Integer alunosEmRisco) {
        this.id = id;
        this.nome = nome;
        this.curso = curso;
        this.professorResponsavel = professorResponsavel;
        this.totalAlunos = totalAlunos;
        this.frequenciaMedia = frequenciaMedia;
        this.alunosEmRisco = alunosEmRisco;
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

    public String getProfessorResponsavel() {
        return professorResponsavel;
    }

    public void setProfessorResponsavel(String professorResponsavel) {
        this.professorResponsavel = professorResponsavel;
    }

    public Integer getTotalAlunos() {
        return totalAlunos;
    }

    public void setTotalAlunos(Integer totalAlunos) {
        this.totalAlunos = totalAlunos;
    }

    public Double getFrequenciaMedia() {
        return frequenciaMedia;
    }

    public void setFrequenciaMedia(Double frequenciaMedia) {
        this.frequenciaMedia = frequenciaMedia;
    }

    public Integer getAlunosEmRisco() {
        return alunosEmRisco;
    }

    public void setAlunosEmRisco(Integer alunosEmRisco) {
        this.alunosEmRisco = alunosEmRisco;
    }
}
