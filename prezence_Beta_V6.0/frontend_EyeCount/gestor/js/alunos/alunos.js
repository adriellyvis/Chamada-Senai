import { request } from "../../../core/api.js";
import { marcarMenuAtivo, getConteudoPrincipal} from "../../../core/spa.js";
import { abrirModal, fecharModal} from "../../../core/modal.js";
import { enviarAvisoGestor } from "../../../core/avisos-api.js";
import {
  iniciarCameraBiometria,
  pararCameraBiometria,
  cameraEstaAtiva
} from "../../../biometria/camera-biometria.js";
import {
  cadastrarFacePython,
  consultarFacePython,
  verificarServidorBiometria
} from "../../../biometria/biometria-api.js";
import {
  criarCadastroFacialGuiado,
  prepararPainelCadastroFacialGuiado
} from "../../../biometria/cadastro-facial-guiado.js";

let usuariosCache = [];
let alunosMonitoradosCache = [];
let alunoSelecionadoId = null;
let modoUsuariosAtual = "alunos";

const UFS_BRASIL = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO",
  "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI",
  "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"
];

function opcoesUfHtml(ufSelecionada = "") {
  const atual = String(ufSelecionada || "").toUpperCase();

  return `
    <option value="">UF</option>
    ${UFS_BRASIL.map(uf => `
      <option value="${uf}" ${uf === atual ? "selected" : ""}>${uf}</option>
    `).join("")}
  `;
}

function formatarRaCompleto(matricula, digitoRa, uf) {
  const ra = String(matricula ?? "").trim();
  const digito = String(digitoRa ?? "").trim();
  const estado = String(uf ?? "").trim().toUpperCase();

  if (!ra || ra === "-") return "-";

  const sufixoDigito = digito ? `-${digito}` : "";
  const sufixoUf = estado ? ` / ${estado}` : "";

  return `${ra}${sufixoDigito}${sufixoUf}`;
}

function obterUsuarioLogado() {
  try {
    return JSON.parse((sessionStorage.getItem("usuario") || localStorage.getItem("usuario")));
  } catch {
    return null;
  }
}

export async function abrirAlunos(elemento) {
  marcarMenuAtivo(elemento);

  const conteudo = getConteudoPrincipal();

  conteudo.innerHTML = `
    <section class="acompanhamento-alunos-page">
      <div class="alunos-monitor-topo">
        <div>
          <span class="alunos-monitor-eyebrow">Acompanhamento institucional</span>
          <h2>Alunos</h2>
          <p>Monitore frequência, biometria e ocorrências sem perder o acesso à gestão da equipe.</p>
        </div>

        <div class="alunos-monitor-acoes-topo">
          <button id="btnAlternarEquipe" class="btn-equipe-gestor" type="button">
            <span class="material-symbols-rounded" aria-hidden="true">groups</span>
            Gerenciar equipe
          </button>

          <button id="btnCadastrarAluno" class="btn-matricular-aluno" type="button">
            <span class="material-symbols-rounded" aria-hidden="true">person_add</span>
            Matricular novo aluno
          </button>
        </div>
      </div>

      <section class="alunos-monitor-resumo" aria-label="Resumo dos alunos">
        <article class="alunos-kpi-card">
          <div>
            <span>Alunos monitorados</span>
            <strong id="totalAlunosMonitorados">0</strong>
            <small>Cadastros ativos</small>
          </div>
          <span class="alunos-kpi-icon azul material-symbols-rounded" aria-hidden="true">group</span>
        </article>

        <article class="alunos-kpi-card destaque">
          <div>
            <span>Frequência crítica</span>
            <strong id="totalFrequenciaCritica">0</strong>
            <small>Menos de 75% de presença</small>
          </div>
          <span class="alunos-kpi-icon roxo material-symbols-rounded" aria-hidden="true">warning</span>
        </article>

        <article class="alunos-kpi-card">
          <div>
            <span>Biometria ativa</span>
            <strong id="totalBiometriaAtiva">0</strong>
            <small id="textoBiometriaResumo">Rostos cadastrados</small>
          </div>
          <span class="alunos-kpi-icon verde material-symbols-rounded" aria-hidden="true">face</span>
        </article>

        <article class="alunos-kpi-card">
          <div>
            <span>Ocorrências</span>
            <strong id="totalOcorrenciasAlunos">0</strong>
            <small>Registros vinculados aos alunos</small>
          </div>
          <span class="alunos-kpi-icon laranja material-symbols-rounded" aria-hidden="true">assignment_late</span>
        </article>
      </section>

      <section id="painelAlunosGestor">
        <div class="alunos-monitor-toolbar">
          <div class="alunos-filtro-label">
            <span class="material-symbols-rounded" aria-hidden="true">filter_alt</span>
            <span>Filtrar alunos por:</span>
          </div>

          <div class="alunos-monitor-busca">
            <span class="material-symbols-rounded" aria-hidden="true">search</span>
            <input id="buscaAlunoGestor" type="search" placeholder="Nome, RA ou e-mail..." autocomplete="off" />
          </div>

          <select id="filtroTurmaAluno" class="alunos-monitor-select">
            <option value="">Todas as turmas</option>
          </select>

          <select id="filtroStatusAluno" class="alunos-monitor-select">
            <option value="">Todos os status</option>
            <option value="critico">Frequência crítica</option>
            <option value="atencao">Em atenção</option>
            <option value="regular">Frequência regular</option>
            <option value="sembiometria">Sem biometria</option>
            <option value="inativo">Inativos</option>
          </select>
        </div>

        <div class="alunos-monitor-grid">
          <section class="ficha-alunos-card">
            <header class="ficha-alunos-header">
              <div>
                <span>Ficha cadastral e frequência</span>
                <small id="contadorAlunosExibidos">Carregando alunos...</small>
              </div>
            </header>

            <div id="listaAlunosGestor" class="lista-alunos-monitorados">
              <div class="alunos-monitor-loading">
                <span class="material-symbols-rounded" aria-hidden="true">progress_activity</span>
                Carregando acompanhamento dos alunos...
              </div>
            </div>
          </section>

          <aside id="prontuarioApoioGestor" class="prontuario-apoio-card">
            <div class="prontuario-vazio">
              <span class="prontuario-icone material-symbols-rounded" aria-hidden="true">badge</span>
              <strong>Prontuário de apoio</strong>
              <p>Selecione um aluno da lista para acompanhar seus dados acadêmicos e acessar as ações disponíveis.</p>
            </div>
          </aside>
        </div>
      </section>

      <section id="painelEquipeGestor" class="painel-equipe-gestor" hidden>
        <div class="equipe-toolbar">
          <div>
            <span class="alunos-monitor-eyebrow">Gestão de equipe</span>
            <h3>Professores e gestores</h3>
            <p>Cadastre professores e consulte os demais usuários institucionais.</p>
          </div>

          <button id="btnCadastrarEquipe" class="btn-matricular-aluno" type="button">
            <span class="material-symbols-rounded" aria-hidden="true">person_add</span>
            Cadastrar usuário
          </button>
        </div>

        <div class="usuarios-toolbar equipe-filtros">
          <div class="usuarios-busca">
            <input id="buscaEquipeGestor" type="text" placeholder="Buscar por nome ou email..." />
            <span class="material-symbols-rounded" aria-hidden="true">search</span>
          </div>

          <select id="filtroPerfilEquipe" class="select-pill">
            <option value="">Professores e gestores</option>
            <option value="professor">Professores</option>
            <option value="gestor">Gestores</option>
          </select>

          <select id="filtroStatusEquipe" class="select-pill">
            <option value="">Todos os status</option>
            <option value="ativo">Ativos</option>
            <option value="inativo">Inativos</option>
          </select>
        </div>

        <div class="usuarios-table-card">
          <div class="usuarios-table-wrapper">
            <table class="usuarios-table">
              <thead>
                <tr>
                  <th>Usuário</th>
                  <th>Email</th>
                  <th>Perfil</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody id="tabelaUsuariosEquipe">
                <tr><td colspan="5">Carregando equipe...</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </section>
  `;

  document.getElementById("btnCadastrarAluno")?.addEventListener("click", () => abrirFormularioAluno("aluno"));
  document.getElementById("btnCadastrarEquipe")?.addEventListener("click", () => abrirFormularioAluno("professor"));
  document.getElementById("btnAlternarEquipe")?.addEventListener("click", alternarPainelUsuariosGestor);

  document.getElementById("buscaAlunoGestor")?.addEventListener("input", aplicarFiltrosAlunos);
  document.getElementById("filtroTurmaAluno")?.addEventListener("change", aplicarFiltrosAlunos);
  document.getElementById("filtroStatusAluno")?.addEventListener("change", aplicarFiltrosAlunos);

  document.getElementById("buscaEquipeGestor")?.addEventListener("input", aplicarFiltrosEquipe);
  document.getElementById("filtroPerfilEquipe")?.addEventListener("change", aplicarFiltrosEquipe);
  document.getElementById("filtroStatusEquipe")?.addEventListener("change", aplicarFiltrosEquipe);

  await carregarUsuarios();
  aplicarBuscaPendenteNotificacaoGestor();
}

function alternarPainelUsuariosGestor() {
  modoUsuariosAtual = modoUsuariosAtual === "alunos" ? "equipe" : "alunos";

  const painelAlunos = document.getElementById("painelAlunosGestor");
  const painelEquipe = document.getElementById("painelEquipeGestor");
  const botao = document.getElementById("btnAlternarEquipe");
  const botaoNovoAluno = document.getElementById("btnCadastrarAluno");

  const mostrarEquipe = modoUsuariosAtual === "equipe";

  if (painelAlunos) painelAlunos.hidden = mostrarEquipe;
  if (painelEquipe) painelEquipe.hidden = !mostrarEquipe;
  if (botaoNovoAluno) botaoNovoAluno.hidden = mostrarEquipe;

  if (botao) {
    botao.innerHTML = mostrarEquipe
      ? '<span class="material-symbols-rounded" aria-hidden="true">school</span> Voltar para alunos'
      : '<span class="material-symbols-rounded" aria-hidden="true">groups</span> Gerenciar equipe';
  }

  if (mostrarEquipe) {
    aplicarFiltrosEquipe();
  } else {
    aplicarFiltrosAlunos();
  }
}

async function carregarUsuarios() {
  try {
    const usuarios = await request("/gestor/usuarios");
    usuariosCache = Array.isArray(usuarios) ? usuarios : [];

    await carregarAcompanhamentoAlunos();
    atualizarResumoAlunos();
    popularFiltroTurmasAlunos();
    aplicarFiltrosAlunos();
    aplicarFiltrosEquipe();

  } catch (error) {
    console.error(error);

    const lista = document.getElementById("listaAlunosGestor");
    if (lista) {
      lista.innerHTML = `
        <div class="alunos-monitor-erro">
          <span class="material-symbols-rounded" aria-hidden="true">error</span>
          Não foi possível carregar os alunos.
        </div>
      `;
    }
  }
}

async function carregarAcompanhamentoAlunos() {
  const alunos = usuariosCache.filter(usuario =>
    String(usuario.perfil ?? "").toLowerCase() === "aluno"
  );

  alunosMonitoradosCache = await Promise.all(
    alunos.map(async usuario => {
      const [detalhes, biometria] = await Promise.all([
        carregarDetalhesAlunoSeguro(usuario.id),
        carregarBiometriaAlunoSeguro(usuario.id)
      ]);

      return {
        ...usuario,
        detalhes,
        turma: detalhes?.turma ?? "Sem turma",
        matricula: detalhes?.matricula ?? "-",
        digitoRa: detalhes?.digitoRa ?? null,
        uf: detalhes?.uf ?? null,
        frequencia: numeroValidoAluno(detalhes?.frequencia),
        ocorrencias: Number(detalhes?.ocorrencias ?? 0) || 0,
        biometriaCadastrada: Boolean(biometria?.cadastrada)
      };
    })
  );
}

async function carregarDetalhesAlunoSeguro(usuarioId) {
  try {
    return await request(`/gestor/usuarios/${usuarioId}/detalhes`);
  } catch (error) {
    console.warn(`Não foi possível carregar detalhes do aluno ${usuarioId}:`, error);
    return null;
  }
}

async function carregarBiometriaAlunoSeguro(usuarioId) {
  try {
    return await request(`/biometria/amostras/${usuarioId}/status`);
  } catch (error) {
    console.warn(`Não foi possível consultar biometria do aluno ${usuarioId}:`, error);
    return { cadastrada: false };
  }
}

function numeroValidoAluno(valor) {
  if (valor === null || valor === undefined || valor === "") return null;
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : null;
}

function popularFiltroTurmasAlunos() {
  const select = document.getElementById("filtroTurmaAluno");
  if (!select) return;

  const turmas = [...new Map(
    alunosMonitoradosCache
      .filter(aluno => aluno.turma && aluno.turma !== "Sem turma")
      .map(aluno => [String(aluno.turma), String(aluno.turma)])
  ).values()].sort((a, b) => a.localeCompare(b, "pt-BR"));

  select.innerHTML = '<option value="">Todas as turmas</option>' +
    turmas.map(turma => `<option value="${escaparAtributoHtml(turma)}">${escaparHtmlGestor(turma)}</option>`).join("");
}

function aplicarFiltrosAlunos() {
  const termo = document.getElementById("buscaAlunoGestor")?.value.toLowerCase().trim() ?? "";
  const turma = document.getElementById("filtroTurmaAluno")?.value ?? "";
  const status = document.getElementById("filtroStatusAluno")?.value ?? "";

  const filtrados = alunosMonitoradosCache.filter(aluno => {
    const buscaOk = !termo || [
      aluno.nome,
      aluno.email,
      aluno.matricula,
      aluno.digitoRa,
      aluno.uf,
      formatarRaCompleto(aluno.matricula, aluno.digitoRa, aluno.uf),
      aluno.turma
    ].some(valor => String(valor ?? "").toLowerCase().includes(termo));

    const turmaOk = !turma || String(aluno.turma) === turma;
    const classificacao = classificarFrequenciaAluno(aluno.frequencia);

    let statusOk = true;
    if (status === "critico") statusOk = classificacao.chave === "critico";
    if (status === "atencao") statusOk = classificacao.chave === "atencao";
    if (status === "regular") statusOk = classificacao.chave === "regular";
    if (status === "sembiometria") statusOk = !aluno.biometriaCadastrada;
    if (status === "inativo") statusOk = !aluno.ativo;

    return buscaOk && turmaOk && statusOk;
  });

  renderizarAlunosMonitorados(filtrados);
}

function renderizarAlunosMonitorados(alunos) {
  const lista = document.getElementById("listaAlunosGestor");
  const contador = document.getElementById("contadorAlunosExibidos");

  if (!lista) return;

  if (contador) {
    contador.textContent = `${alunos.length} ${alunos.length === 1 ? "aluno exibido" : "alunos exibidos"}`;
  }

  if (alunos.length === 0) {
    lista.innerHTML = `
      <div class="alunos-monitor-vazio">
        <span class="material-symbols-rounded" aria-hidden="true">person_search</span>
        <strong>Nenhum aluno encontrado</strong>
        <p>Ajuste os filtros ou faça uma nova matrícula.</p>
      </div>
    `;
    return;
  }

  lista.innerHTML = alunos.map(aluno => {
    const frequencia = aluno.frequencia;
    const classificacao = classificarFrequenciaAluno(frequencia);
    const percentual = frequencia == null ? 0 : Math.max(0, Math.min(100, frequencia));
    const selecionado = String(alunoSelecionadoId) === String(aluno.id);

    return `
      <article class="aluno-monitor-row ${selecionado ? "selecionado" : ""}" data-aluno-row="${aluno.id}">
        <div class="aluno-monitor-identidade">
          <div class="aluno-monitor-avatar">${iniciaisAluno(aluno.nome)}</div>
          <div>
            <strong>${escaparHtmlGestor(aluno.nome ?? "Aluno")}</strong>
            <span>RA: ${escaparHtmlGestor(formatarRaCompleto(aluno.matricula, aluno.digitoRa, aluno.uf))}</span>
            <small>Turma: <b>${escaparHtmlGestor(aluno.turma ?? "Sem turma")}</b></small>
          </div>
        </div>

        <div class="aluno-monitor-frequencia">
          <div class="aluno-monitor-frequencia-topo">
            <strong class="${classificacao.classe}">${frequencia == null ? "--" : `${formatarPercentualAluno(frequencia)}%`}</strong>
            <span>${classificacao.rotulo}</span>
          </div>
          <div class="aluno-monitor-barra" aria-label="Frequência ${frequencia == null ? "sem histórico" : `${formatarPercentualAluno(frequencia)}%`}">
            <i class="${classificacao.classe}" style="width:${percentual}%"></i>
          </div>
        </div>

        <div class="aluno-monitor-biometria">
          <span>Biometria</span>
          <div class="biometria-chip ${aluno.biometriaCadastrada ? "ativo" : "pendente"}">
            <span class="material-symbols-rounded" aria-hidden="true">face</span>
            ${aluno.biometriaCadastrada ? "Ativa" : "Pendente"}
          </div>
        </div>

        <div class="aluno-monitor-ocorrencias">
          <span>Ocorrências</span>
          <strong class="${aluno.ocorrencias > 0 ? "tem-ocorrencia" : ""}">${aluno.ocorrencias}</strong>
        </div>

        <div class="aluno-monitor-acoes">
          <button class="btn-prontuario" type="button" data-prontuario-usuario="${aluno.id}">
            Prontuário
          </button>
          <button class="btn-aluno-mais" type="button" data-detalhes-usuario="${aluno.id}" aria-label="Ver detalhes">
            <span class="material-symbols-rounded" aria-hidden="true">more_horiz</span>
          </button>
        </div>
      </article>
    `;
  }).join("");

  adicionarEventosTabela();
  adicionarEventosProntuario();
}

function adicionarEventosProntuario() {
  document.querySelectorAll("[data-prontuario-usuario]").forEach(botao => {
    botao.addEventListener("click", () => {
      const aluno = alunosMonitoradosCache.find(item => String(item.id) === String(botao.dataset.prontuarioUsuario));
      if (!aluno) return;

      alunoSelecionadoId = aluno.id;
      atualizarProntuarioAluno(aluno);
      aplicarFiltrosAlunos();
    });
  });
}

function atualizarProntuarioAluno(aluno) {
  const painel = document.getElementById("prontuarioApoioGestor");
  if (!painel) return;

  const classificacao = classificarFrequenciaAluno(aluno.frequencia);

  painel.innerHTML = `
    <div class="prontuario-selecionado">
      <div class="prontuario-identidade">
        <div class="prontuario-avatar">${iniciaisAluno(aluno.nome)}</div>
        <div>
          <small>Aluno selecionado</small>
          <strong>${escaparHtmlGestor(aluno.nome ?? "Aluno")}</strong>
          <span>${escaparHtmlGestor(aluno.turma ?? "Sem turma")}</span>
        </div>
      </div>

      <div class="prontuario-indicadores">
        <div>
          <span>Frequência</span>
          <strong class="${classificacao.classe}">${aluno.frequencia == null ? "--" : `${formatarPercentualAluno(aluno.frequencia)}%`}</strong>
        </div>
        <div>
          <span>Biometria</span>
          <strong>${aluno.biometriaCadastrada ? "Ativa" : "Pendente"}</strong>
        </div>
        <div>
          <span>Ocorrências</span>
          <strong>${aluno.ocorrencias}</strong>
        </div>
        <div>
          <span>RA</span>
          <strong>${escaparHtmlGestor(formatarRaCompleto(aluno.matricula, aluno.digitoRa, aluno.uf))}</strong>
        </div>
      </div>

      <div class="prontuario-divisor"></div>

      <div class="prontuario-acoes-titulo">Atalhos de acompanhamento</div>
      <div class="prontuario-acoes-grid">
        <button type="button" data-prontuario-detalhes="${aluno.id}">
          <span class="material-symbols-rounded" aria-hidden="true">badge</span>
          Detalhes
        </button>
        <button type="button" data-prontuario-aviso="${aluno.id}">
          <span class="material-symbols-rounded" aria-hidden="true">send</span>
          Enviar aviso
        </button>
        <button type="button" data-prontuario-face="${aluno.id}">
          <span class="material-symbols-rounded" aria-hidden="true">face</span>
          Biometria
        </button>
        <button type="button" data-prontuario-editar="${aluno.id}">
          <span class="material-symbols-rounded" aria-hidden="true">edit</span>
          Editar
        </button>
      </div>
    </div>
  `;

  document.querySelector(`[data-prontuario-detalhes="${aluno.id}"]`)?.addEventListener("click", () => abrirDetalhesUsuario(aluno.id));
  document.querySelector(`[data-prontuario-aviso="${aluno.id}"]`)?.addEventListener("click", () => abrirAvisoGestorAluno(aluno));
  document.querySelector(`[data-prontuario-face="${aluno.id}"]`)?.addEventListener("click", () => abrirCadastroFaceGestor(aluno));
  document.querySelector(`[data-prontuario-editar="${aluno.id}"]`)?.addEventListener("click", () => editarUsuario(aluno.id));
}

function classificarFrequenciaAluno(frequencia) {
  if (frequencia == null) {
    return { chave: "sem-historico", rotulo: "Sem histórico", classe: "neutro" };
  }

  if (frequencia < 75) {
    return { chave: "critico", rotulo: "Crítico", classe: "critico" };
  }

  if (frequencia < 85) {
    return { chave: "atencao", rotulo: "Em atenção", classe: "atencao" };
  }

  return { chave: "regular", rotulo: frequencia >= 95 ? "Excelente" : "Regular", classe: "regular" };
}

function formatarPercentualAluno(valor) {
  const numero = Number(valor);
  if (!Number.isFinite(numero)) return "0";
  return numero.toFixed(1).replace(".0", "").replace(".", ",");
}

function iniciaisAluno(nome) {
  const partes = String(nome ?? "A").trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return "A";
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return `${partes[0][0]}${partes[partes.length - 1][0]}`.toUpperCase();
}

function atualizarResumoAlunos() {
  const alunosAtivos = alunosMonitoradosCache.filter(aluno => Boolean(aluno.ativo));
  const criticos = alunosAtivos.filter(aluno => aluno.frequencia != null && aluno.frequencia < 75).length;
  const biometriaAtiva = alunosAtivos.filter(aluno => aluno.biometriaCadastrada).length;
  const ocorrencias = alunosAtivos.reduce((total, aluno) => total + (Number(aluno.ocorrencias) || 0), 0);

  setTextoUsuario("totalAlunosMonitorados", alunosAtivos.length);
  setTextoUsuario("totalFrequenciaCritica", criticos);
  setTextoUsuario("totalBiometriaAtiva", biometriaAtiva);
  setTextoUsuario("totalOcorrenciasAlunos", ocorrencias);

  const textoBiometria = document.getElementById("textoBiometriaResumo");
  if (textoBiometria) {
    textoBiometria.textContent = alunosAtivos.length
      ? `${Math.round((biometriaAtiva / alunosAtivos.length) * 100)}% dos alunos ativos`
      : "Rostos cadastrados";
  }
}

function aplicarFiltrosEquipe() {
  const termo = document.getElementById("buscaEquipeGestor")?.value.toLowerCase().trim() ?? "";
  const perfil = document.getElementById("filtroPerfilEquipe")?.value ?? "";
  const status = document.getElementById("filtroStatusEquipe")?.value ?? "";

  const filtrados = usuariosCache.filter(usuario => {
    const perfilUsuario = String(usuario.perfil ?? "").toLowerCase();
    if (perfilUsuario === "aluno") return false;

    const buscaOk = !termo || String(usuario.nome ?? "").toLowerCase().includes(termo) || String(usuario.email ?? "").toLowerCase().includes(termo);
    const perfilOk = !perfil || perfilUsuario === perfil;
    const statusOk = !status || (status === "ativo" && usuario.ativo) || (status === "inativo" && !usuario.ativo);

    return buscaOk && perfilOk && statusOk;
  });

  renderizarEquipeUsuarios(filtrados);
}

function renderizarEquipeUsuarios(usuarios) {
  const tabela = document.getElementById("tabelaUsuariosEquipe");
  if (!tabela) return;

  if (usuarios.length === 0) {
    tabela.innerHTML = '<tr><td colspan="5">Nenhum usuário da equipe encontrado.</td></tr>';
    return;
  }

  tabela.innerHTML = usuarios.map(usuario => {
    const perfil = String(usuario.perfil ?? "").toLowerCase();
    const ativo = Boolean(usuario.ativo);

    return `
      <tr>
        <td>
          <div class="usuario-identidade">
            <div class="usuario-avatar ${perfil}">${usuario.nome?.charAt(0).toUpperCase() ?? "U"}</div>
            <div>
              <strong>${escaparHtmlGestor(usuario.nome ?? "-")}</strong>
              <span>ID #${usuario.id}</span>
            </div>
          </div>
        </td>
        <td>${escaparHtmlGestor(usuario.email ?? "-")}</td>
        <td><span class="usuario-perfil ${perfil}">${formatarPerfilUsuario(usuario.perfil)}</span></td>
        <td><span class="usuario-status ${ativo ? "ativo" : "inativo"}">${ativo ? "Ativo" : "Inativo"}</span></td>
        <td>
          <div class="usuario-acoes">
            ${perfil !== "gestor" ? `<button class="btn-usuario editar" data-editar-usuario="${usuario.id}">Editar</button>` : ""}
            <button class="btn-usuario detalhes" data-detalhes-usuario="${usuario.id}">Detalhes</button>
            ${perfil !== "gestor" ? `
              <button class="btn-usuario detalhes" data-face-usuario="${usuario.id}">Face</button>
              <button class="btn-usuario status ${ativo ? "desativar" : "ativar"}" data-status-usuario="${usuario.id}">${ativo ? "Desativar" : "Ativar"}</button>
            ` : `<span class="usuario-protegido" title="Gestores não podem alterar outros gestores por esta tela">Protegido</span>`}
          </div>
        </td>
      </tr>
    `;
  }).join("");

  adicionarEventosTabela();
}

function setTextoUsuario(id, valor) {
  const elemento = document.getElementById(id);
  if (elemento) elemento.textContent = valor;
}

function formatarPerfilUsuario(perfil) {
  const mapa = {
    aluno: "Aluno",
    professor: "Professor",
    gestor: "Gestor"
  };

  return mapa[String(perfil ?? "").toLowerCase()] ?? perfil ?? "-";
}
function adicionarEventosTabela() {

  document
    .querySelectorAll("[data-status-usuario]")
    .forEach(botao => {

      botao.addEventListener(
        "click",
        () => {

          alterarStatusUsuario(
            botao.dataset.statusUsuario
          );
        }
      );
    });

    document
  .querySelectorAll("[data-detalhes-usuario]")
  .forEach(botao => {

    botao.addEventListener(
      "click",
      () => {

        abrirDetalhesUsuario(
          botao.dataset.detalhesUsuario
        );
      }
    );
  });

  document
    .querySelectorAll("[data-editar-usuario]")
    .forEach(botao => {

      botao.addEventListener(
        "click",
        () => {

          editarUsuario(
            botao.dataset.editarUsuario
          );
        }
      );
    });

  document
    .querySelectorAll("[data-aviso-usuario]")
    .forEach(botao => {
      botao.addEventListener("click", () => {
        const usuario = usuariosCache.find(item => String(item.id) === String(botao.dataset.avisoUsuario));

        if (!usuario) {
          alert("Aluno não encontrado.");
          return;
        }

        abrirAvisoGestorAluno(usuario);
      });
    });

  document
    .querySelectorAll("[data-face-usuario]")
    .forEach(botao => {
      botao.addEventListener("click", () => {
        const usuario = usuariosCache.find(item => item.id == botao.dataset.faceUsuario);

        if (!usuario) {
          alert("Usuário não encontrado.");
          return;
        }

        abrirCadastroFaceGestor(usuario);
      });
    });
}

async function alterarStatusUsuario(id) {
  const usuario = usuariosCache.find(item => String(item.id) === String(id));

  if (String(usuario?.perfil ?? "").toLowerCase() === "gestor") {
    alert("Não é permitido alterar o status de outro gestor.");
    return;
  }

  try {
    await request(
      `/gestor/usuarios/${id}/status`,
      {
        method: "PATCH"
      }
    );

    await carregarUsuarios();

  } catch (error) {
    console.error(error);
    alert(error?.message || "Erro ao alterar status");
  }
}

async function abrirFormularioAluno(perfilPadrao = "aluno") {

  abrirModal({
    titulo: perfilPadrao === "professor" ? "Cadastrar professor" : "Cadastrar aluno",

   conteudo: `
  <form id="formAluno">

    <div class="grupo-form">
      <label>Perfil</label>

      <select id="perfilUsuario" required>
        <option value="">Selecione</option>
        <option value="1">Aluno</option>
        <option value="2">Professor</option>
      </select>
    </div>

    <div class="grupo-form">
      <label>Nome</label>

      <input
        type="text"
        id="nomeAluno"
        required
      >
    </div>

    <div class="grupo-form">
      <label>Email</label>

      <input
        type="email"
        id="emailAluno"
        required
      >
    </div>

    <div class="grupo-form">
      <label>Senha</label>

      <input
        type="password"
        id="senhaAluno"
        required
      >
    </div>

    <div id="camposAluno" style="display:none;">

      <div class="ra-cadastro-grid">
        <div class="grupo-form ra-cadastro-principal">
          <label>RA</label>
          <input
            type="text"
            id="matriculaAluno"
            inputmode="numeric"
            placeholder="Ex.: 2026001"
          >
        </div>

        <div class="grupo-form">
          <label>Dígito RA</label>
          <input
            type="text"
            id="digitoRaAluno"
            inputmode="numeric"
            maxlength="2"
            placeholder="01"
          >
        </div>

        <div class="grupo-form">
          <label>UF</label>
          <select id="ufAluno">
            ${opcoesUfHtml()}
          </select>
        </div>
      </div>

      <div class="grupo-form">

        <label>Turma</label>

        <select id="turmaAluno">

          <option value="">
            Selecione uma turma
          </option>

        </select>

      </div>

    </div>

    <div id="camposProfessor" style="display:none;">

      <div class="grupo-form">
        <label>Especialidade</label>

        <input
          type="text"
          id="especialidadeProfessor"
        >
      </div>

    </div>

    <label class="grupo-form" style="display:flex; gap:10px; align-items:center; flex-direction:row; font-weight:700;">
      <input type="checkbox" id="cadastrarFaceAgora">
      Cadastrar rosto logo após salvar
    </label>

    <button type="submit">
      Cadastrar
    </button>

  </form>
`
  });

  // CARREGA AS TURMAS AQUI
  await carregarTurmasSelect();
const perfilSelect =
  document.getElementById("perfilUsuario");

const camposAluno =
  document.getElementById("camposAluno");

const camposProfessor =
  document.getElementById("camposProfessor");

if (perfilPadrao === "aluno") {
  perfilSelect.value = "1";
  camposAluno.style.display = "block";
  camposProfessor.style.display = "none";
} else if (perfilPadrao === "professor") {
  perfilSelect.value = "2";
  camposAluno.style.display = "none";
  camposProfessor.style.display = "block";
}

perfilSelect.addEventListener(
  "change",
  async () => {

    const perfilId =
      Number(perfilSelect.value);

    camposAluno.style.display =
      perfilId === 1
        ? "block"
        : "none";

    camposProfessor.style.display =
      perfilId === 2
        ? "block"
        : "none";

    if (perfilId === 1) {
      await carregarTurmasSelect();
    }
  }
);

  document.getElementById("matriculaAluno")?.addEventListener("input", event => {
    event.target.value = event.target.value.replace(/\D/g, "");
  });

  document.getElementById("digitoRaAluno")?.addEventListener("input", event => {
    event.target.value = event.target.value.replace(/\D/g, "").slice(0, 2);
  });

  document
    .getElementById("formAluno")
    .addEventListener(
      "submit",
      cadastrarAluno
    );
}

async function carregarTurmasSelect() {

  try {

    const turmas =
      await request(
        "/gestor/turmas/resumo"
      );

    const select =
      document.getElementById(
        "turmaAluno"
      );

    if (!select) return;

    select.innerHTML = `
      <option value="">
        Selecione uma turma
      </option>
    `;

    turmas.forEach(turma => {

      select.innerHTML += `
        <option value="${turma.id}">
          ${turma.nome}
        </option>
      `;
    });

  } catch (error) {

    console.error(error);

    alert("Erro ao carregar turmas");
  }
}

async function cadastrarAluno(event) {

  event.preventDefault();

  try {

    const perfilId =
  Number(
    document.getElementById(
      "perfilUsuario"
    ).value
  );

const body = {

  nome:
    document.getElementById(
      "nomeAluno"
    ).value,

  email:
    document.getElementById(
      "emailAluno"
    ).value,

  senha:
    document.getElementById(
      "senhaAluno"
    ).value,

  perfilId
};

if (perfilId === 1) {

  const matricula =
    document.getElementById("matriculaAluno")?.value.trim() ?? "";

  const digitoRa =
    document.getElementById("digitoRaAluno")?.value.replace(/\D/g, "").slice(0, 2) ?? "";

  const uf =
    document.getElementById("ufAluno")?.value.trim().toUpperCase() ?? "";

  const turmaId =
    Number(document.getElementById("turmaAluno")?.value);

  if (!matricula) {
    alert("Informe o RA do aluno.");
    return;
  }

  if (!/^\d{2}$/.test(digitoRa)) {
    alert("Informe o dígito RA com 2 números, por exemplo 01.");
    return;
  }

  if (!uf) {
    alert("Selecione a UF do RA.");
    return;
  }

  if (!turmaId) {
    alert("Selecione uma turma.");
    return;
  }

  body.matricula = matricula;
  body.digitoRa = digitoRa;
  body.uf = uf;
  body.turmaId = turmaId;
}

if (perfilId === 2) {

  body.especialidade =
    document.getElementById(
      "especialidadeProfessor"
    ).value;
}

    const cadastrarFaceAgora = document.getElementById("cadastrarFaceAgora")?.checked;

    const usuarioCriadoResposta = await request(
      "/gestor/usuarios/completo",
      {
        method: "POST",

        body: JSON.stringify(body)
      }
    );

    await carregarUsuarios();

    const usuarioCriado = normalizarUsuarioCriado(
      usuarioCriadoResposta,
      body,
      perfilId
    );

    if (cadastrarFaceAgora) {
      abrirCadastroFaceGestor(usuarioCriado);
      return;
    }

    fecharModal();

    alert(
      perfilId === 1
        ? "Aluno cadastrado com sucesso!"
        : "Professor cadastrado com sucesso!"
    );

  } catch (error) {
  console.error(error);

  if (error.message.includes("Email já cadastrado")) {
    alert("Esse email já está cadastrado. Use outro email.");
    return;
  }

  alert("Erro ao cadastrar aluno");
    }
}

async function editarUsuario(id) {
  const usuario = usuariosCache.find(u => String(u.id) === String(id));

  if (!usuario) {
    alert("Usuário não encontrado");
    return;
  }

  const perfil = String(usuario.perfil ?? "").toLowerCase();

  if (perfil === "gestor") {
    const usuarioLogado = obterUsuarioLogado();
    const ehProprioGestor = String(usuarioLogado?.id) === String(usuario.id);

    alert(
      ehProprioGestor
        ? "Edite seus dados pela área Perfil."
        : "Não é permitido editar os dados de outro gestor."
    );
    return;
  }

  try {
    const detalhes = await request(
      `/gestor/usuarios/${id}/detalhes`
    );

    const ehAluno = perfil === "aluno";
    const ehProfessor = perfil === "professor";

    abrirModal({
      titulo: `Editar ${formatarPerfilUsuario(usuario.perfil).toLowerCase()}`,
      classe: "modal-usuario modal-editar-usuario",

      conteudo: `
        <form id="formEditarUsuario" class="form-editar-usuario">
          <div class="editar-usuario-intro">
            <span class="material-symbols-rounded" aria-hidden="true">manage_accounts</span>
            <div>
              <strong>Dados do cadastro</strong>
              <small>Atualize somente as informações que precisam ser alteradas.</small>
            </div>
          </div>

          <div class="editar-usuario-grid">
          <div class="grupo-form">
            <label>Nome</label>
            <input
              type="text"
              id="editarNomeUsuario"
              value="${escaparAtributoHtml(detalhes?.nome ?? usuario.nome ?? "")}"
              required
              maxlength="100"
            >
          </div>

          <div class="grupo-form">
            <label>Email</label>
            <input
              type="email"
              id="editarEmailUsuario"
              value="${escaparAtributoHtml(detalhes?.email ?? usuario.email ?? "")}"
              required
              maxlength="100"
            >
          </div>

          ${
            ehAluno
              ? `
                <div class="ra-cadastro-grid">
                  <div class="grupo-form ra-cadastro-principal">
                    <label>RA</label>
                    <input
                      type="text"
                      id="editarMatriculaAluno"
                      value="${escaparAtributoHtml(detalhes?.matricula ?? "")}"
                      inputmode="numeric"
                    >
                  </div>

                  <div class="grupo-form">
                    <label>Dígito RA</label>
                    <input
                      type="text"
                      id="editarDigitoRaAluno"
                      value="${escaparAtributoHtml(detalhes?.digitoRa ?? "")}"
                      inputmode="numeric"
                      maxlength="2"
                    >
                  </div>

                  <div class="grupo-form">
                    <label>UF</label>
                    <select id="editarUfAluno">
                      ${opcoesUfHtml(detalhes?.uf ?? "")}
                    </select>
                  </div>
                </div>

                <div class="grupo-form">
                  <label>Turma</label>
                  <select id="editarTurmaAluno" required>
                    <option value="">Carregando turmas...</option>
                  </select>
                </div>
              `
              : ""
          }

          ${
            ehProfessor
              ? `
                <div class="grupo-form">
                  <label>Especialidade</label>
                  <input
                    type="text"
                    id="editarEspecialidadeProfessor"
                    value="${escaparAtributoHtml(detalhes?.especialidade ?? "")}"
                    maxlength="150"
                  >
                </div>
              `
              : ""
          }

          </div>

          <div class="editar-usuario-acoes">
            <button type="button" class="btn-edicao-cancelar" id="btnCancelarEdicaoUsuario">
              Cancelar
            </button>
            <button type="submit" id="btnSalvarEdicaoUsuario">
              <span class="material-symbols-rounded" aria-hidden="true">save</span>
              Salvar alterações
            </button>
          </div>
        </form>
      `
    });

    if (ehAluno) {
      await carregarTurmasSelectEdicao(usuario.turmaId);

      document.getElementById("editarMatriculaAluno")?.addEventListener("input", event => {
        event.target.value = event.target.value.replace(/\D/g, "");
      });

      document.getElementById("editarDigitoRaAluno")?.addEventListener("input", event => {
        event.target.value = event.target.value.replace(/\D/g, "").slice(0, 2);
      });
    }

    document
      .getElementById("btnCancelarEdicaoUsuario")
      ?.addEventListener("click", fecharModal);

    document
      .getElementById("formEditarUsuario")
      ?.addEventListener("submit", event => {
        salvarEdicaoUsuario(
          event,
          usuario.id,
          ehAluno,
          ehProfessor
        );
      });

  } catch (error) {
    console.error(error);
    alert(error?.message || "Erro ao carregar os dados do usuário para edição.");
  }
}

async function salvarEdicaoUsuario(event, id, ehAluno, ehProfessor) {
  event.preventDefault();

  const botaoSalvar = document.getElementById("btnSalvarEdicaoUsuario");

  try {
    const nome = document.getElementById("editarNomeUsuario")?.value.trim();
    const email = document.getElementById("editarEmailUsuario")?.value.trim();

    if (!nome) {
      alert("Informe o nome do usuário.");
      return;
    }

    if (!email) {
      alert("Informe o email do usuário.");
      return;
    }

    const body = { nome, email };

    if (ehAluno) {
      const matricula =
        document.getElementById("editarMatriculaAluno")?.value.trim() ?? "";

      const digitoRa =
        document.getElementById("editarDigitoRaAluno")?.value.replace(/\D/g, "").slice(0, 2) ?? "";

      const uf =
        document.getElementById("editarUfAluno")?.value.trim().toUpperCase() ?? "";

      const turmaId = Number(
        document.getElementById("editarTurmaAluno")?.value
      );

      if (!matricula) {
        alert("Informe o RA do aluno.");
        return;
      }

      if (!/^\d{2}$/.test(digitoRa)) {
        alert("Informe o dígito RA com 2 números, por exemplo 01.");
        return;
      }

      if (!uf) {
        alert("Selecione a UF do RA.");
        return;
      }

      if (!turmaId) {
        alert("Selecione uma turma");
        return;
      }

      body.matricula = matricula;
      body.digitoRa = digitoRa;
      body.uf = uf;
      body.turmaId = turmaId;
    }

    if (ehProfessor) {
      body.especialidade =
        document.getElementById("editarEspecialidadeProfessor")?.value.trim() ?? "";
    }

    if (botaoSalvar) {
      botaoSalvar.disabled = true;
      botaoSalvar.textContent = "Salvando...";
    }

    await request(`/gestor/usuarios/${id}`, {
      method: "PUT",
      body: JSON.stringify(body)
    });

    fecharModal();
    await carregarUsuarios();

    alert("Usuário editado com sucesso!");

  } catch (error) {
    console.error(error);
    alert(error?.message || "Erro ao editar usuário");
  } finally {
    if (botaoSalvar && document.body.contains(botaoSalvar)) {
      botaoSalvar.disabled = false;
      botaoSalvar.textContent = "Salvar alterações";
    }
  }
}

async function carregarTurmasSelectEdicao(
  turmaSelecionada = null
) {

  try {

    const turmas =
      await request(
        "/gestor/turmas/resumo"
      );

    const select =
      document.getElementById(
        "editarTurmaAluno"
      );

    if (!select) return;

    select.innerHTML = `
      <option value="">
        Selecione uma turma
      </option>
    `;

    turmas.forEach(turma => {

      select.innerHTML += `
        <option
          value="${turma.id}"
          ${turma.id == turmaSelecionada
            ? "selected"
            : ""}
        >
          ${turma.nome}
        </option>
      `;
    });

  } catch (error) {

    console.error(error);

    alert(
      "Erro ao carregar turmas"
    );
  }
}


function escaparAtributoHtml(valor) {
  return String(valor ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

async function abrirDetalhesUsuario(id) {
  try {
    const usuario = await request(`/gestor/usuarios/${id}/detalhes`);
    const perfil = formatarPerfilUsuario(usuario?.perfil);
    const raCompleto = usuario?.matricula
      ? formatarRaCompleto(usuario.matricula, usuario.digitoRa, usuario.uf)
      : null;

    const itens = [
      { icone: "mail", rotulo: "E-mail", valor: usuario?.email || "Não informado" },
      { icone: "badge", rotulo: "Perfil", valor: perfil || "Não informado" },
      usuario?.turma ? { icone: "school", rotulo: "Turma", valor: usuario.turma } : null,
      raCompleto ? { icone: "id_card", rotulo: "RA", valor: raCompleto } : null,
      usuario?.frequencia != null ? { icone: "monitoring", rotulo: "Frequência", valor: `${usuario.frequencia}%` } : null,
      usuario?.especialidade ? { icone: "menu_book", rotulo: "Especialidade", valor: usuario.especialidade } : null
    ].filter(Boolean);

    abrirModal({
      titulo: "Detalhes do usuário",
      classe: "modal-usuario modal-detalhes-usuario",
      conteudo: `
        <div class="detalhes-usuario">
          <div class="detalhes-usuario-hero">
            <div class="detalhes-usuario-avatar">${escaparHtmlGestor(iniciaisAluno(usuario?.nome || "U"))}</div>
            <div class="detalhes-usuario-identidade">
              <span>Cadastro institucional</span>
              <h3>${escaparHtmlGestor(usuario?.nome || "Usuário")}</h3>
              <small>${escaparHtmlGestor(perfil || "Usuário")}</small>
            </div>
          </div>

          <div class="detalhes-usuario-grid">
            ${itens.map(item => `
              <div class="detalhes-usuario-item">
                <span class="material-symbols-rounded detalhes-usuario-icone" aria-hidden="true">${escaparHtmlGestor(item.icone)}</span>
                <div>
                  <span>${escaparHtmlGestor(item.rotulo)}</span>
                  <strong>${escaparHtmlGestor(item.valor)}</strong>
                </div>
              </div>
            `).join("")}
          </div>
        </div>
      `
    });
  } catch (error) {
    console.error(error);
    alert("Erro ao carregar detalhes");
  }
}
function normalizarUsuarioCriado(resposta, body, perfilId) {
  const perfil = perfilId === 1 ? "aluno" : "professor";
  const usuarioEncontrado = usuariosCache.find(usuario =>
    String(usuario.email ?? "").toLowerCase() === String(body.email ?? "").toLowerCase()
  );

  return {
    ...(usuarioEncontrado || {}),
    ...(resposta || {}),
    nome: resposta?.nome ?? usuarioEncontrado?.nome ?? body.nome,
    email: resposta?.email ?? usuarioEncontrado?.email ?? body.email,
    perfil: resposta?.perfil ?? usuarioEncontrado?.perfil ?? perfil,
    id: resposta?.id ?? resposta?.usuarioId ?? usuarioEncontrado?.id,
    alunoId: resposta?.alunoId ?? usuarioEncontrado?.alunoId,
    professorId: resposta?.professorId ?? usuarioEncontrado?.professorId,
    matricula: resposta?.matricula ?? usuarioEncontrado?.matricula ?? body.matricula,
    digitoRa: resposta?.digitoRa ?? usuarioEncontrado?.digitoRa ?? body.digitoRa,
    uf: resposta?.uf ?? usuarioEncontrado?.uf ?? body.uf
  };
}


function abrirAvisoGestorAluno(usuario) {
  const perfil = String(usuario?.perfil ?? "").toLowerCase();

  if (perfil !== "aluno") {
    alert("Avisos individuais desta tela só podem ser enviados para alunos.");
    return;
  }

  abrirModal({
    titulo: "Enviar aviso ao aluno",
    conteudo: `
      <form id="formAvisoGestor" class="form-aviso-gestor">
        <div class="aviso-destinatario-gestor">
          <span class="material-symbols-rounded" aria-hidden="true">person</span>
          <div>
            <small>DESTINATÁRIO</small>
            <strong>${escaparHtmlGestor(usuario.nome ?? "Aluno")}</strong>
            <span>${escaparHtmlGestor(usuario.email ?? "")}</span>
          </div>
        </div>

        <div class="grupo-form">
          <label for="avisoGestorCategoria">Categoria</label>
          <select id="avisoGestorCategoria" required>
            <option value="GERAL">Comunicado geral</option>
            <option value="FREQUENCIA">Frequência</option>
            <option value="ATENDIMENTO">Atendimento / orientação</option>
            <option value="DOCUMENTACAO">Documentação</option>
            <option value="PRAZO">Prazo importante</option>
            <option value="ACADEMICO">Acadêmico</option>
            <option value="OUTRO">Outro</option>
          </select>
        </div>

        <div class="grupo-form">
          <label for="avisoGestorPrioridade">Prioridade</label>
          <select id="avisoGestorPrioridade" required>
            <option value="NORMAL">Normal</option>
            <option value="IMPORTANTE">Importante</option>
          </select>
        </div>

        <div class="grupo-form">
          <label for="avisoGestorTitulo">Título</label>
          <input id="avisoGestorTitulo" type="text" maxlength="150" placeholder="Ex.: Atenção à sua frequência" required />
        </div>

        <div class="grupo-form">
          <label for="avisoGestorMensagem">Mensagem</label>
          <textarea id="avisoGestorMensagem" rows="6" maxlength="1200" placeholder="Escreva a orientação que o aluno receberá..." required></textarea>
          <small class="aviso-form-ajuda">O aviso aparece no mural do aluno e nas notificações.</small>
        </div>

        <div id="avisoGestorFeedback" class="aviso-form-feedback" hidden></div>

        <button id="btnEnviarAvisoGestor" type="submit">Enviar aviso</button>
      </form>
    `
  });

  document.getElementById("formAvisoGestor")?.addEventListener("submit", event => {
    enviarAvisoGestorAluno(event, usuario);
  });
}

async function enviarAvisoGestorAluno(event, usuario) {
  event.preventDefault();

  const botao = document.getElementById("btnEnviarAvisoGestor");
  const feedback = document.getElementById("avisoGestorFeedback");

  const dados = {
    alunoUsuarioId: Number(usuario.id),
    titulo: document.getElementById("avisoGestorTitulo")?.value.trim(),
    mensagem: document.getElementById("avisoGestorMensagem")?.value.trim(),
    categoria: document.getElementById("avisoGestorCategoria")?.value,
    prioridade: document.getElementById("avisoGestorPrioridade")?.value
  };

  if (!dados.titulo || !dados.mensagem) return;

  try {
    if (botao) {
      botao.disabled = true;
      botao.textContent = "Enviando...";
    }

    await enviarAvisoGestor(dados);

    if (feedback) {
      feedback.hidden = false;
      feedback.className = "aviso-form-feedback sucesso";
      feedback.textContent = "Aviso enviado com sucesso.";
    }

    window.setTimeout(() => fecharModal(), 900);
  } catch (error) {
    console.error(error);
    if (feedback) {
      feedback.hidden = false;
      feedback.className = "aviso-form-feedback erro";
      feedback.textContent = error.message || "Erro ao enviar aviso.";
    }
    if (botao) {
      botao.disabled = false;
      botao.textContent = "Enviar aviso";
    }
  }
}

function escaparHtmlGestor(valor) {
  return String(valor ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function abrirCadastroFaceGestor(usuario) {
  const perfil = String(usuario?.perfil ?? "").toLowerCase();

  if (perfil === "gestor") {
    alert("O cadastro facial pelo gestor está liberado apenas para alunos e professores.");
    return;
  }

  const nome = usuario?.nome || "Usuário";
  const perfilLabel = perfil === "professor" ? "professor" : "aluno";

  abrirModal({
    titulo: `Cadastrar rosto - ${nome}`,
    conteudo: `
      <div class="perfil-bio-card">
        <div class="perfil-card__header">
          <div>
            <span class="perfil-eyebrow">Biometria facial</span>
            <h3>${nome}</h3>
            <p>Capture o rosto do ${perfilLabel} para deixar o reconhecimento preparado antes da chamada.</p>
          </div>
        </div>

        <div class="perfil-bio-stage" id="gestorFaceStage">
          <video id="gestorFaceVideo" class="perfil-bio-video" autoplay playsinline muted></video>
          <canvas id="gestorFaceCanvas" style="display:none;"></canvas>

          <div class="perfil-bio-placeholder">
            <div>
              <div class="perfil-bio-face-icon"></div>
              <strong>Câmera fechada</strong>
              <span>Abra a câmera e mantenha apenas uma pessoa no enquadramento.</span>
            </div>
          </div>
        </div>

        <div id="gestorFaceGuia"></div>

        <div class="perfil-bio-actions">
          <button class="perfil-bio-btn secondary" id="btnGestorAbrirCamera" type="button">Abrir câmera</button>
          <button class="perfil-bio-btn primary" id="btnGestorSalvarFace" type="button">Iniciar cadastro guiado</button>
          <button class="perfil-bio-btn danger" id="btnGestorPararCamera" type="button">Parar câmera</button>
          <button class="perfil-bio-btn secondary" id="btnGestorFinalizarFace" type="button">Finalizar depois</button>
        </div>

        <div class="perfil-bio-feedback" id="gestorFaceFeedback">
          Conferindo servidor de biometria.
        </div>
      </div>
    `
  });

  configurarCadastroFaceGestor(usuario);
}

async function configurarCadastroFaceGestor(usuario) {
  const video = document.getElementById("gestorFaceVideo");
  const canvas = document.getElementById("gestorFaceCanvas");
  const stage = document.getElementById("gestorFaceStage");
  const feedback = document.getElementById("gestorFaceFeedback");
  const btnAbrir = document.getElementById("btnGestorAbrirCamera");
  const btnSalvar = document.getElementById("btnGestorSalvarFace");
  const btnParar = document.getElementById("btnGestorPararCamera");
  const btnFinalizar = document.getElementById("btnGestorFinalizarFace");
  const guiaContainer = document.getElementById("gestorFaceGuia");

  if (!video || !canvas || !stage || !feedback || !btnAbrir || !btnSalvar || !btnParar || !btnFinalizar) {
    return;
  }

  const painelGuia = prepararPainelCadastroFacialGuiado(guiaContainer);
  let cadastroSalvo = false;

  const cadastroGuiado = criarCadastroFacialGuiado({
    videoElement: video,
    canvasElement: canvas,
    aoAtualizar(estadoGuia) {
      painelGuia.atualizar(estadoGuia);
      btnSalvar.textContent = estadoGuia.textoBotao;
      btnSalvar.disabled = Boolean(estadoGuia.processando);

      if (estadoGuia.tipo === "validando") {
        stage.classList.add("is-scanning");
        feedback.textContent = estadoGuia.mensagem;
        feedback.className = "perfil-bio-feedback loading";
      } else if (estadoGuia.tipo === "rejeitada" || estadoGuia.tipo === "erro") {
        stage.classList.remove("is-scanning");
        feedback.textContent = estadoGuia.mensagem;
        feedback.className = "perfil-bio-feedback error";
      } else if (estadoGuia.tipo === "aceita") {
        stage.classList.remove("is-scanning");
        feedback.textContent = estadoGuia.mensagem;
        feedback.className = "perfil-bio-feedback success";
      } else if (estadoGuia.tipo === "pronta") {
        feedback.textContent = estadoGuia.mensagem;
        feedback.className = "perfil-bio-feedback loading";
      }
    }
  });

  btnAbrir.disabled = true;
  btnSalvar.disabled = true;
  btnParar.disabled = true;

  try {
    const servidor = await verificarServidorBiometria();

    if (!servidor?.sucesso) {
      throw new Error(servidor?.mensagem || "Servidor de biometria offline.");
    }

    feedback.textContent = "Servidor ativo. Abra a câmera e inicie o cadastro guiado.";
    feedback.className = "perfil-bio-feedback success";

    btnAbrir.disabled = false;
    btnSalvar.disabled = false;
    btnParar.disabled = false;
  } catch (error) {
    console.error(error);
    feedback.textContent = error.message || "Servidor de biometria offline. Inicie o Python primeiro.";
    feedback.className = "perfil-bio-feedback error";
    return;
  }

  btnAbrir.addEventListener("click", async () => {
    try {
      feedback.textContent = "Abrindo câmera...";
      feedback.className = "perfil-bio-feedback loading";

      await iniciarCameraBiometria(video);
      stage.classList.add("is-camera-on");
      stage.classList.remove("is-approved");

      feedback.textContent = "Câmera aberta. Inicie o cadastro guiado.";
      feedback.className = "perfil-bio-feedback success";
    } catch (error) {
      console.error(error);
      feedback.textContent = error.message || "Erro ao abrir câmera.";
      feedback.className = "perfil-bio-feedback error";
    }
  });

  btnSalvar.addEventListener("click", async () => {
    try {
      const perfil = String(usuario?.perfil ?? "aluno").toLowerCase();
      const pessoaId = resolverPessoaIdGestor(usuario, perfil);

      if (!pessoaId) {
        throw new Error("Não foi possível identificar o usuário para salvar a face.");
      }

      const cameraVinculada = Boolean(
        video.srcObject?.getVideoTracks?.().some(track => track.readyState === "live")
      );

      if (!cameraEstaAtiva() || !cameraVinculada) {
        await iniciarCameraBiometria(video);
        stage.classList.add("is-camera-on");
      }

      if (cadastroSalvo || cadastroGuiado.obterEstado().concluido) {
        cadastroSalvo = false;
        stage.classList.remove("is-approved");
        cadastroGuiado.reiniciar();
        return;
      }

      if (!cadastroGuiado.obterEstado().ativo) {
        cadastroGuiado.iniciar();
        return;
      }

      const captura = await cadastroGuiado.capturarAtual();

      if (!captura?.aceita || !captura?.concluido) {
        return;
      }

      btnSalvar.disabled = true;
      feedback.textContent = "Salvando e vinculando as cinco amostras faciais...";
      feedback.className = "perfil-bio-feedback loading";

      const resultado = await cadastrarFacePython({
        perfil,
        pessoaId,
        usuarioId: usuario.id,
        alunoId: perfil === "aluno" ? (usuario.alunoId ?? usuario.idAluno ?? null) : null,
        pessoaNome: usuario.nome || "Usuário",
        imagensBase64: captura.imagensBase64,
        modoGuiado: true,
        etapasCadastro: captura.etapasCadastro
      });

      // O cadastro só é considerado concluído visualmente depois que o
      // próprio fluxo de consulta confirma que as 5 amostras já estão no MySQL.
      feedback.textContent = "Cadastro enviado. Confirmando as 5 amostras no banco...";
      feedback.className = "perfil-bio-feedback loading";

      let statusBanco = null;

      for (let tentativa = 1; tentativa <= 8; tentativa += 1) {
        statusBanco = await consultarFacePython({
          perfil,
          pessoaId,
          usuarioId: usuario.id,
          alunoId: perfil === "aluno" ? (usuario.alunoId ?? usuario.idAluno ?? null) : null
        });

        if (statusBanco?.cadastrada && Number(statusBanco?.quantidadeAmostras || 0) >= 5) {
          break;
        }

        if (tentativa < 8) {
          await aguardarCadastroFaceGestor(500);
        }
      }

      if (!statusBanco?.cadastrada || Number(statusBanco?.quantidadeAmostras || 0) < 5) {
        throw new Error(
          "O servidor recebeu o cadastro, mas ainda não confirmou as 5 amostras no banco. Tente novamente em alguns segundos."
        );
      }

      cadastroSalvo = true;
      stage.classList.remove("is-scanning");
      stage.classList.add("is-approved");

      feedback.textContent = resultado?.mensagem || "Face cadastrada com 5 amostras no banco.";
      feedback.className = "perfil-bio-feedback success";
      btnSalvar.textContent = "Cadastro concluído";
      btnSalvar.disabled = true;

      // Fecha automaticamente somente depois da confirmação no banco.
      pararCameraBiometria(video);
      await aguardarCadastroFaceGestor(850);
      fecharModal();
      await carregarUsuarios();
    } catch (error) {
      console.error(error);
      stage.classList.remove("is-scanning");
      feedback.textContent = error.message || "Erro ao cadastrar rosto.";
      feedback.className = "perfil-bio-feedback error";
      btnSalvar.disabled = false;
    }
  });

  btnParar.addEventListener("click", () => {
    pararCameraBiometria(video);
    stage.classList.remove("is-camera-on", "is-scanning");
    feedback.textContent = "Câmera encerrada. As amostras aceitas continuam na etapa atual.";
    feedback.className = "perfil-bio-feedback";
  });

  btnFinalizar.addEventListener("click", async () => {
    pararCameraBiometria(video);
    fecharModal();
    await carregarUsuarios();
  });
}

function resolverPessoaIdGestor(usuario) {
  // Identificador biométrico oficial: usuarios.id.
  return usuario?.usuarioId ?? usuario?.id ?? null;
}

function aguardarCadastroFaceGestor(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}


function aplicarBuscaPendenteNotificacaoGestor() {
  const nome = sessionStorage.getItem("gestorUsuarioBuscaPendente");
  if (!nome) return;

  const input = document.getElementById("buscaAlunoGestor") || document.getElementById("buscaEquipeGestor");
  if (!input) return;

  sessionStorage.removeItem("gestorUsuarioBuscaPendente");
  input.value = nome;
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.focus();
}
