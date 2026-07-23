package eyecount.repository;

import eyecount.model.HorarioAula;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
/*
 * Repository de HorarioAula. Repository Spring Data responsavel pelas consultas e operacoes
 * de banco desta entidade.
 */

public interface HorarioAulaRepository
        extends JpaRepository<HorarioAula, Integer> {

    List<HorarioAula>
    findByTurmaDisciplina_IdOrderByDiaSemanaAscHoraInicioAsc(
            Integer turmaDisciplinaId
    );

    List<HorarioAula>
    findByAtivoTrueAndDiaSemanaOrderByHoraInicioAsc(
            DayOfWeek diaSemana
    );

    List<HorarioAula>
    findAllByOrderByDiaSemanaAscHoraInicioAsc();

    List<HorarioAula>
    findByAtivoTrueOrderByDiaSemanaAscHoraInicioAsc();

    @Query("""
        SELECT COUNT(h)
        FROM HorarioAula h
        WHERE h.ativo = true
          AND (:ignorarId IS NULL OR h.id <> :ignorarId)
          AND h.diaSemana = :diaSemana
          AND h.turmaDisciplina.turma.id = :turmaId
          AND h.horaInicio < :horaFim
          AND h.horaFim > :horaInicio
          AND (
                :dataFim IS NULL
                OR h.dataInicioVigencia IS NULL
                OR h.dataInicioVigencia <= :dataFim
          )
          AND (
                :dataInicio IS NULL
                OR h.dataFimVigencia IS NULL
                OR h.dataFimVigencia >= :dataInicio
          )
    """)
    long contarConflitosTurma(
            @Param("turmaId") Integer turmaId,
            @Param("diaSemana") DayOfWeek diaSemana,
            @Param("horaInicio") LocalTime horaInicio,
            @Param("horaFim") LocalTime horaFim,
            @Param("dataInicio") LocalDate dataInicio,
            @Param("dataFim") LocalDate dataFim,
            @Param("ignorarId") Integer ignorarId
    );

    @Query("""
        SELECT COUNT(h)
        FROM HorarioAula h
        WHERE h.ativo = true
          AND (:ignorarId IS NULL OR h.id <> :ignorarId)
          AND h.diaSemana = :diaSemana
          AND h.turmaDisciplina.professor.id = :professorId
          AND h.horaInicio < :horaFim
          AND h.horaFim > :horaInicio
          AND (
                :dataFim IS NULL
                OR h.dataInicioVigencia IS NULL
                OR h.dataInicioVigencia <= :dataFim
          )
          AND (
                :dataInicio IS NULL
                OR h.dataFimVigencia IS NULL
                OR h.dataFimVigencia >= :dataInicio
          )
    """)
    long contarConflitosProfessor(
            @Param("professorId") Integer professorId,
            @Param("diaSemana") DayOfWeek diaSemana,
            @Param("horaInicio") LocalTime horaInicio,
            @Param("horaFim") LocalTime horaFim,
            @Param("dataInicio") LocalDate dataInicio,
            @Param("dataFim") LocalDate dataFim,
            @Param("ignorarId") Integer ignorarId
    );
}
