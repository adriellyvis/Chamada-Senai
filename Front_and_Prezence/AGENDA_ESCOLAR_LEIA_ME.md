# PreZence — Agenda Escolar

**Versão atual (16/11/2026):** o frontend usa a API real `/agenda/eventos` por padrão, sem prévias automáticas ou dados locais. Consulte `GUIA_AGENDA_COM_BANCO.md` para instalar, configurar a URL do backend, conferir as rotas e testar as permissões.

Perfis: gestor cria eventos para todos, alunos, professores ou privados; professor cria apenas compromissos privados e lê os eventos institucionais autorizados; aluno acompanha eventos institucionais destinados a alunos e mantém sua grade original. Os eventos são exibidos nos modos **Mês, Semana e Lista** no gestor e professor.

A criação da tabela não conclui a integração com o servidor. O backend deve estar instalado, autenticar o token e consultar o banco. Não use os pacotes de backend antigos para substituir uma aplicação atual sem revisar a autenticação.

Testes: `node --test tests/agenda*.test.mjs`.
