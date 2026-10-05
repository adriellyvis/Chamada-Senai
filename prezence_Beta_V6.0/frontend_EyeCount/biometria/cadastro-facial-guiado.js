import {
  capturarImagemBiometria,
  cameraEstaAtiva
} from "./camera-biometria.js";

import {
  validarAmostraFacePython
} from "./biometria-api.js";

export const ETAPAS_CADASTRO_FACIAL = Object.freeze([
  {
    codigo: "frente",
    titulo: "Olhe para frente",
    instrucao: "Mantenha o rosto centralizado, expressão neutra e os olhos visíveis.",
    detalhe: "A primeira amostra será a referência principal do cadastro."
  },
  {
    codigo: "esquerda",
    titulo: "Vire levemente para a esquerda",
    instrucao: "Gire apenas um pouco o rosto, aproximadamente de 15° a 25°.",
    detalhe: "Não vire de perfil completo e continue olhando para a câmera."
  },
  {
    codigo: "direita",
    titulo: "Vire levemente para a direita",
    instrucao: "Gire apenas um pouco o rosto, aproximadamente de 15° a 25°.",
    detalhe: "Mantenha olhos, nariz e boca visíveis."
  },
  {
    codigo: "distancia",
    titulo: "Aproxime um pouco o rosto",
    instrucao: "Chegue um pouco mais perto da câmera sem cortar o rosto.",
    detalhe: "Essa variação ajuda quando a pessoa estiver em outra distância na chamada."
  },
  {
    codigo: "oculos",
    titulo: "Varie o uso dos óculos",
    instrucao: "Se estiver de óculos, retire-os. Se costuma usar e está sem eles, coloque-os.",
    detalhe: "Caso não use óculos, mantenha-se de frente com uma pequena mudança de expressão."
  }
]);

export function prepararPainelCadastroFacialGuiado(container) {
  if (!container) {
    return {
      atualizar: () => {},
      ocultar: () => {},
      mostrar: () => {}
    };
  }

  container.innerHTML = `
    <section class="perfil-bio-guide" data-cadastro-facial-guia hidden aria-live="polite">
      <div class="perfil-bio-guide__header">
        <div>
          <span class="perfil-bio-guide__contador" data-guia-contador>Etapa 1 de 5</span>
          <strong data-guia-titulo>Olhe para frente</strong>
        </div>
        <span class="perfil-bio-guide__estado" data-guia-estado>Preparar</span>
      </div>

      <p class="perfil-bio-guide__instrucao" data-guia-instrucao></p>
      <small class="perfil-bio-guide__detalhe" data-guia-detalhe></small>

      <div class="perfil-bio-guide__progress" aria-hidden="true">
        <span data-guia-barra></span>
      </div>

      <div class="perfil-bio-guide__steps" data-guia-passos aria-label="Progresso do cadastro facial"></div>
    </section>
  `;

  const raiz = container.querySelector("[data-cadastro-facial-guia]");
  const contador = container.querySelector("[data-guia-contador]");
  const titulo = container.querySelector("[data-guia-titulo]");
  const estado = container.querySelector("[data-guia-estado]");
  const instrucao = container.querySelector("[data-guia-instrucao]");
  const detalhe = container.querySelector("[data-guia-detalhe]");
  const barra = container.querySelector("[data-guia-barra]");
  const passos = container.querySelector("[data-guia-passos]");

  passos.innerHTML = ETAPAS_CADASTRO_FACIAL.map((_, indice) => `
    <span data-guia-passo="${indice}" aria-label="Amostra ${indice + 1}">${indice + 1}</span>
  `).join("");

  const atualizar = ({
    indice = 0,
    concluidas = 0,
    tipo = "pronta",
    etapa = ETAPAS_CADASTRO_FACIAL[0],
    mensagem = null
  } = {}) => {
    if (!raiz) return;

    const total = ETAPAS_CADASTRO_FACIAL.length;
    const indiceSeguro = Math.min(Math.max(Number(indice) || 0, 0), total - 1);
    const concluidasSeguras = Math.min(Math.max(Number(concluidas) || 0, 0), total);
    const etapaAtual = etapa || ETAPAS_CADASTRO_FACIAL[indiceSeguro];
    const finalizado = tipo === "concluida";

    raiz.hidden = false;
    raiz.dataset.estado = tipo;

    contador.textContent = finalizado
      ? `${total} de ${total} amostras concluídas`
      : `Etapa ${indiceSeguro + 1} de ${total}`;

    titulo.textContent = finalizado
      ? "Cadastro pronto para salvar"
      : etapaAtual.titulo;

    instrucao.textContent = mensagem || (
      finalizado
        ? "As cinco amostras foram validadas e serão vinculadas a esta pessoa."
        : etapaAtual.instrucao
    );

    detalhe.textContent = finalizado
      ? "Não feche a página enquanto o servidor salva as imagens."
      : etapaAtual.detalhe;

    estado.textContent = obterRotuloEstado(tipo);
    barra.style.width = `${(concluidasSeguras / total) * 100}%`;

    passos.querySelectorAll("[data-guia-passo]").forEach((passo, passoIndice) => {
      passo.classList.toggle("is-done", passoIndice < concluidasSeguras);
      passo.classList.toggle("is-current", !finalizado && passoIndice === indiceSeguro);
      passo.classList.toggle("is-error", tipo === "rejeitada" && passoIndice === indiceSeguro);
    });
  };

  return {
    atualizar,
    ocultar() {
      if (raiz) raiz.hidden = true;
    },
    mostrar() {
      if (raiz) raiz.hidden = false;
    }
  };
}

export function criarCadastroFacialGuiado({
  videoElement,
  canvasElement,
  aoAtualizar = null
}) {
  let indiceAtual = 0;
  let amostras = [];
  let ativo = false;
  let processando = false;
  let concluido = false;

  const emitir = (tipo, dadosExtras = {}) => {
    const etapa = ETAPAS_CADASTRO_FACIAL[Math.min(indiceAtual, ETAPAS_CADASTRO_FACIAL.length - 1)];
    const estado = {
      tipo,
      indice: indiceAtual,
      total: ETAPAS_CADASTRO_FACIAL.length,
      concluidas: amostras.length,
      etapa,
      ativo,
      processando,
      concluido,
      textoBotao: obterTextoBotaoCadastro({ indiceAtual, ativo, processando, concluido }),
      ...dadosExtras
    };

    if (typeof aoAtualizar === "function") {
      aoAtualizar(estado);
    }

    return estado;
  };

  const iniciar = () => {
    indiceAtual = 0;
    amostras = [];
    ativo = true;
    processando = false;
    concluido = false;

    return emitir("pronta", {
      mensagem: ETAPAS_CADASTRO_FACIAL[0].instrucao
    });
  };

  const reiniciar = () => iniciar();

  const capturarAtual = async () => {
    if (processando) {
      return {
        aceita: false,
        concluido: false,
        mensagem: "A amostra atual ainda está sendo analisada."
      };
    }

    if (!ativo || concluido) {
      iniciar();

      return {
        aceita: false,
        iniciou: true,
        concluido: false,
        mensagem: "Cadastro guiado iniciado. Siga a primeira instrução."
      };
    }

    if (!cameraEstaAtiva()) {
      throw new Error("A câmera precisa estar aberta para capturar a amostra.");
    }

    const etapa = ETAPAS_CADASTRO_FACIAL[indiceAtual];
    processando = true;
    emitir("validando", {
      mensagem: "Analisando enquadramento, iluminação e nitidez..."
    });

    try {
      const imagemBase64 = capturarImagemBiometria(videoElement, canvasElement);
      const validacao = await validarAmostraFacePython({
        imagemBase64,
        etapa: etapa.codigo,
        indice: indiceAtual + 1
      });

      if (!validacao?.valida) {
        processando = false;
        emitir("rejeitada", {
          mensagem: validacao?.mensagem || "A amostra não atingiu a qualidade mínima.",
          validacao
        });

        return {
          aceita: false,
          concluido: false,
          mensagem: validacao?.mensagem,
          validacao,
          etapa
        };
      }

      amostras.push({
        imagemBase64,
        etapa: etapa.codigo,
        qualidade: validacao?.diagnostico || null
      });

      indiceAtual += 1;
      processando = false;

      if (indiceAtual >= ETAPAS_CADASTRO_FACIAL.length) {
        ativo = false;
        concluido = true;

        emitir("concluida", {
          indice: ETAPAS_CADASTRO_FACIAL.length - 1,
          etapa: ETAPAS_CADASTRO_FACIAL[ETAPAS_CADASTRO_FACIAL.length - 1],
          mensagem: "As cinco amostras foram aceitas. Salvando o cadastro facial..."
        });

        return {
          aceita: true,
          concluido: true,
          imagensBase64: amostras.map(item => item.imagemBase64),
          etapasCadastro: amostras.map(item => item.etapa),
          diagnosticos: amostras.map(item => item.qualidade)
        };
      }

      const proximaEtapa = ETAPAS_CADASTRO_FACIAL[indiceAtual];

      emitir("aceita", {
        etapa: proximaEtapa,
        mensagem: `Amostra ${amostras.length} aceita. Agora: ${proximaEtapa.instrucao}`
      });

      return {
        aceita: true,
        concluido: false,
        etapa: proximaEtapa,
        mensagem: `Amostra ${amostras.length} aceita.`
      };
    } catch (erro) {
      processando = false;
      emitir("erro", {
        mensagem: erro.message || "Não foi possível validar a amostra."
      });
      throw erro;
    }
  };

  return {
    iniciar,
    reiniciar,
    capturarAtual,
    obterEstado() {
      return {
        indice: indiceAtual,
        total: ETAPAS_CADASTRO_FACIAL.length,
        concluidas: amostras.length,
        ativo,
        processando,
        concluido,
        etapa: ETAPAS_CADASTRO_FACIAL[Math.min(indiceAtual, ETAPAS_CADASTRO_FACIAL.length - 1)],
        textoBotao: obterTextoBotaoCadastro({ indiceAtual, ativo, processando, concluido })
      };
    }
  };
}

function obterTextoBotaoCadastro({ indiceAtual, ativo, processando, concluido }) {
  if (processando) return "Validando amostra...";
  if (concluido) return "Cadastrar novamente";
  if (!ativo) return "Iniciar cadastro guiado";
  return `Capturar amostra ${indiceAtual + 1}/5`;
}

function obterRotuloEstado(tipo) {
  const rotulos = {
    pronta: "Posicionar",
    validando: "Validando",
    rejeitada: "Tente novamente",
    aceita: "Amostra aceita",
    concluida: "Concluído",
    erro: "Erro"
  };

  return rotulos[tipo] || "Preparar";
}
