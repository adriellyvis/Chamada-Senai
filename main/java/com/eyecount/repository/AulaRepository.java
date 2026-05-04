package com.eyecount.repository;

import com.eyecount.dto.HistoricoAulaDTO;
import com.eyecount.model.Aula;
import com.eyecount.model.StatusAula;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface AulaRepository extends JpaRepository<Aula, Integer> {

    Optional<Aula> findByTurmaDisciplina_IdAndStatus(
            Integer turmaDisciplinaId,
            StatusAula status
    );

    Optional<Aula> findByTurmaDisciplina_IdAndDataAulaAndStatus(
            Integer turmaDisciplinaId,
            LocalDate dataAula,
            StatusAula status
    );

    @Query("""
        SELECT new com.eyecount.dto.HistoricoAulaDTO(
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
    List<HistoricoAulaDTO> buscarHistoricoPorProfessor(Integer usuarioId);
}