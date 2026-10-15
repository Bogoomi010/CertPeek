<div align="center">

<img src="app-icon.svg" width="96" alt="Certificate Viewer" />

# Certificate Viewer

### 인증서 파일을 Windows에 등록하지 않고 바로 열어보는 데스크톱 앱

**더블클릭하면 설치 마법사. 드래그하면 정보.**

[![Tauri](https://img.shields.io/badge/Tauri-2-24C8D8?style=flat-square&logo=tauri&logoColor=white)](https://tauri.app)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![Rust](https://img.shields.io/badge/Rust-x509--parser-000000?style=flat-square&logo=rust&logoColor=white)](https://github.com/rusticata/x509-parser)
[![Seed Design](https://img.shields.io/badge/UI-Seed%20Design-FF6F0F?style=flat-square)](https://seed-design.io)
[![Windows](https://img.shields.io/badge/Windows-10%2B-0078D4?style=flat-square&logo=windows&logoColor=white)](../../releases)
[![MIT license](https://img.shields.io/badge/license-MIT-f4c430?style=flat-square)](LICENSE)

**[Releases](../../releases) · [Issues](../../issues)**

[왜 만들었나](#왜-만들었나) · [지원 형식](#지원-형식) · [표시 정보](#표시-정보) · [설치](#설치) · [개발](#개발) · [기술 스택](#기술-스택)

</div>

> [!NOTE]
> 인증서 저장소에는 아무것도 추가하지 않습니다. 파일은 로컬에서만 파싱되며 네트워크 요청이 없습니다.

<div align="center">

<br />

<img src="docs/assets/upload.jpg" width="360" alt="첨부 화면" />
&nbsp;&nbsp;
<img src="docs/assets/info.jpg" width="520" alt="정보 화면" />

<br /><br />

</div>

---

Windows에서 `.cer` `.pfx` 파일을 더블클릭하면 인증서 **설치** 마법사가 뜹니다. 내용만 확인하고 싶을 뿐인데 저장소에 등록할지부터 물어보고, 지문이나 SAN을 보려면 탭을 몇 번 더 눌러야 합니다.

Certificate Viewer는 파일을 창에 떨어뜨리면 바로 정보 화면을 보여줍니다. 등록 과정이 없으니 남의 인증서, 만료된 인증서, 검증만 하고 버릴 인증서를 부담 없이 열어볼 수 있습니다.

## 왜 만들었나

| | |
|---|---|
| 🔒 **등록 없음** | 인증서 저장소에 아무것도 추가하지 않습니다. 보기만 합니다. |
| 🖱️ **드래그 앤 드롭** | 파일을 창에 떨어뜨리면 바로 열립니다. 버튼으로 선택해도 됩니다. |
| 🔑 **PKCS#12 지원** | 비밀번호가 걸린 `.pfx` `.p12`는 암호 입력 후 열립니다. |
| 📑 **체인 한 번에** | PEM에 인증서가 여러 개면 탭으로 나눠 보여줍니다. |
| 🦀 **Rust 파서** | 파싱은 `x509-parser`가 담당합니다. 파일은 로컬에서만 처리됩니다. |

## 지원 형식

| 확장자 | 형식 | 비고 |
|---|---|---|
| `.pem` `.crt` `.cer` | PEM | `CERTIFICATE` 블록 여러 개 가능 |
| `.der` `.cer` | DER | 단일 인증서 |
| `.pfx` `.p12` | PKCS#12 | 비밀번호 입력, 포함된 모든 인증서 표시 |

## 표시 정보

| 구분 | 항목 |
|---|---|
| 기본 정보 | Subject · Issuer · Serial · Version · 유효 기간 · 서명 알고리즘 · 공개키 |
| 지문 | SHA-256 · SHA-1 |
| 확장 | SAN · Key Usage · Extended Key Usage · 전체 확장 목록 (critical 표시) |
| 상태 | 유효 / 만료 배지 · CA 여부 배지 |

## 설치

[Releases](../../releases)에서 설치 파일을 받습니다. 또는 아래 절차로 직접 빌드합니다.

## 개발

```bash
yarn install
yarn tauri dev
```

요구 사항: [Node.js](https://nodejs.org) 20+, [Yarn](https://classic.yarnpkg.com) 1.x, [Rust](https://rustup.rs) 1.85+, [Tauri 2 사전 요구 사항](https://tauri.app/start/prerequisites/)

## 빌드

```bash
yarn tauri build
```

설치 파일은 `src-tauri/target/release/bundle/` 아래에 생성됩니다.

## 기술 스택

| 영역 | 사용 |
|---|---|
| 셸 | [Tauri 2](https://tauri.app) |
| UI | [React 19](https://react.dev) + [Seed Design](https://seed-design.io) |
| 인증서 파싱 | [x509-parser](https://github.com/rusticata/x509-parser) · [p12-keystore](https://crates.io/crates/p12-keystore) |
| 번들러 | [Vite](https://vite.dev) |

## 라이선스

[MIT](LICENSE) © 2026 kbk

번들된 서드파티(Seed Design, Apache-2.0) 고지는 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)에 있습니다.
