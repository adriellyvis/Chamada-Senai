package com.eyecount.model;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "presencas")
public class Presenca {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne
    @JoinColumn(name = "aluno_id", nullable = false)
    private Aluno aluno;

    @ManyToOne
    @JoinColumn(name = "aula_id", nullable = false)
    private Aula aula;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatusPresenca status;

    @Column(name = "horario_registro")
    private LocalDateTime horarioRegistro;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MetodoPresenca metodo;

    @Column(name = "validacao_biometrica")
    private Boolean validacaoBiometrica = false;

    public Presenca() {}

    public Integer getId() {
        return id;
    }

    public Aluno getAluno() {
        return aluno;
    }

    public void setAluno(Aluno aluno) {
        this.aluno = aluno;
    }

    public Aula getAula() {
        return aula;
    }

    public void setAula(Aula aula) {
        this.aula = aula;
    }

    public StatusPresenca getStatus() {
        return status;
    }

    public void setStatus(StatusPresenca status) {
        this.status = status;
    }

    public LocalDateTime getHorarioRegistro() {
        return horarioRegistro;
    }

    public void setHorarioRegistro(LocalDateTime horarioRegistro) {
        this.horarioRegistro = horarioRegistro;
    }

    public MetodoPresenca getMetodo() {
        return metodo;
    }

    public void setMetodo(MetodoPresenca metodo) {
        this.metodo = metodo;
    }

    public Boolean getValidacaoBiometrica() {
        return validacaoBiometrica;
    }

    public void setValidacaoBiometrica(Boolean validacaoBiometrica) {
        this.validacaoBiometrica = validacaoBiometrica;
    }

}