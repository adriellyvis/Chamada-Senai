import { listarMinhasNotas } from "../api/notas-aluno-api.js";

let notasAlunoCache = [];

export async function abrirNotasAluno(container) {
  if (!container) return;

  container.innerHTML = montarCarregando();

  try {
    const resposta = await listarMinhasNotas();
    notasAlunoCache = Array.isArray(resposta) ? resposta : [];
    container.innerHTML = montarPagina();
    configurarFiltros();
    renderizarConteudo();
  } catch (error) {
    console.error("Erro ao carregar notas do aluno:", error);
    container.innerHTML = `
      <section class="notas-aluno-shell">
        <div class="notas-aluno-empty notas-aluno-error">
          <span class="material-symbols-rounded">error</span>
          <strong>Não foi possível carregar suas notas</strong>
          <p>${escapeHtml(error.message || "Tente novamente em alguns instantes.")}</p>
        </div>
      </section>
    `;
  }
}

function montarCarregando() {
  return `
    <section class="notas-aluno-shell">
      <div class="notas-aluno-loading">
        <span class="material-symbols-rounded">progress_activity</span>
        <strong>Carregando notas...</strong>
      </div>
    </section>
  `;
}

function montarPagina() {
  return `
    <section class="notas-aluno-shell">
      <div class="notas-aluno-resumo" id="notasAlunoResumo"></div>

      <div class="notas-aluno-toolbar">
        <div>
          <strong>Minhas avaliações</strong>
          <span>Consulte as notas lançadas pelos seus professores.</span>
        </div>
        <label class="notas-aluno-filtro">
          <span>Bimestre</span>
          <select id="notasAlunoBimestre">
            <option value="">Todos</option>
            <option value="1">1º bimestre</option>
            <option value="2">2º bimestre</option>
            <option value="3">3º bimestre</option>
            <option value="4">4º bimestre</option>
          </select>
        </label>
      </div>

      <div class="notas-aluno-disciplinas" id="notasAlunoDisciplinas"></div>
    </section>
  `;
}

function configurarFiltros() {
  document.getElementById("notasAlunoBimestre")?.addEventListener("change", renderizarConteudo);
}

function renderizarConteudo() {
  const bimestre = document.getElementById("notasAlunoBimestre")?.value || "";
  const notas = bimestre ? notasAlunoCache.filter(n => String(n.bimestre ?? "") === bimestre) : [...notasAlunoCache];
  renderizarResumo(notas);
  renderizarDisciplinas(notas, bimestre);
}

function renderizarResumo(notas) {
  const container = document.getElementById("notasAlunoResumo");
  if (!container) return;

  const medias = notas.map(notaNormalizada10).filter(Number.isFinite);
  const mediaGeral = medias.length ? medias.reduce((a, b) => a + b, 0) / medias.length : null;
  const disciplinas = agruparPorDisciplina(notas);
  const melhor = [...disciplinas.values()]
    .map(grupo => ({ nome: grupo.nome, media: mediaGrupo(grupo.notas) }))
    .filter(item => Number.isFinite(item.media))
    .sort((a, b) => b.media - a.media)[0];

  container.innerHTML = `
    <article class="notas-aluno-stat notas-aluno-stat-primary">
      <span class="material-symbols-rounded">monitoring</span>
      <div><small>MÉDIA GERAL</small><strong>${mediaGeral == null ? "—" : formatarNumero(mediaGeral)}</strong><p>Normalizada para 10</p></div>
    </article>
    <article class="notas-aluno-stat">
      <span class="material-symbols-rounded">assignment</span>
      <div><small>AVALIAÇÕES</small><strong>${notas.length}</strong><p>Notas no filtro atual</p></div>
    </article>
    <article class="notas-aluno-stat">
      <span class="material-symbols-rounded">menu_book</span>
      <div><small>DISCIPLINAS</small><strong>${disciplinas.size}</strong><p>Com avaliações lançadas</p></div>
    </article>
    <article class="notas-aluno-stat">
      <span class="material-symbols-rounded">workspace_premium</span>
      <div><small>DESTAQUE</small><strong class="notas-aluno-stat-texto">${escapeHtml(melhor?.nome || "—")}</strong><p>${melhor ? `Média ${formatarNumero(melhor.media)}` : "Sem dados suficientes"}</p></div>
    </article>
  `;
}

function renderizarDisciplinas(notas, bimestre) {
  const container = document.getElementById("notasAlunoDisciplinas");
  if (!container) return;

  if (!notas.length) {
    container.innerHTML = `
      <div class="notas-aluno-empty">
        <span class="material-symbols-rounded">school</span>
        <strong>Nenhuma nota lançada${bimestre ? ` no ${bimestre}º bimestre` : ""}</strong>
        <p>Quando o professor registrar uma avaliação, ela aparecerá aqui.</p>
      </div>
    `;
    return;
  }

  const grupos = [...agruparPorDisciplina(notas).values()].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));

  container.innerHTML = grupos.map(grupo => {
    const media = mediaGrupo(grupo.notas);
    const classe = media >= 7 ? "boa" : media >= 6 ? "media" : "baixa";

    return `
      <article class="notas-disciplina-card">
        <header class="notas-disciplina-header">
          <div class="notas-disciplina-identidade">
            <span class="notas-disciplina-icone material-symbols-rounded">menu_book</span>
            <div>
              <span>${escapeHtml(grupo.turmaNome || "Minha turma")}</span>
              <h2>${escapeHtml(grupo.nome)}</h2>
            </div>
          </div>
          <div class="notas-disciplina-media notas-disciplina-media-${classe}">
            <span>Média</span>
            <strong>${Number.isFinite(media) ? formatarNumero(media) : "—"}</strong>
            <small>/ 10</small>
          </div>
        </header>

        <div class="notas-avaliacoes-lista">
          ${grupo.notas.sort((a, b) => String(b.dataAvaliacao || "").localeCompare(String(a.dataAvaliacao || ""))).map(montarAvaliacao).join("")}
        </div>
      </article>
    `;
  }).join("");
}

function montarAvaliacao(nota) {
  const valor10 = notaNormalizada10(nota);
  const classe = valor10 >= 7 ? "boa" : valor10 >= 6 ? "media" : "baixa";

  return `
    <div class="notas-avaliacao-item">
      <div class="notas-avaliacao-info">
        <div class="notas-avaliacao-topo">
          <strong>${escapeHtml(nota.titulo || "Avaliação")}</strong>
          ${nota.bimestre ? `<span>${nota.bimestre}º bimestre</span>` : ""}
        </div>
        <small>${formatarData(nota.dataAvaliacao)}</small>
        ${nota.observacao ? `<p><span class="material-symbols-rounded">chat</span>${escapeHtml(nota.observacao)}</p>` : ""}
      </div>
      <div class="notas-avaliacao-nota notas-avaliacao-nota-${classe}">
        <strong>${formatarNumero(nota.nota)}</strong>
        <span>/ ${formatarNumero(nota.notaMaxima ?? 10)}</span>
      </div>
    </div>
  `;
}

function agruparPorDisciplina(notas) {
  const mapa = new Map();
  notas.forEach(nota => {
    const chave = String(nota.disciplinaId ?? nota.turmaDisciplinaId ?? nota.disciplinaNome ?? "sem-disciplina");
    if (!mapa.has(chave)) {
      mapa.set(chave, { nome: nota.disciplinaNome || "Disciplina", turmaNome: nota.turmaNome || "", notas: [] });
    }
    mapa.get(chave).notas.push(nota);
  });
  return mapa;
}

function mediaGrupo(notas) {
  const valores = notas.map(notaNormalizada10).filter(Number.isFinite);
  return valores.length ? valores.reduce((a, b) => a + b, 0) / valores.length : NaN;
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
  if (!data) return "Data não informada";
  const partes = String(data).split("-");
  return partes.length === 3 ? `${partes[2]}/${partes[1]}/${partes[0]}` : String(data);
}

function escapeHtml(valor) {
  return String(valor ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}
