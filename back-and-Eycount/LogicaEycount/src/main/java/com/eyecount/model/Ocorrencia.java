package com.eyecount.model;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "ocorrencias")
public class Ocorrencia {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne
    @JoinColumn(name = "aluno_id")
    private Aluno aluno;

    @ManyToOne
    @JoinColumn(name = "professor_id")
    private Professor professor;

    @Column(nullable = false, length = 150)
    private String titulo;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String descricao;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private GravidadeOcorrencia gravidade;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatusOcorrencia status;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TipoOcorrencia tipo;

    private LocalDateTime dataOcorrencia;

    @Column(name = "resposta_gestor", columnDefinition = "TEXT")
    private String respostaGestor;

    private LocalDateTime dataAtualizacao;

    public Ocorrencia() {

        this.dataOcorrencia =
                LocalDateTime.now();

        this.status =
                StatusOcorrencia.PENDENTE;
    }

    public Integer getId() {
        return id;
    }

    public Aluno getAluno() {
        return aluno;
    }

    public void setAluno(Aluno aluno) {
        this.aluno = aluno;
    }

    public Professor getProfessor() {
        return professor;
    }

    public void setProfessor(Professor professor) {
        this.professor = professor;
    }

    public String getTitulo() {
        return titulo;
    }

    public void setTitulo(String titulo) {
        this.titulo = titulo;
    }

    public String getDescricao() {
        return descricao;
    }

    public void setDescricao(String descricao) {
        this.descricao = descricao;
    }

    public GravidadeOcorrencia getGravidade() {
        return gravidade;
    }

    public void setGravidade(
            GravidadeOcorrencia gravidade
    ) {
        this.gravidade = gravidade;
    }

    public StatusOcorrencia getStatus() {
        return status;
    }

    public void setStatus(
            StatusOcorrencia status
    ) {
        this.status = status;
    }

    public TipoOcorrencia getTipo() {
        return tipo;
    }

    public void setTipo(
            TipoOcorrencia tipo
    ) {
        this.tipo = tipo;
    }

    public LocalDateTime getDataOcorrencia() {
        return dataOcorrencia;
    }

    public String getRespostaGestor() {
        return respostaGestor;
    }

    public void setRespostaGestor(String respostaGestor) {
        this.respostaGestor = respostaGestor;
    }

    public LocalDateTime getDataAtualizacao() {
        return dataAtualizacao;
    }

    public void setDataAtualizacao(LocalDateTime dataAtualizacao) {
        this.dataAtualizacao = dataAtualizacao;
    }

}