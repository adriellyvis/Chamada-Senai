package com.eyecount.repository;

import com.eyecount.model.Professor;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ProfessorRepository extends JpaRepository<Professor, Integer> {
    Optional<Professor> findByUsuarioId(Integer usuarioId);
}