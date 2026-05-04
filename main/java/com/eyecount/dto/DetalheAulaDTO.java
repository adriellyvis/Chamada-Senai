package com.eyecount.dto;

import java.time.LocalDateTime;

public class DetalheAulaDTO {

    private Integer alunoId;
    private String nomeAluno;
    private String status;
    private LocalDateTime horarioRegistro;
    private String metodo;

    public DetalheAulaDTO(
            Integer alunoId,
            String nomeAluno,
            String status,
            LocalDateTime horarioRegistro,
            String metodo
    ) {
        this.alunoId = alunoId;
        this.nomeAluno = nomeAluno;
        this.status = status;
        this.horarioRegistro = horarioRegistro;
        this.metodo = metodo;
    }

    public Integer getAlunoId() {
        return alunoId;
    }

    public String getNomeAluno() {
        return nomeAluno;
    }

    public String getStatus() {
        return status;
    }

    public LocalDateTime getHorarioRegistro() {
        return horarioRegistro;
    }

    public String getMetodo() {
        return metodo;
    }
}