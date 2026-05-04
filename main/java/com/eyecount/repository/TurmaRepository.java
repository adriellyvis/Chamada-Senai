package com.eyecount.repository;

import com.eyecount.model.Turma;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface TurmaRepository extends JpaRepository<Turma, Integer> {

    @Query("""
        SELECT td.turma
        FROM TurmaDisciplina td
        WHERE td.professor.id = :professorId
    """)
    List<Turma> findTurmasByProfessorId(Integer professorId);
}