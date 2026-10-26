from __future__ import annotations

import hashlib
from pathlib import Path
from urllib.request import Request, urlopen

BASE = Path(__file__).resolve().parent
MODELS = BASE / 'models'
MODELS.mkdir(parents=True, exist_ok=True)

ARQUIVOS = {
    'face_detection_yunet_2023mar.onnx': {
        'url': 'https://media.githubusercontent.com/media/opencv/opencv_zoo/main/models/face_detection_yunet/face_detection_yunet_2023mar.onnx',
        'sha256': '8f2383e4dd3cfbb4553ea8718107fc0423210dc964f9f4280604804ed2552fa4',
        'size': 232589,
    },
    'face_recognition_sface_2021dec.onnx': {
        'url': 'https://media.githubusercontent.com/media/opencv/opencv_zoo/main/models/face_recognition_sface/face_recognition_sface_2021dec.onnx',
        'sha256': '0ba9fbfa01b5270c96627c4ef784da859931e02f04419c829e83484087c34e79',
        'size': 38696353,
    },
}


def sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open('rb') as f:
        for bloco in iter(lambda: f.read(1024 * 1024), b''):
            h.update(bloco)
    return h.hexdigest()


def valido(path: Path, esperado: dict) -> bool:
    if not path.exists():
        return False
    if path.stat().st_size != esperado['size']:
        return False
    return sha256(path) == esperado['sha256']


def baixar(nome: str, esperado: dict) -> None:
    destino = MODELS / nome
    if valido(destino, esperado):
        print(f'[ok] {nome} já está válido ({destino.stat().st_size / 1024 / 1024:.1f} MB)')
        return

    if destino.exists():
        print(f'[corrigindo] {nome} existente é inválido; será baixado novamente.')
        destino.unlink()

    temporario = destino.with_suffix(destino.suffix + '.part')
    if temporario.exists():
        temporario.unlink()

    print(f'[download] {nome}')
    req = Request(esperado['url'], headers={'User-Agent': 'PreZence/1.0'})
    with urlopen(req, timeout=180) as resposta, temporario.open('wb') as saida:
        while True:
            bloco = resposta.read(1024 * 1024)
            if not bloco:
                break
            saida.write(bloco)

    if temporario.stat().st_size != esperado['size']:
        tamanho = temporario.stat().st_size
        temporario.unlink(missing_ok=True)
        raise RuntimeError(f'{nome}: tamanho inválido ({tamanho} bytes; esperado {esperado["size"]}).')

    hash_real = sha256(temporario)
    if hash_real != esperado['sha256']:
        temporario.unlink(missing_ok=True)
        raise RuntimeError(f'{nome}: SHA-256 inválido ({hash_real}).')

    temporario.replace(destino)
    print(f'[ok] {nome} salvo e verificado ({destino.stat().st_size / 1024 / 1024:.1f} MB)')


if __name__ == '__main__':
    try:
        for nome, esperado in ARQUIVOS.items():
            baixar(nome, esperado)
        print('\nModelos prontos e verificados.')
    except Exception as exc:
        print(f'\nFalha ao baixar os modelos: {exc}')
        print('Verifique sua internet/rede institucional e tente novamente.')
        print('Os arquivos corretos ficam em biometria-python\\models\\.')
        raise SystemExit(1)
