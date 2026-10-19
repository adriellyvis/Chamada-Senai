package prezence.repository;

import prezence.dto.aula.HistoricoAulaDTO;
import prezence.model.Aula;
import prezence.model.StatusAula;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface AulaRepository extends JpaRepository<Aula, Integer> {

    Optional<Aula>
    findFirstByTurmaDisciplina_Professor_Usuario_IdAndStatusAndDataAulaOrderByHoraInicioDesc(
            Integer usuarioId,
            StatusAula status,
            LocalDate dataAula
    );

    @Query("""
        SELECT new prezence.dto.aula.HistoricoAulaDTO(
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
    List<HistoricoAulaDTO> buscarHistoricoPorProfessor(
            @Param("usuarioId") Integer usuarioId
    );

    Long countByDataAula(
            LocalDate dataAula
    );

    Long countByDataAulaAndStatus(
            LocalDate dataAula,
            StatusAula status
    );

    Long countByStatus(
            StatusAula status
    );

    Long countByTurmaDisciplina_Professor_Id(
            Integer professorId
    );

    @Query("""
        SELECT a
        FROM Aula a
        WHERE a.turmaDisciplina.turma.id = :turmaId
          AND a.status = :status
        ORDER BY a.dataAula DESC, a.horaInicio DESC
    """)
    List<Aula> buscarAulaAbertaPorTurma(
            @Param("turmaId") Integer turmaId,
            @Param("status") StatusAula status
    );

    Optional<Aula> findByHorarioAula_IdAndDataAula(
            Integer horarioAulaId,
            LocalDate dataAula
    );

    Optional<Aula> findByHorarioAula_IdAndDataAulaAndStatus(
            Integer horarioAulaId,
            LocalDate dataAula,
            StatusAula status
    );

    Optional<Aula>
    findByIdAndTurmaDisciplina_Professor_Usuario_Id(
            Integer aulaId,
            Integer usuarioId
    );
}