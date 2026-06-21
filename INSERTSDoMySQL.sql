USE eyecount;

-- =========================================================
-- PERFIS
-- =========================================================
INSERT INTO perfis (nome) VALUES
('aluno'),
('professor'),
('gestor');

-- =========================================================
-- USUÁRIOS
-- senha padrão: 123456
-- =========================================================
INSERT INTO usuarios (nome, email, senha, perfil_id, ativo) VALUES
-- gestores
('Mariana Gestora', 'mariana.gestor@senai.com', '123456', 3, TRUE),
('Carlos Gestor', 'carlos.gestor@senai.com', '123456', 3, TRUE),

-- professores
('Fabiana Comandini', 'fabiana@senai.com', '123456', 2, TRUE),
('Roberto Lima', 'roberto@senai.com', '123456', 2, TRUE),
('Ana Paula Souza', 'ana.paula@senai.com', '123456', 2, TRUE),

-- alunos
('Maicon Silva', 'maicon@senai.com', '123456', 1, TRUE),
('João Pedro', 'joao.pedro@senai.com', '123456', 1, TRUE),
('Larissa Alves', 'larissa@senai.com', '123456', 1, TRUE),
('Pedro Henrique', 'pedro@senai.com', '123456', 1, TRUE),
('Bianca Santos', 'bianca@senai.com', '123456', 1, TRUE);

-- =========================================================
-- TURMAS
-- =========================================================
INSERT INTO turmas (nome, descricao) VALUES
('4IDS-Seduc', 'Turma de Desenvolvimento de Sistemas'),
('5IDS-Seduc', 'Turma de Back-End'),
('3RDS-Noite', 'Turma de Redes e Infraestrutura');

-- =========================================================
-- DISCIPLINAS
-- =========================================================
INSERT INTO disciplinas (nome) VALUES
('Back-End'),
('Banco de Dados'),
('Biologia'),
('Programação Web'),
('Redes de Computadores');

-- =========================================================
-- PROFESSORES
-- usuario_id conforme ordem dos inserts acima
-- Fabiana = 3, Roberto = 4, Ana Paula = 5
-- =========================================================
INSERT INTO professores (usuario_id, especialidade) VALUES
(3, 'Back-End'),
(4, 'Banco de Dados'),
(5, 'Programação Web');

-- =========================================================
-- ALUNOS
-- usuario_id: Maicon = 6, João = 7, Larissa = 8, Pedro = 9, Bianca = 10
-- =========================================================
INSERT INTO alunos (usuario_id, turma_id, matricula, data_nascimento) VALUES
(6, 1, 'MAT001', '2007-03-15'),
(7, 1, 'MAT002', '2007-08-22'),
(8, 2, 'MAT003', '2006-11-10'),
(9, 2, 'MAT004', '2007-01-30'),
(10, 3, 'MAT005', '2006-05-18');

-- =========================================================
-- RESPONSÁVEIS
-- =========================================================
INSERT INTO responsaveis (nome, email, telefone) VALUES
('Responsável Maicon', 'resp.maicon@email.com', '(11) 90000-0001'),
('Responsável João', 'resp.joao@email.com', '(11) 90000-0002'),
('Responsável Larissa', 'resp.larissa@email.com', '(11) 90000-0003');

INSERT INTO aluno_responsavel (aluno_id, responsavel_id) VALUES
(1, 1),
(2, 2),
(3, 3);

-- =========================================================
-- VÍNCULO TURMA + DISCIPLINA + PROFESSOR
-- professores: Fabiana = 1, Roberto = 2, Ana Paula = 3
-- =========================================================
INSERT INTO turma_disciplina (turma_id, disciplina_id, professor_id) VALUES
(1, 1, 1), -- 4IDS-Seduc / Back-End / Fabiana
(1, 2, 2), -- 4IDS-Seduc / Banco de Dados / Roberto
(2, 1, 1), -- 5IDS-Seduc / Back-End / Fabiana
(2, 4, 3), -- 5IDS-Seduc / Programação Web / Ana Paula
(3, 5, 2); -- 3RDS-Noite / Redes / Roberto

-- =========================================================
-- AULAS
-- =========================================================
INSERT INTO aulas (
    turma_disciplina_id,
    data_aula,
    hora_inicio,
    hora_fim,
    token,
    token_expiracao,
    status
) VALUES
(1, CURDATE(), '13:30:00', '15:00:00', 'TOK001', DATE_ADD(NOW(), INTERVAL 30 MINUTE), 'ENCERRADA'),
(2, CURDATE(), '15:45:00', '17:15:00', 'TOK002', DATE_ADD(NOW(), INTERVAL 30 MINUTE), 'ENCERRADA'),
(3, CURDATE(), '19:00:00', '20:30:00', 'TOK003', DATE_ADD(NOW(), INTERVAL 30 MINUTE), 'AGENDADA'),
(4, DATE_SUB(CURDATE(), INTERVAL 1 DAY), '13:30:00', '15:00:00', 'TOK004', DATE_SUB(NOW(), INTERVAL 1 DAY), 'ENCERRADA'),
(5, DATE_SUB(CURDATE(), INTERVAL 1 DAY), '19:00:00', '20:30:00', 'TOK005', DATE_SUB(NOW(), INTERVAL 1 DAY), 'ENCERRADA');

-- =========================================================
-- PRESENÇAS
-- =========================================================
INSERT INTO presencas (
    aluno_id,
    aula_id,
    status,
    metodo,
    validacao_biometrica
) VALUES
-- aula 1 - turma 4IDS
(1, 1, 'PRESENTE', 'MANUAL', FALSE),
(2, 1, 'ATRASADO', 'MANUAL', FALSE),

-- aula 2 - turma 4IDS
(1, 2, 'PRESENTE', 'MANUAL', FALSE),
(2, 2, 'AUSENTE', 'MANUAL', FALSE),

-- aula 4 - turma 5IDS
(3, 4, 'PRESENTE', 'MANUAL', FALSE),
(4, 4, 'PRESENTE', 'MANUAL', FALSE),

-- aula 5 - turma 3RDS
(5, 5, 'AUSENTE', 'MANUAL', FALSE);

-- =========================================================
-- OCORRÊNCIAS
-- =========================================================
INSERT INTO ocorrencias (
    aluno_id,
    professor_id,
    titulo,
    descricao,
    gravidade,
    status,
    tipo,
    resposta_gestor,
    data_atualizacao
) VALUES
(1, 1, 'Baixa frequência', 'Aluno apresentou faltas recorrentes nas últimas aulas.', 'MEDIA', 'PENDENTE', 'DISCIPLINAR', NULL, NULL),

(2, 1, 'Atrasos frequentes', 'Aluno chegou atrasado em duas aulas consecutivas.', 'BAIXA', 'EM_ANALISE', 'INTERVENCAO', NULL, NULL),

(3, 1, 'Atestado médico entregue', 'Aluno apresentou atestado referente à ausência.', 'BAIXA', 'RESOLVIDA', 'ATESTADO', 'Atestado validado pelo gestor.', NOW()),

(4, 3, 'Participação excelente', 'Aluno teve destaque em atividade prática em sala.', 'BAIXA', 'RESOLVIDA', 'DESTAQUE', 'Ocorrência positiva registrada.', NOW()),

(5, 2, 'Falta sem justificativa', 'Aluno não compareceu e não apresentou justificativa.', 'ALTA', 'PENDENTE', 'JUSTIFICATIVA', NULL, NULL);

-- =========================================================
-- BIOMETRIA
-- =========================================================
INSERT INTO biometria (
    usuario_id,
    embedding_facial,
    tipo,
    ativo
) VALUES
(6, '[0.12, 0.45, 0.98]', 'face', TRUE),
(7, '[0.22, 0.35, 0.78]', 'face', TRUE),
(8, '[0.31, 0.41, 0.68]', 'face', TRUE);

SELECT id, tipo, gravidade, status
FROM ocorrencias;

SELECT id, status, metodo
FROM presencas;