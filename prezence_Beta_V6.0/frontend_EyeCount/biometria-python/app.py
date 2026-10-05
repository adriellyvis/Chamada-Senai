from flask import Flask, request, jsonify
from flask_cors import CORS
import base64
import binascii
import cv2
import hmac
import json
import math
import numpy as np
import os
import traceback
from urllib import request as urllib_request
from urllib import error as urllib_error

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SPRING_API_URL = os.environ.get(
    "EYECOUNT_API_URL",
    "http://127.0.0.1:8080"
).rstrip("/")

# Chave interna usada somente na comunicação Spring -> Python.
# Mantida fora do JavaScript do navegador.
BIOMETRIA_SERVICE_KEY = "lhSgA8hVcdtfxuRq123KvZ4EaZFTVLn0mJUl88xMQ5BIj8Lri39JfobWdVTXYUut"

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 24 * 1024 * 1024
CORS(app)


PERFIS_PERMITIDOS = {"aluno", "professor", "gestor", "usuario"}

# Cadastro com várias amostras reduz falsos positivos e melhora a variação
# de iluminação e pequenos movimentos do rosto.
QUANTIDADE_AMOSTRAS_CADASTRO = 5
MINIMO_AMOSTRAS_CADASTRO = 3
QUANTIDADE_AMOSTRAS_VERIFICACAO = 3

# Prova de vida ativa. O usuário começa centralizado e depois cumpre
# um desafio aleatório antes do reconhecimento facial.
QUANTIDADE_AMOSTRAS_LIVENESS = 3
LIVENESS_DESLOCAMENTO_X_MINIMO = 0.055
LIVENESS_APROXIMACAO_MINIMA = 0.16
LIVENESS_AFASTAMENTO_MINIMO = 0.14

# No LBPH, valores menores representam maior semelhança.
LIMITE_CONFIANCA_LBPH = 62.0

# Segundo verificador independente, baseado em textura local e contornos.
# Quanto menor o score, maior a semelhança. A margem exige separação
# suficiente entre a identidade esperada e a segunda identidade mais próxima.
LIMITE_SCORE_DESCRITOR = 0.250
MARGEM_MINIMA_IDENTIDADE = 0.020

# Cadastro: as 5 amostras precisam formar um conjunto coerente.
LIMITE_COERENCIA_AMOSTRA = 0.380
LIMITE_COERENCIA_MAIORIA = 0.330

# Impede que o mesmo rosto seja cadastrado para outra pessoa.
# Mantido mais rígido que o reconhecimento normal para evitar
# bloquear pessoas diferentes que sejam apenas parecidas.
LIMITE_SCORE_CADASTRO_DUPLICADO = 0.240

# Validação de qualidade usada antes de aceitar cada etapa do cadastro guiado.
LUMINOSIDADE_MINIMA = 35.0
LUMINOSIDADE_MAXIMA = 225.0
NITIDEZ_MINIMA = 45.0
CONTRASTE_MINIMO = 18.0
PROPORCAO_MINIMA_ROSTO = 0.055
PROPORCAO_MAXIMA_ROSTO = 0.72
DESVIO_CENTRO_MAXIMO_X = 0.30
DESVIO_CENTRO_MAXIMO_Y = 0.32

# Na verificação de presença podem existir outras pessoas ao fundo. O aluno
# só é aceito quando aparece como a face principal: suficientemente grande,
# próxima do centro e sem outra face igualmente dominante no enquadramento.
PROPORCAO_MINIMA_ROSTO_PRINCIPAL = 0.045
PROPORCAO_MINIMA_ROSTO_SECUNDARIO = 0.018
DESVIO_CENTRO_MAXIMO_PRINCIPAL_X = 0.30
DESVIO_CENTRO_MAXIMO_PRINCIPAL_Y = 0.34
MARGEM_MINIMA_SCORE_FACE_PRINCIPAL = 0.15
RELACAO_AREA_FACE_AMBIGUA = 0.55

ARQUIVO_CLASSIFICADOR_LOCAL = os.path.join(
    BASE_DIR,
    "haarcascade_frontalface_default.xml"
)

ARQUIVO_CLASSIFICADOR_PACOTE = os.path.join(
    getattr(cv2.data, "haarcascades", ""),
    "haarcascade_frontalface_default.xml"
)

CAMINHO_CLASSIFICADOR = None
detector_rosto = cv2.CascadeClassifier()

for caminho_classificador in (
    ARQUIVO_CLASSIFICADOR_LOCAL,
    ARQUIVO_CLASSIFICADOR_PACOTE
):
    if not caminho_classificador or not os.path.isfile(caminho_classificador):
        continue

    detector_teste = cv2.CascadeClassifier(caminho_classificador)

    if not detector_teste.empty():
        detector_rosto = detector_teste
        CAMINHO_CLASSIFICADOR = caminho_classificador
        break

if detector_rosto.empty():
    print(
        "ERRO: nenhum classificador facial válido foi encontrado. ",
        "Esperado em:",
        ARQUIVO_CLASSIFICADOR_LOCAL
    )

HOG = cv2.HOGDescriptor(
    (128, 128),
    (16, 16),
    (8, 8),
    (8, 8),
    9
)


def resposta_erro_interno(mensagem, erro):
    print(mensagem, erro)
    traceback.print_exc()

    return jsonify({
        "sucesso": False,
        "mensagem": f"{mensagem} {erro}",
        "tipoErro": type(erro).__name__
    }), 500



def converter_base64_para_imagem(imagem_base64):
    if not isinstance(imagem_base64, str) or not imagem_base64.strip():
        raise ValueError("Imagem Base64 vazia ou inválida.")

    conteudo = imagem_base64.strip()

    if "," in conteudo:
        cabecalho, conteudo = conteudo.split(",", 1)

        if "base64" not in cabecalho.lower():
            raise ValueError("Formato da imagem não é Base64.")

    conteudo = "".join(conteudo.split())

    if not conteudo:
        raise ValueError("Imagem Base64 sem conteúdo.")

    try:
        imagem_bytes = base64.b64decode(conteudo, validate=True)
    except (binascii.Error, ValueError) as erro:
        raise ValueError("Imagem Base64 corrompida.") from erro

    if not imagem_bytes:
        raise ValueError("A imagem enviada está vazia.")

    imagem_array = np.frombuffer(imagem_bytes, np.uint8)
    imagem = cv2.imdecode(imagem_array, cv2.IMREAD_COLOR)

    if imagem is None or imagem.size == 0:
        raise ValueError("Não foi possível decodificar a imagem enviada.")

    return imagem


def obter_imagens_base64(dados):
    imagens = dados.get("imagensBase64")

    if isinstance(imagens, list):
        imagens_validas = [
            item for item in imagens
            if isinstance(item, str) and item.strip()
        ]

        if imagens_validas:
            return imagens_validas

    imagem_unica = dados.get("imagemBase64")

    if isinstance(imagem_unica, str) and imagem_unica.strip():
        return [imagem_unica]

    return []


def detectar_rostos(imagem):
    if imagem is None:
        return None, None, []

    if detector_rosto.empty():
        raise RuntimeError("O classificador facial do OpenCV não foi carregado.")

    imagem_cinza_original = cv2.cvtColor(imagem, cv2.COLOR_BGR2GRAY)
    imagem_cinza_equalizada = cv2.equalizeHist(imagem_cinza_original)

    rostos = detector_rosto.detectMultiScale(
        imagem_cinza_equalizada,
        scaleFactor=1.1,
        minNeighbors=6,
        minSize=(90, 90)
    )

    return imagem_cinza_original, imagem_cinza_equalizada, rostos


def recortar_rosto_processado(imagem_cinza_equalizada, caixa_rosto):
    x, y, w, h = [int(valor) for valor in caixa_rosto]
    margem_x = int(w * 0.16)
    margem_y = int(h * 0.18)

    inicio_x = max(0, x - margem_x)
    inicio_y = max(0, y - margem_y)
    fim_x = min(imagem_cinza_equalizada.shape[1], x + w + margem_x)
    fim_y = min(imagem_cinza_equalizada.shape[0], y + h + margem_y)

    rosto = imagem_cinza_equalizada[inicio_y:fim_y, inicio_x:fim_x]

    if rosto.size == 0:
        raise ValueError("A região do rosto detectado ficou vazia.")

    rosto = cv2.resize(rosto, (200, 200), interpolation=cv2.INTER_AREA)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    return clahe.apply(rosto)


def extrair_rosto(imagem):
    _, imagem_cinza_equalizada, rostos = detectar_rostos(imagem)
    quantidade = len(rostos)

    if quantidade != 1:
        return None, quantidade

    return recortar_rosto_processado(
        imagem_cinza_equalizada,
        rostos[0]
    ), quantidade


def analisar_caixa_rosto(caixa_rosto, largura_imagem, altura_imagem, indice):
    x, y, w, h = [int(valor) for valor in caixa_rosto]
    area_imagem = float(max(1, largura_imagem * altura_imagem))
    proporcao_rosto = float((w * h) / area_imagem)
    centro_x = float((x + (w / 2)) / max(1, largura_imagem))
    centro_y = float((y + (h / 2)) / max(1, altura_imagem))
    desvio_x = abs(centro_x - 0.5)
    desvio_y = abs(centro_y - 0.5)

    distancia_centro = math.sqrt(
        ((desvio_x / 0.5) ** 2)
        + ((desvio_y / 0.5) ** 2)
    ) / math.sqrt(2.0)
    score_centralidade = max(0.0, 1.0 - min(1.0, distancia_centro))
    score_tamanho = min(1.0, proporcao_rosto / 0.18)

    # O tamanho recebe um peso um pouco maior para impedir que uma pessoa
    # pequena, ao fundo, seja escolhida apenas por estar exatamente no centro.
    score_principal = (
        0.58 * score_tamanho
        + 0.42 * score_centralidade
    )

    elegivel_principal = (
        proporcao_rosto >= PROPORCAO_MINIMA_ROSTO_PRINCIPAL
        and desvio_x <= DESVIO_CENTRO_MAXIMO_PRINCIPAL_X
        and desvio_y <= DESVIO_CENTRO_MAXIMO_PRINCIPAL_Y
    )

    return {
        "indice": int(indice),
        "caixa": [x, y, w, h],
        "largura": w,
        "altura": h,
        "proporcaoRosto": round(proporcao_rosto, 4),
        "centroX": round(centro_x, 4),
        "centroY": round(centro_y, 4),
        "desvioCentroX": round(desvio_x, 4),
        "desvioCentroY": round(desvio_y, 4),
        "scoreCentralidade": round(score_centralidade, 4),
        "scoreTamanho": round(score_tamanho, 4),
        "scorePrincipal": round(score_principal, 4),
        "elegivelPrincipal": bool(elegivel_principal)
    }


def selecionar_rosto_principal(imagem):
    _, imagem_cinza_equalizada, rostos = detectar_rostos(imagem)
    altura_imagem, largura_imagem = imagem_cinza_equalizada.shape[:2]

    diagnosticos = [
        analisar_caixa_rosto(
            caixa_rosto,
            largura_imagem,
            altura_imagem,
            indice
        )
        for indice, caixa_rosto in enumerate(rostos)
    ]
    diagnosticos.sort(
        key=lambda item: item["scorePrincipal"],
        reverse=True
    )

    analise = {
        "quantidadeRostos": len(diagnosticos),
        "faces": diagnosticos,
        "facePrincipal": None,
        "facePrincipalValida": False,
        "ambigua": False,
        "facesIgnoradas": max(0, len(diagnosticos) - 1),
        "mensagem": "Nenhum rosto foi detectado."
    }

    if not diagnosticos:
        return analise, imagem_cinza_equalizada, None

    principal = diagnosticos[0]
    analise["facePrincipal"] = principal

    if not principal["elegivelPrincipal"]:
        proporcao = float(principal["proporcaoRosto"])

        if proporcao < PROPORCAO_MINIMA_ROSTO_PRINCIPAL:
            analise["mensagem"] = (
                "O rosto principal está pequeno. Aproxime-se e fique no centro da câmera."
            )
        else:
            analise["mensagem"] = (
                "Posicione o rosto principal mais perto do centro da câmera."
            )

        return analise, imagem_cinza_equalizada, None

    elegiveis = [
        item for item in diagnosticos
        if item["elegivelPrincipal"]
    ]

    if len(elegiveis) > 1:
        segunda = elegiveis[1]
        diferenca_score = (
            float(principal["scorePrincipal"])
            - float(segunda["scorePrincipal"])
        )
        relacao_area = (
            float(segunda["proporcaoRosto"])
            / max(float(principal["proporcaoRosto"]), 1e-8)
        )

        if (
            diferenca_score < MARGEM_MINIMA_SCORE_FACE_PRINCIPAL
            and relacao_area >= RELACAO_AREA_FACE_AMBIGUA
        ):
            analise["ambigua"] = True
            analise["mensagem"] = (
                "Há duas pessoas muito próximas da câmera. "
                "Deixe o aluno claramente à frente e no centro."
            )
            return analise, imagem_cinza_equalizada, None

    rosto_principal = recortar_rosto_processado(
        imagem_cinza_equalizada,
        principal["caixa"]
    )

    analise["facePrincipalValida"] = True
    analise["mensagem"] = (
        "Face principal selecionada."
        if len(diagnosticos) == 1
        else "Face principal selecionada; pessoas ao fundo serão ignoradas."
    )

    return analise, imagem_cinza_equalizada, rosto_principal


def avaliar_qualidade_amostra(imagem, etapa="frente"):
    imagem_cinza, imagem_cinza_equalizada, rostos = detectar_rostos(imagem)
    quantidade = len(rostos)

    diagnostico = {
        "etapa": str(etapa or "frente"),
        "quantidadeRostos": quantidade,
        "valida": False
    }

    if quantidade == 0:
        return False, "Nenhum rosto foi detectado. Centralize o rosto e aproxime-se um pouco.", diagnostico, None

    if quantidade > 1:
        return False, "Mais de um rosto foi detectado. Deixe apenas uma pessoa no enquadramento.", diagnostico, None

    x, y, w, h = [int(valor) for valor in rostos[0]]
    altura_imagem, largura_imagem = imagem_cinza.shape[:2]
    area_imagem = float(max(1, altura_imagem * largura_imagem))
    proporcao_rosto = float((w * h) / area_imagem)
    centro_x = float((x + (w / 2)) / max(1, largura_imagem))
    centro_y = float((y + (h / 2)) / max(1, altura_imagem))
    desvio_x = abs(centro_x - 0.5)
    desvio_y = abs(centro_y - 0.5)

    regiao_rosto = imagem_cinza[y:y + h, x:x + w]

    if regiao_rosto.size == 0:
        return False, "A região do rosto ficou vazia. Tente novamente.", diagnostico, None

    luminosidade = float(np.mean(regiao_rosto))
    contraste = float(np.std(regiao_rosto))
    nitidez = float(cv2.Laplacian(regiao_rosto, cv2.CV_64F).var())

    diagnostico.update({
        "larguraImagem": largura_imagem,
        "alturaImagem": altura_imagem,
        "larguraRosto": w,
        "alturaRosto": h,
        "proporcaoRosto": round(proporcao_rosto, 4),
        "centroX": round(centro_x, 4),
        "centroY": round(centro_y, 4),
        "desvioCentroX": round(desvio_x, 4),
        "desvioCentroY": round(desvio_y, 4),
        "luminosidade": round(luminosidade, 2),
        "contraste": round(contraste, 2),
        "nitidez": round(nitidez, 2)
    })

    if proporcao_rosto < PROPORCAO_MINIMA_ROSTO:
        return False, "O rosto está pequeno no enquadramento. Aproxime-se um pouco da câmera.", diagnostico, None

    if proporcao_rosto > PROPORCAO_MAXIMA_ROSTO:
        return False, "O rosto está muito próximo. Afaste-se um pouco para não cortar a face.", diagnostico, None

    if desvio_x > DESVIO_CENTRO_MAXIMO_X or desvio_y > DESVIO_CENTRO_MAXIMO_Y:
        return False, "Centralize melhor o rosto dentro da câmera.", diagnostico, None

    if luminosidade < LUMINOSIDADE_MINIMA:
        return False, "A imagem está escura. Procure uma iluminação de frente para o rosto.", diagnostico, None

    if luminosidade > LUMINOSIDADE_MAXIMA:
        return False, "A imagem está clara demais. Evite luz forte diretamente na câmera.", diagnostico, None

    if contraste < CONTRASTE_MINIMO:
        return False, "O rosto está com pouco contraste. Melhore a iluminação e evite contraluz.", diagnostico, None

    if nitidez < NITIDEZ_MINIMA:
        return False, "A imagem ficou borrada. Pare o movimento e capture novamente.", diagnostico, None

    rosto_processado = recortar_rosto_processado(
        imagem_cinza_equalizada,
        rostos[0]
    )

    diagnostico["valida"] = True
    return True, "Amostra válida.", diagnostico, rosto_processado


def normalizar_perfil(perfil):
    perfil_normalizado = str(perfil or "aluno").strip().lower()

    if perfil_normalizado not in PERFIS_PERMITIDOS:
        return "usuario"

    return perfil_normalizado


def normalizar_id(pessoa_id):
    if pessoa_id is None:
        return None

    valor = str(pessoa_id).strip()

    if not valor or valor.lower() in {"null", "none", "undefined"}:
        return None

    return valor


def chave_face(perfil, pessoa_id):
    return f"{normalizar_perfil(perfil)}_{normalizar_id(pessoa_id)}"



def obter_ids_candidatos(dados):
    """Retorna somente a identidade biométrica oficial baseada em usuarios.id."""
    perfil = normalizar_perfil(dados.get("perfil", "aluno"))
    usuario_id = normalizar_id(dados.get("usuarioId"))

    if not usuario_id:
        return []

    return [(perfil, usuario_id)]


def obter_id_principal(dados):
    candidatos = obter_ids_candidatos(dados)

    if candidatos:
        return candidatos[0]

    return None, None



class ErroAutorizacao(Exception):
    def __init__(self, mensagem, status=401):
        super().__init__(mensagem)
        self.status = int(status)


def obter_token_bearer_requisicao():
    autorizacao = str(
        request.headers.get("Authorization") or ""
    ).strip()

    if not autorizacao.lower().startswith("bearer "):
        raise ErroAutorizacao(
            "Token JWT não informado.",
            401
        )

    token = autorizacao[7:].strip()

    if not token:
        raise ErroAutorizacao(
            "Token JWT não informado.",
            401
        )

    return token


def resposta_erro_autorizacao(erro):
    return jsonify({
        "sucesso": False,
        "mensagem": str(erro)
    }), erro.status


def validar_chave_servico_requisicao():
    """Valida chamadas internas feitas pelo backend Spring."""
    if not BIOMETRIA_SERVICE_KEY:
        raise RuntimeError(
            "BIOMETRIA_SERVICE_KEY não foi configurada no servidor Python."
        )

    chave_recebida = str(
        request.headers.get("X-Prezence-Service-Key") or ""
    ).strip()

    if not chave_recebida:
        raise ErroAutorizacao(
            "Chave interna do serviço biométrico não informada.",
            401
        )

    if not hmac.compare_digest(
        chave_recebida,
        BIOMETRIA_SERVICE_KEY
    ):
        raise ErroAutorizacao(
            "Chave interna do serviço biométrico inválida.",
            403
        )


def carregar_identidades_mysql(token_jwt=None):
    """Busca as identidades faciais ativas no Spring/MySQL.

    Nos fluxos autenticados, encaminha o JWT do usuário.
    Na recuperação de senha, usa somente a chave interna de serviço.
    """
    resposta = chamar_spring(
        "GET",
        "/biometria/identidades",
        token_jwt
    )

    if not isinstance(resposta, list):
        return {}

    identidades = {}

    for item in resposta:
        if not isinstance(item, dict):
            continue

        usuario_id = normalizar_id(item.get("usuarioId"))
        perfil = normalizar_perfil(item.get("perfil", "usuario"))
        amostras = item.get("amostras")

        if not usuario_id or not isinstance(amostras, list):
            continue

        amostras_base64 = []

        for amostra in sorted(
            amostras,
            key=lambda valor: int(valor.get("ordemAmostra") or 0)
            if isinstance(valor, dict)
            else 0
        ):
            if not isinstance(amostra, dict):
                continue

            imagem_base64 = amostra.get("imagemBase64")

            if isinstance(imagem_base64, str) and imagem_base64.strip():
                amostras_base64.append(imagem_base64.strip())

        if not amostras_base64:
            continue

        chave = chave_face(perfil, usuario_id)
        identidades[chave] = {
            "chave": chave,
            "perfil": perfil,
            # No banco, o identificador biométrico oficial é o usuarioId.
            "pessoaId": usuario_id,
            "usuarioId": usuario_id,
            "pessoaNome": item.get("nome") or "Usuário",
            "amostrasBase64": amostras_base64,
            "origem": "mysql"
        }

    return identidades



def carregar_identidades(token_jwt):
    """Carrega as identidades faciais exclusivamente do Spring/MySQL usando JWT."""
    if not token_jwt:
        raise ErroAutorizacao(
            "Token JWT não informado.",
            401
        )

    return carregar_identidades_mysql(token_jwt)


def preparar_rosto_descritor(rosto):
    preparado = cv2.resize(rosto, (128, 128), interpolation=cv2.INTER_AREA)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    return clahe.apply(preparado)


def descritor_lbp_grade(rosto, grade=8):
    imagem = preparar_rosto_descritor(rosto)
    centro = imagem[1:-1, 1:-1]

    vizinhos = (
        imagem[:-2, :-2],
        imagem[:-2, 1:-1],
        imagem[:-2, 2:],
        imagem[1:-1, 2:],
        imagem[2:, 2:],
        imagem[2:, 1:-1],
        imagem[2:, :-2],
        imagem[1:-1, :-2]
    )

    lbp = np.zeros_like(centro, dtype=np.uint8)

    for indice_vizinho, vizinho in enumerate(vizinhos):
        lbp |= (
            (vizinho >= centro).astype(np.uint8)
            << indice_vizinho
        )

    altura, largura = lbp.shape
    descritores = []

    for linha in range(grade):
        inicio_y = linha * altura // grade
        fim_y = (linha + 1) * altura // grade

        for coluna in range(grade):
            inicio_x = coluna * largura // grade
            fim_x = (coluna + 1) * largura // grade
            bloco = lbp[inicio_y:fim_y, inicio_x:fim_x]

            histograma = np.bincount(
                bloco.ravel(),
                minlength=256
            ).astype(np.float32)

            soma = float(histograma.sum())

            if soma > 0:
                histograma /= soma

            descritores.append(histograma)

    return np.concatenate(descritores)


def descritor_hog(rosto):
    imagem = preparar_rosto_descritor(rosto)
    descritor = HOG.compute(imagem).reshape(-1).astype(np.float32)
    norma = float(np.linalg.norm(descritor))

    if norma > 0:
        descritor /= norma

    return descritor


def distancia_chi_quadrado(descritor_a, descritor_b, grade=8):
    denominador = descritor_a + descritor_b + 1e-8
    distancia = 0.5 * np.sum(
        ((descritor_a - descritor_b) ** 2) / denominador
    )

    return float(distancia / (grade * grade))


def similaridade_cosseno(descritor_a, descritor_b):
    denominador = (
        float(np.linalg.norm(descritor_a))
        * float(np.linalg.norm(descritor_b))
    )

    if denominador <= 1e-8:
        return 0.0

    return float(np.dot(descritor_a, descritor_b) / denominador)



def carregar_amostras_identidade(identidade):
    """Converte para OpenCV as amostras Base64 recebidas do MySQL."""
    amostras = []

    for imagem_base64 in identidade.get("amostrasBase64", []):
        if not isinstance(imagem_base64, str) or not imagem_base64.strip():
            continue

        try:
            conteudo = imagem_base64.strip()

            if "," in conteudo:
                conteudo = conteudo.split(",", 1)[1]

            imagem_bytes = base64.b64decode(conteudo, validate=True)
            imagem_array = np.frombuffer(imagem_bytes, np.uint8)
            imagem = cv2.imdecode(imagem_array, cv2.IMREAD_GRAYSCALE)

            if imagem is None or imagem.size == 0:
                continue

            imagem = cv2.resize(
                imagem,
                (200, 200),
                interpolation=cv2.INTER_AREA
            )
            amostras.append(imagem)
        except (binascii.Error, ValueError, cv2.error):
            continue

    return amostras


def calcular_score_entre_rostos(rosto_a, rosto_b):
    """Compara dois recortes faciais usando o mesmo descritor do reconhecimento."""
    lbp_a = descritor_lbp_grade(rosto_a)
    hog_a = descritor_hog(rosto_a)

    lbp_b = descritor_lbp_grade(rosto_b)
    hog_b = descritor_hog(rosto_b)

    distancia_lbp = distancia_chi_quadrado(
        lbp_a,
        lbp_b
    )

    similaridade_hog = similaridade_cosseno(
        hog_a,
        hog_b
    )

    return float(
        0.65 * distancia_lbp
        + 0.35 * (1.0 - similaridade_hog)
    )


def validar_coerencia_amostras_cadastro(rostos):
    """Confere se as amostras do cadastro formam um conjunto facial coerente."""
    quantidade = len(rostos)

    if quantidade < 3:
        return True, {
            "valida": True,
            "motivo": "Poucas amostras para comparação interna."
        }

    medias_vizinhos = []

    for indice, rosto_atual in enumerate(rostos):
        scores = []

        for outro_indice, outro_rosto in enumerate(rostos):
            if indice == outro_indice:
                continue

            scores.append(
                calcular_score_entre_rostos(
                    rosto_atual,
                    outro_rosto
                )
            )

        scores.sort()

        # Usa as duas amostras mais próximas para tolerar pequenas variações
        # de pose, distância e uso de óculos sem aceitar um conjunto misturado.
        melhores = scores[:min(2, len(scores))]
        media_melhores = float(np.mean(melhores))

        medias_vizinhos.append({
            "amostra": indice + 1,
            "scoreCoerencia": round(media_melhores, 4)
        })

    quantidade_coerentes = sum(
        1
        for item in medias_vizinhos
        if item["scoreCoerencia"] <= LIMITE_COERENCIA_MAIORIA
    )

    pior_score = max(
        item["scoreCoerencia"]
        for item in medias_vizinhos
    )

    minimo_coerentes = max(3, quantidade - 1)

    valida = (
        quantidade_coerentes >= minimo_coerentes
        and pior_score <= LIMITE_COERENCIA_AMOSTRA
    )

    return valida, {
        "valida": valida,
        "quantidadeCoerentes": quantidade_coerentes,
        "minimoCoerentes": minimo_coerentes,
        "piorScore": round(pior_score, 4),
        "amostras": medias_vizinhos
    }


def calcular_score_rosto_identidade(rosto_teste, identidade):
    """Retorna o score médio do rosto contra as melhores amostras da identidade."""
    amostras = carregar_amostras_identidade(identidade)

    if not amostras:
        return None

    scores = [
        calcular_score_entre_rostos(
            rosto_teste,
            amostra
        )
        for amostra in amostras
    ]

    scores.sort()
    melhores = scores[:min(3, len(scores))]

    return float(np.mean(melhores))


def procurar_cadastro_facial_duplicado(
    rostos_novos,
    perfil,
    pessoa_id,
    usuario_id=None,
    token_jwt=None
):
    """Bloqueia um rosto que já esteja fortemente associado a outro cadastro."""
    identidades = carregar_identidades(token_jwt)
    chave_atual = chave_face(perfil, pessoa_id)
    chave_usuario_atual = (
        chave_face(perfil, usuario_id)
        if normalizar_id(usuario_id)
        else None
    )
    usuario_id_atual = normalizar_id(usuario_id)
    melhor_candidato = None

    for chave, identidade in identidades.items():
        # O próprio usuário pode refazer o cadastro facial.
        identidade_usuario_id = normalizar_id(
            identidade.get("usuarioId")
        )

        if (
            chave == chave_atual
            or (chave_usuario_atual and chave == chave_usuario_atual)
            or (
                usuario_id_atual
                and identidade_usuario_id == usuario_id_atual
            )
        ):
            continue

        scores = []

        for rosto in rostos_novos:
            score = calcular_score_rosto_identidade(
                rosto,
                identidade
            )

            if score is not None:
                scores.append(score)

        if not scores:
            continue

        votos_fortes = sum(
            1
            for score in scores
            if score <= LIMITE_SCORE_CADASTRO_DUPLICADO
        )

        media = float(np.mean(scores))

        candidato = {
            "chave": chave,
            "votos": votos_fortes,
            "media": media
        }

        if (
            melhor_candidato is None
            or candidato["votos"] > melhor_candidato["votos"]
            or (
                candidato["votos"] == melhor_candidato["votos"]
                and candidato["media"] < melhor_candidato["media"]
            )
        ):
            melhor_candidato = candidato

    if melhor_candidato is None:
        return False, None

    votos_necessarios = max(
        2,
        math.ceil(len(rostos_novos) * 0.6)
    )

    duplicado = (
        melhor_candidato["votos"] >= votos_necessarios
    )

    return duplicado, {
        "votos": melhor_candidato["votos"],
        "votosNecessarios": votos_necessarios,
        "scoreMedio": round(melhor_candidato["media"], 4)
    }

def preparar_contexto_classificacao(identidades):
    if not hasattr(cv2, "face"):
        raise RuntimeError(
            "O módulo cv2.face não está disponível. Instale opencv-contrib-python e remova opencv-python."
        )

    chaves = sorted(identidades.keys())
    imagens_treinamento = []
    labels_treinamento = []
    chave_por_label = {}
    descritores_por_chave = {}

    for label, chave in enumerate(chaves):
        identidade = identidades[chave]
        amostras = carregar_amostras_identidade(identidade)

        if not amostras:
            continue

        chave_por_label[label] = chave
        descritores_por_chave[chave] = []

        for amostra in amostras:
            imagens_treinamento.append(amostra)
            labels_treinamento.append(label)
            descritores_por_chave[chave].append({
                "lbp": descritor_lbp_grade(amostra),
                "hog": descritor_hog(amostra)
            })

    if not imagens_treinamento:
        raise ValueError("Nenhuma amostra facial válida foi encontrada.")

    reconhecedor = cv2.face.LBPHFaceRecognizer_create()
    reconhecedor.train(
        imagens_treinamento,
        np.array(labels_treinamento, dtype=np.int32)
    )

    return {
        "reconhecedor": reconhecedor,
        "chavePorLabel": chave_por_label,
        "descritoresPorChave": descritores_por_chave,
        "quantidadeIdentidades": len(descritores_por_chave)
    }


def classificar_rosto(rosto_teste, identidades, contexto=None):
    contexto = contexto or preparar_contexto_classificacao(identidades)
    reconhecedor = contexto["reconhecedor"]
    chave_por_label = contexto["chavePorLabel"]
    descritores_por_chave = contexto["descritoresPorChave"]

    label_previsto, confianca_lbph = reconhecedor.predict(rosto_teste)
    chave_lbph = chave_por_label.get(int(label_previsto))

    lbp_teste = descritor_lbp_grade(rosto_teste)
    hog_teste = descritor_hog(rosto_teste)
    resultados_descritor = []

    for chave, descritores_amostras in descritores_por_chave.items():
        comparacoes = []

        for descritores in descritores_amostras:
            distancia_lbp = distancia_chi_quadrado(
                lbp_teste,
                descritores["lbp"]
            )
            similaridade_hog = similaridade_cosseno(
                hog_teste,
                descritores["hog"]
            )

            score = (
                0.65 * distancia_lbp
                + 0.35 * (1.0 - similaridade_hog)
            )

            comparacoes.append({
                "score": float(score),
                "distanciaLbp": float(distancia_lbp),
                "similaridadeHog": float(similaridade_hog)
            })

        comparacoes.sort(key=lambda item: item["score"])
        melhores = comparacoes[:min(3, len(comparacoes))]

        score_identidade = float(np.mean([
            item["score"] for item in melhores
        ]))

        resultados_descritor.append({
            "chave": chave,
            "score": score_identidade,
            "distanciaLbp": float(np.mean([
                item["distanciaLbp"] for item in melhores
            ])),
            "similaridadeHog": float(np.mean([
                item["similaridadeHog"] for item in melhores
            ]))
        })

    resultados_descritor.sort(key=lambda item: item["score"])
    melhor_descritor = resultados_descritor[0]
    segundo_descritor = (
        resultados_descritor[1]
        if len(resultados_descritor) > 1
        else None
    )

    margem = (
        segundo_descritor["score"] - melhor_descritor["score"]
        if segundo_descritor
        else None
    )

    return {
        "chaveLbph": chave_lbph,
        "confiancaLbph": float(confianca_lbph),
        "chaveDescritor": melhor_descritor["chave"],
        "scoreDescritor": melhor_descritor["score"],
        "distanciaLbp": melhor_descritor["distanciaLbp"],
        "similaridadeHog": melhor_descritor["similaridadeHog"],
        "margem": margem,
        "quantidadeIdentidades": contexto["quantidadeIdentidades"]
    }


def verificar_resultado_classificacao(classificacao, chaves_esperadas):
    identidade_lbph_correta = (
        classificacao["chaveLbph"] in chaves_esperadas
    )
    identidade_descritor_correta = (
        classificacao["chaveDescritor"] in chaves_esperadas
    )
    confianca_valida = (
        classificacao["confiancaLbph"] <= LIMITE_CONFIANCA_LBPH
    )
    score_valido = (
        classificacao["scoreDescritor"] <= LIMITE_SCORE_DESCRITOR
    )

    margem = classificacao.get("margem")
    margem_valida = (
        margem is None
        or margem >= MARGEM_MINIMA_IDENTIDADE
    )

    return (
        identidade_lbph_correta
        and identidade_descritor_correta
        and confianca_valida
        and score_valido
        and margem_valida
    )



def analisar_liveness_geometrico(desafio, geometrias):
    """Valida o movimento solicitado usando posição/tamanho da face principal."""
    desafio = str(desafio or "").strip().upper()

    if len(geometrias) < QUANTIDADE_AMOSTRAS_LIVENESS:
        return False, {
            "desafio": desafio,
            "mensagem": "A prova de vida precisa de três amostras válidas."
        }

    inicial = geometrias[0]
    posteriores = geometrias[1:]

    centro_inicial = float(inicial["centroX"])
    area_inicial = max(float(inicial["proporcaoRosto"]), 1e-8)

    centros_posteriores = [
        float(item["centroX"])
        for item in posteriores
    ]
    areas_posteriores = [
        float(item["proporcaoRosto"])
        for item in posteriores
    ]

    deslocamento_horizontal = max(
        abs(centro - centro_inicial)
        for centro in centros_posteriores
    )

    maior_area = max(areas_posteriores)
    menor_area = min(areas_posteriores)

    aumento_area = (
        (maior_area - area_inicial)
        / area_inicial
    )
    reducao_area = (
        (area_inicial - menor_area)
        / area_inicial
    )

    diagnostico = {
        "desafio": desafio,
        "centroInicial": round(centro_inicial, 4),
        "centrosDesafio": [round(valor, 4) for valor in centros_posteriores],
        "areaInicial": round(area_inicial, 4),
        "areasDesafio": [round(valor, 4) for valor in areas_posteriores],
        "deslocamentoHorizontal": round(deslocamento_horizontal, 4),
        "aumentoArea": round(aumento_area, 4),
        "reducaoArea": round(reducao_area, 4)
    }

    if desafio == "MOVER_LADO":
        valido = deslocamento_horizontal >= LIVENESS_DESLOCAMENTO_X_MINIMO
        diagnostico["limite"] = LIVENESS_DESLOCAMENTO_X_MINIMO
        diagnostico["mensagem"] = (
            "Movimento lateral confirmado."
            if valido
            else "O movimento lateral foi pequeno. Desloque claramente o rosto para um dos lados."
        )
        return valido, diagnostico

    if desafio == "APROXIMAR":
        valido = aumento_area >= LIVENESS_APROXIMACAO_MINIMA
        diagnostico["limite"] = LIVENESS_APROXIMACAO_MINIMA
        diagnostico["mensagem"] = (
            "Aproximação confirmada."
            if valido
            else "Aproxime mais o rosto da câmera para concluir a prova de vida."
        )
        return valido, diagnostico

    if desafio == "AFASTAR":
        valido = reducao_area >= LIVENESS_AFASTAMENTO_MINIMO
        diagnostico["limite"] = LIVENESS_AFASTAMENTO_MINIMO
        diagnostico["mensagem"] = (
            "Afastamento confirmado."
            if valido
            else "Afaste mais o rosto da câmera para concluir a prova de vida."
        )
        return valido, diagnostico

    return False, {
        **diagnostico,
        "mensagem": "Desafio de prova de vida inválido."
    }


def validar_liveness_e_identidade(dados, token_jwt):
    """Executa prova de vida básica e garante que o rosto em movimento é o usuário esperado."""
    imagens_base64 = obter_imagens_base64(dados)
    desafio = str(dados.get("desafio") or "").strip().upper()
    usuario_id = normalizar_id(dados.get("usuarioId"))
    perfil = normalizar_perfil(dados.get("perfil", "aluno"))

    if not usuario_id:
        raise ValueError("usuarioId é obrigatório para a prova de vida.")

    if desafio not in {"MOVER_LADO", "APROXIMAR", "AFASTAR"}:
        raise ValueError("Desafio de prova de vida inválido.")

    if len(imagens_base64) != QUANTIDADE_AMOSTRAS_LIVENESS:
        raise ValueError(
            f"A prova de vida exige exatamente {QUANTIDADE_AMOSTRAS_LIVENESS} amostras."
        )

    identidades = carregar_identidades(token_jwt)
    chave_esperada = chave_face(perfil, usuario_id)

    if chave_esperada not in identidades:
        raise ValueError("Usuário ainda não possui biometria facial cadastrada.")

    contexto = preparar_contexto_classificacao(identidades)
    chaves_esperadas = {chave_esperada}
    geometrias = []
    classificacoes = []

    for indice, imagem_base64 in enumerate(imagens_base64, start=1):
        imagem = converter_base64_para_imagem(imagem_base64)
        analise, _, rosto_principal = selecionar_rosto_principal(imagem)

        if analise["quantidadeRostos"] == 0:
            raise ValueError(
                f"Prova de vida, amostra {indice}: nenhum rosto foi detectado."
            )

        if analise["ambigua"]:
            raise ValueError(
                "Há duas pessoas muito próximas durante a prova de vida. "
                "Deixe o aluno claramente à frente."
            )

        if not analise["facePrincipalValida"] or rosto_principal is None:
            raise ValueError(
                f"Prova de vida, amostra {indice}: {analise['mensagem']}"
            )

        principal = analise["facePrincipal"]
        geometrias.append({
            "centroX": float(principal["centroX"]),
            "centroY": float(principal["centroY"]),
            "proporcaoRosto": float(principal["proporcaoRosto"])
        })

        classificacao = classificar_rosto(
            rosto_principal,
            identidades,
            contexto
        )
        classificacao["aceito"] = verificar_resultado_classificacao(
            classificacao,
            chaves_esperadas
        )
        classificacao["amostra"] = indice
        classificacoes.append(classificacao)

    votos_identidade = sum(
        1 for item in classificacoes
        if item["aceito"]
    )
    votos_necessarios = 2
    identidade_valida = votos_identidade >= votos_necessarios

    movimento_valido, diagnostico_movimento = analisar_liveness_geometrico(
        desafio,
        geometrias
    )

    valido = identidade_valida and movimento_valido

    if not identidade_valida:
        mensagem = (
            "A prova de vida detectou movimento, mas o rosto não corresponde "
            "ao usuário cadastrado."
        )
    elif not movimento_valido:
        mensagem = diagnostico_movimento.get(
            "mensagem",
            "O movimento solicitado não foi confirmado."
        )
    else:
        mensagem = "Prova de vida concluída com sucesso."

    return {
        "sucesso": True,
        "valido": valido,
        "desafio": desafio,
        "identidadeValida": identidade_valida,
        "movimentoValido": movimento_valido,
        "votosIdentidade": votos_identidade,
        "votosNecessarios": votos_necessarios,
        "mensagem": mensagem,
        "diagnosticoMovimento": diagnostico_movimento
    }


def procurar_identidade_esperada_em_faces(
    imagem_cinza_equalizada,
    diagnosticos_faces,
    identidades,
    chaves_esperadas,
    contexto_classificacao,
    indices_ignorados=None
):
    indices_ignorados = set(indices_ignorados or [])

    for diagnostico in diagnosticos_faces:
        indice = diagnostico.get("indice")

        if indice in indices_ignorados:
            continue

        if (
            float(diagnostico.get("proporcaoRosto", 0.0))
            < PROPORCAO_MINIMA_ROSTO_SECUNDARIO
        ):
            continue

        try:
            rosto = recortar_rosto_processado(
                imagem_cinza_equalizada,
                diagnostico["caixa"]
            )
            classificacao = classificar_rosto(
                rosto,
                identidades,
                contexto_classificacao
            )

            if verificar_resultado_classificacao(
                classificacao,
                chaves_esperadas
            ):
                return True, diagnostico, classificacao
        except (ValueError, cv2.error):
            continue

    return False, None, None


@app.route("/status", methods=["GET"])
def status():
    return jsonify({
        "sucesso": True,
        "mensagem": "Servidor de biometria ativo.",
        "armazenamentoBiometrico": "mysql",
        "opencv": cv2.__version__,
        "opencvContrib": hasattr(cv2, "face"),
        "detectorCarregado": not detector_rosto.empty(),
        "classificadorFacial": CAMINHO_CLASSIFICADOR,
        "amostrasCadastro": QUANTIDADE_AMOSTRAS_CADASTRO,
        "amostrasVerificacao": QUANTIDADE_AMOSTRAS_VERIFICACAO,
        "provaDeVida": {
            "ativa": True,
            "tipo": "desafio_ativo_basico",
            "amostras": QUANTIDADE_AMOSTRAS_LIVENESS,
            "desafios": ["MOVER_LADO", "APROXIMAR", "AFASTAR"]
        },
        "limiteConfiancaLbph": LIMITE_CONFIANCA_LBPH,
        "limiteScoreDescritor": LIMITE_SCORE_DESCRITOR,
        "qualidadeCadastro": {
            "luminosidadeMinima": LUMINOSIDADE_MINIMA,
            "luminosidadeMaxima": LUMINOSIDADE_MAXIMA,
            "nitidezMinima": NITIDEZ_MINIMA,
            "contrasteMinimo": CONTRASTE_MINIMO,
            "proporcaoMinimaRosto": PROPORCAO_MINIMA_ROSTO
        },
        "verificacaoMultiplasFaces": {
            "ativa": True,
            "regra": "A identidade esperada precisa ser a face principal.",
            "proporcaoMinimaRostoPrincipal": PROPORCAO_MINIMA_ROSTO_PRINCIPAL,
            "desvioCentroMaximoX": DESVIO_CENTRO_MAXIMO_PRINCIPAL_X,
            "desvioCentroMaximoY": DESVIO_CENTRO_MAXIMO_PRINCIPAL_Y,
            "votosNecessariosEmTresAmostras": 2
        }
    })


@app.route("/validar-liveness", methods=["POST"])
def validar_liveness():
    try:
        dados = request.get_json(silent=True) or {}

        if not dados:
            return jsonify({
                "sucesso": False,
                "valido": False,
                "mensagem": "Dados da prova de vida não enviados."
            }), 400

        token_jwt = obter_token_bearer_requisicao()

        return jsonify(
            validar_liveness_e_identidade(
                dados,
                token_jwt
            )
        )
    except ErroAutorizacao as erro:
        return resposta_erro_autorizacao(erro)
    except ValueError as erro:
        return jsonify({
            "sucesso": False,
            "valido": False,
            "mensagem": str(erro)
        }), 400
    except Exception as erro:
        resposta, status_http = resposta_erro_interno(
            "Erro interno na prova de vida:",
            erro
        )
        return resposta, status_http


@app.route("/reconhecer-face", methods=["POST"])
def reconhecer_face():
    try:
        dados = request.get_json(silent=True) or {}
        imagens_base64 = obter_imagens_base64(dados)

        if not imagens_base64:
            return jsonify({
                "sucesso": False,
                "mensagem": "Imagem não enviada."
            }), 400

        imagem = converter_base64_para_imagem(imagens_base64[0])
        analise, _, _ = selecionar_rosto_principal(imagem)
        quantidade = analise["quantidadeRostos"]

        return jsonify({
            "sucesso": True,
            "rostoDetectado": quantidade >= 1,
            "quantidadeRostos": quantidade,
            "facePrincipalValida": analise["facePrincipalValida"],
            "ambigua": analise["ambigua"],
            "facesIgnoradas": analise["facesIgnoradas"],
            "mensagem": analise["mensagem"]
        })
    except ValueError as erro:
        return jsonify({
            "sucesso": False,
            "mensagem": str(erro)
        }), 400
    except Exception as erro:
        return resposta_erro_interno("Erro interno ao processar imagem:", erro)



def converter_rosto_para_base64(rosto):
    if rosto is None or rosto.size == 0:
        raise ValueError("Amostra facial vazia.")

    sucesso, buffer = cv2.imencode(
        ".jpg",
        rosto,
        [int(cv2.IMWRITE_JPEG_QUALITY), 92]
    )

    if not sucesso:
        raise ValueError(
            "Não foi possível converter a amostra facial para JPEG."
        )

    return base64.b64encode(
        buffer.tobytes()
    ).decode("utf-8")


def chamar_spring(
    metodo,
    endpoint,
    token_jwt=None,
    corpo=None
):
    url = f"{SPRING_API_URL}{endpoint}"

    if not BIOMETRIA_SERVICE_KEY:
        raise RuntimeError(
            "BIOMETRIA_SERVICE_KEY não foi configurada no servidor Python."
        )

    headers = {
        "Accept": "application/json",
        "X-Prezence-Service-Key": BIOMETRIA_SERVICE_KEY
    }

    # Fluxos normais continuam encaminhando o JWT do usuário.
    # A recuperação de senha ainda não possui JWT e usa apenas
    # a credencial interna Spring <-> Python.
    if token_jwt:
        headers["Authorization"] = f"Bearer {token_jwt}"

    dados_bytes = None

    if corpo is not None:
        headers["Content-Type"] = "application/json"

        dados_bytes = json.dumps(
            corpo,
            ensure_ascii=False
        ).encode("utf-8")

    requisicao = urllib_request.Request(
        url=url,
        data=dados_bytes,
        headers=headers,
        method=metodo
    )

    try:
        with urllib_request.urlopen(
            requisicao,
            timeout=15
        ) as resposta:

            conteudo = resposta.read()

            if not conteudo:
                return None

            return json.loads(
                conteudo.decode("utf-8")
            )

    except urllib_error.HTTPError as erro:
        conteudo_erro = erro.read().decode(
            "utf-8",
            errors="replace"
        )

        mensagem = f"Spring retornou HTTP {erro.code}."

        if conteudo_erro:
            try:
                json_erro = json.loads(conteudo_erro)
                mensagem = (
                    json_erro.get("mensagem")
                    or json_erro.get("message")
                    or mensagem
                )
            except json.JSONDecodeError:
                mensagem = conteudo_erro

        if erro.code in (401, 403):
            raise ErroAutorizacao(
                mensagem,
                erro.code
            ) from erro

        raise RuntimeError(
            f"Erro ao comunicar com o backend: {mensagem}"
        ) from erro

    except urllib_error.URLError as erro:
        raise RuntimeError(
            "Backend Spring indisponível na porta 8080."
        ) from erro


def salvar_amostras_no_mysql(
    usuario_id,
    rostos,
    etapas,
    token_jwt
):
    usuario_id = normalizar_id(
        usuario_id
    )

    if not usuario_id:
        raise ValueError(
            "usuarioId é obrigatório para salvar a biometria no banco."
        )

    if len(rostos) != QUANTIDADE_AMOSTRAS_CADASTRO:
        raise ValueError(
            "São necessárias exatamente 5 amostras "
            "para salvar a biometria no banco."
        )

    etapas_padrao = [
        "FRENTE",
        "ESQUERDA",
        "DIREITA",
        "DISTANCIA",
        "VARIACAO"
    ]

    amostras = []

    for indice, rosto in enumerate(
        rostos,
        start=1
    ):
        etapa = (
            etapas[indice - 1]
            if (
                isinstance(etapas, list)
                and indice - 1 < len(etapas)
                and etapas[indice - 1]
            )
            else etapas_padrao[indice - 1]
        )

        amostras.append({
            "ordemAmostra": indice,
            "etapa": str(etapa).upper(),
            "imagemBase64": converter_rosto_para_base64(
                rosto
            )
        })

    corpo = {
        "usuarioId": int(usuario_id),
        "tipo": "face",
        "amostras": amostras
    }

    chamar_spring(
        "POST",
        "/biometria/amostras",
        token_jwt,
        corpo
    )

@app.route("/validar-amostra", methods=["POST"])
def validar_amostra():
    try:
        dados = request.get_json(silent=True) or {}
        imagens_base64 = obter_imagens_base64(dados)

        if not imagens_base64:
            return jsonify({
                "sucesso": False,
                "valida": False,
                "mensagem": "Imagem da amostra não enviada."
            }), 400

        imagem = converter_base64_para_imagem(imagens_base64[0])
        etapa = dados.get("etapa") or "frente"
        valida, mensagem, diagnostico, _ = avaliar_qualidade_amostra(
            imagem,
            etapa
        )

        return jsonify({
            "sucesso": True,
            "valida": valida,
            "etapa": etapa,
            "indice": dados.get("indice"),
            "mensagem": mensagem,
            "diagnostico": diagnostico
        })
    except ValueError as erro:
        return jsonify({
            "sucesso": False,
            "valida": False,
            "mensagem": str(erro)
        }), 400
    except Exception as erro:
        return resposta_erro_interno("Erro interno ao validar amostra:", erro)


@app.route("/face-cadastrada", methods=["POST"])
def face_cadastrada():
    try:
        dados = request.get_json(silent=True) or {}
        usuario_id = normalizar_id(dados.get("usuarioId"))

        if not usuario_id:
            return jsonify({
                "sucesso": False,
                "cadastrada": False,
                "mensagem": "usuarioId é obrigatório para consultar a biometria."
            }), 400

        token_jwt = obter_token_bearer_requisicao()

        status_banco = chamar_spring(
            "GET",
            f"/biometria/amostras/{usuario_id}/status",
            token_jwt
        )

        if not isinstance(status_banco, dict):
            raise RuntimeError(
                "Resposta inválida do backend ao consultar a biometria."
            )

        cadastrada = bool(status_banco.get("cadastrada"))
        perfil = normalizar_perfil(dados.get("perfil", "aluno"))

        return jsonify({
            "sucesso": True,
            "cadastrada": cadastrada,
            "perfil": perfil,
            "pessoaId": usuario_id,
            "usuarioId": usuario_id,
            "origem": "mysql",
            "quantidadeAmostras": (
                QUANTIDADE_AMOSTRAS_CADASTRO if cadastrada else 0
            ),
            "mensagem": (
                "Face cadastrada encontrada no banco."
                if cadastrada
                else "Face ainda não cadastrada no banco."
            )
        })
    except ErroAutorizacao as erro:
        return resposta_erro_autorizacao(erro)
    except RuntimeError as erro:
        return jsonify({
            "sucesso": False,
            "cadastrada": False,
            "mensagem": str(erro)
        }), 503
    except Exception as erro:
        return resposta_erro_interno("Erro interno ao consultar face:", erro)


@app.route("/cadastrar-face", methods=["POST"])
def cadastrar_face():
    try:
        dados = request.get_json(silent=True) or {}

        if not dados:
            return jsonify({
                "sucesso": False,
                "mensagem": "Dados não enviados."
            }), 400

        token_jwt = obter_token_bearer_requisicao()
        imagens_base64 = obter_imagens_base64(dados)
        perfil = normalizar_perfil(dados.get("perfil", "aluno"))
        usuario_id = normalizar_id(dados.get("usuarioId"))

        # A partir da migração para o MySQL, a chave biométrica nunca usa
        # alunos.id/professores.id. Ela usa somente usuarios.id.
        pessoa_id = usuario_id
        pessoa_nome = (
            dados.get("pessoaNome")
            or dados.get("alunoNome")
            or "Usuário"
        )

        if not pessoa_id or not usuario_id or not imagens_base64:
            return jsonify({
                "sucesso": False,
                "mensagem": (
                    "pessoaId, usuarioId e imagens faciais "
                    "são obrigatórios."
                )
            }), 400

        modo_guiado = bool(dados.get("modoGuiado"))
        etapas_cadastro = dados.get("etapasCadastro")

        if not isinstance(etapas_cadastro, list):
            etapas_cadastro = []

        if modo_guiado and len(imagens_base64) != QUANTIDADE_AMOSTRAS_CADASTRO:
            return jsonify({
                "sucesso": False,
                "mensagem": (
                    f"O cadastro guiado exige exatamente {QUANTIDADE_AMOSTRAS_CADASTRO} amostras. "
                    f"Foram recebidas {len(imagens_base64)}."
                )
            }), 400

        rostos_validos = []
        erros_amostras = []
        diagnosticos_amostras = []

        for indice_imagem, imagem_base64 in enumerate(imagens_base64):
            try:
                imagem = converter_base64_para_imagem(imagem_base64)
                etapa = (
                    etapas_cadastro[indice_imagem]
                    if indice_imagem < len(etapas_cadastro)
                    else f"amostra_{indice_imagem + 1}"
                )

                if modo_guiado:
                    valida, mensagem, diagnostico, rosto = avaliar_qualidade_amostra(
                        imagem,
                        etapa
                    )
                    diagnosticos_amostras.append(diagnostico)

                    if not valida:
                        erros_amostras.append(
                            f"Amostra {indice_imagem + 1}: {mensagem}"
                        )
                        continue
                else:
                    rosto, quantidade = extrair_rosto(imagem)

                    if quantidade == 0:
                        erros_amostras.append(
                            f"Amostra {indice_imagem + 1}: nenhum rosto detectado."
                        )
                        continue

                    if quantidade > 1:
                        erros_amostras.append(
                            f"Amostra {indice_imagem + 1}: mais de um rosto detectado."
                        )
                        continue

                rostos_validos.append(rosto)
            except ValueError as erro_amostra:
                erros_amostras.append(
                    f"Amostra {indice_imagem + 1}: {erro_amostra}"
                )

        minimo_exigido = (
            QUANTIDADE_AMOSTRAS_CADASTRO
            if modo_guiado
            else (
                MINIMO_AMOSTRAS_CADASTRO
                if len(imagens_base64) > 1
                else 1
            )
        )

        if len(rostos_validos) < minimo_exigido:
            return jsonify({
                "sucesso": False,
                "mensagem": (
                    f"Foram obtidas apenas {len(rostos_validos)} amostras válidas. "
                    f"São necessárias pelo menos {minimo_exigido}. "
                    "Mantenha apenas um rosto centralizado e com boa iluminação."
                ),
                "errosAmostras": erros_amostras
            }), 400

        # =========================================================
        # GARANTIR QUE AS AMOSTRAS SÃO DA MESMA PESSOA
        # =========================================================

        if modo_guiado:
            coerente, diagnostico_coerencia = (
                validar_coerencia_amostras_cadastro(
                    rostos_validos
                )
            )

            if not coerente:
                return jsonify({
                    "sucesso": False,
                    "mensagem": (
                        "As amostras faciais estão muito diferentes entre si. "
                        "Refaça o cadastro garantindo que a mesma pessoa "
                        "permaneça diante da câmera nas cinco etapas."
                    ),
                    "tipoErro": "AMOSTRAS_INCOERENTES",
                    "diagnostico": diagnostico_coerencia
                }), 400

        # =========================================================
        # IMPEDIR O MESMO ROSTO EM OUTRO USUÁRIO
        # =========================================================

        duplicado, diagnostico_duplicidade = (
            procurar_cadastro_facial_duplicado(
                rostos_validos,
                perfil,
                pessoa_id,
                usuario_id,
                token_jwt
            )
        )

        if duplicado:
            print(
                "Cadastro facial duplicado detectado:",
                diagnostico_duplicidade
            )

            return jsonify({
                "sucesso": False,
                "mensagem": (
                    "Este rosto parece já estar vinculado a outro cadastro. "
                    "Verifique a pessoa selecionada antes de continuar."
                ),
                "tipoErro": "ROSTO_JA_CADASTRADO",
                "diagnostico": diagnostico_duplicidade
            }), 409

        # =========================================================
        # PERSISTÊNCIA OFICIAL: SPRING / MYSQL
        # =========================================================

        salvar_amostras_no_mysql(
            usuario_id,
            rostos_validos,
            etapas_cadastro,
            token_jwt
        )

        return jsonify({
            "sucesso": True,
            "mensagem": (
                f"Face cadastrada com {len(rostos_validos)} amostras no banco."
            ),
            "perfil": perfil,
            "pessoaId": usuario_id,
            "usuarioId": usuario_id,
            "pessoaNome": pessoa_nome,
            "alunoId": normalizar_id(dados.get("alunoId")),
            "quantidadeAmostras": len(rostos_validos),
            "origem": "mysql",
            "modoGuiado": modo_guiado,
            "etapasCadastro": etapas_cadastro if modo_guiado else []
        })
    except ErroAutorizacao as erro:
        return resposta_erro_autorizacao(erro)
    except ValueError as erro:
        return jsonify({
            "sucesso": False,
            "mensagem": str(erro)
        }), 400
    except Exception as erro:
        return resposta_erro_interno("Erro interno ao cadastrar face:", erro)


@app.route("/biometria/validar", methods=["POST"])
def validar_biometria_recuperacao():
    """Valida uma captura facial durante a recuperação de senha.

    Esta rota não aceita JWT do navegador. Ela é destinada exclusivamente
    ao backend Spring e exige X-Prezence-Service-Key.
    """
    try:
        validar_chave_servico_requisicao()

        usuario_id = normalizar_id(
            request.form.get("usuarioId")
        )
        arquivo_imagem = request.files.get("imagem")

        if not usuario_id:
            return jsonify({
                "valido": False,
                "similaridade": None,
                "mensagem": "usuarioId é obrigatório."
            }), 400

        if arquivo_imagem is None:
            return jsonify({
                "valido": False,
                "similaridade": None,
                "mensagem": "Imagem biométrica não enviada."
            }), 400

        imagem_bytes = arquivo_imagem.read()

        if not imagem_bytes:
            return jsonify({
                "valido": False,
                "similaridade": None,
                "mensagem": "Imagem biométrica vazia."
            }), 400

        imagem_array = np.frombuffer(
            imagem_bytes,
            dtype=np.uint8
        )
        imagem = cv2.imdecode(
            imagem_array,
            cv2.IMREAD_COLOR
        )

        if imagem is None or imagem.size == 0:
            return jsonify({
                "valido": False,
                "similaridade": None,
                "mensagem": "Não foi possível decodificar a imagem biométrica."
            }), 400

        # Durante a recuperação não existe JWT. A busca no Spring é feita
        # pela credencial interna de serviço e continua usando o MySQL
        # como fonte oficial das amostras biométricas.
        identidades = carregar_identidades_mysql(None)

        if not identidades:
            raise RuntimeError(
                "Nenhuma identidade biométrica foi retornada pelo backend Spring."
            )

        chaves_esperadas = {
            chave
            for chave, identidade in identidades.items()
            if normalizar_id(
                identidade.get("usuarioId")
            ) == usuario_id
        }

        if not chaves_esperadas:
            return jsonify({
                "valido": False,
                "similaridade": None,
                "mensagem": "Usuário não possui biometria facial ativa."
            }), 404

        analise, _, rosto_principal = selecionar_rosto_principal(
            imagem
        )

        if int(analise.get("quantidadeRostos") or 0) == 0:
            return jsonify({
                "valido": False,
                "similaridade": None,
                "mensagem": "Nenhum rosto foi detectado na imagem."
            })

        if analise.get("ambigua"):
            return jsonify({
                "valido": False,
                "similaridade": None,
                "mensagem": (
                    "Há mais de uma pessoa em posição de destaque. "
                    "Deixe apenas o titular em frente à câmera."
                )
            })

        if not analise.get("facePrincipalValida") or rosto_principal is None:
            return jsonify({
                "valido": False,
                "similaridade": None,
                "mensagem": (
                    analise.get("mensagem")
                    or "Posicione o rosto no centro e aproxime-se da câmera."
                )
            })

        contexto = preparar_contexto_classificacao(
            identidades
        )
        classificacao = classificar_rosto(
            rosto_principal,
            identidades,
            contexto
        )

        valido = verificar_resultado_classificacao(
            classificacao,
            chaves_esperadas
        )

        similaridade_hog = classificacao.get(
            "similaridadeHog"
        )
        similaridade = (
            round(float(similaridade_hog), 4)
            if similaridade_hog is not None
            else None
        )

        return jsonify({
            "valido": bool(valido),
            "similaridade": similaridade,
            "mensagem": (
                "Identidade confirmada."
                if valido
                else "A face capturada não corresponde ao usuário da recuperação."
            ),
            "diagnostico": {
                "confiancaLbph": round(
                    float(classificacao["confiancaLbph"]),
                    2
                ),
                "scoreDescritor": round(
                    float(classificacao["scoreDescritor"]),
                    4
                ),
                "margem": (
                    round(float(classificacao["margem"]), 4)
                    if classificacao.get("margem") is not None
                    else None
                )
            }
        })

    except ErroAutorizacao as erro:
        return resposta_erro_autorizacao(erro)
    except RuntimeError as erro:
        return jsonify({
            "valido": False,
            "similaridade": None,
            "mensagem": str(erro)
        }), 503
    except ValueError as erro:
        return jsonify({
            "valido": False,
            "similaridade": None,
            "mensagem": str(erro)
        }), 400
    except Exception as erro:
        return resposta_erro_interno(
            "Erro interno na validação biométrica da recuperação:",
            erro
        )


@app.route("/verificar-face", methods=["POST"])
def verificar_face():
    try:
        dados = request.get_json(silent=True) or {}

        if not dados:
            return jsonify({
                "sucesso": False,
                "mensagem": "Dados não enviados."
            }), 400

        token_jwt = obter_token_bearer_requisicao()
        imagens_base64 = obter_imagens_base64(dados)
        candidatos = obter_ids_candidatos(dados)
        usuario_id = normalizar_id(dados.get("usuarioId"))

        if not candidatos or not imagens_base64:
            return jsonify({
                "sucesso": False,
                "reconhecido": False,
                "mensagem": "Identificador da pessoa e imagens faciais são obrigatórios."
            }), 400

        chaves_esperadas = {
            chave_face(perfil, pessoa_id)
            for perfil, pessoa_id in candidatos
        }

        identidades = carregar_identidades(token_jwt)
        identidades_esperadas = [
            chave for chave in chaves_esperadas
            if chave in identidades
        ]

        if not identidades_esperadas:
            return jsonify({
                "sucesso": False,
                "reconhecido": False,
                "mensagem": "Pessoa ainda não possui face cadastrada."
            }), 404

        identidade_esperada = identidades[identidades_esperadas[0]]
        contexto_classificacao = preparar_contexto_classificacao(identidades)
        resultados = []
        erros_amostras = []
        diagnosticos_amostras = []
        total_faces_detectadas = 0
        maior_quantidade_faces = 0
        amostras_com_multiplas_faces = 0
        amostras_ambiguas = 0
        amostras_sem_face_principal = 0
        esperado_fora_principal = 0

        for indice_imagem, imagem_base64 in enumerate(imagens_base64):
            numero_amostra = indice_imagem + 1

            try:
                imagem = converter_base64_para_imagem(imagem_base64)
                analise, imagem_equalizada, rosto_principal = selecionar_rosto_principal(
                    imagem
                )
                quantidade = int(analise["quantidadeRostos"])
                total_faces_detectadas += quantidade
                maior_quantidade_faces = max(
                    maior_quantidade_faces,
                    quantidade
                )

                if quantidade > 1:
                    amostras_com_multiplas_faces += 1

                diagnostico_amostra = {
                    "amostra": numero_amostra,
                    "quantidadeRostos": quantidade,
                    "facesIgnoradas": analise["facesIgnoradas"],
                    "facePrincipalValida": analise["facePrincipalValida"],
                    "ambigua": analise["ambigua"],
                    "facePrincipal": analise["facePrincipal"],
                    "mensagem": analise["mensagem"],
                    "esperadoForaPrincipal": False
                }

                if quantidade == 0:
                    erros_amostras.append(
                        f"Amostra {numero_amostra}: nenhum rosto detectado."
                    )
                    diagnosticos_amostras.append(diagnostico_amostra)
                    continue

                if analise["ambigua"]:
                    amostras_ambiguas += 1
                    encontrado, _, _ = procurar_identidade_esperada_em_faces(
                        imagem_equalizada,
                        analise["faces"],
                        identidades,
                        chaves_esperadas,
                        contexto_classificacao
                    )
                    diagnostico_amostra["esperadoForaPrincipal"] = encontrado

                    if encontrado:
                        esperado_fora_principal += 1

                    erros_amostras.append(
                        f"Amostra {numero_amostra}: {analise['mensagem']}"
                    )
                    diagnosticos_amostras.append(diagnostico_amostra)
                    continue

                if not analise["facePrincipalValida"] or rosto_principal is None:
                    amostras_sem_face_principal += 1
                    encontrado, _, _ = procurar_identidade_esperada_em_faces(
                        imagem_equalizada,
                        analise["faces"],
                        identidades,
                        chaves_esperadas,
                        contexto_classificacao
                    )
                    diagnostico_amostra["esperadoForaPrincipal"] = encontrado

                    if encontrado:
                        esperado_fora_principal += 1

                    erros_amostras.append(
                        f"Amostra {numero_amostra}: {analise['mensagem']}"
                    )
                    diagnosticos_amostras.append(diagnostico_amostra)
                    continue

                classificacao = classificar_rosto(
                    rosto_principal,
                    identidades,
                    contexto_classificacao
                )
                classificacao["aceito"] = verificar_resultado_classificacao(
                    classificacao,
                    chaves_esperadas
                )
                classificacao["amostra"] = numero_amostra
                classificacao["quantidadeRostos"] = quantidade
                classificacao["facesIgnoradas"] = analise["facesIgnoradas"]
                classificacao["facePrincipal"] = analise["facePrincipal"]
                classificacao["esperadoForaPrincipal"] = False

                if not classificacao["aceito"] and quantidade > 1:
                    indice_principal = analise["facePrincipal"].get("indice")
                    encontrado, _, _ = procurar_identidade_esperada_em_faces(
                        imagem_equalizada,
                        analise["faces"],
                        identidades,
                        chaves_esperadas,
                        contexto_classificacao,
                        indices_ignorados={indice_principal}
                    )

                    if encontrado:
                        classificacao["esperadoForaPrincipal"] = True
                        diagnostico_amostra["esperadoForaPrincipal"] = True
                        esperado_fora_principal += 1

                resultados.append(classificacao)
                diagnostico_amostra["aceito"] = classificacao["aceito"]
                diagnosticos_amostras.append(diagnostico_amostra)
            except ValueError as erro_amostra:
                erros_amostras.append(
                    f"Amostra {numero_amostra}: {erro_amostra}"
                )

        total_amostras = len(imagens_base64)
        votos_necessarios = max(
            1,
            math.ceil(total_amostras * 2 / 3)
        )
        votos_positivos = sum(
            1 for resultado in resultados
            if resultado["aceito"]
        )
        reconhecido = (
            votos_positivos >= votos_necessarios
            and len(resultados) >= votos_necessarios
        )

        confianca_media = None
        score_medio = None
        melhor_resultado = None

        if resultados:
            confianca_media = float(np.mean([
                resultado["confiancaLbph"]
                for resultado in resultados
            ]))
            score_medio = float(np.mean([
                resultado["scoreDescritor"]
                for resultado in resultados
            ]))
            melhor_resultado = min(
                resultados,
                key=lambda item: item["scoreDescritor"]
            )

        if reconhecido:
            if amostras_com_multiplas_faces > 0:
                mensagem = (
                    "Aluno reconhecido como face principal. "
                    "As outras pessoas no enquadramento foram ignoradas."
                )
            else:
                mensagem = "Aluno reconhecido como face principal."
        elif amostras_ambiguas > 0:
            mensagem = (
                "Há duas pessoas muito próximas da câmera. "
                "Deixe o aluno claramente à frente e no centro."
            )
        elif esperado_fora_principal > 0:
            mensagem = (
                "Seu rosto foi encontrado, mas não estava como face principal. "
                "Aproxime-se, fique no centro e deixe as outras pessoas ao fundo."
            )
        elif amostras_sem_face_principal > 0 and not resultados:
            mensagem = (
                "Nenhuma face principal válida foi encontrada. "
                "Aproxime-se e posicione o rosto no centro da câmera."
            )
        elif not resultados:
            mensagem = "Nenhuma amostra facial válida pôde ser analisada."
        else:
            mensagem = "A face principal não corresponde ao aluno cadastrado."

        diagnostico_classificacao = {
            "identidadeLbph": None,
            "identidadeDescritor": None,
            "margem": None
        }

        if melhor_resultado:
            diagnostico_classificacao = {
                "identidadeLbph": melhor_resultado.get("chaveLbph"),
                "identidadeDescritor": melhor_resultado.get("chaveDescritor"),
                "margem": (
                    round(float(melhor_resultado["margem"]), 4)
                    if melhor_resultado.get("margem") is not None
                    else None
                )
            }

        return jsonify({
            "sucesso": True,
            "reconhecido": reconhecido,
            "perfil": identidade_esperada.get("perfil"),
            "pessoaId": identidade_esperada.get("pessoaId"),
            "pessoaNome": identidade_esperada.get("pessoaNome"),
            "alunoId": normalizar_id(dados.get("alunoId")),
            "confianca": (
                round(confianca_media, 2)
                if confianca_media is not None
                else None
            ),
            "scoreDescritor": (
                round(score_medio, 4)
                if score_medio is not None
                else None
            ),
            "limiteConfianca": LIMITE_CONFIANCA_LBPH,
            "limiteScoreDescritor": LIMITE_SCORE_DESCRITOR,
            "votosPositivos": votos_positivos,
            "votosNecessarios": votos_necessarios,
            "amostrasRecebidas": total_amostras,
            "amostrasAnalisadas": len(resultados),
            "amostrasComMultiplasFaces": amostras_com_multiplas_faces,
            "amostrasAmbiguas": amostras_ambiguas,
            "amostrasSemFacePrincipal": amostras_sem_face_principal,
            "esperadoForaPrincipal": esperado_fora_principal,
            "maiorQuantidadeFaces": maior_quantidade_faces,
            "totalFacesDetectadas": total_faces_detectadas,
            "regraFacePrincipal": True,
            "mensagem": mensagem,
            "errosAmostras": erros_amostras,
            "diagnostico": diagnostico_classificacao,
            "diagnosticosAmostras": diagnosticos_amostras
        })
    except ErroAutorizacao as erro:
        return resposta_erro_autorizacao(erro)
    except ValueError as erro:
        return jsonify({
            "sucesso": False,
            "reconhecido": False,
            "mensagem": str(erro)
        }), 400
    except Exception as erro:
        resposta, status_http = resposta_erro_interno(
            "Erro interno ao verificar face:",
            erro
        )
        return resposta, status_http


@app.route("/alunos-cadastrados", methods=["GET"])
def alunos_cadastrados():
    try:
        token_jwt = obter_token_bearer_requisicao()
        identidades = carregar_identidades(token_jwt)
        resumo = [
            {
                "chave": identidade.get("chave"),
                "perfil": identidade.get("perfil"),
                "pessoaId": identidade.get("pessoaId"),
                "usuarioId": identidade.get("usuarioId"),
                "pessoaNome": identidade.get("pessoaNome"),
                "origem": "mysql",
                "quantidadeAmostras": len(
                    identidade.get("amostrasBase64", [])
                )
            }
            for identidade in identidades.values()
        ]

        return jsonify({
            "sucesso": True,
            "quantidade": len(resumo),
            "alunos": resumo
        })
    except ErroAutorizacao as erro:
        return resposta_erro_autorizacao(erro)
    except RuntimeError as erro:
        return jsonify({
            "sucesso": False,
            "mensagem": str(erro)
        }), 503
    except Exception as erro:
        return resposta_erro_interno("Erro ao listar faces cadastradas:", erro)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
