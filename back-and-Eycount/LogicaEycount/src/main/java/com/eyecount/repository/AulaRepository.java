package com.eyecount.repository;

import com.eyecount.dto.aula.HistoricoAulaDTO;
import com.eyecount.model.Aula;
import com.eyecount.model.StatusAula;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface AulaRepository extends JpaRepository<Aula, Integer> {

    Optional<Aula> findByTurmaDisciplina_IdAndDataAulaAndStatus(
            Integer turmaDisciplinaId,
            LocalDate dataAula,
            StatusAula status
    );

    Optional<Aula> findByTurmaDisciplina_IdAndStatus(
            Integer turmaDisciplinaId,
            StatusAula status
    );

    @Query("""
        SELECT new com.eyecount.dto.aula.HistoricoAulaDTO(
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

    Long countByDataAula(LocalDate dataAula);

    Long countByDataAulaAndStatus(LocalDate dataAula, StatusAula status);

    Long countByStatus(StatusAula status);

    Long countByTurmaDisciplina_Professor_Id(Integer professorId);

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
}