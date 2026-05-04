package com.eyecount.dto;

public class GestorTurmaAlunoDTO {
    private Integer id;
    private String nome;
    private String matricula;
    private Double frequencia;
    private String status;

    public GestorTurmaAlunoDTO(Integer id, String nome, String matricula, Double frequencia, String status) {
        this.id = id;
        this.nome = nome;
        this.matricula = matricula;
        this.frequencia = frequencia;
        this.status = status;
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

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
