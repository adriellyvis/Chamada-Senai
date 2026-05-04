const turmaSelect = document.getElementById("turmaSelect");
const btnAbrirChamada = document.getElementById("btnAbrirChamada");
const statusAula = document.getElementById("statusAula");
const listaAlunos = document.getElementById("listaAlunos");

const btnVoltar = document.getElementById("btnVoltar");

btnVoltar.addEventListener("click", () => {
  window.location.href = "/professor/historico-professor.html";
});

let aulaAtualId = null;
let turmaSelecionadaId = null;

// pega usuário logado
const usuario = JSON.parse(localStorage.getItem("usuario"));
const btnEncerrarChamada = document.getElementById("btnEncerrarChamada");

if (!usuario) {
  alert("Usuário não encontrado. Faça login novamente.");
  window.location.href = "/professor/area-login-professor.html";
}

// carrega turmas ao abrir página
window.addEventListener("DOMContentLoaded", async () => {
  await carregarTurmas();
  await verificarRetomada();
});

async function verificarRetomada() {
  const aulaRetomarId = localStorage.getItem("aulaRetomarId");

  if (!aulaRetomarId) return;

  try {
    aulaAtualId = Number(aulaRetomarId);

    const response = await fetch(`http://localhost:8080/professor/aula/${aulaAtualId}/alunos`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "usuario-id": usuario.id
      }
    });

    if (!response.ok) {
      throw new Error("Erro ao retomar chamada");
    }

    const alunos = await response.json();
    renderizarAlunos(alunos);

    statusAula.textContent = `Chamada em andamento - Aula #${aulaAtualId}`;
    btnAbrirChamada.disabled = true;
    turmaSelect.disabled = true;


  } catch (err) {
    console.error(err);
    alert("Erro ao retomar chamada");
  }
}

async function carregarTurmas() {
  try {
    const response = await fetch(`http://localhost:8080/professor/turmas/${usuario.id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "usuario-id": usuario.id
      }
    });

    if (!response.ok) {
      const erro = await response.text();
      throw new Error(erro);
    }

    const turmas = await response.json();

    turmaSelect.innerHTML = '<option value="">Selecione uma turma</option>';

    turmas.forEach(td => {
      turmaSelect.innerHTML += `
        <option value="${td.id}">
          ${td.turma.nome} - ${td.disciplina.nome}
        </option>
      `;
    });

  } catch (err) {
    console.error(err);
    alert("Erro ao carregar turmas: " + err.message);
  }
}

// ao selecionar turma, carregar alunos
turmaSelect.addEventListener("change", async () => {
  if (aulaAtualId) return;
  turmaSelecionadaId = Number(turmaSelect.value);
  listaAlunos.innerHTML = "";
  statusAula.textContent = "";
  aulaAtualId = null;

  if (!turmaSelecionadaId) return;

  try {
  const response = await fetch(`http://localhost:8080/professor/turma-disciplina/${turmaSelecionadaId}/alunos`, {
  method: "GET",
  headers: {
    "Content-Type": "application/json",
    "usuario-id": usuario.id
  }
});    if (!response.ok) {
      throw new Error("Erro ao carregar alunos");
    }

    const alunos = await response.json();

    renderizarAlunos(alunos);

  } catch (err) {
    console.error(err);
    alert("Erro ao carregar alunos");
  }
});

// abrir chamada
btnAbrirChamada.addEventListener("click", async () => {
  if (!turmaSelecionadaId) {
    alert("Selecione uma turma primeiro");
    return;
  }

  try {
    const response = await fetch(
      `http://localhost:8080/professor/abrir?turmaDisciplinaId=${turmaSelecionadaId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "usuario-id": usuario.id
        }
      }
    );

    if (!response.ok) {
      throw new Error("Erro ao abrir chamada");
    }

    const aula = await response.json();
    aulaAtualId = aula.id;
    localStorage.setItem("aulaRetomarId", aula.id);

    const alunosResponse = await fetch(`http://localhost:8080/professor/aula/${aulaAtualId}/alunos`, {
  method: "GET",
  headers: {
    "Content-Type": "application/json",
    "usuario-id": usuario.id
  }
});

    if (!alunosResponse.ok) {
  throw new Error("Erro ao carregar alunos da chamada");
}

    const alunos = await alunosResponse.json();
    renderizarAlunos(alunos);

    statusAula.textContent = `Chamada em andamento - Aula #${aula.id}`;
    btnAbrirChamada.disabled = true;
    turmaSelect.disabled = true;

  } catch (err) {
    console.error(err);
    alert("Erro ao abrir chamada");
  }
});

// renderiza alunos
function renderizarAlunos(alunos) {
  listaAlunos.innerHTML = "";

  const desabilitado = !aulaAtualId ? "disabled" : "";

  alunos.forEach(aluno => {
    const card = document.createElement("div");
    card.classList.add("aluno-card");

    card.innerHTML = `
      <span>${aluno.nome}</span>
      <button ${desabilitado} class="${aluno.status === 'presente' ? 'ativo' : ''}" 
              onclick="marcarPresenca(${aluno.alunoId}, 'presente', this)">
        Presente
      </button>
      <button ${desabilitado} class="${aluno.status === 'ausente' ? 'ativo' : ''}" 
              onclick="marcarPresenca(${aluno.alunoId}, 'ausente', this)">
        Ausente
      </button>
      <button ${desabilitado} class="${aluno.status === 'atrasado' ? 'ativo' : ''}" 
              onclick="marcarPresenca(${aluno.alunoId}, 'atrasado', this)">
        Atrasado
      </button>
    `;

    listaAlunos.appendChild(card);
  });
}

// registrar presença
async function marcarPresenca(alunoId, status, botao) {
  if (!aulaAtualId) {
    alert("Abra a chamada antes de marcar presença");
    return;
  }

  try {
    const response = await fetch("http://localhost:8080/professor/presenca", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "usuario-id": usuario.id
  },
  body: JSON.stringify({
    alunoId: alunoId,
    aulaId: aulaAtualId,
    status: status,
    metodo: "manual"
  })
});

    if (!response.ok) {
      throw new Error("Erro ao registrar presença");
    }
    const botoes = botao.parentElement.querySelectorAll("button");
botoes.forEach(btn => btn.classList.remove("ativo"));
botao.classList.add("ativo");

  } catch (err) {
    console.error(err);
    alert("Erro ao registrar presença");
  }
}

btnEncerrarChamada.addEventListener("click", async () => {
  if (!aulaAtualId) {
    alert("Nenhuma chamada em andamento");
    return;
  }

  try {
    const response = await fetch(`http://localhost:8080/professor/aula/encerrar/${aulaAtualId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "usuario-id": usuario.id
      }
    });

    if (!response.ok) {
      throw new Error("Erro ao encerrar chamada");
    }

    const aula = await response.json();

    statusAula.textContent = `Chamada encerrada - Aula #${aula.id}`;
    aulaAtualId = null;

    localStorage.removeItem("aulaRetomarId");

    btnAbrirChamada.disabled = false;
    turmaSelect.disabled = false;

    turmaSelecionadaId = null;
    turmaSelect.value = "";

    listaAlunos.innerHTML = "";

    alert("Chamada encerrada com sucesso");


  } catch (err) {
    console.error(err);
    
    alert("Erro ao encerrar chamada");
  }
});