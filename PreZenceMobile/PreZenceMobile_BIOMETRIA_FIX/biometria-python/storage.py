from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path

import numpy as np


class TemplateStore:
    def __init__(self, pasta: Path) -> None:
        self.pasta = pasta
        self.pasta.mkdir(parents=True, exist_ok=True)

    def _arquivo(self, usuario_id: int) -> Path:
        return self.pasta / f"usuario_{int(usuario_id)}.npz"

    def existe(self, usuario_id: int) -> bool:
        return self._arquivo(usuario_id).exists()

    def salvar(self, usuario_id: int, template: np.ndarray, amostras: int) -> None:
        destino = self._arquivo(usuario_id)
        temporario = destino.with_suffix(".tmp.npz")
        np.savez_compressed(
            temporario,
            template=np.asarray(template, dtype=np.float32),
            amostras=np.int32(amostras),
            atualizado_em=np.array(datetime.now(timezone.utc).isoformat()),
        )
        temporario.replace(destino)

    def carregar(self, usuario_id: int) -> tuple[np.ndarray, int, str | None]:
        arquivo = self._arquivo(usuario_id)
        if not arquivo.exists():
            raise FileNotFoundError(usuario_id)
        with np.load(arquivo, allow_pickle=False) as dados:
            template = np.asarray(dados["template"], dtype=np.float32)
            amostras = int(dados.get("amostras", 1))
            atualizado = str(dados["atualizado_em"]) if "atualizado_em" in dados else None
        return template, amostras, atualizado

    def remover(self, usuario_id: int) -> bool:
        arquivo = self._arquivo(usuario_id)
        if arquivo.exists():
            arquivo.unlink()
            return True
        return False
