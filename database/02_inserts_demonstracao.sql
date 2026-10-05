-- =========================================================
-- PreZence - INSERTS de demonstração
-- Compatível com 01_criar_estrutura_completa.sql
--
-- IMPORTANTE:
-- 1) Execute este arquivo em um banco EyeCount vazio, após os CREATEs.
-- 2) Todos os usuários abaixo usam a senha: 123456
-- 3) A senha já está armazenada com BCrypt.
-- 4) Biometria/amostras faciais NÃO são semeadas com dados falsos.
--    Cadastre os rostos normalmente pelo sistema.
-- =========================================================

-- =========================================================
-- PERFIS
-- =========================================================
INSERT INTO perfis (id, nome) VALUES
(1, 'aluno'),
(2, 'professor'),
(3, 'gestor');

-- =========================================================
-- USUÁRIOS
-- Senha de todos: 123456
-- =========================================================
INSERT INTO usuarios (id, nome, email, senha, perfil_id, ativo) VALUES
(1,  'Ana Souza',       'ana.gestora@eyecount.com',         '$2y$10$Gb5qJNCexwlvocxFoAGA1.fCiLhpDT2Ern27JQo5IXmXu8D219FyW', 3, TRUE),
(2,  'Bruno Lima',      'bruno.gestor@eyecount.com',        '$2y$10$Gb5qJNCexwlvocxFoAGA1.fCiLhpDT2Ern27JQo5IXmXu8D219FyW', 3, TRUE),
(3,  'Daniela Martins', 'daniela.professor@eyecount.com',   '$2y$10$Gb5qJNCexwlvocxFoAGA1.fCiLhpDT2Ern27JQo5IXmXu8D219FyW', 2, TRUE),
(4,  'Ricardo Oliveira','ricardo.professor@eyecount.com',   '$2y$10$Gb5qJNCexwlvocxFoAGA1.fCiLhpDT2Ern27JQo5IXmXu8D219FyW', 2, TRUE),
(5,  'Camila Santos',   'camila.professor@eyecount.com',    '$2y$10$Gb5qJNCexwlvocxFoAGA1.fCiLhpDT2Ern27JQo5IXmXu8D219FyW', 2, TRUE),
(6,  'Lucas Ferreira',  'lucas.aluno@eyecount.com',         '$2y$10$Gb5qJNCexwlvocxFoAGA1.fCiLhpDT2Ern27JQo5IXmXu8D219FyW', 1, TRUE),
(7,  'Mariana Costa',   'mariana.aluno@eyecount.com',       '$2y$10$Gb5qJNCexwlvocxFoAGA1.fCiLhpDT2Ern27JQo5IXmXu8D219FyW', 1, TRUE),
(8,  'Pedro Almeida',   'pedro.aluno@eyecount.com',         '$2y$10$Gb5qJNCexwlvocxFoAGA1.fCiLhpDT2Ern27JQo5IXmXu8D219FyW', 1, TRUE),
(9,  'Diego Alves',     'diego.aluno@eyecount.com',         '$2y$10$Gb5qJNCexwlvocxFoAGA1.fCiLhpDT2Ern27JQo5IXmXu8D219FyW', 1, TRUE),
(10, 'Maicon Silva',    'maicon@senai.com',                  '$2y$10$Gb5qJNCexwlvocxFoAGA1.fCiLhpDT2Ern27JQo5IXmXu8D219FyW', 1, TRUE),
(11, 'Sofia Rodrigues', 'sofia.aluno@eyecount.com',         '$2y$10$Gb5qJNCexwlvocxFoAGA1.fCiLhpDT2Ern27JQo5IXmXu8D219FyW', 1, TRUE);

-- =========================================================
-- TURMAS
-- =========================================================
INSERT INTO turmas
(id, nome, descricao, sala, horario_inicio, horario_fim, ativo, data_inicio, data_fim_prevista)
VALUES
(1, 'DS 2026 - Turma A', 'Desenvolvimento de Sistemas - Turma A', 'Sala 101',
 '13:00:00', '17:15:00', TRUE,
 DATE_SUB(CURDATE(), INTERVAL 30 DAY),
 DATE_ADD(CURDATE(), INTERVAL 120 DAY)),

(2, 'DS 2026 - Turma B', 'Desenvolvimento de Sistemas - Turma B', 'Sala 102',
 '13:00:00', '17:15:00', TRUE,
 DATE_SUB(CURDATE(), INTERVAL 30 DAY),
 DATE_ADD(CURDATE(), INTERVAL 120 DAY));

-- =========================================================
-- ALUNOS
-- Observação importante:
-- Diego Alves mantém usuario_id = 9 e aluno.id = 4.
-- RA de demonstração: dígito 01 e UF SP para todos os alunos.
-- =========================================================
INSERT INTO alunos (id, usuario_id, turma_id, matricula, digito_ra, uf, data_nascimento) VALUES
(1,  6, 1, '2026001', '01', 'SP', '2008-03-12'),
(2,  7, 1, '2026002', '01', 'SP', '2007-11-08'),
(3,  8, 1, '2026003', '01', 'SP', '2008-06-21'),
(4,  9, 1, '2026004', '01', 'SP', '2007-09-17'),
(5, 10, 2, '2026005', '01', 'SP', '2008-02-04'),
(6, 11, 2, '2026006', '01', 'SP', '2007-12-15');

-- =========================================================
-- PROFESSORES
-- =========================================================
INSERT INTO professores (id, usuario_id, especialidade) VALUES
(1, 3, 'Banco de Dados'),
(2, 4, 'Programação Web'),
(3, 5, 'Lógica de Programação');

-- =========================================================
-- RESPONSÁVEIS
-- =========================================================
INSERT INTO responsaveis (id, nome, email, telefone) VALUES
(1, 'Carlos Ferreira', 'carlos.ferreira@email.com', '(11) 99999-1001'),
(2, 'Fernanda Costa',  'fernanda.costa@email.com',  '(11) 99999-1002'),
(3, 'Roberto Silva',   'roberto.silva@email.com',   '(11) 99999-1003');

INSERT INTO aluno_responsavel (aluno_id, responsavel_id) VALUES
(1, 1),
(2, 2),
(5, 3);

-- =========================================================
-- DISCIPLINAS
-- =========================================================
INSERT INTO disciplinas (id, nome, sigla) VALUES
(1, 'Programação Web', 'PW'),
(2, 'Banco de Dados',  'BD'),
(3, 'Lógica de Programação', 'LOG');

-- =========================================================
-- TURMA + DISCIPLINA + PROFESSOR
--
-- Daniela (professor.id 1) ministra Banco de Dados:
-- turmaDisciplinaId 2 -> Turma A
-- turmaDisciplinaId 5 -> Turma B
-- =========================================================
INSERT INTO turma_disciplina (id, turma_id, disciplina_id, professor_id) VALUES
(1, 1, 1, 2),
(2, 1, 2, 1),
(3, 1, 3, 3),
(4, 2, 1, 2),
(5, 2, 2, 1),
(6, 2, 3, 3);

-- =========================================================
-- HORÁRIOS DE AULA
-- =========================================================
INSERT INTO horarios_aula
(id, turma_disciplina_id, dia_semana, hora_inicio, hora_fim,
 tolerancia_minutos, abertura_automatica, encerramento_automatico,
 data_inicio_vigencia, data_fim_vigencia, ativo)
VALUES
(1, 1, 'MONDAY',    '13:00:00', '15:00:00', 10, TRUE, TRUE,
 DATE_SUB(CURDATE(), INTERVAL 30 DAY), DATE_ADD(CURDATE(), INTERVAL 120 DAY), TRUE),

(2, 2, 'TUESDAY',   '13:00:00', '15:00:00', 10, TRUE, TRUE,
 DATE_SUB(CURDATE(), INTERVAL 30 DAY), DATE_ADD(CURDATE(), INTERVAL 120 DAY), TRUE),

(3, 3, 'WEDNESDAY', '13:00:00', '15:00:00', 10, TRUE, TRUE,
 DATE_SUB(CURDATE(), INTERVAL 30 DAY), DATE_ADD(CURDATE(), INTERVAL 120 DAY), TRUE),

(4, 4, 'THURSDAY',  '13:00:00', '15:00:00', 10, TRUE, TRUE,
 DATE_SUB(CURDATE(), INTERVAL 30 DAY), DATE_ADD(CURDATE(), INTERVAL 120 DAY), TRUE),

(5, 5, 'FRIDAY',    '13:00:00', '15:00:00', 10, TRUE, TRUE,
 DATE_SUB(CURDATE(), INTERVAL 30 DAY), DATE_ADD(CURDATE(), INTERVAL 120 DAY), TRUE),

(6, 6, 'WEDNESDAY', '15:15:00', '17:15:00', 10, TRUE, TRUE,
 DATE_SUB(CURDATE(), INTERVAL 30 DAY), DATE_ADD(CURDATE(), INTERVAL 120 DAY), TRUE);

-- =========================================================
-- AULAS DE EXEMPLO
-- Aulas encerradas recentes para alimentar dashboards/frequência.
-- =========================================================
INSERT INTO aulas
(id, turma_disciplina_id, horario_aula_id, data_aula, hora_inicio, hora_fim, token, token_expiracao, status)
VALUES
(1,  1, 1, DATE_SUB(CURDATE(), INTERVAL 21 DAY), '13:00:00', '15:00:00', NULL, NULL, 'ENCERRADA'),
(2,  2, 2, DATE_SUB(CURDATE(), INTERVAL 20 DAY), '13:00:00', '15:00:00', NULL, NULL, 'ENCERRADA'),
(3,  3, 3, DATE_SUB(CURDATE(), INTERVAL 19 DAY), '13:00:00', '15:00:00', NULL, NULL, 'ENCERRADA'),
(4,  1, 1, DATE_SUB(CURDATE(), INTERVAL 14 DAY), '13:00:00', '15:00:00', NULL, NULL, 'ENCERRADA'),
(5,  2, 2, DATE_SUB(CURDATE(), INTERVAL 13 DAY), '13:00:00', '15:00:00', NULL, NULL, 'ENCERRADA'),
(6,  3, 3, DATE_SUB(CURDATE(), INTERVAL 12 DAY), '13:00:00', '15:00:00', NULL, NULL, 'ENCERRADA'),

(7,  4, 4, DATE_SUB(CURDATE(), INTERVAL 18 DAY), '13:00:00', '15:00:00', NULL, NULL, 'ENCERRADA'),
(8,  5, 5, DATE_SUB(CURDATE(), INTERVAL 17 DAY), '13:00:00', '15:00:00', NULL, NULL, 'ENCERRADA'),
(9,  6, 6, DATE_SUB(CURDATE(), INTERVAL 16 DAY), '15:15:00', '17:15:00', NULL, NULL, 'ENCERRADA'),
(10, 4, 4, DATE_SUB(CURDATE(), INTERVAL 11 DAY), '13:00:00', '15:00:00', NULL, NULL, 'ENCERRADA'),
(11, 5, 5, DATE_SUB(CURDATE(), INTERVAL 10 DAY), '13:00:00', '15:00:00', NULL, NULL, 'ENCERRADA'),
(12, 6, 6, DATE_SUB(CURDATE(), INTERVAL 9 DAY),  '15:15:00', '17:15:00', NULL, NULL, 'ENCERRADA');

-- =========================================================
-- PRESENÇAS - TURMA A
-- =========================================================
INSERT INTO presencas
(id, aluno_id, aula_id, status, horario_registro, metodo, validacao_biometrica)
VALUES
(1,  1, 1, 'PRESENTE', DATE_ADD(DATE_SUB(CURDATE(), INTERVAL 21 DAY), INTERVAL 13 HOUR), 'MANUAL', FALSE),
(2,  2, 1, 'PRESENTE', DATE_ADD(DATE_SUB(CURDATE(), INTERVAL 21 DAY), INTERVAL 13 HOUR), 'MANUAL', FALSE),
(3,  3, 1, 'ATRASADO', DATE_ADD(DATE_ADD(DATE_SUB(CURDATE(), INTERVAL 21 DAY), INTERVAL 13 HOUR), INTERVAL 18 MINUTE), 'MANUAL', FALSE),
(4,  4, 1, 'PRESENTE', DATE_ADD(DATE_SUB(CURDATE(), INTERVAL 21 DAY), INTERVAL 13 HOUR), 'MANUAL', FALSE),

(5,  1, 2, 'PRESENTE', DATE_ADD(DATE_SUB(CURDATE(), INTERVAL 20 DAY), INTERVAL 13 HOUR), 'MANUAL', FALSE),
(6,  2, 2, 'AUSENTE',  NULL, 'MANUAL', FALSE),
(7,  3, 2, 'PRESENTE', DATE_ADD(DATE_SUB(CURDATE(), INTERVAL 20 DAY), INTERVAL 13 HOUR), 'MANUAL', FALSE),
(8,  4, 2, 'PRESENTE', DATE_ADD(DATE_SUB(CURDATE(), INTERVAL 20 DAY), INTERVAL 13 HOUR), 'MANUAL', FALSE),

(9,  1, 3, 'PRESENTE', DATE_ADD(DATE_SUB(CURDATE(), INTERVAL 19 DAY), INTERVAL 13 HOUR), 'MANUAL', FALSE),
(10, 2, 3, 'PRESENTE', DATE_ADD(DATE_SUB(CURDATE(), INTERVAL 19 DAY), INTERVAL 13 HOUR), 'MANUAL', FALSE),
(11, 3, 3, 'AUSENTE',  NULL, 'MANUAL', FALSE),
(12, 4, 3, 'ATRASADO', DATE_ADD(DATE_ADD(DATE_SUB(CURDATE(), INTERVAL 19 DAY), INTERVAL 13 HOUR), INTERVAL 14 MINUTE), 'MANUAL', FALSE),

(13, 1, 4, 'PRESENTE', DATE_ADD(DATE_SUB(CURDATE(), INTERVAL 14 DAY), INTERVAL 13 HOUR), 'MANUAL', FALSE),
(14, 2, 4, 'PRESENTE', DATE_ADD(DATE_SUB(CURDATE(), INTERVAL 14 DAY), INTERVAL 13 HOUR), 'MANUAL', FALSE),
(15, 3, 4, 'PRESENTE', DATE_ADD(DATE_SUB(CURDATE(), INTERVAL 14 DAY), INTERVAL 13 HOUR), 'MANUAL', FALSE),
(16, 4, 4, 'PRESENTE', DATE_ADD(DATE_SUB(CURDATE(), INTERVAL 14 DAY), INTERVAL 13 HOUR), 'MANUAL', FALSE),

(17, 1, 5, 'PRESENTE', DATE_ADD(DATE_SUB(CURDATE(), INTERVAL 13 DAY), INTERVAL 13 HOUR), 'MANUAL', FALSE),
(18, 2, 5, 'ATRASADO', DATE_ADD(DATE_ADD(DATE_SUB(CURDATE(), INTERVAL 13 DAY), INTERVAL 13 HOUR), INTERVAL 16 MINUTE), 'MANUAL', FALSE),
(19, 3, 5, 'PRESENTE', DATE_ADD(DATE_SUB(CURDATE(), INTERVAL 13 DAY), INTERVAL 13 HOUR), 'MANUAL', FALSE),
(20, 4, 5, 'PRESENTE', DATE_ADD(DATE_SUB(CURDATE(), INTERVAL 13 DAY), INTERVAL 13 HOUR), 'MANUAL', FALSE),

(21, 1, 6, 'PRESENTE', DATE_ADD(DATE_SUB(CURDATE(), INTERVAL 12 DAY), INTERVAL 13 HOUR), 'MANUAL', FALSE),
(22, 2, 6, 'PRESENTE', DATE_ADD(DATE_SUB(CURDATE(), INTERVAL 12 DAY), INTERVAL 13 HOUR), 'MANUAL', FALSE),
(23, 3, 6, 'PRESENTE', DATE_ADD(DATE_SUB(CURDATE(), INTERVAL 12 DAY), INTERVAL 13 HOUR), 'MANUAL', FALSE),
(24, 4, 6, 'AUSENTE',  NULL, 'MANUAL', FALSE);

-- =========================================================
-- PRESENÇAS - TURMA B
-- =========================================================
INSERT INTO presencas
(id, aluno_id, aula_id, status, horario_registro, metodo, validacao_biometrica)
VALUES
(25, 5, 7,  'PRESENTE', DATE_ADD(DATE_SUB(CURDATE(), INTERVAL 18 DAY), INTERVAL 13 HOUR), 'MANUAL', FALSE),
(26, 6, 7,  'PRESENTE', DATE_ADD(DATE_SUB(CURDATE(), INTERVAL 18 DAY), INTERVAL 13 HOUR), 'MANUAL', FALSE),
(27, 5, 8,  'ATRASADO', DATE_ADD(DATE_ADD(DATE_SUB(CURDATE(), INTERVAL 17 DAY), INTERVAL 13 HOUR), INTERVAL 15 MINUTE), 'MANUAL', FALSE),
(28, 6, 8,  'PRESENTE', DATE_ADD(DATE_SUB(CURDATE(), INTERVAL 17 DAY), INTERVAL 13 HOUR), 'MANUAL', FALSE),
(29, 5, 9,  'PRESENTE', DATE_ADD(DATE_ADD(DATE_SUB(CURDATE(), INTERVAL 16 DAY), INTERVAL 15 HOUR), INTERVAL 15 MINUTE), 'MANUAL', FALSE),
(30, 6, 9,  'AUSENTE',  NULL, 'MANUAL', FALSE),
(31, 5, 10, 'PRESENTE', DATE_ADD(DATE_SUB(CURDATE(), INTERVAL 11 DAY), INTERVAL 13 HOUR), 'MANUAL', FALSE),
(32, 6, 10, 'PRESENTE', DATE_ADD(DATE_SUB(CURDATE(), INTERVAL 11 DAY), INTERVAL 13 HOUR), 'MANUAL', FALSE),
(33, 5, 11, 'PRESENTE', DATE_ADD(DATE_SUB(CURDATE(), INTERVAL 10 DAY), INTERVAL 13 HOUR), 'MANUAL', FALSE),
(34, 6, 11, 'ATRASADO', DATE_ADD(DATE_ADD(DATE_SUB(CURDATE(), INTERVAL 10 DAY), INTERVAL 13 HOUR), INTERVAL 17 MINUTE), 'MANUAL', FALSE),
(35, 5, 12, 'AUSENTE',  NULL, 'MANUAL', FALSE),
(36, 6, 12, 'PRESENTE', DATE_ADD(DATE_ADD(DATE_SUB(CURDATE(), INTERVAL 9 DAY), INTERVAL 15 HOUR), INTERVAL 15 MINUTE), 'MANUAL', FALSE);

-- =========================================================
-- SAÍDA TEMPORÁRIA DE EXEMPLO
-- =========================================================
INSERT INTO saidas_temporarias
(id, aluno_id, aula_id, hora_saida, hora_retorno, tempo_limite)
VALUES
(
    1,
    4,
    4,
    DATE_ADD(DATE_SUB(CURDATE(), INTERVAL 14 DAY), INTERVAL 14 HOUR),
    DATE_ADD(DATE_ADD(DATE_SUB(CURDATE(), INTERVAL 14 DAY), INTERVAL 14 HOUR), INTERVAL 8 MINUTE),
    15
);

-- =========================================================
-- OCORRÊNCIAS
-- =========================================================
INSERT INTO ocorrencias
(id, aluno_id, professor_id, titulo, descricao, gravidade, status, tipo,
 resposta_gestor, data_ocorrencia, data_atualizacao)
VALUES
(1, 3, 1,
 'Frequência em atenção',
 'Aluno apresentou ausência e atraso em aulas recentes.',
 'MEDIA', 'EM_ANALISE', 'INTERVENCAO',
 'Acompanhamento iniciado pela gestão.',
 DATE_SUB(NOW(), INTERVAL 7 DAY),
 DATE_SUB(NOW(), INTERVAL 5 DAY)),

(2, 4, 3,
 'Bom desempenho em atividade',
 'Aluno apresentou ótimo desempenho e participação durante a atividade.',
 'BAIXA', 'RESOLVIDA', 'DESTAQUE',
 'Registro concluído.',
 DATE_SUB(NOW(), INTERVAL 4 DAY),
 DATE_SUB(NOW(), INTERVAL 3 DAY)),

(3, 6, 2,
 'Justificativa de ausência',
 'Ausência comunicada para análise da equipe.',
 'BAIXA', 'PENDENTE', 'JUSTIFICATIVA',
 NULL,
 DATE_SUB(NOW(), INTERVAL 2 DAY),
 NULL);

-- =========================================================
-- AVISOS / FEEDBACKS
-- =========================================================
INSERT INTO avisos
(id, aluno_id, autor_id, turma_id, titulo, mensagem, categoria, prioridade,
 lido, frequencia, nota, melhorias, data_criacao)
VALUES
(1, 4, 1, 1,
 'Atenção à frequência',
 'Acompanhe sua frequência e evite novas ausências.',
 'FREQUENCIA', 'IMPORTANTE',
 FALSE, 83.33, NULL, NULL,
 DATE_SUB(NOW(), INTERVAL 3 DAY)),

(2, 4, 3, 1,
 'Feedback de Banco de Dados',
 'Bom desempenho geral. Continue praticando consultas SQL e modelagem.',
 'FEEDBACK', 'NORMAL',
 FALSE, 83.33, 8.50,
 'Praticar JOINs, agrupamentos e normalização.',
 DATE_SUB(NOW(), INTERVAL 2 DAY)),

(3, 2, 1, 1,
 'Documentação pendente',
 'Favor verificar a documentação acadêmica junto à secretaria.',
 'DOCUMENTACAO', 'IMPORTANTE',
 FALSE, NULL, NULL, NULL,
 DATE_SUB(NOW(), INTERVAL 1 DAY)),

(4, 5, 3, 2,
 'Feedback de Banco de Dados',
 'Boa evolução nas últimas atividades.',
 'FEEDBACK', 'NORMAL',
 TRUE, 83.33, 7.80,
 'Revisar relacionamentos e chaves estrangeiras.',
 DATE_SUB(NOW(), INTERVAL 4 DAY));

-- =========================================================
-- NOTAS - TURMA A
-- =========================================================
INSERT INTO notas
(id, aluno_id, turma_disciplina_id, titulo, nota, nota_maxima, bimestre,
 observacao, data_avaliacao)
VALUES
(1,  1, 1, 'Atividade HTML/CSS',   8.50, 10.00, 1, 'Bom desempenho.', DATE_SUB(CURDATE(), INTERVAL 20 DAY)),
(2,  1, 2, 'Modelagem de Dados',   9.00, 10.00, 1, 'Ótima modelagem.', DATE_SUB(CURDATE(), INTERVAL 19 DAY)),
(3,  1, 3, 'Lista de Lógica',      8.00, 10.00, 1, NULL, DATE_SUB(CURDATE(), INTERVAL 18 DAY)),

(4,  2, 1, 'Atividade HTML/CSS',   7.50, 10.00, 1, NULL, DATE_SUB(CURDATE(), INTERVAL 20 DAY)),
(5,  2, 2, 'Modelagem de Dados',   6.50, 10.00, 1, 'Revisar normalização.', DATE_SUB(CURDATE(), INTERVAL 19 DAY)),
(6,  2, 3, 'Lista de Lógica',      8.20, 10.00, 1, NULL, DATE_SUB(CURDATE(), INTERVAL 18 DAY)),

(7,  3, 1, 'Atividade HTML/CSS',   6.00, 10.00, 1, 'Melhorar organização do código.', DATE_SUB(CURDATE(), INTERVAL 20 DAY)),
(8,  3, 2, 'Modelagem de Dados',   5.80, 10.00, 1, 'Reforçar relacionamentos.', DATE_SUB(CURDATE(), INTERVAL 19 DAY)),
(9,  3, 3, 'Lista de Lógica',      6.40, 10.00, 1, NULL, DATE_SUB(CURDATE(), INTERVAL 18 DAY)),

(10, 4, 1, 'Atividade HTML/CSS',   8.00, 10.00, 1, NULL, DATE_SUB(CURDATE(), INTERVAL 20 DAY)),
(11, 4, 2, 'Modelagem de Dados',   8.50, 10.00, 1, 'Bom domínio do conteúdo.', DATE_SUB(CURDATE(), INTERVAL 19 DAY)),
(12, 4, 3, 'Lista de Lógica',      7.50, 10.00, 1, NULL, DATE_SUB(CURDATE(), INTERVAL 18 DAY)),

(13, 1, 1, 'Projeto Front-End',    9.00, 10.00, 2, NULL, DATE_SUB(CURDATE(), INTERVAL 7 DAY)),
(14, 1, 2, 'Consultas SQL',        8.80, 10.00, 2, NULL, DATE_SUB(CURDATE(), INTERVAL 6 DAY)),
(15, 2, 1, 'Projeto Front-End',    8.30, 10.00, 2, NULL, DATE_SUB(CURDATE(), INTERVAL 7 DAY)),
(16, 2, 2, 'Consultas SQL',        7.20, 10.00, 2, NULL, DATE_SUB(CURDATE(), INTERVAL 6 DAY)),
(17, 3, 1, 'Projeto Front-End',    6.50, 10.00, 2, NULL, DATE_SUB(CURDATE(), INTERVAL 7 DAY)),
(18, 3, 2, 'Consultas SQL',        6.00, 10.00, 2, NULL, DATE_SUB(CURDATE(), INTERVAL 6 DAY)),
(19, 4, 1, 'Projeto Front-End',    8.70, 10.00, 2, NULL, DATE_SUB(CURDATE(), INTERVAL 7 DAY)),
(20, 4, 2, 'Consultas SQL',        9.00, 10.00, 2, NULL, DATE_SUB(CURDATE(), INTERVAL 6 DAY));

-- =========================================================
-- NOTAS - TURMA B
-- =========================================================
INSERT INTO notas
(id, aluno_id, turma_disciplina_id, titulo, nota, nota_maxima, bimestre,
 observacao, data_avaliacao)
VALUES
(21, 5, 4, 'Atividade HTML/CSS', 7.80, 10.00, 1, NULL, DATE_SUB(CURDATE(), INTERVAL 17 DAY)),
(22, 5, 5, 'Modelagem de Dados', 7.50, 10.00, 1, NULL, DATE_SUB(CURDATE(), INTERVAL 16 DAY)),
(23, 5, 6, 'Lista de Lógica',    8.10, 10.00, 1, NULL, DATE_SUB(CURDATE(), INTERVAL 15 DAY)),
(24, 6, 4, 'Atividade HTML/CSS', 8.60, 10.00, 1, NULL, DATE_SUB(CURDATE(), INTERVAL 17 DAY)),
(25, 6, 5, 'Modelagem de Dados', 8.20, 10.00, 1, NULL, DATE_SUB(CURDATE(), INTERVAL 16 DAY)),
(26, 6, 6, 'Lista de Lógica',    7.90, 10.00, 1, NULL, DATE_SUB(CURDATE(), INTERVAL 15 DAY));

-- =========================================================
-- LOGS DE ACESSO
-- =========================================================
INSERT INTO logs_acesso (id, usuario_id, data_hora, acao, ip) VALUES
(1, 1,  DATE_SUB(NOW(), INTERVAL 2 HOUR), 'LOGIN_GESTOR',     '127.0.0.1'),
(2, 3,  DATE_SUB(NOW(), INTERVAL 1 HOUR), 'LOGIN_PROFESSOR',  '127.0.0.1'),
(3, 9,  DATE_SUB(NOW(), INTERVAL 30 MINUTE), 'LOGIN_ALUNO',   '127.0.0.1');