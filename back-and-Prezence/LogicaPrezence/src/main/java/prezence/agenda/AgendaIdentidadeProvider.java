package prezence.agenda;

/**
 * Integração obrigatória com o mecanismo de autenticação existente do PreZence.
 * Implemente um @Component que verifique o token por meio da segurança JÁ EXISTENTE
 * e resolva o usuário ativo e seu perfil a partir do backend.
 * NUNCA converta um JWT sem validar assinatura, validade, emissor e destinatário.
 * NUNCA leia X-User-Id, X-Perfil ou um campo enviado pelo frontend como identidade.
 * Na ausência de implementação, o Spring falha ao iniciar (falha segura).
 */
public interface AgendaIdentidadeProvider {
    AgendaIdentidade usuarioAutenticado();
}
