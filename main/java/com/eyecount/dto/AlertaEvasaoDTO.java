package com.eyecount.dto;

public class AlertaEvasaoDTO {
    private Integer alunoId;
    private String nome;
    private String matricula;
    private Double frequencia;
    private String risco;

    public AlertaEvasaoDTO(Integer alunoId, String nome, String matricula, Double frequencia, String risco) {
        this.alunoId = alunoId;
        this.nome = nome;
        this.matricula = matricula;
        this.frequencia = frequencia;
        this.risco = risco;
    }

    public Integer getAlunoId() {
        return alunoId;
    }

    public void setAlunoId(Integer alunoId) {
        this.alunoId = alunoId;
    }

    public String getNome() {
        return nome;
    }

    public void setNome(String nome) {
        this.nome = nome;
    }

    public String getMatricula() {
        return matricula;
    }

    public void setMatricula(String matricula) {
        this.matricula = matricula;
    }

    public Double getFrequencia() {
        return frequencia;
    }

    public void setFrequencia(Double frequencia) {
        this.frequencia = frequencia;
    }

    public String getRisco() {
        return risco;
    }

    public void setRisco(String risco) {
        this.risco = risco;
    }
}