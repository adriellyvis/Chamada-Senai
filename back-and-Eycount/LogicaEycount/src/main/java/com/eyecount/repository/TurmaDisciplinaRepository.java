package com.eyecount.repository;

import com.eyecount.dto.professor.TurmaProfessorDTO;
import com.eyecount.model.TurmaDisciplina;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface TurmaDisciplinaRepository extends JpaRepository<TurmaDisciplina, Integer> {
    Optional<TurmaDisciplina> findFirstByTurmaId(Integer turmaId);
    List<TurmaDisciplina> findByProfessorId(Integer professorId);
    List<TurmaDisciplina> findByTurmaId(Integer turmaId);

    @Query("""
    SELECT new com.eyecount.dto.professor.TurmaProfessorDTO(
        td.id,
        t.id,
        t.nome,
        d.nome,
        COUNT(a.id),
        t.sala
    )
    FROM TurmaDisciplina td
    JOIN td.turma t
    JOIN td.disciplina d
    JOIN td.professor p
    LEFT JOIN Aluno a ON a.turma.id = t.id
    WHERE p.usuario.id = :usuarioId
    GROUP BY td.id, t.id, t.nome, d.nome, t.sala
""")
    List<TurmaProfessorDTO> buscarTurmasDoProfessorComResumo(
            @Param("usuarioId") Integer usuarioId
    );
}