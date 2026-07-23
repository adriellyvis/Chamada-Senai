export const AVISOS_ALUNO = [
  {
    id: "renovacao-matricula",
    tipo: "secretaria",
    tag: "Secretaria",
    data: "27 ABR",
    titulo: "Renovação de matrícula",
    texto: "A renovação de matrícula estará disponível até sexta-feira. Procure a secretaria em caso de dúvidas.",
    prioridade: "normal"
  },
  {
    id: "palestra-inteligencia-artificial",
    tipo: "coordenacao",
    tag: "Coordenação",
    data: "25 ABR",
    titulo: "Palestra de Inteligência Artificial",
    texto: "Hoje às 19h haverá palestra no auditório principal sobre IA aplicada à educação e tecnologia.",
    prioridade: "normal"
  },
  {
    id: "atencao-frequencia",
    tipo: "frequencia",
    tag: "Frequência",
    data: "24 ABR",
    titulo: "Atenção à frequência",
    texto: "Acompanhe seus registros para evitar inconsistências nas chamadas e ficar acima do mínimo exigido.",
    prioridade: "importante"
  },
  {
    id: "atividade-pdm",
    tipo: "professor",
    tag: "Professor",
    data: "23 ABR",
    titulo: "Entrega da atividade de PDM",
    texto: "A atividade prática deverá ser entregue até sexta-feira às 23h59 pela plataforma indicada em aula.",
    prioridade: "normal"
  },
  {
    id: "validacao-biometrica",
    tipo: "coordenacao",
    tag: "Coordenação",
    data: "22 ABR",
    titulo: "Validação biométrica facial",
    texto: "O módulo de chamada facial será usado para confirmar presenças durante chamadas abertas pelo professor.",
    prioridade: "importante"
  }
];

function obterUsuarioId() {
  try {
    return JSON.parse(localStorage.getItem("usuario"))?.id ?? "anonimo";
  } catch {
    return "anonimo";
  }
}

function chaveLeitura() {
  return `eyecount:aluno:${obterUsuarioId()}:avisos-lidos`;
}

export function obterAvisosLidos() {
  try {
    const valor = JSON.parse(localStorage.getItem(chaveLeitura()));
    return new Set(Array.isArray(valor) ? valor.map(String) : []);
  } catch {
    return new Set();
  }
}

export function avisoEstaLido(id) {
  return obterAvisosLidos().has(String(id));
}

export function marcarAvisoComoLido(id) {
  const lidos = obterAvisosLidos();
  lidos.add(String(id));
  localStorage.setItem(chaveLeitura(), JSON.stringify([...lidos]));
  emitirAtualizacaoAvisos();
}

export function marcarTodosAvisosComoLidos() {
  localStorage.setItem(
    chaveLeitura(),
    JSON.stringify(AVISOS_ALUNO.map(aviso => String(aviso.id)))
  );
  emitirAtualizacaoAvisos();
}

export function obterAvisosComEstado() {
  const lidos = obterAvisosLidos();
  return AVISOS_ALUNO.map(aviso => ({
    ...aviso,
    lido: lidos.has(String(aviso.id))
  }));
}

export function contarAvisosNaoLidos() {
  return obterAvisosComEstado().filter(aviso => !aviso.lido).length;
}

export function emitirAtualizacaoAvisos() {
  window.dispatchEvent(new CustomEvent("avisos-aluno-atualizados"));
}
