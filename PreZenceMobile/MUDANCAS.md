# PreZence Mobile — andamento atual

## Professor

- Dashboard, turmas, alunos, chamada, notas e ocorrências integrados ao backend.
- Histórico de aulas integrado, com abertura dos registros de presença por aula.
- Acompanhamento individual do aluno integrado, reunindo frequência, notas, presenças recentes e ocorrências.

## Aluno

- Dashboard atualizado e compatível com tema claro/escuro.
- Cards principais alinhados ao escopo: frequência, faltas no mês, aulas assistidas e ocorrências.
- Horário de hoje identifica a aula em andamento e a próxima aula a partir da grade recebida do backend.
- Resumo de distribuição de presenças, atrasos e faltas.
- Desempenho por unidade curricular com percentual e barra de frequência.
- Registros biométricos recentes exibidos no dashboard usando o histórico de presença já existente.
- Mural de avisos exibido no dashboard.
- Agenda semanal integrada a `GET /aluno/agenda`.
- Frequência com resumo, desempenho por disciplina, histórico e filtro específico de registros biométricos.
- Notas integradas a `GET /aluno/notas`, com filtros por bimestre e disciplina.
- Avisos integrados, com leitura individual e marcação de todos como lidos.
- Ocorrências do próprio aluno exibidas na mesma área de comunicados.
- Chamada facial integrada para consultar chamada aberta, cadastro biométrico e status da solicitação.
- Perfil do aluno consulta os dados acadêmicos e o status biométrico.

## Biometria mobile

O fluxo de consulta está conectado ao Spring Boot, mas o material atual do projeto não define uma rota de reconhecimento facial que receba uma foto capturada pelo celular. Por isso, o aplicativo não inventa nem chama um endpoint inexistente.

A etapa restante para reconhecimento direto pelo celular é:

1. definir/confirmar o contrato HTTP do serviço de reconhecimento facial;
2. ativar a câmera nativa no Expo;
3. capturar a imagem;
4. enviar a amostra ao serviço de reconhecimento;
5. somente após reconhecimento válido, concluir/solicitar a presença pelo fluxo do Spring Boot.

### Ajustes de acabamento do perfil Aluno

- A Agenda abre no dia atual quando houver aulas de segunda a sábado e ignora horários marcados como inativos.
- Notas são exibidas da avaliação mais recente para a mais antiga dentro dos filtros escolhidos.
- Avisos e ocorrências são ordenados do registro mais recente para o mais antigo.
- A Home continua utilizável mesmo se um endpoint complementar (agenda, avisos, desempenho ou histórico) falhar; o dashboard principal permanece visível e informa a falha parcial.
- A mensagem da tela de chamada facial foi corrigida: a pendência é a integração da câmera/serviço de reconhecimento, não uma limitação do Expo.


## Fechamento Aluno + Professor — 26/10/2026

- Aluno: média acadêmica no dashboard, atalhos para notas/avisos, avisos como aba principal e agenda movida para Mais.
- Professor: nova tela de acompanhamento completo do aluno com frequência, notas, presenças recentes e ocorrências.
- Alunos em risco no dashboard do professor agora abrem diretamente o acompanhamento individual.
- Biometria por câmera e mensagens internas continuam dependentes de contratos de backend que não constam no material atual.

## Gestor — etapa consolidada

- Perfil Gestor deixou de usar placeholders.
- Dashboard institucional e gestão de turmas, usuários, disciplinas e ocorrências implementados.
- Cadastro de usuários restrito a Aluno/Professor e edição de outros gestores bloqueada.
- Navegação do Gestor consolidada sem alterar os fluxos finais de Aluno e Professor.
- Serviço administrativo usa fallback de rota somente em 404/405 para não mascarar erros reais da API.
