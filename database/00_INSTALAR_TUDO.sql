-- EyeCount - instalacao completa
-- Estrutura + dados de demonstracao

-- =========================================================
-- EyeCount - Estrutura completa do banco de dados
-- =========================================================
CREATE DATABASE IF NOT EXISTS eyecount;
USE eyecount;

-- =========================================================
-- TABELA: perfis
-- =========================================================
CREATE TABLE IF NOT EXISTS perfis (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(50) NOT NULL,
    CONSTRAINT uk_perfis_nome UNIQUE (nome)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================================
-- TABELA: usuarios
-- =========================================================
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================================
-- TABELA: turmas
-- =========================================================
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

    INDEX idx_turmas_ativo (ativo),
    INDEX idx_turmas_periodo (data_inicio, data_fim_prevista)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================================
-- TABELA: alunos
-- =========================================================
CREATE TABLE IF NOT EXISTS alunos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    turma_id INT NOT NULL,
    matricula VARCHAR(50) NOT NULL,
    data_nascimento DATE NULL,

    CONSTRAINT uk_alunos_usuario UNIQUE (usuario_id),
    CONSTRAINT uk_alunos_matricula UNIQUE (matricula),
    CONSTRAINT fk_aluno_usuario
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
    CONSTRAINT fk_aluno_turma
        FOREIGN KEY (turma_id) REFERENCES turmas(id),

    INDEX idx_alunos_turma (turma_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================================
-- TABELA: professores
-- =========================================================
CREATE TABLE IF NOT EXISTS professores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    especialidade VARCHAR(100) NULL,

    CONSTRAINT uk_professores_usuario UNIQUE (usuario_id),
    CONSTRAINT fk_professor_usuario
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================================
-- TABELA: responsaveis
-- =========================================================
CREATE TABLE IF NOT EXISTS responsaveis (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    telefone VARCHAR(20) NULL,

    CONSTRAINT uk_responsaveis_email UNIQUE (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================================
-- TABELA: aluno_responsavel
-- =========================================================
CREATE TABLE IF NOT EXISTS aluno_responsavel (
    aluno_id INT NOT NULL,
    responsavel_id INT NOT NULL,

    PRIMARY KEY (aluno_id, responsavel_id),
    CONSTRAINT fk_aluno_resp_aluno
        FOREIGN KEY (aluno_id) REFERENCES alunos(id),
    CONSTRAINT fk_aluno_resp_responsavel
        FOREIGN KEY (responsavel_id) REFERENCES responsaveis(id),

    INDEX idx_aluno_responsavel_responsavel (responsavel_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================================
-- TABELA: disciplinas
-- =========================================================
CREATE TABLE IF NOT EXISTS disciplinas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,

    CONSTRAINT uk_disciplinas_nome UNIQUE (nome)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================================
-- TABELA: turma_disciplina
-- =========================================================
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

    INDEX idx_td_turma (turma_id),
    INDEX idx_td_disciplina (disciplina_id),
    INDEX idx_td_professor (professor_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =========================================================
-- TABELA: horarios_aula
-- =========================================================
CREATE TABLE IF NOT EXISTS horarios_aula (
    id INT AUTO_INCREMENT PRIMARY KEY,
    turma_disciplina_id INT NOT NULL,
    dia_semana VARCHAR(20) NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fim TIME NOT NULL,
    tolerancia_minutos INT NOT NULL DEFAULT 30,
    abertura_automatica BOOLEAN NOT NULL DEFAULT TRUE,
    encerramento_automatico BOOLEAN NOT NULL DEFAULT TRUE,
    data_inicio_vigencia DATE NULL,
    data_fim_vigencia DATE NULL,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,

    CONSTRAINT fk_horario_turma_disciplina
        FOREIGN KEY (turma_disciplina_id) REFERENCES turma_disciplina(id),

    INDEX idx_horario_dia_ativo (dia_semana, ativo),
    INDEX idx_horario_turma_disciplina (turma_disciplina_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================================
-- TABELA: aulas
-- =========================================================
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
    CONSTRAINT fk_aula_turma_disciplina
        FOREIGN KEY (turma_disciplina_id) REFERENCES turma_disciplina(id),
    CONSTRAINT fk_aula_horario_aula
        FOREIGN KEY (horario_aula_id) REFERENCES horarios_aula(id),

    INDEX idx_aulas_turma_disciplina (turma_disciplina_id),
    INDEX idx_aulas_horario_aula (horario_aula_id),
    INDEX idx_aulas_data (data_aula),
    INDEX idx_aulas_status (status),
    INDEX idx_aulas_data_status (data_aula, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================================
-- TABELA: presencas
-- =========================================================
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
    horario_registro DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
    metodo ENUM(
        'MANUAL',
        'BIOMETRIA',
        'TOKEN'
    ) NOT NULL DEFAULT 'MANUAL',
    validacao_biometrica BOOLEAN NOT NULL DEFAULT FALSE,

    CONSTRAINT uk_presencas_aluno_aula UNIQUE (aluno_id, aula_id),
    CONSTRAINT fk_presenca_aluno
        FOREIGN KEY (aluno_id) REFERENCES alunos(id),
    CONSTRAINT fk_presenca_aula
        FOREIGN KEY (aula_id) REFERENCES aulas(id),

    INDEX idx_presencas_aula (aula_id),
    INDEX idx_presencas_status (status),
    INDEX idx_presencas_metodo (metodo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================================
-- TABELA: saidas_temporarias
-- =========================================================
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

    INDEX idx_saidas_aluno (aluno_id),
    INDEX idx_saidas_aula (aula_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================================
-- TABELA: logs_acesso
-- =========================================================
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================================
-- TABELA: ocorrencias
-- =========================================================
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================================
-- TABELA: biometria
-- =========================================================
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================================
-- DADOS INICIAIS ESSENCIAIS
-- =========================================================
INSERT INTO perfis (id, nome) VALUES
    (1, 'aluno'),
    (2, 'professor'),
    (3, 'gestor')
ON DUPLICATE KEY UPDATE nome = VALUES(nome);


-- =========================================================
-- EYCOUNT - INSERTS DE DEMONSTRACAO
-- MySQL 8+
--
-- Pode ser executado mais de uma vez.
-- Usuarios, alunos, professores e biometrias usam chaves unicas.
-- Turmas, vinculos, aulas e ocorrencias possuem verificacao antes do INSERT.
--
-- Senha padrao dos usuarios de teste: 123456
-- =========================================================

USE eyecount;

SET SQL_SAFE_UPDATES = 0;

-- =========================================================
-- 1. PERFIS
-- =========================================================

INSERT INTO perfis (id, nome) VALUES
    (1, 'aluno'),
    (2, 'professor'),
    (3, 'gestor')
ON DUPLICATE KEY UPDATE
    nome = VALUES(nome);

SET @perfil_aluno = (
    SELECT id FROM perfis WHERE nome = 'aluno' LIMIT 1
);

SET @perfil_professor = (
    SELECT id FROM perfis WHERE nome = 'professor' LIMIT 1
);

SET @perfil_gestor = (
    SELECT id FROM perfis WHERE nome = 'gestor' LIMIT 1
);

-- =========================================================
-- 2. USUARIOS
-- =========================================================

INSERT INTO usuarios (nome, email, senha, perfil_id, ativo) VALUES
    ('Ana Gestora', 'ana.gestora@eyecount.com', '123456', @perfil_gestor, TRUE),
    ('Bruno Gestor', 'bruno.gestor@eyecount.com', '123456', @perfil_gestor, TRUE),

    ('Carlos Professor', 'carlos.professor@eyecount.com', '123456', @perfil_professor, TRUE),
    ('Daniela Professora', 'daniela.professora@eyecount.com', '123456', @perfil_professor, TRUE),
    ('Eduardo Professor', 'eduardo.professor@eyecount.com', '123456', @perfil_professor, TRUE),

    ('Alice Santos', 'alice.santos@eyecount.com', '123456', @perfil_aluno, TRUE),
    ('Bruno Lima', 'bruno.lima@eyecount.com', '123456', @perfil_aluno, TRUE),
    ('Camila Rocha', 'camila.rocha@eyecount.com', '123456', @perfil_aluno, TRUE),
    ('Diego Alves', 'diego.alves@eyecount.com', '123456', @perfil_aluno, TRUE),
    ('Elisa Martins', 'elisa.martins@eyecount.com', '123456', @perfil_aluno, TRUE),
    ('Felipe Costa', 'felipe.costa@eyecount.com', '123456', @perfil_aluno, TRUE),
    ('Gabriela Souza', 'gabriela.souza@eyecount.com', '123456', @perfil_aluno, TRUE),
    ('Henrique Dias', 'henrique.dias@eyecount.com', '123456', @perfil_aluno, TRUE)
ON DUPLICATE KEY UPDATE
    nome = VALUES(nome),
    senha = VALUES(senha),
    perfil_id = VALUES(perfil_id),
    ativo = VALUES(ativo);

-- IDs dos usuarios criados.
SET @u_prof_carlos = (
    SELECT id FROM usuarios
    WHERE email = 'carlos.professor@eyecount.com'
    LIMIT 1
);

SET @u_prof_daniela = (
    SELECT id FROM usuarios
    WHERE email = 'daniela.professora@eyecount.com'
    LIMIT 1
);

SET @u_prof_eduardo = (
    SELECT id FROM usuarios
    WHERE email = 'eduardo.professor@eyecount.com'
    LIMIT 1
);

SET @u_alice = (
    SELECT id FROM usuarios
    WHERE email = 'alice.santos@eyecount.com'
    LIMIT 1
);

SET @u_bruno = (
    SELECT id FROM usuarios
    WHERE email = 'bruno.lima@eyecount.com'
    LIMIT 1
);

SET @u_camila = (
    SELECT id FROM usuarios
    WHERE email = 'camila.rocha@eyecount.com'
    LIMIT 1
);

SET @u_diego = (
    SELECT id FROM usuarios
    WHERE email = 'diego.alves@eyecount.com'
    LIMIT 1
);

SET @u_elisa = (
    SELECT id FROM usuarios
    WHERE email = 'elisa.martins@eyecount.com'
    LIMIT 1
);

SET @u_felipe = (
    SELECT id FROM usuarios
    WHERE email = 'felipe.costa@eyecount.com'
    LIMIT 1
);

SET @u_gabriela = (
    SELECT id FROM usuarios
    WHERE email = 'gabriela.souza@eyecount.com'
    LIMIT 1
);

SET @u_henrique = (
    SELECT id FROM usuarios
    WHERE email = 'henrique.dias@eyecount.com'
    LIMIT 1
);

-- =========================================================
-- 3. TURMAS
-- =========================================================

INSERT INTO turmas (
    nome,
    descricao,
    sala,
    horario_inicio,
    horario_fim,
    ativo,
    data_inicio,
    data_fim_prevista
)
SELECT
    'Desenvolvimento de Sistemas - Tarde',
    'Turma de desenvolvimento web, banco de dados e programacao.',
    'Sala 12',
    '13:00:00',
    '17:00:00',
    TRUE,
    DATE_SUB(CURDATE(), INTERVAL 60 DAY),
    DATE_ADD(CURDATE(), INTERVAL 300 DAY)
WHERE NOT EXISTS (
    SELECT 1
    FROM turmas
    WHERE nome = 'Desenvolvimento de Sistemas - Tarde'
);

INSERT INTO turmas (
    nome,
    descricao,
    sala,
    horario_inicio,
    horario_fim,
    ativo,
    data_inicio,
    data_fim_prevista
)
SELECT
    'Mecatronica - Manha',
    'Turma de automacao, eletrica e sistemas industriais.',
    'Laboratorio 03',
    '07:30:00',
    '11:30:00',
    TRUE,
    DATE_SUB(CURDATE(), INTERVAL 45 DAY),
    DATE_ADD(CURDATE(), INTERVAL 320 DAY)
WHERE NOT EXISTS (
    SELECT 1
    FROM turmas
    WHERE nome = 'Mecatronica - Manha'
);

INSERT INTO turmas (
    nome,
    descricao,
    sala,
    horario_inicio,
    horario_fim,
    ativo,
    data_inicio,
    data_fim_prevista
)
SELECT
    'Redes de Computadores - Noite',
    'Turma de redes, infraestrutura e seguranca.',
    'Sala 08',
    '18:30:00',
    '22:00:00',
    TRUE,
    DATE_SUB(CURDATE(), INTERVAL 30 DAY),
    DATE_ADD(CURDATE(), INTERVAL 330 DAY)
WHERE NOT EXISTS (
    SELECT 1
    FROM turmas
    WHERE nome = 'Redes de Computadores - Noite'
);

SET @turma_ds = (
    SELECT id FROM turmas
    WHERE nome = 'Desenvolvimento de Sistemas - Tarde'
    LIMIT 1
);

SET @turma_mec = (
    SELECT id FROM turmas
    WHERE nome = 'Mecatronica - Manha'
    LIMIT 1
);

SET @turma_redes = (
    SELECT id FROM turmas
    WHERE nome = 'Redes de Computadores - Noite'
    LIMIT 1
);

-- =========================================================
-- 4. PROFESSORES
-- =========================================================

INSERT INTO professores (usuario_id, especialidade) VALUES
    (@u_prof_carlos, 'Programacao e Banco de Dados'),
    (@u_prof_daniela, 'Automacao Industrial'),
    (@u_prof_eduardo, 'Redes e Seguranca')
ON DUPLICATE KEY UPDATE
    especialidade = VALUES(especialidade);

SET @prof_carlos = (
    SELECT id FROM professores
    WHERE usuario_id = @u_prof_carlos
    LIMIT 1
);

SET @prof_daniela = (
    SELECT id FROM professores
    WHERE usuario_id = @u_prof_daniela
    LIMIT 1
);

SET @prof_eduardo = (
    SELECT id FROM professores
    WHERE usuario_id = @u_prof_eduardo
    LIMIT 1
);

-- =========================================================
-- 5. ALUNOS
-- =========================================================

INSERT INTO alunos (
    usuario_id,
    turma_id,
    matricula,
    data_nascimento
) VALUES
    (@u_alice, @turma_ds, 'EC2026001', '2008-02-10'),
    (@u_bruno, @turma_ds, 'EC2026002', '2007-11-21'),
    (@u_camila, @turma_ds, 'EC2026003', '2008-05-14'),
    (@u_diego, @turma_ds, 'EC2026004', '2007-09-03'),

    (@u_elisa, @turma_mec, 'EC2026005', '2008-01-19'),
    (@u_felipe, @turma_mec, 'EC2026006', '2007-07-27'),

    (@u_gabriela, @turma_redes, 'EC2026007', '2008-03-30'),
    (@u_henrique, @turma_redes, 'EC2026008', '2007-12-08')
ON DUPLICATE KEY UPDATE
    turma_id = VALUES(turma_id),
    matricula = VALUES(matricula),
    data_nascimento = VALUES(data_nascimento);

SET @aluno_alice = (
    SELECT id FROM alunos WHERE usuario_id = @u_alice LIMIT 1
);

SET @aluno_bruno = (
    SELECT id FROM alunos WHERE usuario_id = @u_bruno LIMIT 1
);

SET @aluno_camila = (
    SELECT id FROM alunos WHERE usuario_id = @u_camila LIMIT 1
);

SET @aluno_diego = (
    SELECT id FROM alunos WHERE usuario_id = @u_diego LIMIT 1
);

SET @aluno_elisa = (
    SELECT id FROM alunos WHERE usuario_id = @u_elisa LIMIT 1
);

SET @aluno_felipe = (
    SELECT id FROM alunos WHERE usuario_id = @u_felipe LIMIT 1
);

SET @aluno_gabriela = (
    SELECT id FROM alunos WHERE usuario_id = @u_gabriela LIMIT 1
);

SET @aluno_henrique = (
    SELECT id FROM alunos WHERE usuario_id = @u_henrique LIMIT 1
);

-- =========================================================
-- 6. DISCIPLINAS
-- =========================================================

INSERT INTO disciplinas (nome) VALUES
    ('Logica de Programacao'),
    ('Banco de Dados'),
    ('Desenvolvimento Web'),
    ('Automacao Industrial'),
    ('Redes de Computadores'),
    ('Seguranca da Informacao')
ON DUPLICATE KEY UPDATE
    nome = VALUES(nome);

SET @disc_logica = (
    SELECT id FROM disciplinas
    WHERE nome = 'Logica de Programacao'
    LIMIT 1
);

SET @disc_banco = (
    SELECT id FROM disciplinas
    WHERE nome = 'Banco de Dados'
    LIMIT 1
);

SET @disc_web = (
    SELECT id FROM disciplinas
    WHERE nome = 'Desenvolvimento Web'
    LIMIT 1
);

SET @disc_automacao = (
    SELECT id FROM disciplinas
    WHERE nome = 'Automacao Industrial'
    LIMIT 1
);

SET @disc_redes = (
    SELECT id FROM disciplinas
    WHERE nome = 'Redes de Computadores'
    LIMIT 1
);

SET @disc_seguranca = (
    SELECT id FROM disciplinas
    WHERE nome = 'Seguranca da Informacao'
    LIMIT 1
);

-- =========================================================
-- 7. VINCULOS TURMA, DISCIPLINA E PROFESSOR
-- =========================================================

INSERT INTO turma_disciplina (
    turma_id,
    disciplina_id,
    professor_id
)
SELECT @turma_ds, @disc_logica, @prof_carlos
WHERE NOT EXISTS (
    SELECT 1 FROM turma_disciplina
    WHERE turma_id = @turma_ds
      AND disciplina_id = @disc_logica
      AND professor_id = @prof_carlos
);

INSERT INTO turma_disciplina (
    turma_id,
    disciplina_id,
    professor_id
)
SELECT @turma_ds, @disc_banco, @prof_carlos
WHERE NOT EXISTS (
    SELECT 1 FROM turma_disciplina
    WHERE turma_id = @turma_ds
      AND disciplina_id = @disc_banco
      AND professor_id = @prof_carlos
);

INSERT INTO turma_disciplina (
    turma_id,
    disciplina_id,
    professor_id
)
SELECT @turma_ds, @disc_web, @prof_carlos
WHERE NOT EXISTS (
    SELECT 1 FROM turma_disciplina
    WHERE turma_id = @turma_ds
      AND disciplina_id = @disc_web
      AND professor_id = @prof_carlos
);

INSERT INTO turma_disciplina (
    turma_id,
    disciplina_id,
    professor_id
)
SELECT @turma_mec, @disc_automacao, @prof_daniela
WHERE NOT EXISTS (
    SELECT 1 FROM turma_disciplina
    WHERE turma_id = @turma_mec
      AND disciplina_id = @disc_automacao
      AND professor_id = @prof_daniela
);

INSERT INTO turma_disciplina (
    turma_id,
    disciplina_id,
    professor_id
)
SELECT @turma_redes, @disc_redes, @prof_eduardo
WHERE NOT EXISTS (
    SELECT 1 FROM turma_disciplina
    WHERE turma_id = @turma_redes
      AND disciplina_id = @disc_redes
      AND professor_id = @prof_eduardo
);

INSERT INTO turma_disciplina (
    turma_id,
    disciplina_id,
    professor_id
)
SELECT @turma_redes, @disc_seguranca, @prof_eduardo
WHERE NOT EXISTS (
    SELECT 1 FROM turma_disciplina
    WHERE turma_id = @turma_redes
      AND disciplina_id = @disc_seguranca
      AND professor_id = @prof_eduardo
);

SET @td_ds_logica = (
    SELECT id FROM turma_disciplina
    WHERE turma_id = @turma_ds
      AND disciplina_id = @disc_logica
      AND professor_id = @prof_carlos
    LIMIT 1
);

SET @td_ds_banco = (
    SELECT id FROM turma_disciplina
    WHERE turma_id = @turma_ds
      AND disciplina_id = @disc_banco
      AND professor_id = @prof_carlos
    LIMIT 1
);

SET @td_ds_web = (
    SELECT id FROM turma_disciplina
    WHERE turma_id = @turma_ds
      AND disciplina_id = @disc_web
      AND professor_id = @prof_carlos
    LIMIT 1
);

SET @td_mec_automacao = (
    SELECT id FROM turma_disciplina
    WHERE turma_id = @turma_mec
      AND disciplina_id = @disc_automacao
      AND professor_id = @prof_daniela
    LIMIT 1
);

SET @td_redes = (
    SELECT id FROM turma_disciplina
    WHERE turma_id = @turma_redes
      AND disciplina_id = @disc_redes
      AND professor_id = @prof_eduardo
    LIMIT 1
);

SET @td_seguranca = (
    SELECT id FROM turma_disciplina
    WHERE turma_id = @turma_redes
      AND disciplina_id = @disc_seguranca
      AND professor_id = @prof_eduardo
    LIMIT 1
);

-- =========================================================
-- 8. AULAS HISTORICAS
-- =========================================================

INSERT INTO aulas (
    turma_disciplina_id,
    data_aula,
    hora_inicio,
    hora_fim,
    status
)
SELECT
    @td_ds_logica,
    DATE_SUB(CURDATE(), INTERVAL 4 DAY),
    '13:00:00',
    '15:00:00',
    'ENCERRADA'
WHERE NOT EXISTS (
    SELECT 1 FROM aulas
    WHERE turma_disciplina_id = @td_ds_logica
      AND data_aula = DATE_SUB(CURDATE(), INTERVAL 4 DAY)
      AND hora_inicio = '13:00:00'
);

INSERT INTO aulas (
    turma_disciplina_id,
    data_aula,
    hora_inicio,
    hora_fim,
    status
)
SELECT
    @td_ds_banco,
    DATE_SUB(CURDATE(), INTERVAL 3 DAY),
    '15:00:00',
    '17:00:00',
    'ENCERRADA'
WHERE NOT EXISTS (
    SELECT 1 FROM aulas
    WHERE turma_disciplina_id = @td_ds_banco
      AND data_aula = DATE_SUB(CURDATE(), INTERVAL 3 DAY)
      AND hora_inicio = '15:00:00'
);

INSERT INTO aulas (
    turma_disciplina_id,
    data_aula,
    hora_inicio,
    hora_fim,
    status
)
SELECT
    @td_ds_web,
    DATE_SUB(CURDATE(), INTERVAL 2 DAY),
    '13:00:00',
    '15:00:00',
    'ENCERRADA'
WHERE NOT EXISTS (
    SELECT 1 FROM aulas
    WHERE turma_disciplina_id = @td_ds_web
      AND data_aula = DATE_SUB(CURDATE(), INTERVAL 2 DAY)
      AND hora_inicio = '13:00:00'
);

INSERT INTO aulas (
    turma_disciplina_id,
    data_aula,
    hora_inicio,
    hora_fim,
    status
)
SELECT
    @td_ds_logica,
    DATE_SUB(CURDATE(), INTERVAL 1 DAY),
    '13:00:00',
    '15:00:00',
    'ENCERRADA'
WHERE NOT EXISTS (
    SELECT 1 FROM aulas
    WHERE turma_disciplina_id = @td_ds_logica
      AND data_aula = DATE_SUB(CURDATE(), INTERVAL 1 DAY)
      AND hora_inicio = '13:00:00'
);

INSERT INTO aulas (
    turma_disciplina_id,
    data_aula,
    hora_inicio,
    hora_fim,
    status
)
SELECT
    @td_mec_automacao,
    DATE_SUB(CURDATE(), INTERVAL 2 DAY),
    '07:30:00',
    '11:30:00',
    'ENCERRADA'
WHERE NOT EXISTS (
    SELECT 1 FROM aulas
    WHERE turma_disciplina_id = @td_mec_automacao
      AND data_aula = DATE_SUB(CURDATE(), INTERVAL 2 DAY)
      AND hora_inicio = '07:30:00'
);

INSERT INTO aulas (
    turma_disciplina_id,
    data_aula,
    hora_inicio,
    hora_fim,
    status
)
SELECT
    @td_redes,
    DATE_SUB(CURDATE(), INTERVAL 1 DAY),
    '18:30:00',
    '20:10:00',
    'ENCERRADA'
WHERE NOT EXISTS (
    SELECT 1 FROM aulas
    WHERE turma_disciplina_id = @td_redes
      AND data_aula = DATE_SUB(CURDATE(), INTERVAL 1 DAY)
      AND hora_inicio = '18:30:00'
);

SET @aula_ds_1 = (
    SELECT id FROM aulas
    WHERE turma_disciplina_id = @td_ds_logica
      AND data_aula = DATE_SUB(CURDATE(), INTERVAL 4 DAY)
      AND hora_inicio = '13:00:00'
    ORDER BY id DESC
    LIMIT 1
);

SET @aula_ds_2 = (
    SELECT id FROM aulas
    WHERE turma_disciplina_id = @td_ds_banco
      AND data_aula = DATE_SUB(CURDATE(), INTERVAL 3 DAY)
      AND hora_inicio = '15:00:00'
    ORDER BY id DESC
    LIMIT 1
);

SET @aula_ds_3 = (
    SELECT id FROM aulas
    WHERE turma_disciplina_id = @td_ds_web
      AND data_aula = DATE_SUB(CURDATE(), INTERVAL 2 DAY)
      AND hora_inicio = '13:00:00'
    ORDER BY id DESC
    LIMIT 1
);

SET @aula_ds_4 = (
    SELECT id FROM aulas
    WHERE turma_disciplina_id = @td_ds_logica
      AND data_aula = DATE_SUB(CURDATE(), INTERVAL 1 DAY)
      AND hora_inicio = '13:00:00'
    ORDER BY id DESC
    LIMIT 1
);

SET @aula_mec_1 = (
    SELECT id FROM aulas
    WHERE turma_disciplina_id = @td_mec_automacao
      AND data_aula = DATE_SUB(CURDATE(), INTERVAL 2 DAY)
      AND hora_inicio = '07:30:00'
    ORDER BY id DESC
    LIMIT 1
);

SET @aula_redes_1 = (
    SELECT id FROM aulas
    WHERE turma_disciplina_id = @td_redes
      AND data_aula = DATE_SUB(CURDATE(), INTERVAL 1 DAY)
      AND hora_inicio = '18:30:00'
    ORDER BY id DESC
    LIMIT 1
);

-- =========================================================
-- 9. PRESENCAS
-- =========================================================

-- Aula DS 1.
INSERT INTO presencas (
    aluno_id, aula_id, status, horario_registro, metodo, validacao_biometrica
) VALUES
    (@aluno_alice, @aula_ds_1, 'PRESENTE', TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 4 DAY), '13:03:00'), 'BIOMETRIA', TRUE),
    (@aluno_bruno, @aula_ds_1, 'PRESENTE', TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 4 DAY), '13:05:00'), 'MANUAL', FALSE),
    (@aluno_camila, @aula_ds_1, 'ATRASADO', TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 4 DAY), '13:35:00'), 'BIOMETRIA', TRUE),
    (@aluno_diego, @aula_ds_1, 'AUSENTE', TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 4 DAY), '15:00:00'), 'MANUAL', FALSE)
ON DUPLICATE KEY UPDATE
    status = VALUES(status),
    horario_registro = VALUES(horario_registro),
    metodo = VALUES(metodo),
    validacao_biometrica = VALUES(validacao_biometrica);

-- Aula DS 2.
INSERT INTO presencas (
    aluno_id, aula_id, status, horario_registro, metodo, validacao_biometrica
) VALUES
    (@aluno_alice, @aula_ds_2, 'PRESENTE', TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 3 DAY), '15:02:00'), 'BIOMETRIA', TRUE),
    (@aluno_bruno, @aula_ds_2, 'AUSENTE', TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 3 DAY), '17:00:00'), 'MANUAL', FALSE),
    (@aluno_camila, @aula_ds_2, 'PRESENTE', TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 3 DAY), '15:04:00'), 'MANUAL', FALSE),
    (@aluno_diego, @aula_ds_2, 'ATRASADO', TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 3 DAY), '15:40:00'), 'BIOMETRIA', TRUE)
ON DUPLICATE KEY UPDATE
    status = VALUES(status),
    horario_registro = VALUES(horario_registro),
    metodo = VALUES(metodo),
    validacao_biometrica = VALUES(validacao_biometrica);

-- Aula DS 3.
INSERT INTO presencas (
    aluno_id, aula_id, status, horario_registro, metodo, validacao_biometrica
) VALUES
    (@aluno_alice, @aula_ds_3, 'PRESENTE', TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 2 DAY), '13:01:00'), 'BIOMETRIA', TRUE),
    (@aluno_bruno, @aula_ds_3, 'PRESENTE', TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 2 DAY), '13:06:00'), 'BIOMETRIA', TRUE),
    (@aluno_camila, @aula_ds_3, 'PRESENTE', TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 2 DAY), '13:08:00'), 'MANUAL', FALSE),
    (@aluno_diego, @aula_ds_3, 'AUSENTE', TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 2 DAY), '15:00:00'), 'MANUAL', FALSE)
ON DUPLICATE KEY UPDATE
    status = VALUES(status),
    horario_registro = VALUES(horario_registro),
    metodo = VALUES(metodo),
    validacao_biometrica = VALUES(validacao_biometrica);

-- Aula DS 4.
INSERT INTO presencas (
    aluno_id, aula_id, status, horario_registro, metodo, validacao_biometrica
) VALUES
    (@aluno_alice, @aula_ds_4, 'PRESENTE', TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 1 DAY), '13:02:00'), 'BIOMETRIA', TRUE),
    (@aluno_bruno, @aula_ds_4, 'ATRASADO', TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 1 DAY), '13:36:00'), 'BIOMETRIA', TRUE),
    (@aluno_camila, @aula_ds_4, 'AUSENTE', TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 1 DAY), '15:00:00'), 'MANUAL', FALSE),
    (@aluno_diego, @aula_ds_4, 'AUSENTE', TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 1 DAY), '15:00:00'), 'MANUAL', FALSE)
ON DUPLICATE KEY UPDATE
    status = VALUES(status),
    horario_registro = VALUES(horario_registro),
    metodo = VALUES(metodo),
    validacao_biometrica = VALUES(validacao_biometrica);

-- Aula Mecatronica.
INSERT INTO presencas (
    aluno_id, aula_id, status, horario_registro, metodo, validacao_biometrica
) VALUES
    (@aluno_elisa, @aula_mec_1, 'PRESENTE', TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 2 DAY), '07:32:00'), 'BIOMETRIA', TRUE),
    (@aluno_felipe, @aula_mec_1, 'ATRASADO', TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 2 DAY), '08:05:00'), 'MANUAL', FALSE)
ON DUPLICATE KEY UPDATE
    status = VALUES(status),
    horario_registro = VALUES(horario_registro),
    metodo = VALUES(metodo),
    validacao_biometrica = VALUES(validacao_biometrica);

-- Aula Redes.
INSERT INTO presencas (
    aluno_id, aula_id, status, horario_registro, metodo, validacao_biometrica
) VALUES
    (@aluno_gabriela, @aula_redes_1, 'PRESENTE', TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 1 DAY), '18:33:00'), 'BIOMETRIA', TRUE),
    (@aluno_henrique, @aula_redes_1, 'AUSENTE', TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 1 DAY), '20:10:00'), 'MANUAL', FALSE)
ON DUPLICATE KEY UPDATE
    status = VALUES(status),
    horario_registro = VALUES(horario_registro),
    metodo = VALUES(metodo),
    validacao_biometrica = VALUES(validacao_biometrica);

-- =========================================================
-- 10. OCORRENCIAS
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
    data_ocorrencia,
    data_atualizacao
)
SELECT
    @aluno_diego,
    @prof_carlos,
    'Faltas consecutivas',
    'Aluno apresentou faltas em aulas recentes e precisa de acompanhamento.',
    'MEDIA',
    'PENDENTE',
    'INTERVENCAO',
    NULL,
    DATE_SUB(NOW(), INTERVAL 1 DAY),
    NULL
WHERE NOT EXISTS (
    SELECT 1 FROM ocorrencias
    WHERE aluno_id = @aluno_diego
      AND titulo = 'Faltas consecutivas'
);

INSERT INTO ocorrencias (
    aluno_id,
    professor_id,
    titulo,
    descricao,
    gravidade,
    status,
    tipo,
    resposta_gestor,
    data_ocorrencia,
    data_atualizacao
)
SELECT
    @aluno_camila,
    @prof_carlos,
    'Atestado medico apresentado',
    'Documento apresentado para justificar ausencia.',
    'BAIXA',
    'RESOLVIDA',
    'ATESTADO',
    'Documento conferido e justificativa aceita.',
    DATE_SUB(NOW(), INTERVAL 3 DAY),
    DATE_SUB(NOW(), INTERVAL 2 DAY)
WHERE NOT EXISTS (
    SELECT 1 FROM ocorrencias
    WHERE aluno_id = @aluno_camila
      AND titulo = 'Atestado medico apresentado'
);

INSERT INTO ocorrencias (
    aluno_id,
    professor_id,
    titulo,
    descricao,
    gravidade,
    status,
    tipo,
    resposta_gestor,
    data_ocorrencia,
    data_atualizacao
)
SELECT
    @aluno_alice,
    @prof_carlos,
    'Destaque em projeto',
    'Aluna apresentou excelente desempenho no projeto da disciplina.',
    'BAIXA',
    'RESOLVIDA',
    'DESTAQUE',
    'Destaque registrado no historico da aluna.',
    DATE_SUB(NOW(), INTERVAL 5 DAY),
    DATE_SUB(NOW(), INTERVAL 4 DAY)
WHERE NOT EXISTS (
    SELECT 1 FROM ocorrencias
    WHERE aluno_id = @aluno_alice
      AND titulo = 'Destaque em projeto'
);

INSERT INTO ocorrencias (
    aluno_id,
    professor_id,
    titulo,
    descricao,
    gravidade,
    status,
    tipo,
    resposta_gestor,
    data_ocorrencia,
    data_atualizacao
)
SELECT
    @aluno_felipe,
    @prof_daniela,
    'Atrasos frequentes',
    'Aluno chegou depois do horario em mais de uma atividade.',
    'MEDIA',
    'EM_ANALISE',
    'DISCIPLINAR',
    'Caso encaminhado para acompanhamento.',
    DATE_SUB(NOW(), INTERVAL 2 DAY),
    DATE_SUB(NOW(), INTERVAL 1 DAY)
WHERE NOT EXISTS (
    SELECT 1 FROM ocorrencias
    WHERE aluno_id = @aluno_felipe
      AND titulo = 'Atrasos frequentes'
);

-- =========================================================
-- 11. BIOMETRIAS DE TESTE
--
-- Estes embeddings sao apenas dados ficticios para preencher o banco.
-- Eles nao substituem o cadastro facial real feito pelo servidor Python.
-- =========================================================

INSERT INTO biometria (
    usuario_id,
    embedding_facial,
    tipo,
    ativo
) VALUES
    (@u_alice, '[0.11,0.22,0.33,0.44]', 'face', TRUE),
    (@u_camila, '[0.15,0.25,0.35,0.45]', 'face', TRUE),
    (@u_elisa, '[0.18,0.28,0.38,0.48]', 'face', TRUE),
    (@u_gabriela, '[0.21,0.31,0.41,0.51]', 'face', TRUE),
    (@u_prof_carlos, '[0.12,0.24,0.36,0.48]', 'face', TRUE)
ON DUPLICATE KEY UPDATE
    embedding_facial = VALUES(embedding_facial),
    ativo = VALUES(ativo);

-- =========================================================
-- 12. HORARIOS DE AULA
--
-- Execute este bloco apenas se a tabela horarios_aula existir.
-- Os horarios entram DESATIVADOS para nao abrirem chamadas inesperadas.
-- Para testar, altere ativo para TRUE e ajuste o dia e a hora.
-- =========================================================

INSERT INTO horarios_aula (
    turma_disciplina_id,
    dia_semana,
    hora_inicio,
    hora_fim,
    tolerancia_minutos,
    abertura_automatica,
    encerramento_automatico,
    data_inicio_vigencia,
    data_fim_vigencia,
    ativo
)
SELECT
    @td_ds_logica,
    'MONDAY',
    '13:00:00',
    '15:00:00',
    30,
    TRUE,
    TRUE,
    CURDATE(),
    DATE_ADD(CURDATE(), INTERVAL 6 MONTH),
    FALSE
WHERE NOT EXISTS (
    SELECT 1 FROM horarios_aula
    WHERE turma_disciplina_id = @td_ds_logica
      AND dia_semana = 'MONDAY'
      AND hora_inicio = '13:00:00'
);

INSERT INTO horarios_aula (
    turma_disciplina_id,
    dia_semana,
    hora_inicio,
    hora_fim,
    tolerancia_minutos,
    abertura_automatica,
    encerramento_automatico,
    data_inicio_vigencia,
    data_fim_vigencia,
    ativo
)
SELECT
    @td_ds_banco,
    'WEDNESDAY',
    '15:00:00',
    '17:00:00',
    20,
    TRUE,
    TRUE,
    CURDATE(),
    DATE_ADD(CURDATE(), INTERVAL 6 MONTH),
    FALSE
WHERE NOT EXISTS (
    SELECT 1 FROM horarios_aula
    WHERE turma_disciplina_id = @td_ds_banco
      AND dia_semana = 'WEDNESDAY'
      AND hora_inicio = '15:00:00'
);

INSERT INTO horarios_aula (
    turma_disciplina_id,
    dia_semana,
    hora_inicio,
    hora_fim,
    tolerancia_minutos,
    abertura_automatica,
    encerramento_automatico,
    data_inicio_vigencia,
    data_fim_vigencia,
    ativo
)
SELECT
    @td_mec_automacao,
    'TUESDAY',
    '07:30:00',
    '11:30:00',
    15,
    TRUE,
    TRUE,
    CURDATE(),
    DATE_ADD(CURDATE(), INTERVAL 6 MONTH),
    FALSE
WHERE NOT EXISTS (
    SELECT 1 FROM horarios_aula
    WHERE turma_disciplina_id = @td_mec_automacao
      AND dia_semana = 'TUESDAY'
      AND hora_inicio = '07:30:00'
);

INSERT INTO horarios_aula (
    turma_disciplina_id,
    dia_semana,
    hora_inicio,
    hora_fim,
    tolerancia_minutos,
    abertura_automatica,
    encerramento_automatico,
    data_inicio_vigencia,
    data_fim_vigencia,
    ativo
)
SELECT
    @td_redes,
    'THURSDAY',
    '18:30:00',
    '20:10:00',
    20,
    TRUE,
    TRUE,
    CURDATE(),
    DATE_ADD(CURDATE(), INTERVAL 6 MONTH),
    FALSE
WHERE NOT EXISTS (
    SELECT 1 FROM horarios_aula
    WHERE turma_disciplina_id = @td_redes
      AND dia_semana = 'THURSDAY'
      AND hora_inicio = '18:30:00'
);

SET SQL_SAFE_UPDATES = 1;

-- =========================================================
-- FIM DOS INSERTS
-- =========================================================
