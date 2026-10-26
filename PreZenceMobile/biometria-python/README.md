# PreZence — serviço biométrico 1:1

Este serviço recebe a selfie capturada pelo `expo-camera` e **verifica somente contra o template do usuário já autenticado (`usuarioId`)**. Ele não procura a pessoa em uma base inteira.

## Arquitetura

`expo-camera -> POST /reconhecer -> YuNet (detecção) -> SFace (embedding) -> comparação 1:1 -> Spring /biometria/presenca/solicitar`

As selfies usadas em cadastro e reconhecimento são processadas em memória e **não são armazenadas** por este serviço. Em `data/embeddings/` fica apenas um template vetorial por usuário.

## 1. Instalar Python

Recomendado para este projeto: Python 3.11 ou 3.12 (64 bits).

No Windows, marque `Add python.exe to PATH` durante a instalação.

## 2. Criar ambiente e instalar dependências

```bat
cd biometria-python
python -m venv .venv
.venv\Scripts\activate
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
```

## 3. Baixar os modelos oficiais do OpenCV Zoo

```bat
python baixar_modelos.py
```

Devem existir:

- `models/face_detection_yunet_2023mar.onnx`
- `models/face_recognition_sface_2021dec.onnx`

## 4. Cadastrar um usuário para teste

Use de preferência três fotos frontais diferentes do mesmo usuário:

```bat
python cadastrar.py --usuario 15 foto1.jpg foto2.jpg foto3.jpg
```

Ou via HTTP:

```bat
curl -X POST http://localhost:5000/cadastrar ^
  -F "usuarioId=15" ^
  -F "imagem=@foto1.jpg" ^
  -F "imagem=@foto2.jpg" ^
  -F "imagem=@foto3.jpg"
```

O ID precisa ser o mesmo `user.id` retornado pelo login do PreZence.

## 5. Iniciar API biométrica

```bat
python app.py
```

Ela escuta em `0.0.0.0:5000`, portanto o celular na mesma rede consegue acessar `http://IP_DO_PC:5000`.

Teste no PC:

```text
http://localhost:5000/health
```

Teste no navegador do celular:

```text
http://IP_DO_PC:5000/health
```

## Rotas

### `GET /health`
Mostra se o serviço está ativo e se os modelos existem.

### `GET /status/{usuarioId}`
Informa se há template biométrico local para o usuário.

### `POST /cadastrar`
Multipart:
- `usuarioId`
- `imagem` (1 a 5 arquivos)

### `POST /reconhecer`
Multipart:
- `usuarioId` obrigatório
- `imagem` obrigatório
- `alunoId` opcional
- `aulaId` opcional

Resposta positiva típica:

```json
{
  "reconhecido": true,
  "usuarioId": 15,
  "similaridade": 0.58,
  "threshold": 0.40,
  "mensagem": "Rosto compatível com o usuário autenticado."
}
```

## Threshold

O padrão do projeto é `0.40`, configurável por:

```bat
set BIOMETRIA_COSINE_THRESHOLD=0.40
python app.py
```

O OpenCV documenta `0.363` como referência no benchmark LFW do SFace. O projeto usa um valor um pouco mais rigoroso por padrão, mas **vocês devem calibrar com a iluminação/câmeras reais da escola antes de entrega**.

## Limitações importantes

- Este MVP não implementa prova de vida (liveness). Uma foto/tela pode ser um vetor de fraude.
- Não use o resultado facial sozinho para aplicar penalidade acadêmica; mantenha o professor como confirmação final, como já está no fluxo do PreZence.
- Em produção, proteja o serviço com autenticação/rede privada, criptografe templates em repouso e defina retenção/exclusão de dados biométricos.
