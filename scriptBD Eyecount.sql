-- =========================================================
-- EYecount - Estrutura completa do banco de dados
-- Banco: MySQL 8+
-- =========================================================
-- Criar banco
CREATE DATABASE eyecount;
USE eyecount;

-- =========================================================
-- TABELA: perfis
-- =========================================================
CREATE TABLE perfis (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(50) NOT NULL UNIQUE -- aluno, professor, gestor
);

-- =========================================================
-- TABELA: usuarios
-- =========================================================
CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    perfil_id INT NOT NULL,
    ativo BOOLEAN DEFAULT TRUE,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_usuario_perfil
        FOREIGN KEY (perfil_id) REFERENCES perfis(id)
);

-- =========================================================
-- TABELA: turmas
-- =========================================================
CREATE TABLE turmas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    descricao TEXT
);

-- =========================================================
-- TABELA: alunos
-- =========================================================
CREATE TABLE alunos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL UNIQUE,
    turma_id INT NOT NULL,
    matricula VARCHAR(50) NOT NULL UNIQUE,
    data_nascimento DATE,

    CONSTRAINT fk_aluno_usuario
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id),

    CONSTRAINT fk_aluno_turma
        FOREIGN KEY (turma_id) REFERENCES turmas(id)
);

-- =========================================================
-- TABELA: professores                                     =
-- =========================================================
CREATE TABLE professores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL UNIQUE,
    especialidade VARCHAR(100),

    CONSTRAINT fk_professor_usuario
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- =========================================================
-- TABELA: responsaveis
-- =========================================================
CREATE TABLE responsaveis (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    telefone VARCHAR(20)
);

-- =========================================================
-- TABELA: aluno_responsavel
-- =========================================================
CREATE TABLE aluno_responsavel (
    aluno_id INT NOT NULL,
    responsavel_id INT NOT NULL,

    PRIMARY KEY (aluno_id, responsavel_id),

    CONSTRAINT fk_aluno_resp_aluno
        FOREIGN KEY (aluno_id) REFERENCES alunos(id),

    CONSTRAINT fk_aluno_resp_responsavel
        FOREIGN KEY (responsavel_id) REFERENCES responsaveis(id)
);

-- =========================================================
-- TABELA: disciplinas
-- =========================================================
CREATE TABLE disciplinas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL UNIQUE
);

-- =========================================================
-- TABELA: turma_disciplina
-- =========================================================
CREATE TABLE turma_disciplina (
    id INT AUTO_INCREMENT PRIMARY KEY,
    turma_id INT NOT NULL,
    disciplina_id INT NOT NULL,
    professor_id INT NOT NULL,

    CONSTRAINT fk_td_turma
        FOREIGN KEY (turma_id) REFERENCES turmas(id),

    CONSTRAINT fk_td_disciplina
        FOREIGN KEY (disciplina_id) REFERENCES disciplinas(id),

    CONSTRAINT fk_td_professor
        FOREIGN KEY (professor_id) REFERENCES professores(id)
);

-- =========================================================
-- TABELA: aulas
-- =========================================================
CREATE TABLE aulas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    turma_disciplina_id INT NOT NULL,
    data_aula DATE NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fim TIME,
    token VARCHAR(50) UNIQUE,
    token_expiracao DATETIME,
    status ENUM('AGENDADA', 'EM_ANDAMENTO', 'ENCERRADA', 'CANCELADA') DEFAULT 'AGENDADA',

    CONSTRAINT fk_aula_turma_disciplina
        FOREIGN KEY (turma_disciplina_id) REFERENCES turma_disciplina(id)
);

-- =========================================================
-- TABELA: presencas
-- =========================================================
CREATE TABLE presencas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    aluno_id INT NOT NULL,
    aula_id INT NOT NULL,

    status ENUM('PRESENTE','AUSENTE','ATRASADO','SAIDA_TEMPORARIA') NOT NULL DEFAULT 'AUSENTE',

    horario_registro DATETIME DEFAULT CURRENT_TIMESTAMP,

    metodo ENUM('BIOMETRIA','MANUAL','TOKEN') NOT NULL DEFAULT 'MANUAL',

    validacao_biometrica BOOLEAN DEFAULT FALSE,

    CONSTRAINT fk_presenca_aluno
        FOREIGN KEY (aluno_id) REFERENCES alunos(id),

    CONSTRAINT fk_presenca_aula
        FOREIGN KEY (aula_id) REFERENCES aulas(id),

    CONSTRAINT unique_presenca
        UNIQUE (aluno_id, aula_id)
);

-- =========================================================
-- TABELA: saidas_temporarias
-- =========================================================
CREATE TABLE saidas_temporarias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    aluno_id INT NOT NULL,
    aula_id INT NOT NULL,
    hora_saida DATETIME NOT NULL,
    hora_retorno DATETIME,
    tempo_limite INT NOT NULL, -- minutos

    CONSTRAINT fk_saida_aluno
        FOREIGN KEY (aluno_id) REFERENCES alunos(id),

    CONSTRAINT fk_saida_aula
        FOREIGN KEY (aula_id) REFERENCES aulas(id)
);

-- =========================================================
-- TABELA: logs_acesso
-- =========================================================
CREATE TABLE logs_acesso (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    data_hora DATETIME DEFAULT CURRENT_TIMESTAMP,
    acao VARCHAR(255) NOT NULL,
    ip VARCHAR(45),

    CONSTRAINT fk_log_usuario
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

CREATE TABLE ocorrencias (
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

    data_ocorrencia TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao DATETIME NULL,

    CONSTRAINT fk_ocorrencia_aluno
        FOREIGN KEY (aluno_id)
        REFERENCES alunos(id),

    CONSTRAINT fk_ocorrencia_professor
        FOREIGN KEY (professor_id)
        REFERENCES professores(id)
);
-- =========================================================
-- TABELA: biometria
-- =========================================================
CREATE TABLE biometria (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    embedding_facial TEXT NOT NULL,
    tipo ENUM('face') NOT NULL DEFAULT 'face',
    ativo BOOLEAN DEFAULT TRUE,
    data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_biometria_usuario
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id),

    CONSTRAINT unique_biometria_usuario
        UNIQUE (usuario_id, tipo)
);

-- =========================================================
-- ÍNDICES
-- =========================================================
CREATE INDEX idx_usuario_email ON usuarios(email);
CREATE INDEX idx_aluno_matricula ON alunos(matricula);
CREATE INDEX idx_aula_data ON aulas(data_aula);
CREATE INDEX idx_presenca_status ON presencas(status);
CREATE INDEX idx_log_data ON logs_acesso(data_hora);

-- =========================================================
-- DADOS INICIAIS
-- =========================================================
INSERT INTO perfis (nome) VALUES
('aluno'),
('professor'),
('gestor');

SELECT * FROM usuarios;
SELECT * FROM ocorrencias;
select * from turma_disciplina;
SELECT * FROM aulas;
SELECT * FROM presencas;
SELECT * FROM professores;
SELECT id, status FROM aulas;
USE eyecount;

SHOW COLUMNS FROM ocorrencias LIKE 'status';
