-- =========================================================
-- =========================================================
-- EyeCount - Banco de dados
-- CREATEs consolidados para o estado atual do projeto.
-- =========================================================
-- =========================================================

/*CREATE DATABASE  prezence;*/
/*USE prezence;*/

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
    data_nascimento DATE NULL,

    CONSTRAINT uk_alunos_usuario UNIQUE (usuario_id),
    CONSTRAINT uk_alunos_matricula UNIQUE (matricula),
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
    nota FLOAT(53) NOT NULL,
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

CREATE TABLE solicitacoes_suporte (
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
    
   CREATE TABLE recuperacoes_senha (
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
    
    SELECT
    id,
    challenge_id,
    usuario_id,
    status,
    tentativas,
    criado_em,
    expira_em
FROM recuperacoes_senha
ORDER BY id DESC
LIMIT 5;	
