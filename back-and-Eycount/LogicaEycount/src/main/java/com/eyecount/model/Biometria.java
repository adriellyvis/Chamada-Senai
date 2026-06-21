package com.eyecount.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "biometria")
public class Biometria {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @Column(name = "embedding_facial", nullable = false, columnDefinition = "TEXT")
    private String embeddingFacial;

    @Column(nullable = false)
    private String tipo = "face";

    private Boolean ativo = true;

    @Column(name = "data_cadastro")
    private LocalDateTime dataCadastro;

    public Biometria() {}

    @PrePersist
    public void prePersist() {
        if (dataCadastro == null) {
            dataCadastro = LocalDateTime.now();
        }
    }

    // getters e setters

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public Usuario getUsuario() {
        return usuario;
    }

    public void setUsuario(Usuario usuario) {
        this.usuario = usuario;
    }

    public String getEmbeddingFacial() {
        return embeddingFacial;
    }

    public void setEmbeddingFacial(String embeddingFacial) {
        this.embeddingFacial = embeddingFacial;
    }

    public String getTipo() {
        return tipo;
    }

    public void setTipo(String tipo) {
        this.tipo = tipo;
    }

    public Boolean getAtivo() {
        return ativo;
    }

    public void setAtivo(Boolean ativo) {
        this.ativo = ativo;
    }

    public LocalDateTime getDataCadastro() {
        return dataCadastro;
    }

    public void setDataCadastro(LocalDateTime dataCadastro) {
        this.dataCadastro = dataCadastro;
    }
}