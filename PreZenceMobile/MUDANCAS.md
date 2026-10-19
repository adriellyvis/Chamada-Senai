# PreZence Mobile — atualização de paridade com a aplicação web

Esta versão mantém o backend existente e adapta o Expo ao contrato atual da API.

## O que foi implementado

- Login compatível com `POST /auth/login` do Spring Boot.
- URL da API corrigida para a raiz `http://IP:8080`.
- Navegação mobile por perfil (Aluno, Professor e Gestor).
- Identidade visual aproximada da web: cards arredondados, azul/roxo institucional, estados, pills, cabeçalhos e tema escuro.
- Aluno: dashboard, agenda, frequência, notas, avisos/ocorrências, chamada facial (status) e perfil.
- Professor: dashboard, turmas, alunos, notas com CRUD, ocorrências com cadastro, chamada manual com abertura/encerramento e registro de presença, histórico e perfil.
- Gestor: dashboard, turmas com CRUD, usuários com criação/edição/status, disciplinas com CRUD, ocorrências com mudança de status e perfil.
- Configurações locais de tema, notificações e confirmação de saída.

## Observação sobre biometria

A aplicação web usa câmera no navegador + um serviço biométrico Python separado. O projeto Expo atual não tinha uma dependência nativa de câmera/biometria; por isso a tela mobile de chamada facial já consulta a chamada aberta e o status do cadastro, enquanto a captura/reconhecimento pela câmera nativa fica isolada para uma etapa posterior.

## Executar

```bash
npm install
npx expo start -c
```

No computador, mantenha o Spring Boot na porta 8080 e use o IPv4 da máquina no `.env` quando testar no celular.
