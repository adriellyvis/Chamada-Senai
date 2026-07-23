package eyecount.repository;

import eyecount.dto.aula.HistoricoAulaDTO;
import eyecount.model.Aula;
import eyecount.model.StatusAula;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
/*
 * Repository de Aula. Repository Spring Data responsavel pelas consultas e operacoes de
 * banco desta entidade.
 */

public interface AulaRepository extends JpaRepository<Aula, Integer> {
    /*
     * Busca registros aplicando os filtros descritos no metodo findByTurmaDisciplina_IdAndDataAulaAndStatus.
     */
    Optional<Aula> findByTurmaDisciplina_IdAndDataAulaAndStatus(
            Integer turmaDisciplinaId,
            LocalDate dataAula,
            StatusAula status
    );
    /*
     * Busca registros aplicando os filtros descritos no metodo findByTurmaDisciplina_IdAndStatus.
     */
    Optional<Aula> findByTurmaDisciplina_IdAndStatus(
            Integer turmaDisciplinaId,
            StatusAula status
    );
    /*
     * Busca o primeiro registro que atende aos filtros descritos no metodo findFirstByTurmaDisciplina_Professor_Usuario_IdAndStatusOrderByDataAulaDescHoraInicioDesc.
     */
    Optional<Aula> findFirstByTurmaDisciplina_Professor_Usuario_IdAndStatusOrderByDataAulaDescHoraInicioDesc(
            Integer usuarioId,
            StatusAula status
    );

    /*
     * Consulta personalizada que monta o historico ordenado pelos registros mais recentes.
     */
    @Query("""
        SELECT new eyecount.dto.aula.HistoricoAulaDTO(
            a.id,
            td.turma.nome,
            a.dataAula,
            a.horaInicio,
            a.horaFim,
            a.status
        )
        FROM Aula a
        JOIN a.turmaDisciplina td
        WHERE td.professor.usuario.id = :usuarioId
        ORDER BY a.dataAula DESC, a.horaInicio DESC
    """)
    List<HistoricoAulaDTO> buscarHistoricoPorProfessor(@Param("usuarioId") Integer usuarioId);
    /*
     * Conta registros aplicando os filtros descritos no metodo countByDataAula.
     */
    Long countByDataAula(LocalDate dataAula);
    /*
     * Conta registros aplicando os filtros descritos no metodo countByDataAulaAndStatus.
     */
    Long countByDataAulaAndStatus(LocalDate dataAula, StatusAula status);
    /*
     * Conta registros aplicando os filtros descritos no metodo countByStatus.
     */
    Long countByStatus(StatusAula status);
    /*
     * Conta registros aplicando os filtros descritos no metodo countByTurmaDisciplina_Professor_Id.
     */
    Long countByTurmaDisciplina_Professor_Id(Integer professorId);

    /*
     * Consulta personalizada que busca chamadas em andamento para uma turma e ordena as mais recentes primeiro.
     */
    @Query("""
    SELECT a FROM Aula a
    WHERE a.turmaDisciplina.turma.id = :turmaId
    AND a.status = :status
    ORDER BY a.dataAula DESC, a.horaInicio DESC
""")
    List<Aula> buscarAulaAbertaPorTurma(
            @Param("turmaId") Integer turmaId,
            @Param("status") StatusAula status
    );
    /*
     * Busca registros aplicando os filtros descritos no metodo findByHorarioAula_IdAndDataAula.
     */
    Optional<Aula> findByHorarioAula_IdAndDataAula(
            Integer horarioAulaId,
            LocalDate dataAula
    );
    /*
     * Busca registros aplicando os filtros descritos no metodo findByHorarioAula_IdAndDataAulaAndStatus.
     */
    Optional<Aula> findByHorarioAula_IdAndDataAulaAndStatus(
            Integer horarioAulaId,
            LocalDate dataAula,
            StatusAula status
    );
}
