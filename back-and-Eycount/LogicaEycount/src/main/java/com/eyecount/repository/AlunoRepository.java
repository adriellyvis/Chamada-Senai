package com.eyecount.repository;

import com.eyecount.dto.professor.AlunoProfessorDTO;
import com.eyecount.model.Aluno;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface AlunoRepository extends JpaRepository<Aluno, Integer> {
    List<Aluno> findByTurmaId(Integer turmaId);
    Optional<Aluno> findByUsuarioId(Integer usuarioId);
    Optional<Aluno> findByUsuario_Id(Integer usuarioId);

    @Query("""
    SELECT new com.eyecount.dto.professor.AlunoProfessorDTO(
        a.id,
        u.nome,
        u.email,
        a.matricula,
        t.id,
        t.nome,
        COALESCE(
            (
                SUM(CASE WHEN p.status = 'presente' THEN 1 ELSE 0 END) * 100.0
            ) / NULLIF(COUNT(p.id), 0),
            0
        )
    )
    FROM Aluno a
    JOIN a.usuario u
    JOIN a.turma t
    JOIN TurmaDisciplina td ON td.turma.id = t.id
    LEFT JOIN Aula au ON au.turmaDisciplina.id = td.id
    LEFT JOIN Presenca p ON p.aluno.id = a.id AND p.aula.id = au.id
    WHERE td.professor.usuario.id = :usuarioId
      AND (:turmaId IS NULL OR t.id = :turmaId)
    GROUP BY a.id, u.nome, u.email, a.matricula, t.id, t.nome
""")
    List<AlunoProfessorDTO> buscarAlunosDoProfessor(
            @Param("usuarioId") Integer usuarioId,
            @Param("turmaId") Integer turmaId
    );

}