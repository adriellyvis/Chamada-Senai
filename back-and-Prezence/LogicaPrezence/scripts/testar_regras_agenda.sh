#!/usr/bin/env bash
set -euo pipefail
BASE="$(cd "$(dirname "$0")/.." && pwd)"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
SRC="$BASE/src/main/java/prezence/agenda"
TEST="$BASE/src/test/java/prezence/agenda/AgendaRegrasTeste.java"
javac --release 17 -d "$TMP" \
  "$SRC/AgendaPerfil.java" "$SRC/AgendaVisibilidade.java" "$SRC/AgendaTipo.java" \
  "$SRC/AgendaIdentidade.java" "$SRC/AgendaPermissoes.java" "$SRC/AgendaApiException.java" \
  "$SRC/AgendaEventoDados.java" "$SRC/AgendaValidacao.java" "$TEST"
java -cp "$TMP" prezence.agenda.AgendaRegrasTeste
