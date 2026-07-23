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
