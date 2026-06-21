package com.eyecount.repository;

import com.eyecount.dto.professor.DesempenhoTurmaDTO;
import com.eyecount.model.Professor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ProfessorRepository extends JpaRepository<Professor, Integer> {
    Optional<Professor> findByUsuarioId(Integer usuarioId);


}