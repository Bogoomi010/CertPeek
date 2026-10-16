import { useEffect, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { LogicalSize } from "@tauri-apps/api/dpi";
import { getCurrentWindow } from "@tauri-apps/api/window";
import {
  AttachmentInput as SeedAttachmentInput,
  Box,
  HStack,
  Icon,
  PrefixIcon,
  Text,
  VStack,
  useAttachmentInputContext,
} from "@seed-design/react";
import {
  IconArrowUpBracketDownFill,
  IconCheckmarkLine,
  IconChevronLeftLine,
  IconMinusLine,
  IconXmarkLine,
} from "@karrotmarket/react-monochrome-icon";
import { ActionButton } from "seed-design/ui/action-button";
import { t } from "./strings";
import appIcon from "../app-icon.svg";
import { Badge } from "seed-design/ui/badge";
import { TabsContent, TabsList, TabsRoot, TabsTrigger } from "seed-design/ui/tabs";
import { TextField, TextFieldInput } from "seed-design/ui/text-field";

interface CertInfo {
  subject: string;
  issuer: string;
  serial: string;
  version: number;
  not_before: string;
  not_after: string;
  is_valid_now: boolean;
  is_ca: boolean;
  signature_algorithm: string;
  public_key: string;
  san: string[];
  key_usage: string[];
  extended_key_usage: string[];
  sha1: string;
  sha256: string;
  extensions: { name: string; critical: boolean }[];
}

const cn = (dn: string) => dn.match(/CN=([^,]+)/)?.[1] ?? dn;

const border = "1px solid var(--seed-color-stroke-neutral-muted)";

// Seed has no copy glyph; two overlapping rounded squares, drawn to match the 24px line icons.
// Sized explicitly: Seed's Icon/PrefixIcon wrappers only size their own icon components.
const IconCopy = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="11" height="11" rx="2.5" />
    <path d="M15 9V6.5A2.5 2.5 0 0 0 12.5 4h-6A2.5 2.5 0 0 0 4 6.5v6A2.5 2.5 0 0 0 6.5 15H9" />
  </svg>
);

// Writes to the clipboard and reports "copied" for a moment so the caller can swap its icon.
function useCopy() {
  const [copied, setCopied] = useState(false);
  const copy = (text: string) => {
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    }, () => {});
  };
  return [copied, copy] as const;
}

function CopyButton({ text }: { text: string }) {
  const [copied, copy] = useCopy();
  return (
    <button
      type="button"
      aria-label={copied ? t.copied : t.copy}
      title={copied ? t.copied : t.copy}
      onClick={() => copy(text)}
      style={{ background: "none", border: 0, padding: 4, cursor: "pointer", display: "flex", color: "var(--seed-color-fg-neutral-subtle)" }}
    >
      {copied ? <Icon svg={<IconCheckmarkLine />} size="x4" color="fg.positive" /> : <IconCopy />}
    </button>
  );
}

type RowData = { label: string; value: string; mono?: boolean };

function Row({ label, value, mono }: RowData) {
  return (
    <tr style={{ borderTop: border }}>
      <th
        scope="row"
        style={{
          width: 160,
          padding: "8px 12px",
          textAlign: "left",
          verticalAlign: "top",
          fontWeight: 400,
          background: "var(--seed-color-bg-neutral-weak)",
          borderRight: border,
        }}
      >
        <Text textStyle="t4Regular" color="fg.neutralSubtle">
          {label}
        </Text>
      </th>
      <td style={{ padding: "8px 12px", wordBreak: "break-all", fontFamily: mono ? "monospace" : undefined }}>
        <Text textStyle="t4Regular" color="fg.neutral">
          {value || "-"}
        </Text>
      </td>
      <td style={{ width: 32, padding: "6px 8px 6px 0", verticalAlign: "top" }}>{value && <CopyButton text={value} />}</td>
    </tr>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <VStack gap="x2">
      <Text as="h2" textStyle="t5Bold" color="fg.neutral">
        {title}
      </Text>
      <table style={{ width: "100%", borderCollapse: "collapse", border, borderRadius: 8, overflow: "hidden" }}>
        <tbody>{children}</tbody>
      </table>
    </VStack>
  );
}

function CertCard({ cert }: { cert: CertInfo }) {
  const sections: [string, RowData[]][] = [
    [t.general, [
      { label: "Subject", value: cert.subject },
      { label: "Issuer", value: cert.issuer },
      { label: "Serial", value: cert.serial, mono: true },
      { label: "Version", value: `V${cert.version}` },
      { label: t.validFrom, value: cert.not_before },
      { label: t.validUntil, value: cert.not_after },
      { label: t.signatureAlgorithm, value: cert.signature_algorithm },
      { label: t.publicKey, value: cert.public_key },
    ]],
    [t.fingerprints, [
      { label: "SHA-256", value: cert.sha256, mono: true },
      { label: "SHA-1", value: cert.sha1, mono: true },
    ]],
    [t.extensions, [
      { label: "SAN", value: cert.san.join(", ") },
      { label: "Key Usage", value: cert.key_usage.join(", ") },
      { label: "Extended Key Usage", value: cert.extended_key_usage.join(", ") },
      { label: t.allExtensions, value: cert.extensions.map((e) => (e.critical ? `${e.name} (critical)` : e.name)).join(", ") },
    ]],
  ];
  // "Copy all": one `label: value` line per row, blank line between sections.
  const allText = sections
    .map(([, rows]) => rows.map((r) => `${r.label}: ${r.value || "-"}`).join("\n"))
    .join("\n\n");
  const [copiedAll, copyAll] = useCopy();

  return (
    <VStack gap="x6" p="x5" bg="bg.layerDefault" borderRadius="r3">
      <HStack gap="x2" alignItems="center" flexWrap="wrap">
        <Text as="h1" textStyle="t7Bold" color="fg.neutral">
          {cn(cert.subject)}
        </Text>
        <Badge tone={cert.is_valid_now ? "positive" : "critical"} variant="solid">
          {cert.is_valid_now ? t.valid : t.invalid}
        </Badge>
        {cert.is_ca && <Badge tone="informative" variant="weak">CA</Badge>}
        <ActionButton variant="neutralWeak" size="small" layout="withText" onClick={() => copyAll(allText)} style={{ marginLeft: "auto" }}>
          <PrefixIcon svg={copiedAll ? <IconCheckmarkLine /> : <IconCopy />} />
          {copiedAll ? t.copied : t.copyAll}
        </ActionButton>
      </HStack>

      {sections.map(([title, rows]) => (
        <Section key={title} title={title}>
          {rows.map((r) => <Row key={r.label} {...r} />)}
        </Section>
      ))}
    </VStack>
  );
}

// Frameless window: this bar is the drag handle and holds minimize / close.
function TitleBar() {
  const win = () => ("__TAURI_INTERNALS__" in window ? getCurrentWindow() : null);
  return (
    <HStack
      data-tauri-drag-region
      justifyContent="flex-end"
      alignItems="center"
      px="x2"
      style={{ height: 36, flexShrink: 0, userSelect: "none" }}
    >
      <WinButton label={t.minimize} onClick={() => void win()?.minimize()}>
        <IconMinusLine />
      </WinButton>
      <WinButton label={t.close} onClick={() => void win()?.close()}>
        <IconXmarkLine />
      </WinButton>
    </HStack>
  );
}

// ponytail: bare icon button (no Seed variant is background-less); add hover state if wanted
function WinButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      style={{ background: "none", border: 0, padding: 6, cursor: "pointer", display: "flex", color: "inherit" }}
    >
      <Icon svg={children} size="x5" color="fg.neutralSubtle" />
    </button>
  );
}

function InfoScreen({ certs, onBack }: { certs: CertInfo[]; onBack: () => void }) {
  return (
    <Box bg="bg.layerBasement" minHeight="100vh">
      <Box bg="bg.layerBasement" style={{ position: "sticky", top: 0, zIndex: 1 }}>
        <TitleBar />
      </Box>
      <VStack gap="x5" px="x6" pb="x6" maxWidth="960px" mx="auto">
        <HStack gap="x3" alignItems="center">
          <ActionButton
            variant="neutralWeak"
            size="small"
            layout="iconOnly"
            aria-label={t.back}
            onClick={onBack}
          >
            <Icon svg={<IconChevronLeftLine />} />
          </ActionButton>
          <Text as="h1" textStyle="t7Bold" color="fg.neutral">
            {t.details}
          </Text>
        </HStack>

        {certs.length === 1 ? (
          <CertCard cert={certs[0]} />
        ) : (
          <TabsRoot defaultValue="0" triggerLayout="hug">
            <TabsList>
              {certs.map((c, i) => (
                <TabsTrigger key={i} value={String(i)}>
                  {cn(c.subject)}
                </TabsTrigger>
              ))}
            </TabsList>
            {certs.map((c, i) => (
              <TabsContent key={i} value={String(i)}>
                <Box pt="x4">
                  <CertCard cert={c} />
                </Box>
              </TabsContent>
            ))}
          </TabsRoot>
        )}
      </VStack>
    </Box>
  );
}

function Header({ subtitle }: { subtitle: string }) {
  return (
    <VStack gap="x3" alignItems="center">
      <img src={appIcon} width={72} height={72} alt="" style={{ borderRadius: 16 }} />
      <Text as="h1" textStyle="t7Bold" color="fg.neutral">
        {t.appTitle}
      </Text>
      <Text textStyle="t4Regular" color="fg.neutralSubtle" style={{ textAlign: "center" }}>
        {subtitle}
      </Text>
    </VStack>
  );
}

// The whole window below the title bar is the drop target (see .drop-area in index.html).
function DropArea({ error }: { error?: string }) {
  const { triggerProps } = useAttachmentInputContext();
  return (
    <SeedAttachmentInput.Dropzone asChild className="drop-area">
      <VStack gap="x5" px="x6" pb="x6" justifyContent="center" alignItems="center" style={{ flex: 1, minHeight: 0 }}>
        <Header subtitle={t.formats} />
        <VStack gap="x2" alignItems="center">
          <ActionButton variant="brandSolid" size="medium" layout="withText" {...triggerProps}>
            <PrefixIcon svg={<IconArrowUpBracketDownFill />} />
            {t.chooseFile}
          </ActionButton>
          <SeedAttachmentInput.DropzoneLabel>{t.dropHint}</SeedAttachmentInput.DropzoneLabel>
        </VStack>
        {error && (
          <Text textStyle="t4Regular" color="fg.critical" style={{ textAlign: "center", wordBreak: "break-all" }}>
            {error}
          </Text>
        )}
      </VStack>
    </SeedAttachmentInput.Dropzone>
  );
}

export default function App() {
  const [certs, setCerts] = useState<CertInfo[]>([]);
  // Bumped after a failed parse to remount the file input: Seed keeps the rejected entry otherwise
  // and maxFiles=1 would refuse the next pick.
  const [attempt, setAttempt] = useState(0);
  const [error, setError] = useState<string>();
  // PKCS#12 file waiting for a password; null when no prompt is needed.
  const [locked, setLocked] = useState<{ name: string; data: number[] } | null>(null);
  const [password, setPassword] = useState("");
  const passwordRef = useRef<HTMLInputElement>(null);

  // After a file dialog / Explorer drag the OS focus is elsewhere, so autoFocus alone does nothing:
  // pull the window to the front first, then focus the password input.
  useEffect(() => {
    if (!locked) return;
    const focus = () => passwordRef.current?.focus();
    if ("__TAURI_INTERNALS__" in window) getCurrentWindow().setFocus().then(focus, focus);
    else focus();
  }, [locked]);

  const reset = () => {
    setCerts([]);
    setError(undefined);
    setLocked(null);
    setPassword("");
  };

  const load = async (name: string, data: number[], pw?: string) => {
    try {
      setCerts(await invoke<CertInfo[]>("parse_cert", { data, password: pw }));
      setError(undefined);
      setLocked(null);
      return true;
    } catch (e) {
      setCerts([]);
      if (String(e) === "WRONG_PASSWORD") {
        setError(pw === undefined ? undefined : t.wrongPassword);
        setLocked({ name, data });
      } else {
        setError(String(e));
        setLocked(null);
      }
      return false;
    }
  };

  const showInfo = certs.length > 0;

  // The window itself is square (480x480) on the upload screen and grows for the info screen.
  useEffect(() => {
    if (!("__TAURI_INTERNALS__" in window)) return; // plain browser (vite dev): nothing to resize
    const win = getCurrentWindow();
    const [w, h, min] = showInfo ? [960, 760, 640] : [480, 480, 480];
    win.setMinSize(new LogicalSize(min, 480))
      .then(() => win.setSize(new LogicalSize(w, h)))
      .then(() => win.center())
      .catch(() => {});
  }, [showInfo]);

  if (showInfo) return <InfoScreen certs={certs} onBack={reset} />;

  return (
    // ponytail: 100vh + overflow hidden keeps the window scrollbar away; the content scrolls internally if it ever overflows
    <Box
      bg="bg.layerDefault"
      style={{ height: "100vh", overflow: "hidden", display: "flex", flexDirection: "column" }}
    >
      <TitleBar />
      {locked ? (
        <VStack gap="x5" px="x6" pb="x6" justifyContent="center" style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
          <Header subtitle={t.passwordProtected(locked.name)} />
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void load(locked.name, locked.data, password);
            }}
          >
            <VStack gap="x3">
              <TextField
                size="medium"
                label={t.passwordLabel}
                value={password}
                onValueChange={({ value }) => setPassword(value)}
                errorMessage={error}
                invalid={!!error}
              >
                <TextFieldInput ref={passwordRef} type="password" autoFocus />
              </TextField>
              <HStack gap="x2">
                <ActionButton type="button" variant="neutralWeak" size="medium" onClick={reset} style={{ flex: 1 }}>
                  {t.cancel}
                </ActionButton>
                <ActionButton type="submit" variant="brandSolid" size="medium" style={{ flex: 1 }}>
                  {t.open}
                </ActionButton>
              </HStack>
            </VStack>
          </form>
        </VStack>
      ) : (
        <SeedAttachmentInput.Root
          key={attempt}
          maxFiles={1}
          accept=".cer,.crt,.pem,.der,.pfx,.p12"
          invalid={!!error}
          onFileAccept={async ([entry]) => {
            const data = Array.from(new Uint8Array(await entry.file.arrayBuffer()));
            if (!(await load(entry.file.name, data))) setAttempt((a) => a + 1);
          }}
          style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}
        >
          <DropArea error={error} />
          <SeedAttachmentInput.HiddenInput />
        </SeedAttachmentInput.Root>
      )}
    </Box>
  );
}
