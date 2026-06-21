package com.eyecount.repository;

import com.eyecount.model.Turma;
import com.eyecount.model.TurmaDisciplina;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface TurmaRepository extends JpaRepository<Turma, Integer> {
    @Query("""
    SELECT COUNT(t)
    FROM Turma t
""")
    Long countTurmasAtivas();

    @Query("""
    SELECT COUNT(t)
    FROM Turma t
    WHERE NOT EXISTS (
        SELECT td
        FROM TurmaDisciplina td
        WHERE td.turma = t
        AND td.professor IS NOT NULL
    )
""")
    Long countTurmasSemProfessor();

    Long countBy();
}