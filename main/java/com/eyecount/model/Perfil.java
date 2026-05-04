package com.eyecount.model;

import jakarta.persistence.*;

@Entity
@Table(name = "perfis")
public class Perfil {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false, unique = true, length = 50)
    private String nome; // aluno, professor, gestor

    // =========================
    // CONSTRUTOR
    // =========================
    public Perfil() {
    }

    // =========================
    // GETTERS E SETTERS
    // =========================

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
}