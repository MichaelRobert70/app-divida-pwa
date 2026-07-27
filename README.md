<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Minhas Contas

PWA para controle de contas a pagar e a receber, com build nativo Android via Capacitor.

## Pré-requisitos

- **Node.js**
- Para build Android: **Android Studio** + **JDK 17+**

## Rodar localmente (PWA)

1. Instalar dependências:
   `npm install`
2. Configurar `GEMINI_API_KEY` em `.env.local`
3. Iniciar o servidor de desenvolvimento:
   `npm run dev`

## Build web (PWA)

```
npm run build
```

Os arquivos são gerados em `dist/`.

## Build Android (APK)

### Scripts disponíveis

| Script | Descrição |
|--------|-----------|
| `npm run build:android` | Build do Vite em modo Android (`--mode android`, `base: './'`) |
| `npm run cap:sync` | Sincroniza `dist/` com o projeto Android |
| `npm run cap:open` | Abre o projeto no Android Studio |
| `npm run android:build` | Build web + sync Capacitor (atalho) |

### Gerar APK de debug

```
npm run android:build
cd android
.\gradlew assembleDebug
```

O APK é gerado em:
```
android/app/build/outputs/apk/debug/app-debug.apk
```

### Gerar APK de release (assinado)

```
cd android
.\gradlew assembleRelease
```

> Requer configuração de keystore em `android/app/build.gradle` (bloco `signingConfigs`).

## Estrutura do projeto

- `public/icons/` — ícones PWA (192, 512, 1024, apple-touch-icon)
- `android/` — projeto nativo Capacitor (Android Studio)
- `vite.config.ts` — config com `base` condicional e `VitePWA`
- `capacitor.config.ts` — config do Capacitor (`appId: com.minhascontas.app`)

## Tecnologias

- React 19 + TypeScript
- Vite 6 + TailwindCSS 4
- vite-plugin-pwa (PWA com manifest e service worker)
- Capacitor 8 (wrapper nativo Android)
- Dexie (IndexedDB) para persistência local
