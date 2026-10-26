from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

import cv2 as cv
import numpy as np


class BiometriaErro(Exception):
    """Erro esperado/explicável durante cadastro ou verificação biométrica."""


@dataclass(frozen=True)
class AnaliseRosto:
    embedding: np.ndarray
    score_deteccao: float
    nitidez: float
    luminosidade: float
    proporcao_rosto: float


class MotorBiometrico:
    def __init__(
        self,
        detector_model: Path,
        recognizer_model: Path,
        *,
        threshold: float = 0.40,
        detect_threshold: float = 0.88,
        min_face_ratio: float = 0.055,
        min_sharpness: float = 45.0,
        min_brightness: float = 35.0,
        max_brightness: float = 225.0,
    ) -> None:
        self.detector_model = detector_model
        self.recognizer_model = recognizer_model
        self.threshold = threshold
        self.detect_threshold = detect_threshold
        self.min_face_ratio = min_face_ratio
        self.min_sharpness = min_sharpness
        self.min_brightness = min_brightness
        self.max_brightness = max_brightness

        self._detector = None
        self._recognizer = None

    @staticmethod
    def _modelo_valido(path: Path, tamanho_minimo: int) -> bool:
        if not path.exists() or not path.is_file():
            return False
        try:
            tamanho = path.stat().st_size
            if tamanho < tamanho_minimo:
                return False
            with path.open('rb') as f:
                cabecalho = f.read(64)
            return not cabecalho.startswith(b'version https://git-lfs.github.com/spec/v1')
        except OSError:
            return False

    @property
    def modelos_disponiveis(self) -> bool:
        return (
            self._modelo_valido(self.detector_model, 200_000)
            and self._modelo_valido(self.recognizer_model, 30_000_000)
        )

    def _garantir_modelos(self) -> None:
        if not self.modelos_disponiveis:
            faltando = []
            if not self.detector_model.exists():
                faltando.append(self.detector_model.name)
            if not self.recognizer_model.exists():
                faltando.append(self.recognizer_model.name)
            raise BiometriaErro(
                "Modelos de reconhecimento ausentes: " + ", ".join(faltando) +
                ". Rode: python baixar_modelos.py"
            )

        if self._detector is None:
            self._detector = cv.FaceDetectorYN.create(
                str(self.detector_model), "", (320, 320),
                self.detect_threshold, 0.3, 5000
            )
        if self._recognizer is None:
            self._recognizer = cv.FaceRecognizerSF.create(str(self.recognizer_model), "")

    @staticmethod
    def _decodificar(conteudo: bytes) -> np.ndarray:
        if not conteudo:
            raise BiometriaErro("Imagem vazia.")
        array = np.frombuffer(conteudo, dtype=np.uint8)
        imagem = cv.imdecode(array, cv.IMREAD_COLOR)
        if imagem is None or imagem.size == 0:
            raise BiometriaErro("Arquivo de imagem inválido ou formato não suportado.")
        return imagem

    @staticmethod
    def _redimensionar(imagem: np.ndarray, max_lado: int = 960) -> np.ndarray:
        h, w = imagem.shape[:2]
        maior = max(h, w)
        if maior <= max_lado:
            return imagem
        escala = max_lado / float(maior)
        return cv.resize(imagem, (int(w * escala), int(h * escala)), interpolation=cv.INTER_AREA)

    def extrair(self, conteudo: bytes) -> AnaliseRosto:
        self._garantir_modelos()
        imagem = self._redimensionar(self._decodificar(conteudo))
        h, w = imagem.shape[:2]
        self._detector.setInputSize((w, h))
        _, faces = self._detector.detect(imagem)

        if faces is None or len(faces) == 0:
            raise BiometriaErro("Nenhum rosto foi detectado. Centralize o rosto e tente novamente.")
        if len(faces) > 1:
            raise BiometriaErro("Mais de um rosto foi detectado. Tire a foto sozinho.")

        face = faces[0]
        x, y, fw, fh = [float(v) for v in face[:4]]
        score_deteccao = float(face[-1])
        proporcao = max(0.0, fw * fh) / float(max(1, w * h))

        if proporcao < self.min_face_ratio:
            raise BiometriaErro("O rosto está muito distante da câmera. Aproxime-se e tente novamente.")

        x1 = max(0, int(x))
        y1 = max(0, int(y))
        x2 = min(w, int(x + fw))
        y2 = min(h, int(y + fh))
        recorte = imagem[y1:y2, x1:x2]
        if recorte.size == 0:
            raise BiometriaErro("Não foi possível recortar o rosto detectado.")

        cinza = cv.cvtColor(recorte, cv.COLOR_BGR2GRAY)
        luminosidade = float(np.mean(cinza))
        nitidez = float(cv.Laplacian(cinza, cv.CV_64F).var())

        if luminosidade < self.min_brightness:
            raise BiometriaErro("A foto está escura. Procure um local mais iluminado.")
        if luminosidade > self.max_brightness:
            raise BiometriaErro("A foto está clara demais. Evite luz forte diretamente no rosto.")
        if nitidez < self.min_sharpness:
            raise BiometriaErro("A foto ficou desfocada. Segure o celular firme e tente novamente.")

        alinhada = self._recognizer.alignCrop(imagem, face)
        embedding = self._recognizer.feature(alinhada).astype(np.float32).reshape(-1)
        norma = float(np.linalg.norm(embedding))
        if norma <= 1e-8:
            raise BiometriaErro("Não foi possível extrair características faciais da imagem.")
        embedding /= norma

        return AnaliseRosto(
            embedding=embedding,
            score_deteccao=score_deteccao,
            nitidez=nitidez,
            luminosidade=luminosidade,
            proporcao_rosto=proporcao,
        )

    @staticmethod
    def criar_template(embeddings: Iterable[np.ndarray]) -> np.ndarray:
        itens = [np.asarray(e, dtype=np.float32).reshape(-1) for e in embeddings]
        if not itens:
            raise BiometriaErro("Nenhuma amostra facial válida foi fornecida.")
        media = np.mean(np.stack(itens, axis=0), axis=0).astype(np.float32)
        norma = float(np.linalg.norm(media))
        if norma <= 1e-8:
            raise BiometriaErro("Não foi possível criar o template biométrico.")
        return media / norma

    def comparar(self, template: np.ndarray, embedding: np.ndarray) -> tuple[bool, float]:
        template = np.asarray(template, dtype=np.float32).reshape(-1)
        embedding = np.asarray(embedding, dtype=np.float32).reshape(-1)
        if template.shape != embedding.shape:
            raise BiometriaErro("Template biométrico incompatível com o modelo atual.")
        score = float(np.dot(template, embedding))
        return score >= self.threshold, score
