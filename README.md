# Certificate Viewer

X.509 인증서 파일을 열어 내용을 보여주는 데스크톱 앱입니다. Tauri 2 + React + [Seed Design](https://seed-design.io)으로 만들었습니다.

## 기능

- PEM(`.pem` `.crt` `.cer`), DER(`.der`), PKCS#12(`.pfx` `.p12`) 지원
- PKCS#12는 비밀번호 입력 후 열기, PEM에 인증서가 여러 개면 탭으로 표시
- Subject / Issuer / 시리얼 / 유효기간 / 서명 알고리즘 / 공개키
- SHA-256, SHA-1 지문
- SAN, Key Usage, Extended Key Usage, 전체 확장 목록
- 유효 여부, CA 여부 배지

## 개발

```bash
yarn install
yarn tauri dev
```

## 빌드

```bash
yarn tauri build
```

산출물은 `src-tauri/target/release/bundle/`에 생성됩니다.

## 라이선스

[MIT](LICENSE)
