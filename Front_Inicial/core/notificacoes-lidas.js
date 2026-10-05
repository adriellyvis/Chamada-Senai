const LIMITE_ASSINATURAS = 300;

function obterUsuarioId() {
  try {
    const usuario = JSON.parse((sessionStorage.getItem("usuario") || localStorage.getItem("usuario")));
    return usuario?.id ?? usuario?.usuarioId ?? "anonimo";
  } catch {
    return "anonimo";
  }
}

function chaveStorage(perfil) {
  return `eyecount:${String(perfil || "usuario").toLowerCase()}:${obterUsuarioId()}:notificacoes-lidas`;
}

function carregarLista(perfil) {
  try {
    const valor = JSON.parse(localStorage.getItem(chaveStorage(perfil)) || "[]");
    return Array.isArray(valor) ? valor.map(String).filter(Boolean) : [];
  } catch {
    return [];
  }
}

function salvarLista(perfil, lista) {
  const normalizada = [...new Set((lista || []).map(String).filter(Boolean))];
  const limitada = normalizada.slice(-LIMITE_ASSINATURAS);
  localStorage.setItem(chaveStorage(perfil), JSON.stringify(limitada));
}

export function notificacaoEstaLida(perfil, assinatura) {
  if (!assinatura) return false;
  return new Set(carregarLista(perfil)).has(String(assinatura));
}

export function marcarNotificacaoComoLida(perfil, assinatura) {
  if (!assinatura) return;
  const lista = carregarLista(perfil);
  lista.push(String(assinatura));
  salvarLista(perfil, lista);
}

export function marcarNotificacoesComoLidas(perfil, assinaturas = []) {
  const lista = carregarLista(perfil);
  assinaturas.forEach(assinatura => {
    if (assinatura) lista.push(String(assinatura));
  });
  salvarLista(perfil, lista);
}

export function contarNaoLidas(itens = []) {
  return (itens || []).filter(item => !item?.lida).length;
}
