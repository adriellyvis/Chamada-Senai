package com.eyecount.dto;

import com.eyecount.model.StatusAula;
import java.time.LocalDate;
import java.time.LocalTime;

public class HistoricoAulaDTO {

    private Integer id;
    private String turma;
    private LocalDate data;
    private LocalTime horaInicio;
    private LocalTime horaFim;
    private StatusAula status;

    public HistoricoAulaDTO() {
    }

    public HistoricoAulaDTO(Integer id, String turma, LocalDate data,
                            LocalTime horaInicio, LocalTime horaFim, StatusAula status) {
        this.id = id;
        this.turma = turma;
        this.data = data;
        this.horaInicio = horaInicio;
        this.horaFim = horaFim;
        this.status = status;
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getTurma() {
        return turma;
    }

    public void setTurma(String turma) {
        this.turma = turma;
    }

    public LocalDate getData() {
        return data;
    }

    public void setData(LocalDate data) {
        this.data = data;
    }

    public LocalTime getHoraInicio() {
        return horaInicio;
    }

    public void setHoraInicio(LocalTime horaInicio) {
        this.horaInicio = horaInicio;
    }

    public LocalTime getHoraFim() {
        return horaFim;
    }

    public void setHoraFim(LocalTime horaFim) {
        this.horaFim = horaFim;
    }

    public StatusAula getStatus() {
        return status;
    }

    public void setStatus(StatusAula status) {
        this.status = status;
    }
}