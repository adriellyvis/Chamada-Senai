# PreZence — Frontend da Agenda integrado à API (16/11/2026)

## Status real

Este ZIP contém o **frontend** atualizado, não contém o backend Spring Boot nem uma conexão direta ao MySQL. A tabela criada no banco **não basta** para habilitar a agenda: as rotas `/agenda/eventos` precisam existir, estar conectadas ao banco e exigir autenticação no backend atual. **Não foi possível testar o banco real do usuário**, porque o backend atualizado não foi incluído no upload.

A tela foi adaptada para usar a **API real por padrão**. Não exibe mais compromissos fictícios quando o servidor falha, e o modo local fica desabilitado no arquivo `core/runtime-config.js`. O aluno mantém a grade original `/aluno/agenda` e recebe os eventos institucionais da nova API.

## Instalação segura no seu projeto

1. Faça backup da pasta `Front_and_Prezence` e do backend atual.
2. No ZIP de **atualização parcial**, copie a pasta `core` e os arquivos incluídos para o mesmo local da sua pasta `Front_and_Prezence`. Escolha substituir apenas os arquivos correspondentes. **Não apague pastas existentes**.
3. Acesse o portal por HTTP/HTTPS (Live Server ou o servidor de rede), não por `file://`.
4. Confirme que o backend Spring Boot está ligado e aceitando o token do login atual.
5. Entre com Gestor, acesse **Agenda** e clique em **Nova marcação**; salve um evento de teste para `PROFESSORES`.
6. Faça login como Professor, abra a Agenda e confirme que pode ler, mas não editar o evento do gestor. Depois teste a criação de uma marcação privada.
7. Faça login como Aluno e confirme que eventos `TODOS` e `ALUNOS` aparecem acima da grade de horários, sem incluir eventos `PROFESSORES` ou privados.

Após copiar arquivos JS, use **Ctrl+F5** para limpar o cache do navegador.

## Endereço do backend

Em `core/runtime-config.js`:

```js
window.PREZENCE_API_URL = window.PREZENCE_API_URL || "";
window.PREZENCE_AGENDA_PERMITIR_DEMO = false;
```

Deixando vazio, o endereço é `http://IP_DO_SITE:8080` quando o site usa HTTP; se seu backend está em outra máquina/porta, configure a URL base, por exemplo:

```js
window.PREZENCE_API_URL = "http://192.168.1.10:8080";
```

Este endereço é **apenas um exemplo**, não o IP do seu computador. Não altere a porta da API se o backend já funciona em `8080`. Se frontend e backend têm origens distintas, habilite **CORS com a origem exata do frontend** no backend. Não exponha o MySQL, a senha do banco nem o token no `runtime-config.js`. Se o site estiver em HTTPS, a API também deve estar acessível por HTTPS.

## Rotas exigidas no Spring Boot

| Ação | Método e caminho |
|---|---|
| Listar visíveis no período | `GET /agenda/eventos?inicio=2026-11-01&fim=2026-11-30` |
| Criar | `POST /agenda/eventos` |
| Alterar um evento próprio | `PUT /agenda/eventos/{id}` |
| Excluir um evento próprio | `DELETE /agenda/eventos/{id}` |

Todas as chamadas usam `Authorization: Bearer <token>` a partir da sessão do PreZence. A resposta da listagem precisa ser **array JSON**; o backend de referência `PreZence_Modulo_Backend_Agenda.zip` retorna o formato esperado.

Requisição para criar/editar:

```json
{
  "titulo": "Conselho de classe",
  "descricao": "Reunião pedagógica",
  "tipo": "REUNIAO",
  "inicio": "2026-11-20T14:00",
  "fim": "2026-11-20T15:00",
  "local": "Sala dos professores",
  "visibilidade": "PROFESSORES"
}
```

Resposta deve incluir `id`, `titulo`, `descricao`, `tipo`, `inicio`, `fim`, `local`, `visibilidade`, `criadorId`, `criadorPerfil` e `criadorNome`. **O autor nunca deve vir do corpo da requisição:** é definido pela autenticação validada pelo backend.

## Se der erro ao abrir

- **Erro de conexão:** inicie o backend, confira `core/runtime-config.js`, rede/firewall, CORS e URL. Não é problema de tabela isoladamente.
- **HTTP 404 ou 405:** o servidor atende, mas a rota `/agenda/eventos` não foi integrada ou está em outro caminho.
- **HTTP 401:** faça novo login; o token precisa ser validado pelo backend.
- **HTTP 403:** confira permissões e integração com a identidade do usuário no backend.
- **HTTP 500:** abra o terminal do Spring Boot para localizar erro de banco, entidade ou autenticação.
- **Lista vazia sem erro:** a API respondeu `[]`; confira se há eventos cadastrados, o período e o perfil autorizado.
- **Formato inválido:** a API respondeu objeto (`{content: [...]}` ou similar) em vez de lista, ou não retornou os campos obrigatórios.

No navegador, use **F12 → Rede (Network)** e filtre por `agenda/eventos` para ver o código HTTP, sem compartilhar seu token ou senhas em capturas.

## Regras funcionais

| Ação | Gestor | Professor | Aluno |
|---|---|---|---|
| Publicar para todos/alunos/professores | Sim | Não | Não |
| Criar privadamente | Sim | Sim | Não |
| Ler institucionais permitidos | Sim | Sim | Sim |
| Editar/excluir evento de outro autor | Não | Não | Não |

A interface respeita essas regras, mas a **segurança de verdade precisa ser feita no servidor**, inclusive no `GET`, `PUT` e `DELETE`. A tabela MySQL, sozinha, não garante privacidade.

## Testes realizados nesta atualização

- `node --test tests/agenda*.test.mjs`: **13 testes aprovados**, abrangendo regras de perfil, Bearer, URLs, payload sem autor, quatro verbos, erro 404 e formato de resposta.
- Teste isolado no Chromium: calendário e modos Mês/Semana/Lista, formulário e interações simuladas de criação, edição e exclusão. **Não foi um teste com seu servidor**.
- A navegação HTTP local do portal não pôde ser testada neste ambiente devido a um bloqueio do navegador automatizado.

## Última dependência

Se o backend ainda não tiver `/agenda/eventos`, envie o ZIP **atual** do Spring Boot, contendo autenticação (`/auth/login`), filtro de token e entidades de usuário. O módulo Java anterior possui uma interface `AgendaIdentidadeProvider` que precisa ser implementada com a autenticação real. É inseguro fazê-lo adivinhando o perfil ou lendo ID declarado pelo navegador.
