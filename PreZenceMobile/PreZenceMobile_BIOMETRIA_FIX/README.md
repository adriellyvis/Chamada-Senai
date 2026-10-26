# PreZence Mobile

Aplicativo mobile do PreZence: Expo (SDK 58) + React Native + React Navigation + TypeScript.

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
EXPO_PUBLIC_API_URL=http://10.110.22.22:8080
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

A estrutura de navegação dos três perfis está funcional. O perfil Aluno já possui dashboard, agenda, frequência, notas, avisos/ocorrências e consulta do estado da chamada facial integrados ao backend. A captura facial usa expo-camera. O envio ao reconhecedor facial fica habilitado quando EXPO_PUBLIC_BIOMETRIA_URL estiver configurada.
