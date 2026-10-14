# Electron security contracts

Run `pnpm test:electron-security` on macOS with the repository's installed Electron. CI runs this after the native presentation smoke test. The wrapper uses hidden windows, an ephemeral loopback server, and an isolated temporary profile, then removes that profile. It never starts the wall or touches the installed application.

| Contract | Primary patch | Expected behavior |
| --- | --- | --- |
| Modified-link-click popup from a sandboxed top-level frame | [Sandbox flag inheritance](https://github.com/electron/electron/commit/6594d5a5b074cf501da084dc7908d3df0d68a886) | Opaque origin; storage and cookies denied |
| File and HTTP protocol handlers, cross-origin `no-cors` fetch | [Opaque response forwarding](https://github.com/electron/electron/commit/80178e4631cb2f6a5e42f8e793b2ae9624e78a0d) | Opaque response, status zero, empty body |
| Webview worker with an embedder that disables Node integration | [Worker preference inheritance](https://github.com/electron/electron/commit/9a675aef8822bae4088567822969f900b3a37671) | `typeof require` is `undefined` |
| Same sandboxed preload consumed by two principals | [Preload cache isolation](https://github.com/electron/electron/commit/25ba8be57c65a83d8c14ebb8aa37693df17a04f3) | Separate nonempty cache entries; both legitimate preloads execute |

The preload case tests principal separation and legitimate IPC execution. It does not simulate a compromised renderer forging cache writes or prove a complete exploit. These are runtime regressions, not proof that this app renders untrusted content or that macOS foreground, physical keyboard, lock, lid, or multi-display acceptance passed. The webview is a fixture-only surface; production does not enable it.
