package eyecount.repository;

import eyecount.dto.alerta.AlertaEvasaoDTO;
import eyecount.dto.aluno.AlunoDesempenhoDisciplinaDTO;
import eyecount.dto.aluno.HistoricoPresencaDTO;
import eyecount.dto.dashboard.FrequenciaTurmaDTO;
import eyecount.dto.professor.DesempenhoTurmaDTO;
import eyecount.model.Presenca;
import eyecount.model.StatusPresenca;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
/*
 * Repository de Presenca. Repository Spring Data responsavel pelas consultas e operacoes de
 * banco desta entidade.
 */

public interface PresencaRepository extends JpaRepository<Presenca, Integer> {
    /*
     * Busca registros aplicando os filtros descritos no metodo findByAluno_IdAndAula_Id.
     */
    Optional<Presenca> findByAluno_IdAndAula_Id(Integer alunoId, Integer aulaId);
    /*
     * Busca registros aplicando os filtros descritos no metodo findByAlunoId.
     */
    List<Presenca> findByAlunoId(Integer alunoId);
    /*
     * Busca registros aplicando os filtros descritos no metodo findByAula_Id.
     */
    List<Presenca> findByAula_Id(Integer aulaId);
    /*
     * Busca registros aplicando os filtros descritos no metodo findByAluno_Id.
     */
    List<Presenca> findByAluno_Id(Integer alunoId);
    /*
     * Conta registros aplicando os filtros descritos no metodo countByAluno_IdAndStatus.
     */
    Long countByAluno_IdAndStatus(Integer alunoId, StatusPresenca status);
    /*
     * Conta registros aplicando os filtros descritos no metodo countByAluno_IdAndStatusAndAula_DataAulaBetween.
     */
    Long countByAluno_IdAndStatusAndAula_DataAulaBetween(
            Integer alunoId,
            StatusPresenca status,
            LocalDate dataInicio,
            LocalDate dataFim
    );

    /*
     * Consulta personalizada que calcula a frequencia e retorna somente alunos abaixo do limite de risco.
     */
    @Query("""
        SELECT new eyecount.dto.alerta.AlertaEvasaoDTO(
            a.id,
            a.usuario.nome,
            a.matricula,
            a.turma.nome,
            ROUND(
                (
                    SUM(
                        CASE
                            WHEN p.status = eyecount.model.StatusPresenca.PRESENTE
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
                                WHEN p.status = eyecount.model.StatusPresenca.PRESENTE
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
                        WHEN p.status = eyecount.model.StatusPresenca.PRESENTE
                        THEN 1
                        ELSE 0
                    END
                ) * 100.0
            ) / COUNT(p.id)
        ) < 75
    """)
    List<AlertaEvasaoDTO> buscarAlertasEvasao();

    /*
     * Consulta personalizada que monta o historico ordenado pelos registros mais recentes.
     */
    @Query("""
        SELECT new eyecount.dto.aluno.HistoricoPresencaDTO(
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

    /*
     * Consulta personalizada que agrupa presencas e calcula a frequencia por turma.
     */
    @Query("""
        SELECT new eyecount.dto.dashboard.FrequenciaTurmaDTO(
            t.id,
            t.nome,
            COUNT(DISTINCT a.id),
            (
                SUM(
                    CASE
                        WHEN p.status = eyecount.model.StatusPresenca.PRESENTE
                        THEN 1
                        ELSE 0
                    END
                ) * 100.0 / COUNT(p)
            ),
            SUM(
                CASE
                    WHEN p.status = eyecount.model.StatusPresenca.AUSENTE
                    THEN 1
                    ELSE 0
                END
            ),
            (
                SUM(
                    CASE
                        WHEN p.status = eyecount.model.StatusPresenca.AUSENTE
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

    /*
     * Consulta personalizada que calcula o percentual de presenca usando os filtros informados.
     */
    @Query("""
        SELECT
            (
                SUM(
                    CASE
                        WHEN p.status = eyecount.model.StatusPresenca.PRESENTE
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

    /*
     * Consulta personalizada que filtra alunos com frequencia abaixo do limite para o professor.
     */
    @Query("""
        SELECT new eyecount.dto.alerta.AlertaEvasaoDTO(
            a.id,
            a.usuario.nome,
            a.matricula,
            a.turma.nome,
            (
                SUM(
                    CASE
                        WHEN p.status = eyecount.model.StatusPresenca.PRESENTE
                        THEN 1
                        ELSE 0
                    END
                ) * 100.0 / COUNT(p)
            ),
            CASE
                WHEN (
                    SUM(
                        CASE
                            WHEN p.status = eyecount.model.StatusPresenca.PRESENTE
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
                    WHEN p.status = eyecount.model.StatusPresenca.PRESENTE
                    THEN 1
                    ELSE 0
                END
            ) * 100.0 / COUNT(p)
        ) < 75
    """)
    List<AlertaEvasaoDTO> buscarAlunosRiscoProfessor(
            @Param("professorId") Integer professorId
    );

    /*
     * Consulta personalizada que agrupa presencas e calcula a frequencia por turma.
     */
    @Query("""
        SELECT new eyecount.dto.dashboard.FrequenciaTurmaDTO(
            t.id,
            t.nome,
            COUNT(DISTINCT a.id),
            (
                SUM(
                    CASE
                        WHEN p.status = eyecount.model.StatusPresenca.PRESENTE
                        THEN 1
                        ELSE 0
                    END
                ) * 100.0 / COUNT(p)
            ),
            SUM(
                CASE
                    WHEN p.status = eyecount.model.StatusPresenca.AUSENTE
                    THEN 1
                    ELSE 0
                END
            ),
            (
                SUM(
                    CASE
                        WHEN p.status = eyecount.model.StatusPresenca.AUSENTE
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

    /*
     * Consulta personalizada que agrupa os dados usados no relatorio de desempenho.
     */
    @Query("""
        SELECT new eyecount.dto.professor.DesempenhoTurmaDTO(
            t.id,
            t.nome,
            SUM(CASE WHEN p.status = eyecount.model.StatusPresenca.PRESENTE THEN 1 ELSE 0 END),
            SUM(CASE WHEN p.status = eyecount.model.StatusPresenca.ATRASADO THEN 1 ELSE 0 END),
            SUM(CASE WHEN p.status = eyecount.model.StatusPresenca.AUSENTE THEN 1 ELSE 0 END)
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

    /*
     * Consulta personalizada que conta os registros conforme as condicoes da JPQL.
     */
    @Query("""
        SELECT COUNT(p)
        FROM Presenca p
        JOIN p.aula a
        WHERE a.dataAula = CURRENT_DATE
        AND p.status = eyecount.model.StatusPresenca.PRESENTE
    """)
    Long countPresencasHoje();

    /*
     * Consulta personalizada que conta os registros conforme as condicoes da JPQL.
     */
    @Query("""
        SELECT COUNT(p)
        FROM Presenca p
        JOIN p.aula a
        WHERE a.dataAula = CURRENT_DATE
        AND p.status = eyecount.model.StatusPresenca.AUSENTE
    """)
    Long countAusentesHoje();

        /*
         * Consulta personalizada que agrupa os dados usados no relatorio de desempenho.
         */
    @Query("""
        SELECT new eyecount.dto.aluno.AlunoDesempenhoDisciplinaDTO(
            d.nome,

            SUM(CASE WHEN p.status = eyecount.model.StatusPresenca.PRESENTE THEN 1 ELSE 0 END),

            SUM(CASE WHEN p.status = eyecount.model.StatusPresenca.AUSENTE THEN 1 ELSE 0 END),

            SUM(CASE WHEN p.status = eyecount.model.StatusPresenca.ATRASADO THEN 1 ELSE 0 END),

            COALESCE(
                (
                    SUM(CASE
                        WHEN p.status = eyecount.model.StatusPresenca.PRESENTE
                          OR p.status = eyecount.model.StatusPresenca.ATRASADO
                        THEN 1 ELSE 0
                    END) * 100.0
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
        List<AlunoDesempenhoDisciplinaDTO> buscarDesempenhoPorDisciplina(
                @Param("alunoId") Integer alunoId
        );

}
