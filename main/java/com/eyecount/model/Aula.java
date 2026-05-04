package com.eyecount.model;

import jakarta.persistence.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Entity
@Table(name = "aulas")
public class Aula {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne
    @JoinColumn(name = "turma_disciplina_id", nullable = false)
    private TurmaDisciplina turmaDisciplina;

    @Column(name = "data_aula", nullable = false)
    private LocalDate dataAula;

    @Column(name = "hora_inicio", nullable = false)
    private LocalTime horaInicio;

    @Column(name = "hora_fim", nullable = true)
    private LocalTime horaFim;

    @Column(length = 50)
    private String token;

    @Column(name = "token_expiracao")
    private LocalDateTime tokenExpiracao;

    @Enumerated(EnumType.STRING)
    private StatusAula status;

    public Aula() {}

    public Integer getId() {
        return id;
    }

    public TurmaDisciplina getTurmaDisciplina() {
        return turmaDisciplina;
    }

    public void setTurmaDisciplina(TurmaDisciplina turmaDisciplina) {
        this.turmaDisciplina = turmaDisciplina;
    }

    public LocalDate getDataAula() {
        return dataAula;
    }

    public void setDataAula(LocalDate dataAula) {
        this.dataAula = dataAula;
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

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public LocalDateTime getTokenExpiracao() {
        return tokenExpiracao;
    }

    public void setTokenExpiracao(LocalDateTime tokenExpiracao) {
        this.tokenExpiracao = tokenExpiracao;
    }

    public StatusAula getStatus() {
        return status;
    }

    public void setStatus(StatusAula status) {
        this.status = status;
    }
}