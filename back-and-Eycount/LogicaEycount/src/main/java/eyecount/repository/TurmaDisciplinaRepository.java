package eyecount.repository;

import eyecount.dto.professor.TurmaProfessorDTO;
import eyecount.model.TurmaDisciplina;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
/*
 * Repository de TurmaDisciplina. Repository Spring Data responsavel pelas consultas e
 * operacoes de banco desta entidade.
 */

public interface TurmaDisciplinaRepository extends JpaRepository<TurmaDisciplina, Integer> {
    /*
     * Busca o primeiro registro que atende aos filtros descritos no metodo findFirstByTurmaId.
     */
    Optional<TurmaDisciplina> findFirstByTurmaId(Integer turmaId);
    /*
     * Busca registros aplicando os filtros descritos no metodo findByProfessorId.
     */
    List<TurmaDisciplina> findByProfessorId(Integer professorId);
    /*
     * Busca registros aplicando os filtros descritos no metodo findByTurmaId.
     */
    List<TurmaDisciplina> findByTurmaId(Integer turmaId);

    /*
     * Consulta JPQL personalizada executada pelo metodo buscarTurmasDoProfessorComResumo.
     */
    @Query("""
    SELECT new eyecount.dto.professor.TurmaProfessorDTO(
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
