-- =========================================================
-- EYCOUNT - SELECTS DE CONFERENCIA
-- MySQL 8+
-- =========================================================

USE eyecount;

-- =========================================================
-- 1. QUANTIDADE DE REGISTROS POR TABELA
-- =========================================================

SELECT 'perfis' AS tabela, COUNT(*) AS total FROM perfis
UNION ALL
SELECT 'usuarios', COUNT(*) FROM usuarios
UNION ALL
SELECT 'turmas', COUNT(*) FROM turmas
UNION ALL
SELECT 'alunos', COUNT(*) FROM alunos
UNION ALL
SELECT 'professores', COUNT(*) FROM professores
UNION ALL
SELECT 'disciplinas', COUNT(*) FROM disciplinas
UNION ALL
SELECT 'turma_disciplina', COUNT(*) FROM turma_disciplina
UNION ALL
SELECT 'aulas', COUNT(*) FROM aulas
UNION ALL
SELECT 'presencas', COUNT(*) FROM presencas
UNION ALL
SELECT 'ocorrencias', COUNT(*) FROM ocorrencias
UNION ALL
SELECT 'biometria', COUNT(*) FROM biometria;

-- =========================================================
-- 2. USUARIOS E PERFIS
-- =========================================================

SELECT
    u.id,
    u.nome,
    u.email,
    p.nome AS perfil,
    u.ativo,
    u.data_criacao
FROM usuarios u
JOIN perfis p
    ON p.id = u.perfil_id
ORDER BY
    p.id,
    u.nome;

-- =========================================================
-- 3. ALUNOS E SUAS TURMAS
-- =========================================================

SELECT
    a.id AS aluno_id,
    u.nome AS aluno,
    u.email,
    a.matricula,
    t.id AS turma_id,
    t.nome AS turma,
    u.ativo
FROM alunos a
JOIN usuarios u
    ON u.id = a.usuario_id
JOIN turmas t
    ON t.id = a.turma_id
ORDER BY
    t.nome,
    u.nome;

-- =========================================================
-- 4. PROFESSORES
-- =========================================================

SELECT
    p.id AS professor_id,
    u.nome AS professor,
    u.email,
    p.especialidade,
    u.ativo
FROM professores p
JOIN usuarios u
    ON u.id = p.usuario_id
ORDER BY u.nome;

-- =========================================================
-- 5. RESUMO DAS TURMAS
-- =========================================================

SELECT
    t.id,
    t.nome,
    t.sala,
    t.horario_inicio,
    t.horario_fim,
    t.data_inicio,
    t.data_fim_prevista,
    t.ativo,
    COUNT(DISTINCT a.id) AS total_alunos,
    COUNT(DISTINCT td.professor_id) AS total_professores,
    COUNT(DISTINCT td.disciplina_id) AS total_disciplinas
FROM turmas t
LEFT JOIN alunos a
    ON a.turma_id = t.id
LEFT JOIN turma_disciplina td
    ON td.turma_id = t.id
GROUP BY
    t.id,
    t.nome,
    t.sala,
    t.horario_inicio,
    t.horario_fim,
    t.data_inicio,
    t.data_fim_prevista,
    t.ativo
ORDER BY t.nome;

-- =========================================================
-- 6. VINCULOS ENTRE TURMA, DISCIPLINA E PROFESSOR
-- =========================================================

SELECT
    td.id AS vinculo_id,
    t.nome AS turma,
    d.nome AS disciplina,
    u.nome AS professor
FROM turma_disciplina td
JOIN turmas t
    ON t.id = td.turma_id
JOIN disciplinas d
    ON d.id = td.disciplina_id
JOIN professores p
    ON p.id = td.professor_id
JOIN usuarios u
    ON u.id = p.usuario_id
ORDER BY
    t.nome,
    d.nome;

-- =========================================================
-- 7. HORARIOS DE AULA
--
-- Execute somente se a tabela horarios_aula existir.
-- =========================================================

SELECT
    h.id,
    t.nome AS turma,
    d.nome AS disciplina,
    u.nome AS professor,
    h.dia_semana,
    h.hora_inicio,
    h.hora_fim,
    h.tolerancia_minutos,
    h.abertura_automatica,
    h.encerramento_automatico,
    h.data_inicio_vigencia,
    h.data_fim_vigencia,
    h.ativo
FROM horarios_aula h
JOIN turma_disciplina td
    ON td.id = h.turma_disciplina_id
JOIN turmas t
    ON t.id = td.turma_id
JOIN disciplinas d
    ON d.id = td.disciplina_id
JOIN professores p
    ON p.id = td.professor_id
JOIN usuarios u
    ON u.id = p.usuario_id
ORDER BY
    h.dia_semana,
    h.hora_inicio;

-- =========================================================
-- 8. AULAS
--
-- horario_aula_id aparece somente se a coluna ja existir.
-- =========================================================

SELECT
    a.id AS aula_id,
    t.nome AS turma,
    d.nome AS disciplina,
    u.nome AS professor,
    a.data_aula,
    a.hora_inicio,
    a.hora_fim,
    a.status,
    a.horario_aula_id
FROM aulas a
JOIN turma_disciplina td
    ON td.id = a.turma_disciplina_id
JOIN turmas t
    ON t.id = td.turma_id
JOIN disciplinas d
    ON d.id = td.disciplina_id
JOIN professores p
    ON p.id = td.professor_id
JOIN usuarios u
    ON u.id = p.usuario_id
ORDER BY
    a.data_aula DESC,
    a.hora_inicio DESC;

-- =========================================================
-- 9. PRESENCAS COMPLETAS
-- =========================================================

SELECT
    pr.id AS presenca_id,
    a.id AS aula_id,
    a.data_aula,
    t.nome AS turma,
    d.nome AS disciplina,
    ua.nome AS aluno,
    pr.status,
    pr.metodo,
    pr.validacao_biometrica,
    pr.horario_registro
FROM presencas pr
JOIN alunos al
    ON al.id = pr.aluno_id
JOIN usuarios ua
    ON ua.id = al.usuario_id
JOIN aulas a
    ON a.id = pr.aula_id
JOIN turma_disciplina td
    ON td.id = a.turma_disciplina_id
JOIN turmas t
    ON t.id = td.turma_id
JOIN disciplinas d
    ON d.id = td.disciplina_id
ORDER BY
    a.data_aula DESC,
    t.nome,
    ua.nome;

-- =========================================================
-- 10. FREQUENCIA POR ALUNO
--
-- Mostra duas regras:
-- 1. somente PRESENTE;
-- 2. PRESENTE + ATRASADO.
-- =========================================================

SELECT
    al.id AS aluno_id,
    u.nome AS aluno,
    t.nome AS turma,
    COUNT(pr.id) AS total_registros,

    SUM(pr.status = 'PRESENTE') AS presentes,
    SUM(pr.status = 'ATRASADO') AS atrasos,
    SUM(pr.status = 'AUSENTE') AS ausentes,

    ROUND(
        100.0 * SUM(pr.status = 'PRESENTE')
        / NULLIF(COUNT(pr.id), 0),
        1
    ) AS frequencia_somente_presente,

    ROUND(
        100.0 * SUM(
            pr.status IN ('PRESENTE', 'ATRASADO')
        )
        / NULLIF(COUNT(pr.id), 0),
        1
    ) AS frequencia_com_atraso
FROM alunos al
JOIN usuarios u
    ON u.id = al.usuario_id
JOIN turmas t
    ON t.id = al.turma_id
LEFT JOIN presencas pr
    ON pr.aluno_id = al.id
GROUP BY
    al.id,
    u.nome,
    t.nome
ORDER BY
    t.nome,
    frequencia_com_atraso DESC;

-- =========================================================
-- 11. FREQUENCIA POR TURMA
-- =========================================================

SELECT
    t.id AS turma_id,
    t.nome AS turma,
    COUNT(pr.id) AS total_registros,
    SUM(pr.status = 'PRESENTE') AS presentes,
    SUM(pr.status = 'ATRASADO') AS atrasos,
    SUM(pr.status = 'AUSENTE') AS ausentes,

    ROUND(
        100.0 * SUM(
            pr.status IN ('PRESENTE', 'ATRASADO')
        )
        / NULLIF(COUNT(pr.id), 0),
        1
    ) AS frequencia
FROM turmas t
LEFT JOIN alunos al
    ON al.turma_id = t.id
LEFT JOIN presencas pr
    ON pr.aluno_id = al.id
GROUP BY
    t.id,
    t.nome
ORDER BY
    frequencia DESC;

-- =========================================================
-- 12. ALUNOS EM RISCO
-- Frequencia abaixo de 75 por cento.
-- =========================================================

SELECT
    al.id AS aluno_id,
    u.nome AS aluno,
    t.nome AS turma,
    COUNT(pr.id) AS total_registros,
    ROUND(
        100.0 * SUM(
            pr.status IN ('PRESENTE', 'ATRASADO')
        )
        / NULLIF(COUNT(pr.id), 0),
        1
    ) AS frequencia
FROM alunos al
JOIN usuarios u
    ON u.id = al.usuario_id
JOIN turmas t
    ON t.id = al.turma_id
LEFT JOIN presencas pr
    ON pr.aluno_id = al.id
GROUP BY
    al.id,
    u.nome,
    t.nome
HAVING
    COUNT(pr.id) > 0
    AND frequencia < 75
ORDER BY frequencia ASC;

-- =========================================================
-- 13. OCORRENCIAS
-- =========================================================

SELECT
    o.id,
    ua.nome AS aluno,
    up.nome AS professor,
    o.titulo,
    o.tipo,
    o.gravidade,
    o.status,
    o.resposta_gestor,
    o.data_ocorrencia,
    o.data_atualizacao
FROM ocorrencias o
JOIN alunos al
    ON al.id = o.aluno_id
JOIN usuarios ua
    ON ua.id = al.usuario_id
JOIN professores p
    ON p.id = o.professor_id
JOIN usuarios up
    ON up.id = p.usuario_id
ORDER BY o.data_ocorrencia DESC;

-- =========================================================
-- 14. METRICAS DAS OCORRENCIAS
-- =========================================================

SELECT
    COUNT(*) AS total,
    SUM(status = 'PENDENTE') AS pendentes,
    SUM(status = 'EM_ANALISE') AS em_analise,
    SUM(status = 'RESOLVIDA') AS resolvidas,
    SUM(status = 'CANCELADA') AS canceladas,
    SUM(gravidade = 'ALTA') AS graves,
    SUM(gravidade = 'MEDIA') AS medias,
    SUM(gravidade = 'BAIXA') AS leves
FROM ocorrencias;

-- =========================================================
-- 15. BIOMETRIAS
-- =========================================================

SELECT
    b.id,
    u.nome AS usuario,
    p.nome AS perfil,
    b.tipo,
    b.ativo,
    b.data_cadastro,
    CHAR_LENGTH(b.embedding_facial) AS tamanho_embedding
FROM biometria b
JOIN usuarios u
    ON u.id = b.usuario_id
JOIN perfis p
    ON p.id = u.perfil_id
ORDER BY u.nome;

-- =========================================================
-- 16. CONFERIR DUPLICIDADE DE EMAIL
-- O resultado esperado e nenhuma linha.
-- =========================================================

SELECT
    email,
    COUNT(*) AS quantidade
FROM usuarios
GROUP BY email
HAVING COUNT(*) > 1;

-- =========================================================
-- 17. CONFERIR DUPLICIDADE DE MATRICULA
-- O resultado esperado e nenhuma linha.
-- =========================================================

SELECT
    matricula,
    COUNT(*) AS quantidade
FROM alunos
GROUP BY matricula
HAVING COUNT(*) > 1;

-- =========================================================
-- 18. CONFERIR PRESENCA DUPLICADA
-- O resultado esperado e nenhuma linha.
-- =========================================================

SELECT
    aluno_id,
    aula_id,
    COUNT(*) AS quantidade
FROM presencas
GROUP BY
    aluno_id,
    aula_id
HAVING COUNT(*) > 1;

-- =========================================================
-- 19. ALUNOS SEM TURMA
-- O resultado esperado e nenhuma linha.
-- =========================================================

SELECT
    al.id,
    u.nome,
    al.matricula
FROM alunos al
JOIN usuarios u
    ON u.id = al.usuario_id
LEFT JOIN turmas t
    ON t.id = al.turma_id
WHERE t.id IS NULL;

-- =========================================================
-- 20. TURMAS SEM PROFESSOR
-- =========================================================

SELECT
    t.id,
    t.nome
FROM turmas t
LEFT JOIN turma_disciplina td
    ON td.turma_id = t.id
   AND td.professor_id IS NOT NULL
WHERE td.id IS NULL
ORDER BY t.nome;

-- =========================================================
-- 21. CHAMADAS ABERTAS
-- =========================================================

SELECT
    a.id,
    t.nome AS turma,
    d.nome AS disciplina,
    u.nome AS professor,
    a.data_aula,
    a.hora_inicio,
    a.status
FROM aulas a
JOIN turma_disciplina td
    ON td.id = a.turma_disciplina_id
JOIN turmas t
    ON t.id = td.turma_id
JOIN disciplinas d
    ON d.id = td.disciplina_id
JOIN professores p
    ON p.id = td.professor_id
JOIN usuarios u
    ON u.id = p.usuario_id
WHERE a.status = 'EM_ANDAMENTO'
ORDER BY
    a.data_aula DESC,
    a.hora_inicio DESC;

-- =========================================================
-- 22. VERIFICAR ESTRUTURA DA AUTOMACAO
-- =========================================================

SHOW TABLES LIKE 'horarios_aula';

SHOW COLUMNS
FROM aulas
LIKE 'horario_aula_id';
