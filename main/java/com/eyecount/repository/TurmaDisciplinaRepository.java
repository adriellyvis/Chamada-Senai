package com.eyecount.repository;

import com.eyecount.model.TurmaDisciplina;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TurmaDisciplinaRepository extends JpaRepository<TurmaDisciplina, Integer> {
    Optional<TurmaDisciplina> findFirstByTurmaId(Integer turmaId);

    List<TurmaDisciplina> findByProfessorId(Integer professorId);
}