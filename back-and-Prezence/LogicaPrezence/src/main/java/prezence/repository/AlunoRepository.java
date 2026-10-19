package prezence.repository;

import prezence.dto.professor.AlunoProfessorDTO;
import prezence.model.Aluno;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;


@SuppressWarnings("ALL")
public interface AlunoRepository
        extends JpaRepository<Aluno, Integer> {


    List<Aluno> findByTurmaId(
            Integer turmaId
    );


    Optional<Aluno> findByUsuarioId(
            Integer usuarioId
    );


    Optional<Aluno> findByUsuario_Id(
            Integer usuarioId
    );


    Optional<Aluno> findByMatricula(
            String matricula
    );


    Optional<Aluno>
    findByMatriculaAndDigitoRaAndUfIgnoreCase(
            String matricula,
            String digitoRa,
            String uf
    );


    @Query("""
    SELECT DISTINCT new prezence.dto.professor.AlunoProfessorDTO(
        a.id,
        u.nome,
        u.email,
        a.matricula,
        t.id,
        t.nome,
        0.0
    )
    FROM Aluno a
    JOIN a.usuario u
    JOIN a.turma t
    JOIN TurmaDisciplina td
        ON td.turma.id = t.id
    WHERE td.professor.usuario.id = :usuarioId
      AND (
            :turmaId IS NULL
            OR t.id = :turmaId
      )
    """)
    List<AlunoProfessorDTO> buscarAlunosDoProfessor(
            @Param("usuarioId") Integer usuarioId,
            @Param("turmaId") Integer turmaId
    );
}