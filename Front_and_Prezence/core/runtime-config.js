// Ajuste este arquivo apenas para apontar o endereço público da API na implantação.
// Em desenvolvimento, deixar vazio usa o hostname da página na porta 8080.
window.PREZENCE_API_URL = window.PREZENCE_API_URL || "";

// Endereço do serviço Python. Para HTTPS, configure também um endpoint HTTPS
// (proxy reverso); não inclua segredos ou tokens neste arquivo público.
window.PREZENCE_BIOMETRIA_URL = window.PREZENCE_BIOMETRIA_URL || "";

// A agenda usa GET/POST/PUT/DELETE em /agenda/eventos no MESMO backend acima.
// Só habilite a demonstração local para testes isolados, nunca com informações reais.
// Mesmo que tenha sido ativada em uma sessão antiga, agora está DESLIGADA por padrão.
window.PREZENCE_AGENDA_PERMITIR_DEMO = false;
