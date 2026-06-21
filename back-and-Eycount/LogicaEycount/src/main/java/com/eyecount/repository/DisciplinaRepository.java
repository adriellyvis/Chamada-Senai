package com.eyecount.repository;

import com.eyecount.model.Disciplina;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface DisciplinaRepository extends JpaRepository<Disciplina, Integer> {
    Optional<Disciplina> findByNome(String nome);
    Optional<Disciplina> findByNomeIgnoreCase(String nome);
}