import {
  listarVinculosProfessorNotas,
  listarAlunosProfessorNotas,
  listarNotasVinculo,
  cadastrarNotaProfessor,
  atualizarNotaProfessor,
  excluirNotaProfessor
} from "../api/notas-professor-api.js";

let vinculosCache = [];
let alunosCache = [];
let notasCache = [];
let vinculoAtual = null;
let notaEmEdicao = null;

export async function abrirNotasProfessor() {
  const conteudo = document.getElementById("conteudoPrincipal");
  if (!conteudo) return;

  conteudo.innerHTML = montarEstrutura();
  configurarEventos();
  await carregarVinculos();
  atualizarIcones();
}

function montarEstrutura() {
  return `
    <section class="page-shell notas-professor-page">
      <header class="page-topbar notas-professor-topbar">
        <div>
          <h1 class="page-title">NOTAS ACADÊMICAS</h1>
          <p class="page-sub">Lance e acompanhe as avaliações dos alunos por turma e disciplina.</p>
        </div>
        <button class="notas-btn notas-btn-primary" id="btnNovaNota" type="button" disabled>
          <i data-lucide="plus"></i>
          <span>Lançar nota</span>
        </button>
      </header>

      <div class="content-area notas-professor-content">
        <section class="notas-resumo-grid" aria-label="Resumo de notas">
          ${cardResumo("Avaliações lançadas", "notasStatTotal", "0", "Registros no filtro", "clipboard-list", "blue")}
          ${cardResumo("Alunos avaliados", "notasStatAlunos", "0", "Com pelo menos uma nota", "users-round", "purple")}
          ${cardResumo("Média geral", "notasStatMedia", "—", "Normalizada para 10", "chart-no-axes-column-increasing", "green")}
          ${cardResumo("Abaixo de 6,0", "notasStatAtencao", "0", "Apenas referência visual", "triangle-alert", "orange")}
        </section>

        <section class="notas-toolbar-card">
          <div class="notas-field notas-field-wide">
            <label for="notasVinculoProfessor">Turma / disciplina</label>
            <select id="notasVinculoProfessor">
              <option value="">Carregando...</option>
            </select>
          </div>

          <div class="notas-field">
            <label for="notasFiltroBimestre">Bimestre</label>
            <select id="notasFiltroBimestre">
              <option value="">Todos</option>
              <option value="1">1º bimestre</option>
              <option value="2">2º bimestre</option>
              <option value="3">3º bimestre</option>
              <option value="4">4º bimestre</option>
            </select>
          </div>

          <div class="notas-field notas-field-search">
            <label for="notasBuscaProfessor">Pesquisar</label>
            <div class="notas-search-wrap">
              <i data-lucide="search"></i>
              <input id="notasBuscaProfessor" type="search" placeholder="Aluno ou avaliação..." autocomplete="off" />
            </div>
          </div>
        </section>

        <div class="notas-contexto" id="notasContextoProfessor"></div>

        <section class="notas-table-card">
          <div class="notas-table-header">
            <div>
              <h2>Registros de avaliação</h2>
              <p id="notasTableSubtitulo">Selecione uma turma e disciplina.</p>
            </div>
          </div>
          <div class="notas-table-scroll" id="notasTabelaProfessor">
            <div class="notas-empty">Carregando vínculos...</div>
          </div>
        </section>
      </div>
    </section>

    <div class="notas-modal-backdrop" id="notasModalProfessor" hidden>
      <section class="notas-modal" role="dialog" aria-modal="true" aria-labelledby="notasModalTitulo">
        <header class="notas-modal-header">
          <div>
            <span class="notas-modal-eyebrow">NOTA ACADÊMICA</span>
            <h2 id="notasModalTitulo">Lançar nota</h2>
          </div>
          <button class="notas-icon-btn" id="btnFecharModalNota" type="button" aria-label="Fechar">
            <i data-lucide="x"></i>
          </button>
        </header>

        <form id="formNotaProfessor" class="notas-form">
          <div class="notas-form-grid">
            <div class="notas-field notas-field-full">
              <label for="notaAlunoProfessor">Aluno</label>
              <select id="notaAlunoProfessor" required></select>
            </div>

            <div class="notas-field notas-field-full">
              <label for="notaTituloProfessor">Avaliação</label>
              <input id="notaTituloProfessor" maxlength="100" placeholder="Ex.: Avaliação JavaScript" required />
            </div>

            <div class="notas-field">
              <label for="notaValorProfessor">Nota</label>
              <input id="notaValorProfessor" type="number" min="0" max="1000" step="0.01" placeholder="8,5" required />
            </div>

            <div class="notas-field">
              <label for="notaMaximaProfessor">Nota máxima</label>
              <input id="notaMaximaProfessor" type="number" min="0.01" max="1000" step="0.01" value="10" required />
            </div>

            <div class="notas-field">
              <label for="notaBimestreProfessor">Bimestre</label>
              <select id="notaBimestreProfessor">
                <option value="">Não informar</option>
                <option value="1">1º bimestre</option>
                <option value="2">2º bimestre</option>
                <option value="3">3º bimestre</option>
                <option value="4">4º bimestre</option>
              </select>
            </div>

            <div class="notas-field">
              <label for="notaDataProfessor">Data da avaliação</label>
              <input id="notaDataProfessor" type="date" />
            </div>

            <div class="notas-field notas-field-full">
              <label for="notaObservacaoProfessor">Observação <span>(opcional)</span></label>
              <textarea id="notaObservacaoProfessor" maxlength="500" rows="3" placeholder="Comentário sobre o desempenho do aluno..."></textarea>
            </div>
          </div>

          <div class="notas-form-feedback" id="notaFormFeedbackProfessor" aria-live="polite"></div>

          <footer class="notas-modal-footer">
            <button class="notas-btn notas-btn-secondary" id="btnCancelarNota" type="button">Cancelar</button>
            <button class="notas-btn notas-btn-primary" id="btnSalvarNota" type="submit">
              <i data-lucide="save"></i>
              <span>Salvar nota</span>
            </button>
          </footer>
        </form>
      </section>
    </div>
  `;
}

function cardResumo(titulo, id, valor, legenda, icone, cor) {
  return `
    <article class="notas-resumo-card notas-resumo-${cor}">
      <div class="notas-resumo-icon"><i data-lucide="${icone}"></i></div>
      <div>
        <span>${titulo}</span>
        <strong id="${id}">${valor}</strong>
        <small>${legenda}</small>
      </div>
    </article>
  `;
}

function configurarEventos() {
  document.getElementById("notasVinculoProfessor")?.addEventListener("change", async event => {
    const id = Number(event.target.value);
    vinculoAtual = vinculosCache.find(item => Number(item.turmaDisciplinaId) === id) || null;
    await carregarDadosVinculo();
  });

  document.getElementById("notasFiltroBimestre")?.addEventListener("change", renderizarTudo);
  document.getElementById("notasBuscaProfessor")?.addEventListener("input", renderizarTabela);

  document.getElementById("btnNovaNota")?.addEventListener("click", () => abrirModalNota());
  document.getElementById("btnFecharModalNota")?.addEventListener("click", fecharModalNota);
  document.getElementById("btnCancelarNota")?.addEventListener("click", fecharModalNota);
  document.getElementById("formNotaProfessor")?.addEventListener("submit", salvarNota);

  document.getElementById("notasModalProfessor")?.addEventListener("click", event => {
    if (event.target.id === "notasModalProfessor") fecharModalNota();
  });

  document.removeEventListener("keydown", fecharModalComEscape);
  document.addEventListener("keydown", fecharModalComEscape);
}

async function carregarVinculos() {
  const select = document.getElementById("notasVinculoProfessor");

  try {
    const resposta = await listarVinculosProfessorNotas();
    vinculosCache = (Array.isArray(resposta) ? resposta : [])
      .map(normalizarVinculo)
      .filter(item => item.turmaDisciplinaId);

    if (!vinculosCache.length) {
      select.innerHTML = `<option value="">Nenhuma turma/disciplina vinculada</option>`;
      document.getElementById("notasTabelaProfessor").innerHTML = `<div class="notas-empty">Você ainda não possui disciplinas vinculadas.</div>`;
      return;
    }

    select.innerHTML = vinculosCache.map(item => `
      <option value="${item.turmaDisciplinaId}">${escapeHtml(item.turmaNome)} — ${escapeHtml(item.disciplinaNome)}</option>
    `).join("");

    vinculoAtual = vinculosCache[0];
    select.value = String(vinculoAtual.turmaDisciplinaId);
    await carregarDadosVinculo();
  } catch (error) {
    console.error("Erro ao carregar vínculos para notas:", error);
    select.innerHTML = `<option value="">Erro ao carregar</option>`;
    document.getElementById("notasTabelaProfessor").innerHTML = `<div class="notas-empty notas-empty-error">${escapeHtml(error.message || "Erro ao carregar turmas e disciplinas.")}</div>`;
  }
}

async function carregarDadosVinculo() {
  if (!vinculoAtual) return;

  const tabela = document.getElementById("notasTabelaProfessor");
  tabela.innerHTML = `<div class="notas-empty">Carregando notas...</div>`;
  document.getElementById("btnNovaNota").disabled = true;

  try {
    const [alunos, notas] = await Promise.all([
      listarAlunosProfessorNotas(vinculoAtual.turmaId),
      listarNotasVinculo(vinculoAtual.turmaDisciplinaId)
    ]);

    alunosCache = (Array.isArray(alunos) ? alunos : []).map(normalizarAluno);
    notasCache = Array.isArray(notas) ? notas : [];

    document.getElementById("btnNovaNota").disabled = alunosCache.length === 0;
    preencherContexto();
    preencherSelectAlunos();
    renderizarTudo();
  } catch (error) {
    console.error("Erro ao carregar notas:", error);
    alunosCache = [];
    notasCache = [];
    tabela.innerHTML = `<div class="notas-empty notas-empty-error">${escapeHtml(error.message || "Erro ao carregar notas.")}</div>`;
  }
}

function preencherContexto() {
  const contexto = document.getElementById("notasContextoProfessor");
  const subtitulo = document.getElementById("notasTableSubtitulo");
  if (!vinculoAtual) return;

  contexto.innerHTML = `
    <span><i data-lucide="school"></i>${escapeHtml(vinculoAtual.turmaNome)}</span>
    <span><i data-lucide="book-open"></i>${escapeHtml(vinculoAtual.disciplinaNome)}</span>
    <span><i data-lucide="users-round"></i>${alunosCache.length} aluno${alunosCache.length === 1 ? "" : "s"}</span>
  `;

  if (subtitulo) subtitulo.textContent = `${vinculoAtual.turmaNome} · ${vinculoAtual.disciplinaNome}`;
  atualizarIcones();
}

function preencherSelectAlunos() {
  const select = document.getElementById("notaAlunoProfessor");
  if (!select) return;

  select.innerHTML = alunosCache.length
    ? alunosCache.map(aluno => `<option value="${aluno.id}">${escapeHtml(aluno.nome)} · ${escapeHtml(aluno.matricula)}</option>`).join("")
    : `<option value="">Nenhum aluno nesta turma</option>`;
}

function renderizarTudo() {
  atualizarResumo();
  renderizarTabela();
}

function obterNotasFiltradas() {
  const bimestre = document.getElementById("notasFiltroBimestre")?.value || "";
  if (!bimestre) return [...notasCache];
  return notasCache.filter(nota => String(nota.bimestre ?? "") === bimestre);
}

function atualizarResumo() {
  const notas = obterNotasFiltradas();
  const alunosAvaliados = new Set(notas.map(n => n.alunoId)).size;
  const medias = notas.map(notaNormalizada10).filter(Number.isFinite);
  const media = medias.length ? medias.reduce((a, b) => a + b, 0) / medias.length : null;
  const atencao = medias.filter(valor => valor < 6).length;

  setTexto("notasStatTotal", notas.length);
  setTexto("notasStatAlunos", alunosAvaliados);
  setTexto("notasStatMedia", media == null ? "—" : `${formatarNumero(media)}/10`);
  setTexto("notasStatAtencao", atencao);
}

function renderizarTabela() {
  const container = document.getElementById("notasTabelaProfessor");
  if (!container) return;

  const termo = normalizarTexto(document.getElementById("notasBuscaProfessor")?.value || "");
  const notas = obterNotasFiltradas()
    .filter(nota => !termo || normalizarTexto(`${nota.alunoNome || ""} ${nota.titulo || ""}`).includes(termo))
    .sort((a, b) => {
      const nome = String(a.alunoNome || "").localeCompare(String(b.alunoNome || ""), "pt-BR");
      return nome !== 0 ? nome : String(b.dataAvaliacao || "").localeCompare(String(a.dataAvaliacao || ""));
    });

  if (!notas.length) {
    container.innerHTML = `
      <div class="notas-empty">
        <i data-lucide="notebook-tabs"></i>
        <strong>Nenhuma nota encontrada</strong>
        <span>${notasCache.length ? "Ajuste os filtros ou lance uma nova nota." : "Use “Lançar nota” para registrar a primeira avaliação."}</span>
      </div>
    `;
    atualizarIcones();
    return;
  }

  container.innerHTML = `
    <table class="notas-table">
      <thead>
        <tr>
          <th>Aluno</th>
          <th>Avaliação</th>
          <th>Bimestre</th>
          <th>Nota</th>
          <th>Data</th>
          <th>Observação</th>
          <th class="notas-col-acoes">Ações</th>
        </tr>
      </thead>
      <tbody>
        ${notas.map(nota => {
          const valor10 = notaNormalizada10(nota);
          const classe = valor10 >= 7 ? "boa" : valor10 >= 6 ? "media" : "baixa";
          return `
            <tr>
              <td>
                <div class="notas-aluno-cell">
                  <span class="notas-avatar">${escapeHtml(inicial(nota.alunoNome))}</span>
                  <div><strong>${escapeHtml(nota.alunoNome || "Aluno")}</strong><small>ID ${escapeHtml(nota.alunoId ?? "-")}</small></div>
                </div>
              </td>
              <td><strong>${escapeHtml(nota.titulo || "Avaliação")}</strong></td>
              <td>${nota.bimestre ? `<span class="notas-pill">${nota.bimestre}º</span>` : `<span class="notas-muted">—</span>`}</td>
              <td><span class="notas-score notas-score-${classe}"><strong>${formatarNumero(nota.nota)}</strong><small>/ ${formatarNumero(nota.notaMaxima ?? 10)}</small></span></td>
              <td>${formatarData(nota.dataAvaliacao)}</td>
              <td class="notas-observacao-cell" title="${escapeHtml(nota.observacao || "")}">${escapeHtml(nota.observacao || "—")}</td>
              <td>
                <div class="notas-acoes">
                  <button class="notas-icon-btn" type="button" data-acao-nota="editar" data-nota-id="${nota.id}" title="Editar nota"><i data-lucide="pencil"></i></button>
                  <button class="notas-icon-btn notas-icon-danger" type="button" data-acao-nota="excluir" data-nota-id="${nota.id}" title="Excluir nota"><i data-lucide="trash-2"></i></button>
                </div>
              </td>
            </tr>
          `;
        }).join("")}
      </tbody>
    </table>
  `;

  container.querySelectorAll("[data-acao-nota]").forEach(botao => {
    botao.addEventListener("click", async () => {
      const nota = notasCache.find(item => String(item.id) === String(botao.dataset.notaId));
      if (!nota) return;
      if (botao.dataset.acaoNota === "editar") abrirModalNota(nota);
      if (botao.dataset.acaoNota === "excluir") await excluirNota(nota);
    });
  });

  atualizarIcones();
}

function abrirModalNota(nota = null) {
  if (!vinculoAtual || !alunosCache.length) return;

  notaEmEdicao = nota;
  const modal = document.getElementById("notasModalProfessor");
  const feedback = document.getElementById("notaFormFeedbackProfessor");

  document.getElementById("notasModalTitulo").textContent = nota ? "Editar nota" : "Lançar nota";
  feedback.textContent = "";
  feedback.className = "notas-form-feedback";

  preencherSelectAlunos();
  document.getElementById("notaAlunoProfessor").value = String(nota?.alunoId ?? alunosCache[0]?.id ?? "");
  document.getElementById("notaTituloProfessor").value = nota?.titulo ?? "";
  document.getElementById("notaValorProfessor").value = nota?.nota ?? "";
  document.getElementById("notaMaximaProfessor").value = nota?.notaMaxima ?? 10;
  document.getElementById("notaBimestreProfessor").value = nota?.bimestre ?? (document.getElementById("notasFiltroBimestre")?.value || "");
  document.getElementById("notaDataProfessor").value = nota?.dataAvaliacao ?? hojeISO();
  document.getElementById("notaObservacaoProfessor").value = nota?.observacao ?? "";

  modal.hidden = false;
  document.body.classList.add("notas-modal-open");
  setTimeout(() => document.getElementById("notaTituloProfessor")?.focus(), 20);
  atualizarIcones();
}

function fecharModalNota() {
  const modal = document.getElementById("notasModalProfessor");
  if (!modal || modal.hidden) return;
  modal.hidden = true;
  notaEmEdicao = null;
  document.body.classList.remove("notas-modal-open");
}

function fecharModalComEscape(event) {
  if (event.key === "Escape") fecharModalNota();
}

async function salvarNota(event) {
  event.preventDefault();
  if (!vinculoAtual) return;

  const btn = document.getElementById("btnSalvarNota");
  const feedback = document.getElementById("notaFormFeedbackProfessor");
  const nota = Number(document.getElementById("notaValorProfessor").value);
  const notaMaxima = Number(document.getElementById("notaMaximaProfessor").value);

  if (
    !Number.isFinite(nota) ||
    !Number.isFinite(notaMaxima) ||
    nota < 0 ||
    nota > 1000 ||
    notaMaxima <= 0 ||
    notaMaxima > 1000 ||
    nota > notaMaxima
  ) {
    feedback.textContent = "Informe valores entre 0 e 1000, mantendo a nota menor ou igual à nota máxima.";
    feedback.className = "notas-form-feedback is-error";
    return;
  }

  const dados = {
    alunoId: Number(document.getElementById("notaAlunoProfessor").value),
    turmaDisciplinaId: Number(vinculoAtual.turmaDisciplinaId),
    titulo: document.getElementById("notaTituloProfessor").value.trim(),
    nota,
    notaMaxima,
    bimestre: document.getElementById("notaBimestreProfessor").value ? Number(document.getElementById("notaBimestreProfessor").value) : null,
    observacao: document.getElementById("notaObservacaoProfessor").value.trim() || null,
    dataAvaliacao: document.getElementById("notaDataProfessor").value || null
  };

  if (!dados.alunoId || !dados.titulo) {
    feedback.textContent = "Selecione o aluno e informe o nome da avaliação.";
    feedback.className = "notas-form-feedback is-error";
    return;
  }

  btn.disabled = true;
  feedback.textContent = "Salvando...";
  feedback.className = "notas-form-feedback";

  try {
    if (notaEmEdicao?.id) await atualizarNotaProfessor(notaEmEdicao.id, dados);
    else await cadastrarNotaProfessor(dados);

    fecharModalNota();
    await recarregarNotas();
  } catch (error) {
    console.error("Erro ao salvar nota:", error);
    feedback.textContent = error.message || "Não foi possível salvar a nota.";
    feedback.className = "notas-form-feedback is-error";
  } finally {
    btn.disabled = false;
  }
}

async function excluirNota(nota) {
  if (!window.confirm(`Excluir a nota “${nota.titulo || "Avaliação"}” de ${nota.alunoNome || "este aluno"}?`)) return;

  try {
    await excluirNotaProfessor(nota.id);
    await recarregarNotas();
  } catch (error) {
    console.error("Erro ao excluir nota:", error);
    window.alert(error.message || "Não foi possível excluir a nota.");
  }
}

async function recarregarNotas() {
  if (!vinculoAtual) return;
  try {
    const notas = await listarNotasVinculo(vinculoAtual.turmaDisciplinaId);
    notasCache = Array.isArray(notas) ? notas : [];
    renderizarTudo();
  } catch (error) {
    console.error(error);
    window.alert(error.message || "Erro ao atualizar as notas.");
  }
}

function normalizarVinculo(item) {
  const turma = item?.turma && typeof item.turma === "object" ? item.turma : {};
  const disciplinaObj = item?.disciplina && typeof item.disciplina === "object" ? item.disciplina : {};
  return {
    turmaDisciplinaId: item?.turmaDisciplinaId ?? item?.vinculoId ?? item?.id ?? null,
    turmaId: item?.turmaId ?? turma.id ?? null,
    turmaNome: item?.nomeTurma ?? turma.nome ?? item?.turmaNome ?? item?.nome ?? "Turma",
    disciplinaNome: item?.nomeDisciplina ?? disciplinaObj.nome ?? (typeof item?.disciplina === "string" ? item.disciplina : null) ?? "Disciplina"
  };
}

function normalizarAluno(item) {
  const usuario = item?.usuario && typeof item.usuario === "object" ? item.usuario : {};
  return {
    id: item?.id ?? item?.alunoId ?? null,
    nome: usuario.nome ?? item?.nomeAluno ?? item?.nome ?? "Aluno",
    matricula: item?.matricula ?? item?.ra ?? item?.registroAcademico ?? "Sem matrícula"
  };
}

function notaNormalizada10(nota) {
  const valor = Number(nota?.nota);
  const maxima = Number(nota?.notaMaxima ?? 10);
  if (!Number.isFinite(valor) || !Number.isFinite(maxima) || maxima <= 0) return NaN;
  return (valor / maxima) * 10;
}

function formatarNumero(valor) {
  const numero = Number(valor);
  if (!Number.isFinite(numero)) return "—";
  return numero.toLocaleString("pt-BR", { minimumFractionDigits: numero % 1 ? 1 : 0, maximumFractionDigits: 2 });
}

function formatarData(data) {
  if (!data) return "—";
  const partes = String(data).split("-");
  return partes.length === 3 ? `${partes[2]}/${partes[1]}/${partes[0]}` : String(data);
}

function hojeISO() {
  const agora = new Date();
  const local = new Date(agora.getTime() - agora.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function setTexto(id, valor) {
  const el = document.getElementById(id);
  if (el) el.textContent = valor;
}

function inicial(nome) {
  return String(nome || "A").trim().charAt(0).toUpperCase() || "A";
}

function normalizarTexto(texto) {
  return String(texto || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

function escapeHtml(valor) {
  return String(valor ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

function atualizarIcones() {
  if (window.lucide) window.lucide.createIcons();
}
