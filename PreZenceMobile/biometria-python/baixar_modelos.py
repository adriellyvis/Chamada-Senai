from __future__ import annotations

import hashlib
from pathlib import Path
from urllib.request import Request, urlopen

BASE = Path(__file__).resolve().parent
MODELS = BASE / "models"
MODELS.mkdir(parents=True, exist_ok=True)

# OpenCV Zoo espelhado oficialmente no Hugging Face.
# Os URLs "raw.githubusercontent.com" podem devolver apenas o ponteiro Git LFS (~130 bytes).
MODELOS = {
    "face_detection_yunet_2023mar.onnx": {
        "url": (
            "https://huggingface.co/opencv/opencv_zoo/resolve/main/"
            "models/face_detection_yunet/face_detection_yunet_2023mar.onnx"
        ),
        "sha256": "8f2383e4dd3cfbb4553ea8718107fc0423210dc964f9f4280604804ed2552fa4",
        "min_bytes": 200_000,
    },
    "face_recognition_sface_2021dec.onnx": {
        "url": (
            "https://huggingface.co/opencv/opencv_zoo/resolve/main/"
            "models/face_recognition_sface/face_recognition_sface_2021dec.onnx"
        ),
        "sha256": "0ba9fbfa01b5270c96627c4ef784da859931e02f04419c829e83484087c34e79",
        "min_bytes": 30_000_000,
    },
}


def sha256_arquivo(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as arquivo:
        for bloco in iter(lambda: arquivo.read(1024 * 1024), b""):
            h.update(bloco)
    return h.hexdigest()


def valido(path: Path, cfg: dict) -> bool:
    if not path.exists() or path.stat().st_size < int(cfg["min_bytes"]):
        return False
    return sha256_arquivo(path).lower() == str(cfg["sha256"]).lower()


def baixar(nome: str, cfg: dict) -> None:
    destino = MODELS / nome
    if valido(destino, cfg):
        print(f"[ok] {nome} ja esta valido ({destino.stat().st_size / 1024 / 1024:.2f} MB)")
        return

    if destino.exists():
        print(f"[aviso] removendo arquivo invalido: {nome} ({destino.stat().st_size} bytes)")
        destino.unlink()

    temporario = destino.with_suffix(destino.suffix + ".part")
    if temporario.exists():
        temporario.unlink()

    print(f"[download] {nome}")
    req = Request(str(cfg["url"]), headers={"User-Agent": "PreZence/1.0"})
    try:
        with urlopen(req, timeout=180) as resposta, temporario.open("wb") as saida:
            while True:
                bloco = resposta.read(1024 * 1024)
                if not bloco:
                    break
                saida.write(bloco)

        tamanho = temporario.stat().st_size
        if tamanho < int(cfg["min_bytes"]):
            raise RuntimeError(
                f"download incompleto: {tamanho} bytes; esperado pelo menos {cfg['min_bytes']} bytes"
            )

        hash_recebido = sha256_arquivo(temporario)
        if hash_recebido.lower() != str(cfg["sha256"]).lower():
            raise RuntimeError(
                f"SHA-256 invalido para {nome}. Recebido {hash_recebido}"
            )

        temporario.replace(destino)
        print(f"[ok] {nome} ({destino.stat().st_size / 1024 / 1024:.2f} MB)")
    except Exception:
        if temporario.exists():
            temporario.unlink()
        raise


if __name__ == "__main__":
    try:
        for nome, cfg in MODELOS.items():
            baixar(nome, cfg)
        print("\nModelos validados e prontos.")
    except Exception as exc:
        print(f"\nFalha ao preparar os modelos: {exc}")
        print(
            "Verifique a internet. Os modelos sao baixados do espelho oficial "
            "opencv/opencv_zoo no Hugging Face."
        )
        raise SystemExit(1)
