package com.eyecount.repository;

import com.eyecount.dto.alerta.AlertaEvasaoDTO;
import com.eyecount.dto.aluno.HistoricoPresencaDTO;
import com.eyecount.dto.dashboard.FrequenciaTurmaDTO;
import com.eyecount.dto.professor.DesempenhoTurmaDTO;
import com.eyecount.model.Presenca;
import com.eyecount.model.StatusPresenca;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface PresencaRepository extends JpaRepository<Presenca, Integer> {

    Optional<Presenca> findByAluno_IdAndAula_Id(Integer alunoId, Integer aulaId);

    List<Presenca> findByAlunoId(Integer alunoId);

    List<Presenca> findByAula_Id(Integer aulaId);

    List<Presenca> findByAluno_Id(Integer alunoId);

    Long countByAluno_IdAndStatus(Integer alunoId, StatusPresenca status);

    @Query("""
        SELECT new com.eyecount.dto.alerta.AlertaEvasaoDTO(
            a.id,
            a.usuario.nome,
            a.matricula,
            a.turma.nome,
            ROUND(
                (
                    SUM(
                        CASE
                            WHEN p.status = com.eyecount.model.StatusPresenca.PRESENTE
                            THEN 1
                            ELSE 0
                        END
                    ) * 100.0
                ) / COUNT(p.id),
                1
            ),
            CASE
                WHEN (
                    (
                        SUM(
                            CASE
                                WHEN p.status = com.eyecount.model.StatusPresenca.PRESENTE
                                THEN 1
                                ELSE 0
                            END
                        ) * 100.0
                    ) / COUNT(p.id)
                ) < 50
                THEN 'alto'
                ELSE 'medio'
            END
        )
        FROM Presenca p
        JOIN p.aluno a
        GROUP BY
            a.id,
            a.usuario.nome,
            a.matricula,
            a.turma.nome
        HAVING (
            (
                SUM(
                    CASE
                        WHEN p.status = com.eyecount.model.StatusPresenca.PRESENTE
                        THEN 1
                        ELSE 0
                    END
                ) * 100.0
            ) / COUNT(p.id)
        ) < 75
    """)
    List<AlertaEvasaoDTO> buscarAlertasEvasao();

    @Query("""
        SELECT new com.eyecount.dto.aluno.HistoricoPresencaDTO(
            a.id,
            td.disciplina.nome,
            a.dataAula,
            p.status,
            p.metodo,
            p.horarioRegistro
        )
        FROM Presenca p
        JOIN p.aula a
        JOIN a.turmaDisciplina td
        WHERE p.aluno.id = :alunoId
        ORDER BY a.dataAula DESC
    """)
    List<HistoricoPresencaDTO> buscarHistoricoAluno(Integer alunoId);

    @Query("""
        SELECT new com.eyecount.dto.dashboard.FrequenciaTurmaDTO(
            t.id,
            t.nome,
            COUNT(DISTINCT a.id),
            (
                SUM(
                    CASE
                        WHEN p.status = com.eyecount.model.StatusPresenca.PRESENTE
                        THEN 1
                        ELSE 0
                    END
                ) * 100.0 / COUNT(p)
            ),
            SUM(
                CASE
                    WHEN p.status = com.eyecount.model.StatusPresenca.AUSENTE
                    THEN 1
                    ELSE 0
                END
            ),
            (
                SUM(
                    CASE
                        WHEN p.status = com.eyecount.model.StatusPresenca.AUSENTE
                        THEN 1
                        ELSE 0
                    END
                ) * 100.0 / COUNT(p)
            )
        )
        FROM Presenca p
        JOIN p.aluno a
        JOIN a.turma t
        GROUP BY t.id, t.nome
    """)
    List<FrequenciaTurmaDTO> buscarFrequenciaTurmas();

    @Query("""
        SELECT
            (
                SUM(
                    CASE
                        WHEN p.status = com.eyecount.model.StatusPresenca.PRESENTE
                        THEN 1
                        ELSE 0
                    END
                ) * 100.0 / COUNT(p)
            )
        FROM Presenca p
        JOIN p.aula a
        JOIN a.turmaDisciplina td
        WHERE td.professor.id = :professorId
    """)
    Double calcularFrequenciaPorProfessor(
            @Param("professorId") Integer professorId
    );

    @Query("""
        SELECT new com.eyecount.dto.alerta.AlertaEvasaoDTO(
            a.id,
            a.usuario.nome,
            a.matricula,
            a.turma.nome,
            (
                SUM(
                    CASE
                        WHEN p.status = com.eyecount.model.StatusPresenca.PRESENTE
                        THEN 1
                        ELSE 0
                    END
                ) * 100.0 / COUNT(p)
            ),
            CASE
                WHEN (
                    SUM(
                        CASE
                            WHEN p.status = com.eyecount.model.StatusPresenca.PRESENTE
                            THEN 1
                            ELSE 0
                        END
                    ) * 100.0 / COUNT(p)
                ) < 50
                THEN 'alto'
                ELSE 'medio'
            END
        )
        FROM Presenca p
        JOIN p.aluno a
        JOIN p.aula au
        JOIN au.turmaDisciplina td
        WHERE td.professor.id = :professorId
        GROUP BY
            a.id,
            a.usuario.nome,
            a.matricula,
            a.turma.nome
        HAVING (
            SUM(
                CASE
                    WHEN p.status = com.eyecount.model.StatusPresenca.PRESENTE
                    THEN 1
                    ELSE 0
                END
            ) * 100.0 / COUNT(p)
        ) < 75
    """)
    List<AlertaEvasaoDTO> buscarAlunosRiscoProfessor(
            @Param("professorId") Integer professorId
    );

    @Query("""
        SELECT new com.eyecount.dto.dashboard.FrequenciaTurmaDTO(
            t.id,
            t.nome,
            COUNT(DISTINCT a.id),
            (
                SUM(
                    CASE
                        WHEN p.status = com.eyecount.model.StatusPresenca.PRESENTE
                        THEN 1
                        ELSE 0
                    END
                ) * 100.0 / COUNT(p)
            ),
            SUM(
                CASE
                    WHEN p.status = com.eyecount.model.StatusPresenca.AUSENTE
                    THEN 1
                    ELSE 0
                END
            ),
            (
                SUM(
                    CASE
                        WHEN p.status = com.eyecount.model.StatusPresenca.AUSENTE
                        THEN 1
                        ELSE 0
                    END
                ) * 100.0 / COUNT(p)
            )
        )
        FROM Presenca p
        JOIN p.aluno a
        JOIN a.turma t
        JOIN p.aula au
        JOIN au.turmaDisciplina td
        WHERE td.professor.id = :professorId
        GROUP BY t.id, t.nome
    """)
    List<FrequenciaTurmaDTO> buscarFrequenciaTurmasProfessor(
            @Param("professorId") Integer professorId
    );

    @Query("""
        SELECT new com.eyecount.dto.professor.DesempenhoTurmaDTO(
            t.id,
            t.nome,
            SUM(CASE WHEN p.status = com.eyecount.model.StatusPresenca.PRESENTE THEN 1 ELSE 0 END),
            SUM(CASE WHEN p.status = com.eyecount.model.StatusPresenca.ATRASADO THEN 1 ELSE 0 END),
            SUM(CASE WHEN p.status = com.eyecount.model.StatusPresenca.AUSENTE THEN 1 ELSE 0 END)
        )
        FROM Presenca p
        JOIN p.aula a
        JOIN a.turmaDisciplina td
        JOIN td.turma t
        JOIN td.professor prof
        JOIN prof.usuario u
        WHERE u.id = :usuarioId
          AND (:turmaId IS NULL OR t.id = :turmaId)
        GROUP BY t.id, t.nome
    """)
    List<DesempenhoTurmaDTO> buscarDesempenhoTurmas(
            @Param("usuarioId") Integer usuarioId,
            @Param("turmaId") Integer turmaId
    );

    @Query("""
        SELECT COUNT(p)
        FROM Presenca p
        JOIN p.aula a
        WHERE a.dataAula = CURRENT_DATE
        AND p.status = com.eyecount.model.StatusPresenca.PRESENTE
    """)
    Long countPresencasHoje();

    @Query("""
        SELECT COUNT(p)
        FROM Presenca p
        JOIN p.aula a
        WHERE a.dataAula = CURRENT_DATE
        AND p.status = com.eyecount.model.StatusPresenca.AUSENTE
    """)
    Long countAusentesHoje();


}