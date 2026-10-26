# Paridade Web x Mobile — regras aplicadas

Esta versão alinha as ações do mobile com o comportamento do frontend web e com os contratos atuais do backend Spring.

## Ocorrências

### Aluno
- Consulta as próprias ocorrências.
- Pode abrir uma ocorrência para ver todos os detalhes e eventual resposta do gestor.
- Não pode criar, editar, alterar status ou excluir ocorrências.

### Professor
- Lista as ocorrências registradas por ele.
- Pode registrar ocorrência somente para alunos vinculados às suas turmas (a validação final continua no backend).
- Pode editar somente uma ocorrência própria enquanto o status estiver `PENDENTE`.
- Ocorrências fora de `PENDENTE` ficam somente para consulta.
- Pode abrir os detalhes completos e visualizar a resposta do gestor.

### Gestor
- Consulta todas as ocorrências.
- Pode alterar status entre `PENDENTE`, `EM_ANALISE`, `RESOLVIDA` e `CANCELADA`.
- Para `RESOLVIDA` ou `CANCELADA`, a resposta/justificativa do gestor é obrigatória.
- Não há edição arbitrária do texto registrado pelo professor, pois o backend administrativo expõe alteração de status/resposta, não edição do conteúdo original.

## Usuários — Gestor
- Lista e abre detalhes.
- Cadastra Aluno e Professor via `/gestor/usuarios/completo`.
- Aluno usa `perfilId: 1`, matrícula e turma.
- Professor usa `perfilId: 2` e especialidade.
- Gestor não pode cadastrar outro Gestor nessa tela.
- Outro Gestor não pode ser editado nem ter status alterado.
- Aluno/Professor podem ser ativados/desativados.
- Gestor pode enviar aviso individual para aluno.
- Ao editar, os detalhes reais são carregados antes de preencher o formulário para não apagar especialidade/turma por acidente.

## Turmas — Gestor
- Lista e pesquisa.
- Card abre detalhes com alunos, professores e disciplinas vinculados.
- Cadastro usa `nome`, `descricao`, `professorId` e `disciplinaId`.
- Edição permite também alterar o status ativo/inativo.
- Campos antigos sem contrato atual (`codigo`, `turno`) foram removidos do envio.

## Disciplinas — Gestor
- Lista e pesquisa.
- Toque no card abre edição.
- Cadastro/edição usa `nome` e `sigla`, conforme `DisciplinaDTO`.
- Campos sem contrato atual, como carga horária, não são enviados.

## Alunos — Professor
- Toque no aluno abre a situação completa.
- Ações para Notas e Ocorrências continuam disponíveis.
- Nova ação de Feedback envia aviso ao mural do aluno via `/professor/avisos`.
- Ocorrências na tela de situação também são clicáveis e levam à gestão de ocorrências daquele aluno.

## Dashboard do Gestor
- Ocorrências recentes são clicáveis e levam à área de gestão de ocorrências.

## Preservado
- Login e sessão.
- Fluxos de Aluno, Professor e Gestor já existentes.
- Biometria com `expo-camera` e o serviço biométrico unificado Spring/MySQL.
- Ícones Ionicons e setas de navegação da versão visual anterior.
