package com.eyecount.dto;

public class GestorDashboardDTO {
    private Double mediaTurma;
    private Integer totalAlunos;
    private Integer aulasDadas;
    private Integer alertasEvasao;
    private Integer sensoresOnline;
    private Integer sensoresAtencao;
    private Integer sensoresOffline;

    public GestorDashboardDTO(
            Double mediaTurma,
            Integer totalAlunos,
            Integer aulasDadas,
            Integer alertasEvasao,
            Integer sensoresOnline,
            Integer sensoresAtencao,
            Integer sensoresOffline
    ) {
        this.mediaTurma = mediaTurma;
        this.totalAlunos = totalAlunos;
        this.aulasDadas = aulasDadas;
        this.alertasEvasao = alertasEvasao;
        this.sensoresOnline = sensoresOnline;
        this.sensoresAtencao = sensoresAtencao;
        this.sensoresOffline = sensoresOffline;
    }

    public Double getMediaTurma() {
        return mediaTurma;
    }

    public void setMediaTurma(Double mediaTurma) {
        this.mediaTurma = mediaTurma;
    }

    public Integer getTotalAlunos() {
        return totalAlunos;
    }

    public void setTotalAlunos(Integer totalAlunos) {
        this.totalAlunos = totalAlunos;
    }

    public Integer getAulasDadas() {
        return aulasDadas;
    }

    public void setAulasDadas(Integer aulasDadas) {
        this.aulasDadas = aulasDadas;
    }

    public Integer getAlertasEvasao() {
        return alertasEvasao;
    }

    public void setAlertasEvasao(Integer alertasEvasao) {
        this.alertasEvasao = alertasEvasao;
    }

    public Integer getSensoresOnline() {
        return sensoresOnline;
    }

    public void setSensoresOnline(Integer sensoresOnline) {
        this.sensoresOnline = sensoresOnline;
    }

    public Integer getSensoresAtencao() {
        return sensoresAtencao;
    }

    public void setSensoresAtencao(Integer sensoresAtencao) {
        this.sensoresAtencao = sensoresAtencao;
    }

    public Integer getSensoresOffline() {
        return sensoresOffline;
    }

    public void setSensoresOffline(Integer sensoresOffline) {
        this.sensoresOffline = sensoresOffline;
    }
}