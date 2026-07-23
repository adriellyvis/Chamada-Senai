package eyecount.repository;

import eyecount.model.Turma;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
/*
 * Repository de Turma. Repository Spring Data responsavel pelas consultas e operacoes de
 * banco desta entidade.
 */

public interface TurmaRepository extends JpaRepository<Turma, Integer> {
    /*
     * Consulta personalizada que conta os registros conforme as condicoes da JPQL.
     */
    @Query("""
    SELECT COUNT(t)
    FROM Turma t
""")
    Long countTurmasAtivas();

    /*
     * Consulta personalizada que conta os registros conforme as condicoes da JPQL.
     */
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
    long countByAtivoTrue();
    /*
     * Conta registros aplicando os filtros descritos no metodo countBy.
     */
    Long countBy();
}
