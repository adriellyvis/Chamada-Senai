# PreZence Mobile

Aplicativo mobile do PreZence: Expo (SDK 54) + React Native + React Navigation + TypeScript.

Fluxo de dados: **Celular → Spring Boot → MySQL** (o app nunca acessa o banco diretamente).

## Estrutura

```
index.ts / App.tsx        entrada do app (providers)
src/config/env.ts         leitura das variáveis EXPO_PUBLIC_*
src/services/             api.ts (axios + interceptors), authService.ts (login)
src/storage/auth.ts       token e usuário no AsyncStorage
src/contexts/             AuthContext (signIn / signOut / sessão)
src/navigation/           Routes (escolhe o fluxo por perfil), AuthStack, tabs por perfil
src/screens/              auth/, aluno/, professor/, gestor/, shared/
src/components/           Button, TextField, HomePlaceholder
src/theme/ · src/types/   cores/espaçamentos e tipos
```

`Routes` mostra o `AuthStack` (login) sem sessão, e a aba do perfil (`ALUNO`, `PROFESSOR` ou `GESTOR`) com sessão.
Se a API responder 401 numa rota protegida, a sessão é limpa e o app volta ao login.

## Configuração da API

No computador, o Spring Boot deve aceitar conexões da rede:

```properties
server.address=0.0.0.0
server.port=8080
```

Copie `.env.example` para `.env` e informe o IPv4 do computador (não use `localhost`):

```env
EXPO_PUBLIC_API_URL=http://192.168.X.X:8080
# Opcional: prefixo das rotas, se o backend usar (ex.: /api/v1)
EXPO_PUBLIC_API_PREFIX=
```

O login é chamado em `{EXPO_PUBLIC_API_URL}{EXPO_PUBLIC_API_PREFIX}/auth/login`.
Celular e computador precisam estar na mesma rede.

## Rodando

```bash
npm install
npx expo start -c
```

Depois de alterar o `.env`, reinicie com `-c` para o Expo recarregar as variáveis.

Verificação de tipos: `npm run typecheck`.

## Próximos passos

As telas iniciais de cada perfil são provisórias; as funcionalidades específicas devem ser ligadas aos endpoints reais do backend.
