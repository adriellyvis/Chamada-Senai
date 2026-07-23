from flask import Flask, request, jsonify
from flask_cors import CORS
import cv2
import numpy as np
import base64
import os
import json

app = Flask(__name__)
CORS(app)

PASTA_DADOS = "dados_biometricos"
PASTA_FACES = os.path.join(PASTA_DADOS, "faces")
ARQUIVO_INDICE = os.path.join(PASTA_DADOS, "alunos.json")

PERFIS_PERMITIDOS = {"aluno", "professor", "gestor", "usuario"}

os.makedirs(PASTA_DADOS, exist_ok=True)
os.makedirs(PASTA_FACES, exist_ok=True)

detector_rosto = cv2.CascadeClassifier(
    cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
)


def carregar_indice():
    if not os.path.exists(ARQUIVO_INDICE):
        return {}

    with open(ARQUIVO_INDICE, "r", encoding="utf-8") as arquivo:
        return json.load(arquivo)


def salvar_indice(indice):
    with open(ARQUIVO_INDICE, "w", encoding="utf-8") as arquivo:
        json.dump(indice, arquivo, ensure_ascii=False, indent=2)


def converter_base64_para_imagem(imagem_base64):
    if "," in imagem_base64:
        imagem_base64 = imagem_base64.split(",")[1]

    imagem_bytes = base64.b64decode(imagem_base64)
    imagem_array = np.frombuffer(imagem_bytes, np.uint8)
    imagem = cv2.imdecode(imagem_array, cv2.IMREAD_COLOR)

    return imagem


def extrair_rosto(imagem):
    if imagem is None:
        return None, 0

    imagem_cinza = cv2.cvtColor(imagem, cv2.COLOR_BGR2GRAY)

    rostos = detector_rosto.detectMultiScale(
        imagem_cinza,
        scaleFactor=1.1,
        minNeighbors=5,
        minSize=(80, 80)
    )

    quantidade = len(rostos)

    if quantidade == 0:
        return None, quantidade

    if quantidade > 1:
        return None, quantidade

    x, y, w, h = rostos[0]

    rosto = imagem_cinza[y:y+h, x:x+w]
    rosto = cv2.resize(rosto, (200, 200))

    return rosto, quantidade


def normalizar_perfil(perfil):
    perfil_normalizado = str(perfil or "aluno").strip().lower()

    if perfil_normalizado not in PERFIS_PERMITIDOS:
        return "usuario"

    return perfil_normalizado


def chave_face(perfil, pessoa_id):
    return f"{normalizar_perfil(perfil)}_{pessoa_id}"


def caminho_rosto(perfil, pessoa_id):
    return os.path.join(PASTA_FACES, f"{chave_face(perfil, pessoa_id)}.jpg")


def caminho_rosto_aluno(aluno_id):
    return caminho_rosto("aluno", aluno_id)


def id_para_label(pessoa_id):
    try:
        return int(pessoa_id)
    except Exception:
        return abs(hash(str(pessoa_id))) % 1000000


def obter_ids_candidatos(dados):
    perfil = normalizar_perfil(dados.get("perfil", "aluno"))

    candidatos = []

    if perfil == "aluno" and dados.get("alunoId"):
        candidatos.append(("aluno", dados.get("alunoId")))

    if dados.get("pessoaId"):
        candidatos.append((perfil, dados.get("pessoaId")))

    if dados.get("usuarioId"):
        candidatos.append((perfil, dados.get("usuarioId")))

    if dados.get("alunoId") and ("aluno", dados.get("alunoId")) not in candidatos:
        candidatos.append(("aluno", dados.get("alunoId")))

    unicos = []
    vistos = set()

    for perfil_item, pessoa_id in candidatos:
        if pessoa_id is None or pessoa_id == "":
            continue

        chave = chave_face(perfil_item, pessoa_id)

        if chave not in vistos:
            vistos.add(chave)
            unicos.append((perfil_item, pessoa_id))

    return unicos


def obter_id_principal(dados):
    candidatos = obter_ids_candidatos(dados)

    if candidatos:
        return candidatos[0]

    return None, None


@app.route("/status", methods=["GET"])
def status():
    return jsonify({
        "sucesso": True,
        "mensagem": "Servidor de biometria ativo."
    })


@app.route("/reconhecer-face", methods=["POST"])
def reconhecer_face():
    try:
        dados = request.get_json()

        if not dados or "imagemBase64" not in dados:
            return jsonify({
                "sucesso": False,
                "mensagem": "Imagem não enviada."
            }), 400

        imagem = converter_base64_para_imagem(dados["imagemBase64"])
        rosto, quantidade = extrair_rosto(imagem)

        return jsonify({
            "sucesso": True,
            "rostoDetectado": quantidade == 1,
            "quantidadeRostos": quantidade,
            "mensagem": "Rosto detectado." if quantidade == 1 else "Nenhum rosto ou múltiplos rostos detectados."
        })

    except Exception as erro:
        print("Erro ao reconhecer face:", erro)

        return jsonify({
            "sucesso": False,
            "mensagem": "Erro interno ao processar imagem."
        }), 500


@app.route("/face-cadastrada", methods=["POST"])
def face_cadastrada():
    try:
        dados = request.get_json() or {}
        candidatos = obter_ids_candidatos(dados)

        if not candidatos:
            return jsonify({
                "sucesso": False,
                "cadastrada": False,
                "mensagem": "Identificador da pessoa não informado."
            }), 400

        for perfil, pessoa_id in candidatos:
            caminho = caminho_rosto(perfil, pessoa_id)

            if os.path.exists(caminho):
                return jsonify({
                    "sucesso": True,
                    "cadastrada": True,
                    "perfil": perfil,
                    "pessoaId": pessoa_id,
                    "arquivo": caminho,
                    "mensagem": "Face cadastrada encontrada."
                })

        return jsonify({
            "sucesso": True,
            "cadastrada": False,
            "mensagem": "Face ainda não cadastrada."
        })

    except Exception as erro:
        print("Erro ao consultar face cadastrada:", erro)

        return jsonify({
            "sucesso": False,
            "cadastrada": False,
            "mensagem": "Erro interno ao consultar face."
        }), 500


@app.route("/cadastrar-face", methods=["POST"])
def cadastrar_face():
    try:
        dados = request.get_json()

        if not dados:
            return jsonify({
                "sucesso": False,
                "mensagem": "Dados não enviados."
            }), 400

        imagem_base64 = dados.get("imagemBase64")
        perfil, pessoa_id = obter_id_principal(dados)
        pessoa_nome = dados.get("pessoaNome") or dados.get("alunoNome") or "Usuário"

        if not pessoa_id or not imagem_base64:
            return jsonify({
                "sucesso": False,
                "mensagem": "Identificador da pessoa e imagemBase64 são obrigatórios."
            }), 400

        imagem = converter_base64_para_imagem(imagem_base64)
        rosto, quantidade = extrair_rosto(imagem)

        if quantidade == 0:
            return jsonify({
                "sucesso": False,
                "mensagem": "Nenhum rosto detectado."
            }), 400

        if quantidade > 1:
            return jsonify({
                "sucesso": False,
                "mensagem": "Mais de um rosto detectado. Cadastre apenas uma pessoa por vez."
            }), 400

        caminho = caminho_rosto(perfil, pessoa_id)

        cv2.imwrite(caminho, rosto)

        indice = carregar_indice()
        chave = chave_face(perfil, pessoa_id)
        indice[chave] = {
            "perfil": perfil,
            "pessoaId": pessoa_id,
            "pessoaNome": pessoa_nome,
            "alunoId": dados.get("alunoId"),
            "usuarioId": dados.get("usuarioId"),
            "arquivo": caminho
        }
        salvar_indice(indice)

        return jsonify({
            "sucesso": True,
            "mensagem": "Face cadastrada com sucesso.",
            "perfil": perfil,
            "pessoaId": pessoa_id,
            "pessoaNome": pessoa_nome,
            "alunoId": dados.get("alunoId")
        })

    except Exception as erro:
        print("Erro ao cadastrar face:", erro)

        return jsonify({
            "sucesso": False,
            "mensagem": "Erro interno ao cadastrar face."
        }), 500


@app.route("/verificar-face", methods=["POST"])
def verificar_face():
    try:
        dados = request.get_json()

        if not dados:
            return jsonify({
                "sucesso": False,
                "mensagem": "Dados não enviados."
            }), 400

        imagem_base64 = dados.get("imagemBase64")
        candidatos = obter_ids_candidatos(dados)

        if not candidatos or not imagem_base64:
            return jsonify({
                "sucesso": False,
                "mensagem": "Identificador da pessoa e imagemBase64 são obrigatórios."
            }), 400

        caminhos_existentes = [
            (perfil, pessoa_id, caminho_rosto(perfil, pessoa_id))
            for perfil, pessoa_id in candidatos
            if os.path.exists(caminho_rosto(perfil, pessoa_id))
        ]

        if not caminhos_existentes:
            return jsonify({
                "sucesso": False,
                "reconhecido": False,
                "mensagem": "Pessoa ainda não possui face cadastrada."
            }), 404

        imagem = converter_base64_para_imagem(imagem_base64)
        rosto_teste, quantidade = extrair_rosto(imagem)

        if quantidade == 0:
            return jsonify({
                "sucesso": False,
                "reconhecido": False,
                "mensagem": "Nenhum rosto detectado."
            }), 400

        if quantidade > 1:
            return jsonify({
                "sucesso": False,
                "reconhecido": False,
                "mensagem": "Mais de um rosto detectado."
            }), 400

        limite_confianca = 80
        melhor_resultado = None

        for perfil, pessoa_id, caminho in caminhos_existentes:
            rosto_cadastrado = cv2.imread(caminho, cv2.IMREAD_GRAYSCALE)

            if rosto_cadastrado is None:
                continue

            label_esperado = id_para_label(pessoa_id)
            reconhecedor = cv2.face.LBPHFaceRecognizer_create()
            reconhecedor.train(
                [rosto_cadastrado],
                np.array([label_esperado])
            )

            label, confianca = reconhecedor.predict(rosto_teste)
            reconhecido = label == label_esperado and confianca <= limite_confianca

            resultado = {
                "perfil": perfil,
                "pessoaId": pessoa_id,
                "label": int(label),
                "confianca": round(float(confianca), 2),
                "reconhecido": reconhecido
            }

            if melhor_resultado is None or resultado["confianca"] < melhor_resultado["confianca"]:
                melhor_resultado = resultado

            if reconhecido:
                return jsonify({
                    "sucesso": True,
                    "reconhecido": True,
                    "perfil": perfil,
                    "pessoaId": pessoa_id,
                    "alunoId": dados.get("alunoId"),
                    "confianca": resultado["confianca"],
                    "limiteConfianca": limite_confianca,
                    "mensagem": "Pessoa reconhecida."
                })

        return jsonify({
            "sucesso": True,
            "reconhecido": False,
            "perfil": melhor_resultado.get("perfil") if melhor_resultado else None,
            "pessoaId": melhor_resultado.get("pessoaId") if melhor_resultado else None,
            "confianca": melhor_resultado.get("confianca") if melhor_resultado else None,
            "limiteConfianca": limite_confianca,
            "mensagem": "Rosto não corresponde à face cadastrada."
        })

    except Exception as erro:
        print("Erro ao verificar face:", erro)

        return jsonify({
            "sucesso": False,
            "reconhecido": False,
            "mensagem": "Erro interno ao verificar face."
        }), 500


@app.route("/alunos-cadastrados", methods=["GET"])
def alunos_cadastrados():
    indice = carregar_indice()

    return jsonify({
        "sucesso": True,
        "quantidade": len(indice),
        "alunos": list(indice.values())
    })


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
