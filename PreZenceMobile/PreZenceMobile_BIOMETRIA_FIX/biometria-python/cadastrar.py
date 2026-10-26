from __future__ import annotations

import argparse
from pathlib import Path

from reconhecimento import BiometriaErro, MotorBiometrico
from storage import TemplateStore

BASE = Path(__file__).resolve().parent


def main() -> int:
    parser = argparse.ArgumentParser(description="Cadastra o template facial de um usuário do PreZence.")
    parser.add_argument("--usuario", type=int, required=True, help="ID do usuário no sistema")
    parser.add_argument("imagens", nargs="+", help="Uma a cinco fotos frontais")
    args = parser.parse_args()

    if args.usuario <= 0:
        parser.error("--usuario deve ser maior que zero")
    if not 1 <= len(args.imagens) <= 5:
        parser.error("informe de 1 a 5 imagens")

    motor = MotorBiometrico(
        BASE / "models" / "face_detection_yunet_2023mar.onnx",
        BASE / "models" / "face_recognition_sface_2021dec.onnx",
        threshold=0.40,
    )
    store = TemplateStore(BASE / "data" / "embeddings")

    embeddings = []
    for caminho_bruto in args.imagens:
        caminho = Path(caminho_bruto)
        try:
            analise = motor.extrair(caminho.read_bytes())
            embeddings.append(analise.embedding)
            print(f"[ok] {caminho.name}: detecção={analise.score_deteccao:.3f}, nitidez={analise.nitidez:.1f}")
        except (OSError, BiometriaErro) as exc:
            print(f"[erro] {caminho}: {exc}")

    if not embeddings:
        print("Nenhuma amostra válida; cadastro não alterado.")
        return 1

    store.salvar(args.usuario, motor.criar_template(embeddings), len(embeddings))
    print(f"Cadastro salvo para usuarioId={args.usuario} com {len(embeddings)} amostra(s).")
    print("As fotos não foram copiadas para a pasta de dados; somente o vetor biométrico foi salvo.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
