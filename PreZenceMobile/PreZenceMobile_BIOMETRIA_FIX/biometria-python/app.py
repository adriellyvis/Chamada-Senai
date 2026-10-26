from __future__ import annotations

import os
from pathlib import Path
from typing import Any

from flask import Flask, jsonify, request
from flask_cors import CORS
from werkzeug.exceptions import RequestEntityTooLarge

from reconhecimento import BiometriaErro, MotorBiometrico
from storage import TemplateStore

BASE = Path(__file__).resolve().parent
MODELS = BASE / "models"
DATA = BASE / "data" / "embeddings"

PORT = int(os.getenv("BIOMETRIA_PORT", "5000"))
THRESHOLD = float(os.getenv("BIOMETRIA_COSINE_THRESHOLD", "0.40"))
MAX_MB = int(os.getenv("BIOMETRIA_MAX_IMAGE_MB", "6"))

motor = MotorBiometrico(
    MODELS / "face_detection_yunet_2023mar.onnx",
    MODELS / "face_recognition_sface_2021dec.onnx",
    threshold=THRESHOLD,
)
store = TemplateStore(DATA)

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = MAX_MB * 1024 * 1024
CORS(app, resources={r"/*": {"origins": "*"}})


def numero_form(nome: str, obrigatorio: bool = True) -> int | None:
    bruto = request.form.get(nome)
    if bruto is None or str(bruto).strip() == "":
        if obrigatorio:
            raise BiometriaErro(f"Campo '{nome}' é obrigatório.")
        return None
    try:
        valor = int(bruto)
    except (TypeError, ValueError):
        raise BiometriaErro(f"Campo '{nome}' deve ser numérico.")
    if valor <= 0:
        raise BiometriaErro(f"Campo '{nome}' deve ser maior que zero.")
    return valor


def json_erro(mensagem: str, status: int = 400, **extra: Any):
    payload = {"sucesso": False, "reconhecido": False, "mensagem": mensagem, **extra}
    return jsonify(payload), status


@app.errorhandler(RequestEntityTooLarge)
def arquivo_grande(_):
    return json_erro(f"Imagem maior que o limite de {MAX_MB} MB.", 413)


@app.get("/health")
def health():
    return jsonify({
        "ok": True,
        "servico": "prezence-biometria",
        "modelosCarregados": motor.modelos_disponiveis,
        "thresholdCosine": motor.threshold,
        "porta": PORT,
        "detectorExiste": motor.detector_model.exists(),
        "recognizerExiste": motor.recognizer_model.exists(),
        "detectorBytes": motor.detector_model.stat().st_size if motor.detector_model.exists() else 0,
        "recognizerBytes": motor.recognizer_model.stat().st_size if motor.recognizer_model.exists() else 0,
    })


@app.get("/status/<int:usuario_id>")
def status(usuario_id: int):
    cadastrado = store.existe(usuario_id)
    amostras = 0
    atualizado = None
    if cadastrado:
        _, amostras, atualizado = store.carregar(usuario_id)
    return jsonify({
        "usuarioId": usuario_id,
        "cadastrada": cadastrado,
        "amostras": amostras,
        "atualizadoEm": atualizado,
    })


@app.post("/cadastrar")
def cadastrar():
    try:
        usuario_id = numero_form("usuarioId")
        arquivos = request.files.getlist("imagem") or request.files.getlist("imagens")
        arquivos = [a for a in arquivos if a and a.filename]
        if not arquivos:
            raise BiometriaErro("Envie ao menos uma imagem no campo 'imagem'.")
        if len(arquivos) > 5:
            raise BiometriaErro("Envie no máximo 5 imagens por cadastro.")

        embeddings = []
        analises = []
        erros = []
        for indice, arquivo in enumerate(arquivos, start=1):
            try:
                analise = motor.extrair(arquivo.read())
                embeddings.append(analise.embedding)
                analises.append({
                    "amostra": indice,
                    "deteccao": round(analise.score_deteccao, 4),
                    "nitidez": round(analise.nitidez, 2),
                    "luminosidade": round(analise.luminosidade, 2),
                })
            except BiometriaErro as exc:
                erros.append(f"Amostra {indice}: {exc}")

        if not embeddings:
            raise BiometriaErro("Nenhuma amostra pôde ser usada. " + " ".join(erros))

        template = motor.criar_template(embeddings)
        store.salvar(usuario_id, template, len(embeddings))
        return jsonify({
            "sucesso": True,
            "cadastrada": True,
            "usuarioId": usuario_id,
            "amostrasAceitas": len(embeddings),
            "amostrasRejeitadas": len(erros),
            "erros": erros,
            "qualidade": analises,
            "mensagem": "Cadastro biométrico salvo. As imagens recebidas não foram armazenadas.",
        })
    except BiometriaErro as exc:
        return json_erro(str(exc), 422)
    except Exception as exc:
        app.logger.exception("Falha inesperada ao cadastrar biometria")
        return json_erro("Erro interno ao cadastrar biometria.", 500, detalhe=type(exc).__name__)


@app.post("/reconhecer")
def reconhecer():
    try:
        usuario_id = numero_form("usuarioId")
        aluno_id = numero_form("alunoId", obrigatorio=False)
        aula_id = numero_form("aulaId", obrigatorio=False)
        arquivo = request.files.get("imagem")
        if arquivo is None or not arquivo.filename:
            raise BiometriaErro("Envie a foto no campo 'imagem'.")

        if not store.existe(usuario_id):
            return json_erro(
                "Usuário ainda não possui template biométrico neste serviço.",
                404,
                usuarioId=usuario_id,
            )

        template, _, _ = store.carregar(usuario_id)
        analise = motor.extrair(arquivo.read())
        reconhecido, similaridade = motor.comparar(template, analise.embedding)

        mensagem = (
            "Rosto compatível com o usuário autenticado."
            if reconhecido else
            "O rosto não corresponde ao cadastro biométrico."
        )
        return jsonify({
            "sucesso": True,
            "reconhecido": reconhecido,
            "usuarioId": usuario_id if reconhecido else None,
            "alunoId": aluno_id,
            "aulaId": aula_id,
            "similaridade": round(similaridade, 6),
            "confianca": round(similaridade, 6),
            "threshold": motor.threshold,
            "mensagem": mensagem,
            "qualidade": {
                "deteccao": round(analise.score_deteccao, 4),
                "nitidez": round(analise.nitidez, 2),
                "luminosidade": round(analise.luminosidade, 2),
                "proporcaoRosto": round(analise.proporcao_rosto, 4),
            },
        })
    except BiometriaErro as exc:
        return json_erro(str(exc), 422)
    except Exception as exc:
        app.logger.exception("Falha inesperada no reconhecimento")
        return json_erro("Erro interno no reconhecimento facial.", 500, detalhe=type(exc).__name__)


if __name__ == "__main__":
    print(f"PreZence biometria: http://0.0.0.0:{PORT}")
    print(f"Threshold cosine: {THRESHOLD:.3f}")
    print("Modelos:", "OK" if motor.modelos_disponiveis else "AUSENTES - rode python baixar_modelos.py")
    app.run(host="0.0.0.0", port=PORT, debug=False, threaded=True)
