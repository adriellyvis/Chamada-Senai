-- =========================================================
-- =========================================================
-- PreZence - Banco de dados
-- CREATEs consolidados para o estado atual do projeto.
-- =========================================================
-- =========================================================

CREATE DATABASE IF NOT EXISTS prezence;
USE prezence;

-- Tabela de perfis
CREATE TABLE IF NOT EXISTS perfis (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(50) NOT NULL,
    CONSTRAINT uk_perfis_nome UNIQUE (nome)
);

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    senha VARCHAR(255) NOT NULL,
    perfil_id INT NOT NULL,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    data_criacao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uk_usuarios_email UNIQUE (email),
    CONSTRAINT fk_usuario_perfil
        FOREIGN KEY (perfil_id) REFERENCES perfis(id),

    INDEX idx_usuarios_perfil (perfil_id),
    INDEX idx_usuarios_ativo (ativo)
);

-- Tabela de turmas
CREATE TABLE IF NOT EXISTS turmas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    descricao TEXT NULL,
    sala VARCHAR(50) NULL,
    horario_inicio TIME NULL,
    horario_fim TIME NULL,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    data_inicio DATE NULL,
    data_fim_prevista DATE NULL,

    CONSTRAINT chk_turmas_horario
        CHECK (
            horario_inicio IS NULL
            OR horario_fim IS NULL
            OR horario_fim > horario_inicio
        ),
    CONSTRAINT chk_turmas_periodo
        CHECK (
            data_inicio IS NULL
            OR data_fim_prevista IS NULL
            OR data_fim_prevista > data_inicio
        ),

    INDEX idx_turmas_ativo (ativo),
    INDEX idx_turmas_periodo (data_inicio, data_fim_prevista)
);

-- Tabela de alunos
CREATE TABLE IF NOT EXISTS alunos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    turma_id INT NOT NULL,
    matricula VARCHAR(50) NOT NULL,
    digito_ra VARCHAR(2) NULL,
    uf VARCHAR(2) NULL,
    data_nascimento DATE NULL,

    CONSTRAINT uk_alunos_usuario UNIQUE (usuario_id),
    CONSTRAINT uk_aluno_ra_completo
    UNIQUE (
        matricula,
        digito_ra,
        uf
    ),
    CONSTRAINT fk_aluno_usuario
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
    CONSTRAINT fk_aluno_turma
        FOREIGN KEY (turma_id) REFERENCES turmas(id),

    INDEX idx_alunos_turma (turma_id)
);

-- Tabela de professores
CREATE TABLE IF NOT EXISTS professores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    especialidade VARCHAR(100) NULL,

    CONSTRAINT uk_professores_usuario UNIQUE (usuario_id),
    CONSTRAINT fk_professor_usuario
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- Tabela de responsáveis
CREATE TABLE IF NOT EXISTS responsaveis (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    telefone VARCHAR(20) NULL,

    CONSTRAINT uk_responsaveis_email UNIQUE (email)
);

-- Relação entre alunos e responsáveis
CREATE TABLE IF NOT EXISTS aluno_responsavel (
    aluno_id INT NOT NULL,
    responsavel_id INT NOT NULL,

    PRIMARY KEY (aluno_id, responsavel_id),
    CONSTRAINT fk_aluno_resp_aluno
        FOREIGN KEY (aluno_id) REFERENCES alunos(id),
    CONSTRAINT fk_aluno_resp_responsavel
        FOREIGN KEY (responsavel_id) REFERENCES responsaveis(id),

    INDEX idx_aluno_responsavel_responsavel (responsavel_id)
);

-- Tabela de disciplinas
CREATE TABLE IF NOT EXISTS disciplinas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    sigla VARCHAR(10) NOT NULL,

    CONSTRAINT uk_disciplinas_nome UNIQUE (nome),
    CONSTRAINT uk_disciplinas_sigla UNIQUE (sigla)
);

-- Relação entre turma, disciplina e professor
CREATE TABLE IF NOT EXISTS turma_disciplina (
    id INT AUTO_INCREMENT PRIMARY KEY,
    turma_id INT NOT NULL,
    disciplina_id INT NOT NULL,
    professor_id INT NOT NULL,

    CONSTRAINT fk_td_turma
        FOREIGN KEY (turma_id) REFERENCES turmas(id),
    CONSTRAINT fk_td_disciplina
        FOREIGN KEY (disciplina_id) REFERENCES disciplinas(id),
    CONSTRAINT fk_td_professor
        FOREIGN KEY (professor_id) REFERENCES professores(id),
    CONSTRAINT uk_turma_disciplina
        UNIQUE (turma_id, disciplina_id, professor_id),

    INDEX idx_td_turma (turma_id),
    INDEX idx_td_disciplina (disciplina_id),
    INDEX idx_td_professor (professor_id)
);

-- Tabela de horários das aulas
CREATE TABLE IF NOT EXISTS horarios_aula (
    id INT AUTO_INCREMENT PRIMARY KEY,
    turma_disciplina_id INT NOT NULL,
    dia_semana ENUM(
        'MONDAY',
        'TUESDAY',
        'WEDNESDAY',
        'THURSDAY',
        'FRIDAY',
        'SATURDAY',
        'SUNDAY'
    ) NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fim TIME NOT NULL,
    tolerancia_minutos INT NOT NULL DEFAULT 0,
    abertura_automatica BOOLEAN NOT NULL DEFAULT TRUE,
    encerramento_automatico BOOLEAN NOT NULL DEFAULT TRUE,
    data_inicio_vigencia DATE NULL,
    data_fim_vigencia DATE NULL,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,

    CONSTRAINT fk_horario_turma_disciplina
        FOREIGN KEY (turma_disciplina_id) REFERENCES turma_disciplina(id),
    CONSTRAINT chk_horario_intervalo
        CHECK (hora_fim > hora_inicio),
    CONSTRAINT chk_horario_tolerancia
        CHECK (tolerancia_minutos BETWEEN 0 AND 180),
    CONSTRAINT chk_horario_vigencia
        CHECK (
            data_inicio_vigencia IS NULL
            OR data_fim_vigencia IS NULL
            OR data_fim_vigencia >= data_inicio_vigencia
        ),

    INDEX idx_horarios_td (turma_disciplina_id),
    INDEX idx_horarios_dia_inicio (dia_semana, hora_inicio),
    INDEX idx_horarios_ativo (ativo),
    INDEX idx_horarios_vigencia (data_inicio_vigencia, data_fim_vigencia)
);

-- Tabela de aulas
CREATE TABLE IF NOT EXISTS aulas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    turma_disciplina_id INT NOT NULL,
    horario_aula_id INT NULL,
    data_aula DATE NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fim TIME NULL,
    token VARCHAR(50) NULL,
    token_expiracao DATETIME NULL,
    status ENUM(
        'AGENDADA',
        'EM_ANDAMENTO',
        'ENCERRADA',
        'CANCELADA'
    ) NOT NULL DEFAULT 'AGENDADA',

    CONSTRAINT uk_aulas_token UNIQUE (token),
    CONSTRAINT uk_aula_horario_data UNIQUE (horario_aula_id, data_aula),
    CONSTRAINT fk_aula_turma_disciplina
        FOREIGN KEY (turma_disciplina_id) REFERENCES turma_disciplina(id),
    CONSTRAINT fk_aula_horario
        FOREIGN KEY (horario_aula_id) REFERENCES horarios_aula(id),

    INDEX idx_aulas_turma_disciplina (turma_disciplina_id),
    INDEX idx_aulas_horario (horario_aula_id),
    INDEX idx_aulas_data (data_aula),
    INDEX idx_aulas_status (status),
    INDEX idx_aulas_data_status (data_aula, status)
);

-- Tabela de presenças
CREATE TABLE IF NOT EXISTS presencas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    aluno_id INT NOT NULL,
    aula_id INT NOT NULL,
    status ENUM(
        'PRESENTE',
        'AUSENTE',
        'ATRASADO',
        'SAIDA_TEMPORARIA'
    ) NOT NULL DEFAULT 'AUSENTE',
    horario_registro DATETIME NULL DEFAULT NULL,
    metodo ENUM(
        'MANUAL',
        'BIOMETRIA',
        'TOKEN'
    ) NOT NULL DEFAULT 'MANUAL',
    validacao_biometrica BOOLEAN NOT NULL DEFAULT FALSE,

    CONSTRAINT uk_presenca_aluno_aula UNIQUE (aluno_id, aula_id),
    CONSTRAINT fk_presenca_aluno
        FOREIGN KEY (aluno_id) REFERENCES alunos(id),
    CONSTRAINT fk_presenca_aula
        FOREIGN KEY (aula_id) REFERENCES aulas(id),

    INDEX idx_presencas_aula (aula_id),
    INDEX idx_presencas_status (status),
    INDEX idx_presencas_metodo (metodo)
);

-- Tabela de saídas temporárias
CREATE TABLE IF NOT EXISTS saidas_temporarias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    aluno_id INT NOT NULL,
    aula_id INT NOT NULL,
    hora_saida DATETIME NOT NULL,
    hora_retorno DATETIME NULL,
    tempo_limite INT NOT NULL,

    CONSTRAINT fk_saida_aluno
        FOREIGN KEY (aluno_id) REFERENCES alunos(id),
    CONSTRAINT fk_saida_aula
        FOREIGN KEY (aula_id) REFERENCES aulas(id),
    CONSTRAINT chk_saida_tempo_limite
        CHECK (tempo_limite > 0),
    CONSTRAINT chk_saida_retorno
        CHECK (hora_retorno IS NULL OR hora_retorno >= hora_saida),

    INDEX idx_saidas_aluno (aluno_id),
    INDEX idx_saidas_aula (aula_id)
);

-- Tabela de logs de acesso
CREATE TABLE IF NOT EXISTS logs_acesso (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    data_hora DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    acao VARCHAR(255) NOT NULL,
    ip VARCHAR(45) NULL,

    CONSTRAINT fk_log_usuario
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id),

    INDEX idx_logs_usuario (usuario_id),
    INDEX idx_logs_data (data_hora)
);
-- 
-- Tabela de ocorrências
CREATE TABLE IF NOT EXISTS ocorrencias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    aluno_id INT NOT NULL,
    professor_id INT NOT NULL,
    titulo VARCHAR(150) NOT NULL,
    descricao TEXT NOT NULL,
    gravidade ENUM(
        'BAIXA',
        'MEDIA',
        'ALTA'
    ) NOT NULL,
    status ENUM(
        'PENDENTE',
        'EM_ANALISE',
        'RESOLVIDA',
        'CANCELADA'
    ) NOT NULL DEFAULT 'PENDENTE',
    tipo ENUM(
        'DISCIPLINAR',
        'ATESTADO',
        'JUSTIFICATIVA',
        'INTERVENCAO',
        'DESTAQUE'
    ) NOT NULL,
    resposta_gestor TEXT NULL,
    data_ocorrencia DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao DATETIME NULL,

    CONSTRAINT fk_ocorrencia_aluno
        FOREIGN KEY (aluno_id) REFERENCES alunos(id),
    CONSTRAINT fk_ocorrencia_professor
        FOREIGN KEY (professor_id) REFERENCES professores(id),

    INDEX idx_ocorrencias_aluno (aluno_id),
    INDEX idx_ocorrencias_professor (professor_id),
    INDEX idx_ocorrencias_status (status),
    INDEX idx_ocorrencias_data (data_ocorrencia)
);


-- =========================================================
-- Tabela de avisos
-- =========================================================
CREATE TABLE IF NOT EXISTS avisos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    aluno_id INT NOT NULL,
    autor_id INT NOT NULL,
    turma_id INT NULL,
    titulo VARCHAR(150) NOT NULL,
    mensagem TEXT NOT NULL,
    categoria ENUM(
        'GERAL',
        'FREQUENCIA',
        'ATENDIMENTO',
        'DOCUMENTACAO',
        'PRAZO',
        'ACADEMICO',
        'FEEDBACK',
        'OUTRO'
    ) NOT NULL DEFAULT 'GERAL',
    prioridade ENUM(
        'NORMAL',
        'IMPORTANTE'
    ) NOT NULL DEFAULT 'NORMAL',
    lido BOOLEAN NOT NULL DEFAULT FALSE,
    frequencia DOUBLE NULL,
    nota FLOAT(53) NULL,
    melhorias TEXT NULL,
    data_criacao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_aviso_aluno
        FOREIGN KEY (aluno_id) REFERENCES alunos(id),
    CONSTRAINT fk_aviso_autor
        FOREIGN KEY (autor_id) REFERENCES usuarios(id),
    CONSTRAINT fk_aviso_turma
        FOREIGN KEY (turma_id) REFERENCES turmas(id),

    INDEX idx_avisos_aluno (aluno_id),
    INDEX idx_avisos_autor (autor_id),
    INDEX idx_avisos_turma (turma_id),
    INDEX idx_avisos_lido (lido),
    INDEX idx_avisos_data (data_criacao)
);

-- =========================================================
-- Solicitações de confirmação de presença biométrica
-- =========================================================
CREATE TABLE IF NOT EXISTS solicitacoes_presenca_biometrica (
    id INT AUTO_INCREMENT PRIMARY KEY,
    aluno_id INT NOT NULL,
    aula_id INT NOT NULL,
    status ENUM(
        'PENDENTE',
        'CONFIRMADA',
        'RECUSADA'
    ) NOT NULL DEFAULT 'PENDENTE',
    status_sugerido ENUM(
        'PRESENTE',
        'AUSENTE',
        'ATRASADO',
        'SAIDA_TEMPORARIA'
    ) NOT NULL,
    horario_solicitacao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    horario_decisao DATETIME NULL,
    professor_usuario_id INT NULL,
    motivo_recusa VARCHAR(500) NULL,

    CONSTRAINT fk_solicitacao_biometrica_aluno
        FOREIGN KEY (aluno_id) REFERENCES alunos(id),
    CONSTRAINT fk_solicitacao_biometrica_aula
        FOREIGN KEY (aula_id) REFERENCES aulas(id),
    CONSTRAINT fk_solicitacao_biometrica_professor_usuario
        FOREIGN KEY (professor_usuario_id) REFERENCES usuarios(id),

    INDEX idx_solicitacao_aluno_aula (aluno_id, aula_id),
    INDEX idx_solicitacao_status (status),
    INDEX idx_solicitacao_professor (professor_usuario_id),
    INDEX idx_solicitacao_horario (horario_solicitacao)
);

-- Tabela de biometria
CREATE TABLE IF NOT EXISTS biometria (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    embedding_facial TEXT NOT NULL,
    tipo VARCHAR(20) NOT NULL DEFAULT 'face',
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    data_cadastro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uk_biometria_usuario_tipo UNIQUE (usuario_id, tipo),
    CONSTRAINT fk_biometria_usuario
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id),

    INDEX idx_biometria_ativo (ativo)
);


-- =========================================================
-- Amostras faciais da biometria
-- Cada biometria facial possui 5 amostras processadas.
-- =========================================================
CREATE TABLE IF NOT EXISTS biometria_amostras (
    id INT AUTO_INCREMENT PRIMARY KEY,
    biometria_id INT NOT NULL,
    ordem_amostra INT NOT NULL,
    etapa VARCHAR(40) NULL,
    imagem_face LONGBLOB NOT NULL,
    data_cadastro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_biometria_amostra_biometria
        FOREIGN KEY (biometria_id)
        REFERENCES biometria(id)
        ON DELETE CASCADE,

    CONSTRAINT uk_biometria_ordem_amostra
        UNIQUE (biometria_id, ordem_amostra),

    CONSTRAINT chk_biometria_ordem_amostra
        CHECK (ordem_amostra BETWEEN 1 AND 5),

    INDEX idx_biometria_amostras_biometria (biometria_id)
);

-- =========================================================
-- Notas acadêmicas
-- =========================================================
CREATE TABLE IF NOT EXISTS notas (
    id INT AUTO_INCREMENT PRIMARY KEY,

    aluno_id INT NOT NULL,
    turma_disciplina_id INT NOT NULL,

    titulo VARCHAR(100) NOT NULL,

    nota FLOAT(53) NOT NULL,
    nota_maxima FLOAT(53) NOT NULL DEFAULT 10.00,

    bimestre INT NULL,

    observacao VARCHAR(500) NULL,

    data_avaliacao DATE NULL,
    data_criacao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_nota_aluno
        FOREIGN KEY (aluno_id)
        REFERENCES alunos(id),

    CONSTRAINT fk_nota_turma_disciplina
        FOREIGN KEY (turma_disciplina_id)
        REFERENCES turma_disciplina(id),

    CONSTRAINT chk_nota_valor
        CHECK (nota >= 0 AND nota <= nota_maxima),

    CONSTRAINT chk_nota_maxima
        CHECK (nota_maxima > 0),

    CONSTRAINT chk_nota_bimestre
        CHECK (bimestre IS NULL OR bimestre BETWEEN 1 AND 4),

    INDEX idx_notas_aluno (aluno_id),
    INDEX idx_notas_turma_disciplina (turma_disciplina_id),
    INDEX idx_notas_bimestre (bimestre)
);

CREATE TABLE IF NOT EXISTS solicitacoes_suporte (
    id INT AUTO_INCREMENT PRIMARY KEY,

    nome VARCHAR(120) NOT NULL,
    email VARCHAR(160) NOT NULL,
    perfil VARCHAR(30) NOT NULL,

    assunto VARCHAR(120) NOT NULL,
    mensagem TEXT NOT NULL,

    status VARCHAR(20) NOT NULL DEFAULT 'PENDENTE',

    resposta_gestor TEXT NULL,

    gestor_usuario_id INT NULL,

    data_criacao DATETIME(6) NOT NULL,
    data_atualizacao DATETIME(6) NULL,

    CONSTRAINT fk_solicitacoes_suporte_gestor
        FOREIGN KEY (gestor_usuario_id)
        REFERENCES usuarios(id)
);

CREATE INDEX idx_suporte_status_data
    ON solicitacoes_suporte(status, data_criacao);
    
CREATE TABLE IF NOT EXISTS recuperacoes_senha (
    id INT AUTO_INCREMENT PRIMARY KEY,

    challenge_id VARCHAR(64) NOT NULL UNIQUE,

    usuario_id INT NOT NULL,

    status VARCHAR(30) NOT NULL,

    tentativas INT NOT NULL DEFAULT 0,

    criado_em DATETIME(6) NOT NULL,

    expira_em DATETIME(6) NOT NULL,

    biometria_validada_em DATETIME(6) NULL,

    concluido_em DATETIME(6) NULL,

    CONSTRAINT fk_recuperacao_senha_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id)
);

CREATE INDEX idx_recuperacao_challenge
    ON recuperacoes_senha(challenge_id);

CREATE INDEX idx_recuperacao_usuario_status
    ON recuperacoes_senha(usuario_id, status);
    
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