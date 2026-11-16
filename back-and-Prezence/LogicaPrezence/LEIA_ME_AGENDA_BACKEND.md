# PreZence — agenda integrada ao backend real

Esta pasta contém o **backend original fornecido** com o módulo `prezence.agenda` acrescentado. Foram preservados os controllers, services, entidades, API de login, biometria, QR Code e regras existentes. Não é necessário substituir o frontend atualizado novamente.

## Funcionalidades

- `GET /agenda/eventos?inicio=2026-11-01&fim=2026-11-30` — lista de eventos **filtrada no servidor** pelo usuário JWT e período (máx. 93 dias; até 2.000 eventos por consulta).
- `POST /agenda/eventos` — cadastra evento; `PUT /agenda/eventos/{id}` — edita; `DELETE /agenda/eventos/{id}` — exclui.
- Gestor: publica para `TODOS`, `ALUNOS`, `PROFESSORES` ou `PRIVADO`. Professor: cria `PRIVADO`. Aluno: somente leitura de eventos destinados ao seu perfil.
- Somente o **próprio autor** pode editar ou excluir eventos. Privados de outros usuários não aparecem na consulta, incluindo privados de professores para gestores.
- O autor e seu perfil são obtidos dos atributos **inseridos pelo `JwtFilter` após verificar o JWT**, e conferidos no banco de usuários; o cliente não define o autor.

## Instalação no IntelliJ IDEA / Windows

1. Faça **backup do projeto e do banco**.
2. Extraia `PreZence_Backend_Agenda_INTEGRADO.zip` em uma **pasta separada** e abra o projeto `back-and-Prezence/LogicaPrezence` pelo arquivo `pom.xml` no IntelliJ IDEA. Não substitua seu backend antes de testar.
3. Confira a conexão ao MySQL em `src/main/resources/application.properties`; use **a mesma base `prezence` que já utiliza no sistema**. Credenciais, `JWT_SECRET` e `BIOMETRIA_SERVICE_KEY` precisam estar corretos no seu ambiente (não cole segredos em chats nem faça commit deles).
4. O backend está configurado com `spring.jpa.hibernate.ddl-auto=validate`: **ele não cria nem modifica tabelas**. Se você já criou `agenda_eventos`, verifique se as colunas e tipos correspondem a `sql/agenda_eventos_mysql.sql`. Se não criou a tabela, execute o SQL nessa base **após fazer backup**. `CREATE TABLE IF NOT EXISTS` não corrige uma tabela existente com esquema diferente.
5. Atualize o projeto Maven (no IntelliJ, botão **Reload All Maven Projects**). Rode os testes `mvn test` ou diretamente pelo IntelliJ e inicie o `PrezenceApplication`.
6. Entre no frontend atualizado como gestor e abra **Agenda**; crie um evento de teste para `TODOS` e verifique se aparece também para professor e aluno. Um professor não deve conseguir alterar esse evento.

## Exemplo de requisição POST (token de login do próprio PreZence)

`POST http://localhost:8080/agenda/eventos` com os cabeçalhos `Content-Type: application/json` e `Authorization: Bearer <token JWT>`:

```json
{
  "titulo": "Reunião pedagógica",
  "descricao": "Alinhamento do trimestre",
  "tipo": "REUNIAO",
  "inicio": "2026-11-20T14:00",
  "fim": "2026-11-20T15:00",
  "local": "Sala dos professores",
  "visibilidade": "PROFESSORES"
}
```

A API retorna objetos com `id`, `titulo`, `descricao`, `tipo`, `inicio`, `fim`, `local`, `visibilidade`, `criadorId`, `criadorPerfil`, `criadorNome`, `criadoEm`, `atualizadoEm`, no formato aceito pelo frontend. O usuário deve entrar pelo login normal; não envie `criadorId` no corpo.

## Testes e diagnóstico

- Sem Spring/Maven/MySQL: `scripts/TESTAR_REGRAS_AGENDA_WINDOWS.bat` no Windows ou `bash scripts/testar_regras_agenda.sh` no Linux/Mac. **45 verificações de regras/validação** (executadas durante a preparação).
- Com o Maven disponível: `mvn test` executa também as classes de teste JUnit/Mockito para autenticação da agenda e alterações indevidas de eventos. Os testes HTTP/DB precisam ser realizados no ambiente real.
- `401` — token ausente ou inválido; `403` — perfil não permitido ou operação em evento de outro usuário; `404` — evento não existe; `400` — datas ou payload inválidos; `413` — solicitação de período com excesso de eventos.
- Se houver erro de Hibernate na inicialização (`Schema-validation: missing table` ou `wrong column type`), confira `SELECT DATABASE();`, `SHOW TABLES LIKE 'agenda_eventos';` e `SHOW CREATE TABLE agenda_eventos;` no MySQL.
- Se ocorrer erro de CORS, abra o frontend pelo endereço/porta já liberados em `CorsConfig`; não desative o JWT nem torne a rota pública.
- Se o frontend carregar eventos fictícios em vez dos reais, confira se está usando a versão mais recente de `core/agenda-eventos-api.js` com o modo demonstração desabilitado.

## Arquivos acrescentados

- `src/main/java/prezence/agenda/*.java` — controller, service, JPA, DTOs, regras de autorização, tratamento de erros e integração real com o `JwtFilter`.
- `src/test/java/prezence/agenda/` — testes de regras, autenticação e serviço.
- `sql/agenda_eventos_mysql.sql` — **referência de esquema**; não é uma migração automática.
- `scripts/testar_regras_agenda.sh` e `scripts/TESTAR_REGRAS_AGENDA_WINDOWS.bat` — verificação sem Maven.

**Limite da validação aqui:** o ambiente de preparação não tem Maven nem a instância do seu MySQL; portanto, o projeto completo não foi compilado nem executado com banco real. Não declaro integração de ponta a ponta confirmada até rodar os testes com seu Spring Boot/MySQL.
