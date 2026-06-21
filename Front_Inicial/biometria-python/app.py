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


def caminho_rosto_aluno(aluno_id):
    return os.path.join(PASTA_FACES, f"aluno_{aluno_id}.jpg")


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


@app.route("/cadastrar-face", methods=["POST"])
def cadastrar_face():
    try:
        dados = request.get_json()

        if not dados:
            return jsonify({
                "sucesso": False,
                "mensagem": "Dados não enviados."
            }), 400

        aluno_id = dados.get("alunoId")
        aluno_nome = dados.get("alunoNome", "Aluno")
        imagem_base64 = dados.get("imagemBase64")

        if not aluno_id or not imagem_base64:
            return jsonify({
                "sucesso": False,
                "mensagem": "alunoId e imagemBase64 são obrigatórios."
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

        caminho = caminho_rosto_aluno(aluno_id)

        cv2.imwrite(caminho, rosto)

        indice = carregar_indice()
        indice[str(aluno_id)] = {
            "alunoId": aluno_id,
            "alunoNome": aluno_nome,
            "arquivo": caminho
        }
        salvar_indice(indice)

        return jsonify({
            "sucesso": True,
            "mensagem": "Face cadastrada com sucesso.",
            "alunoId": aluno_id,
            "alunoNome": aluno_nome
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

        aluno_id = dados.get("alunoId")
        imagem_base64 = dados.get("imagemBase64")

        if not aluno_id or not imagem_base64:
            return jsonify({
                "sucesso": False,
                "mensagem": "alunoId e imagemBase64 são obrigatórios."
            }), 400

        caminho = caminho_rosto_aluno(aluno_id)

        if not os.path.exists(caminho):
            return jsonify({
                "sucesso": False,
                "reconhecido": False,
                "mensagem": "Aluno ainda não possui face cadastrada."
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

        rosto_cadastrado = cv2.imread(caminho, cv2.IMREAD_GRAYSCALE)

        if rosto_cadastrado is None:
            return jsonify({
                "sucesso": False,
                "reconhecido": False,
                "mensagem": "Erro ao carregar face cadastrada."
            }), 500

        reconhecedor = cv2.face.LBPHFaceRecognizer_create()
        reconhecedor.train(
            [rosto_cadastrado],
            np.array([int(aluno_id)])
        )

        label, confianca = reconhecedor.predict(rosto_teste)

        limite_confianca = 80
        reconhecido = label == int(aluno_id) and confianca <= limite_confianca

        return jsonify({
            "sucesso": True,
            "reconhecido": reconhecido,
            "alunoId": aluno_id,
            "confianca": round(float(confianca), 2),
            "limiteConfianca": limite_confianca,
            "mensagem": "Aluno reconhecido." if reconhecido else "Rosto não corresponde ao aluno cadastrado."
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
    app.run(debug=True, port=5000)