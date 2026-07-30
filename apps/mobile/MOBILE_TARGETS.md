# Мобильные таргеты (Android / iOS)

Каталоги `src-tauri/gen/android` и `src-tauri/gen/apple` **не сгенерированы** —
в окружении, где разворачивался монорепо, не установлен Rust. Ниже — что поставить
и что запустить, чтобы их создать.

Сам крейт к мобильной сборке уже готов, доделывать в нём ничего не нужно:

- `src-tauri/Cargo.toml` → `crate-type = ["staticlib", "cdylib", "rlib"]`
- `src-tauri/src/lib.rs` → `#[cfg_attr(mobile, tauri::mobile_entry_point)]`

## Проверка окружения

```bash
pnpm --filter @restopos/mobile exec tauri info
```

Команда покажет, что именно не найдено.

## Android

Что должно быть установлено:

| Компонент | Зачем | Проверка |
|---|---|---|
| Rust (rustup) | Tauri CLI собирает Rust-крейт | `cargo --version` |
| Android-таргеты Rust | кросс-компиляция под ARM/x86 | см. команду ниже |
| Android SDK + Platform-Tools | сборка APK, `adb` | `$ANDROID_HOME` |
| Android NDK | нативная часть | `$NDK_HOME` |
| JDK 17+ | Gradle | `java -version`, `$JAVA_HOME` |

Состояние этой машины на момент развёртывания:

- ❌ Rust — **не установлен**, это единственный блокер
- ✅ Android SDK — `C:\Users\<user>\AppData\Local\Android\Sdk`
- ✅ Android NDK — `27.1.12297006`
- ✅ JDK 21 — установлен, но `JAVA_HOME` **не выставлен**
- ⚠️ `ANDROID_HOME` выставлен, `NDK_HOME` — нет

Шаги:

```bash
# 1. Rust (Windows: скачать rustup-init.exe с https://rustup.rs)
rustup default stable

# 2. Android-таргеты
rustup target add aarch64-linux-android armv7-linux-androideabi \
                  i686-linux-android x86_64-linux-android

# 3. Переменные окружения (PowerShell, на текущего пользователя)
#    NDK_HOME указывает на конкретную версию, а не на каталог ndk/
[Environment]::SetEnvironmentVariable("JAVA_HOME", "C:\Program Files\Java\jdk-21", "User")
[Environment]::SetEnvironmentVariable("NDK_HOME", "$env:ANDROID_HOME\ndk\27.1.12297006", "User")

# 4. Генерация проекта (перезапустив терминал)
pnpm --filter @restopos/mobile tauri android init

# 5. Запуск на устройстве/эмуляторе
pnpm --filter @restopos/mobile tauri android dev
```

## iOS

**На Windows невозможно.** Требуется macOS: Xcode ставится только туда, и подкоманды
`ios` в CLI на этой платформе просто нет — `tauri ios init` отвечает
`unrecognized subcommand 'ios'`, потому что она вырезана на этапе компиляции CLI.

На macOS:

```bash
xcode-select --install
rustup target add aarch64-apple-ios aarch64-apple-ios-sim x86_64-apple-ios
brew install cocoapods

pnpm --filter @restopos/mobile tauri ios init
pnpm --filter @restopos/mobile tauri ios dev
```

Для установки на реальный iPhone дополнительно нужен Apple Developer Account
и signing team, прописанный в сгенерированном Xcode-проекте.

## Про git

`gen/android` и `gen/apple` сейчас в `.gitignore`: они полностью воспроизводятся
командой `init`. Как только в них появятся ручные правки — иконки, разрешения
в `AndroidManifest.xml`, signing-конфиг — их нужно убрать из `.gitignore`
и закоммитить, иначе правки будет затирать при каждой регенерации.
