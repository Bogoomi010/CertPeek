// Language is fixed at build time: `vite --mode ko` loads .env.ko (VITE_LANG=ko); anything else is English.
// ponytail: two builds instead of a runtime switcher; add a picker here if one is ever wanted.

const en = {
  lang: "en",
  appTitle: "CertPeek",
  formats: "PEM, DER or PKCS#12 (.cer .crt .pem .der .pfx .p12)",
  chooseFile: "Choose file",
  dropHint: "or drop it anywhere in this window",
  passwordProtected: (name: string) => `${name} is password protected.`,
  passwordLabel: "PKCS#12 password",
  open: "Open",
  cancel: "Cancel",
  wrongPassword: "Incorrect password.",
  details: "Certificate details",
  back: "Back to file picker",
  minimize: "Minimize",
  close: "Close",
  valid: "Valid",
  invalid: "Expired / not yet valid",
  general: "General",
  fingerprints: "Fingerprints",
  extensions: "Extensions",
  validFrom: "Valid from",
  validUntil: "Valid until",
  signatureAlgorithm: "Signature algorithm",
  publicKey: "Public key",
  allExtensions: "All extensions",
};

const ko: typeof en = {
  lang: "ko",
  appTitle: "CertPeek",
  formats: "PEM, DER 또는 PKCS#12 (.cer .crt .pem .der .pfx .p12)",
  chooseFile: "파일 선택",
  dropHint: "또는 창 어디에나 드래그해서 열기",
  passwordProtected: (name) => `${name} 파일은 비밀번호로 보호되어 있습니다.`,
  passwordLabel: "PKCS#12 비밀번호",
  open: "열기",
  cancel: "취소",
  wrongPassword: "비밀번호가 올바르지 않습니다.",
  details: "인증서 정보",
  back: "첨부 화면으로 돌아가기",
  minimize: "창 내리기",
  close: "앱 끄기",
  valid: "유효",
  invalid: "만료/미개시",
  general: "기본 정보",
  fingerprints: "지문",
  extensions: "확장",
  validFrom: "유효 기간 시작",
  validUntil: "유효 기간 종료",
  signatureAlgorithm: "서명 알고리즘",
  publicKey: "공개키",
  allExtensions: "전체 확장",
};

export const t = import.meta.env.VITE_LANG === "ko" ? ko : en;
document.documentElement.lang = t.lang;
