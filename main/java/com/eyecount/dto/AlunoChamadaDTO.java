package com.eyecount.dto;

public class AlunoChamadaDTO {
    private Integer alunoId;
    private String nome;
    private String status;

    public AlunoChamadaDTO(Integer alunoId, String nome, String status) {
        this.alunoId = alunoId;
        this.nome = nome;
        this.status = status;
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

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
