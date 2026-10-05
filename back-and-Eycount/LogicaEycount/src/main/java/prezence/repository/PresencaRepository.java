package prezence.repository;

import prezence.dto.alerta.AlertaEvasaoDTO;
import prezence.dto.aluno.AlunoDesempenhoDisciplinaDTO;
import prezence.dto.aluno.HistoricoPresencaDTO;
import prezence.dto.dashboard.FrequenciaTurmaDTO;
import prezence.dto.professor.DesempenhoTurmaDTO;
import prezence.model.Presenca;
import prezence.model.StatusPresenca;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/*
 * Repository responsável pelas consultas e operações
 * relacionadas aos registros de presença.
 *
 * Regra utilizada nos percentuais de frequência:
 *
 * - PRESENTE: conta como comparecimento;
 * - ATRASADO: conta como comparecimento;
 * - AUSENTE: não conta como comparecimento.
 *
 * O registro automático realizado depois da tolerância
 * é salvo como AUSENTE pelo PresencaService.
 */
public interface PresencaRepository
        extends JpaRepository<Presenca, Integer> {

    Optional<Presenca> findByAluno_IdAndAula_Id(
            Integer alunoId,
            Integer aulaId
    );

    boolean existsByAluno_IdAndAula_Id(
            Integer alunoId,
            Integer aulaId
    );

    List<Presenca> findByAlunoId(
            Integer alunoId
    );

    List<Presenca> findByAluno_Id(
            Integer alunoId
    );

    List<Presenca> findByAula_Id(
            Integer aulaId
    );

    Long countByAluno_IdAndStatus(
            Integer alunoId,
            StatusPresenca status
    );

    Long countByAluno_IdAndStatusAndAula_DataAulaBetween(
            Integer alunoId,
            StatusPresenca status,
            LocalDate dataInicio,
            LocalDate dataFim
    );

    @Query("""
        SELECT new prezence.dto.alerta.AlertaEvasaoDTO(
            a.id,
            a.usuario.nome,
            a.matricula,
            a.turma.nome,
            ROUND(
                (
                    SUM(
                        CASE
                            WHEN p.status = prezence.model.StatusPresenca.PRESENTE
                              OR p.status = prezence.model.StatusPresenca.ATRASADO
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
                                WHEN p.status = prezence.model.StatusPresenca.PRESENTE
                                  OR p.status = prezence.model.StatusPresenca.ATRASADO
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
                        WHEN p.status = prezence.model.StatusPresenca.PRESENTE
                          OR p.status = prezence.model.StatusPresenca.ATRASADO
                        THEN 1
                        ELSE 0
                    END
                ) * 100.0
            ) / COUNT(p.id)
        ) < 75
    """)
    List<AlertaEvasaoDTO> buscarAlertasEvasao();

    @Query("""
        SELECT new prezence.dto.aluno.HistoricoPresencaDTO(
            a.id,
            td.disciplina.nome,
            prof.usuario.nome,
            a.dataAula,
            p.status,
            p.metodo,
            p.horarioRegistro
        )
        FROM Presenca p
        JOIN p.aula a
        JOIN a.turmaDisciplina td
        JOIN td.professor prof
        WHERE p.aluno.id = :alunoId
        ORDER BY
            a.dataAula DESC,
            p.horarioRegistro DESC
    """)
        List<HistoricoPresencaDTO> buscarHistoricoAluno(
                @Param("alunoId") Integer alunoId
        );

    @Query("""
        SELECT new prezence.dto.dashboard.FrequenciaTurmaDTO(
            t.id,
            t.nome,
            COUNT(DISTINCT a.id),
            (
                SUM(
                    CASE
                        WHEN p.status = prezence.model.StatusPresenca.PRESENTE
                          OR p.status = prezence.model.StatusPresenca.ATRASADO
                        THEN 1
                        ELSE 0
                    END
                ) * 100.0 / COUNT(p)
            ),
            SUM(
                CASE
                    WHEN p.status = prezence.model.StatusPresenca.AUSENTE
                    THEN 1
                    ELSE 0
                END
            ),
            (
                SUM(
                    CASE
                        WHEN p.status = prezence.model.StatusPresenca.AUSENTE
                        THEN 1
                        ELSE 0
                    END
                ) * 100.0 / COUNT(p)
            )
        )
        FROM Presenca p
        JOIN p.aluno a
        JOIN a.turma t
        GROUP BY
            t.id,
            t.nome
    """)
    List<FrequenciaTurmaDTO> buscarFrequenciaTurmas();

    @Query("""
        SELECT
            (
                SUM(
                    CASE
                        WHEN p.status = prezence.model.StatusPresenca.PRESENTE
                          OR p.status = prezence.model.StatusPresenca.ATRASADO
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
        SELECT new prezence.dto.alerta.AlertaEvasaoDTO(
            a.id,
            a.usuario.nome,
            a.matricula,
            a.turma.nome,
            (
                SUM(
                    CASE
                        WHEN p.status = prezence.model.StatusPresenca.PRESENTE
                          OR p.status = prezence.model.StatusPresenca.ATRASADO
                        THEN 1
                        ELSE 0
                    END
                ) * 100.0 / COUNT(p)
            ),
            CASE
                WHEN (
                    SUM(
                        CASE
                            WHEN p.status = prezence.model.StatusPresenca.PRESENTE
                              OR p.status = prezence.model.StatusPresenca.ATRASADO
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
                    WHEN p.status = prezence.model.StatusPresenca.PRESENTE
                      OR p.status = prezence.model.StatusPresenca.ATRASADO
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
        SELECT new prezence.dto.dashboard.FrequenciaTurmaDTO(
            t.id,
            t.nome,
            COUNT(DISTINCT a.id),
            (
                SUM(
                    CASE
                        WHEN p.status = prezence.model.StatusPresenca.PRESENTE
                          OR p.status = prezence.model.StatusPresenca.ATRASADO
                        THEN 1
                        ELSE 0
                    END
                ) * 100.0 / COUNT(p)
            ),
            SUM(
                CASE
                    WHEN p.status = prezence.model.StatusPresenca.AUSENTE
                    THEN 1
                    ELSE 0
                END
            ),
            (
                SUM(
                    CASE
                        WHEN p.status = prezence.model.StatusPresenca.AUSENTE
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
        GROUP BY
            t.id,
            t.nome
    """)
    List<FrequenciaTurmaDTO> buscarFrequenciaTurmasProfessor(
            @Param("professorId") Integer professorId
    );

    @Query("""
        SELECT new prezence.dto.professor.DesempenhoTurmaDTO(
            t.id,
            t.nome,
            SUM(
                CASE
                    WHEN p.status = prezence.model.StatusPresenca.PRESENTE
                    THEN 1
                    ELSE 0
                END
            ),
            SUM(
                CASE
                    WHEN p.status = prezence.model.StatusPresenca.ATRASADO
                    THEN 1
                    ELSE 0
                END
            ),
            SUM(
                CASE
                    WHEN p.status = prezence.model.StatusPresenca.AUSENTE
                    THEN 1
                    ELSE 0
                END
            )
        )
        FROM Presenca p
        JOIN p.aula a
        JOIN a.turmaDisciplina td
        JOIN td.turma t
        JOIN td.professor prof
        JOIN prof.usuario u
        WHERE u.id = :usuarioId
          AND (:turmaId IS NULL OR t.id = :turmaId)
        GROUP BY
            t.id,
            t.nome
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
          AND (
              p.status = prezence.model.StatusPresenca.PRESENTE
              OR p.status = prezence.model.StatusPresenca.ATRASADO
          )
    """)
    Long countPresencasHoje();

    @Query("""
        SELECT COUNT(p)
        FROM Presenca p
        JOIN p.aula a
        WHERE a.dataAula = CURRENT_DATE
          AND p.status = prezence.model.StatusPresenca.AUSENTE
    """)
    Long countAusentesHoje();

    @Query("""
        SELECT new prezence.dto.aluno.AlunoDesempenhoDisciplinaDTO(
            d.nome,

            SUM(
                CASE
                    WHEN p.status = prezence.model.StatusPresenca.PRESENTE
                    THEN 1
                    ELSE 0
                END
            ),

            SUM(
                CASE
                    WHEN p.status = prezence.model.StatusPresenca.AUSENTE
                    THEN 1
                    ELSE 0
                END
            ),

            SUM(
                CASE
                    WHEN p.status = prezence.model.StatusPresenca.ATRASADO
                    THEN 1
                    ELSE 0
                END
            ),

            COALESCE(
                (
                    SUM(
                        CASE
                            WHEN p.status = prezence.model.StatusPresenca.PRESENTE
                              OR p.status = prezence.model.StatusPresenca.ATRASADO
                            THEN 1
                            ELSE 0
                        END
                    ) * 100.0
                ) / NULLIF(COUNT(p.id), 0),
                0
            )
        )
        FROM Presenca p
        JOIN p.aula a
        JOIN a.turmaDisciplina td
        JOIN td.disciplina d
        WHERE p.aluno.id = :alunoId
        GROUP BY d.nome
        ORDER BY d.nome
    """)
    List<AlunoDesempenhoDisciplinaDTO>
    buscarDesempenhoPorDisciplina(
            @Param("alunoId") Integer alunoId
    );

    @Query("""
    SELECT COALESCE(
        (
            SUM(
                CASE
                    WHEN p.status = prezence.model.StatusPresenca.PRESENTE
                      OR p.status = prezence.model.StatusPresenca.ATRASADO
                    THEN 1
                    ELSE 0
                END
            ) * 100.0
        ) / NULLIF(COUNT(p.id), 0),
        0
    )
    FROM Presenca p
    JOIN p.aula aula
    JOIN aula.turmaDisciplina td
    WHERE p.aluno.id = :alunoId
      AND td.turma.id = :turmaId
""")
    Double calcularFrequenciaAlunoNaTurma(
            @Param("alunoId") Integer alunoId,
            @Param("turmaId") Integer turmaId
    );
}