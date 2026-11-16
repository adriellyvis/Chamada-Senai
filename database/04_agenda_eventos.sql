-- MySQL 8 / MariaDB recente. Execute na MESMA base de dados do backend atual,
-- após verificar backup e políticas de migração do projeto.
-- Datas sem fuso: a instituição precisa usar sempre o mesmo fuso horário (America/Sao_Paulo).
CREATE TABLE IF NOT EXISTS agenda_eventos (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(120) NOT NULL,
    descricao VARCHAR(1500) NOT NULL DEFAULT '',
    tipo VARCHAR(20) NOT NULL,
    inicio DATETIME NOT NULL,
    fim DATETIME NOT NULL,
    local_evento VARCHAR(120) NOT NULL DEFAULT '',
    visibilidade VARCHAR(20) NOT NULL,
    criador_id BIGINT NOT NULL,
    criador_perfil VARCHAR(20) NOT NULL,
    criador_nome VARCHAR(120) NOT NULL DEFAULT '',
    criado_em DATETIME NOT NULL,
    atualizado_em DATETIME NOT NULL,
    INDEX idx_agenda_intervalo (inicio, fim),
    INDEX idx_agenda_autor (criador_id, criador_perfil)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
-- FK opcional SOMENTE após confirmar nome/tipo da chave primária da tabela de usuários.
