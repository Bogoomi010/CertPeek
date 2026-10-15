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

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
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
      </HStack>

      <Section title={t.general}>
        <Row label="Subject" value={cert.subject} />
        <Row label="Issuer" value={cert.issuer} />
        <Row label="Serial" value={cert.serial} mono />
        <Row label="Version" value={`V${cert.version}`} />
        <Row label={t.validFrom} value={cert.not_before} />
        <Row label={t.validUntil} value={cert.not_after} />
        <Row label={t.signatureAlgorithm} value={cert.signature_algorithm} />
        <Row label={t.publicKey} value={cert.public_key} />
      </Section>

      <Section title={t.fingerprints}>
        <Row label="SHA-256" value={cert.sha256} mono />
        <Row label="SHA-1" value={cert.sha1} mono />
      </Section>

      <Section title={t.extensions}>
        <Row label="SAN" value={cert.san.join(", ")} />
        <Row label="Key Usage" value={cert.key_usage.join(", ")} />
        <Row label="Extended Key Usage" value={cert.extended_key_usage.join(", ")} />
        <Row
          label={t.allExtensions}
          value={cert.extensions.map((e) => (e.critical ? `${e.name} (critical)` : e.name)).join(", ")}
        />
      </Section>
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
                label={t.passwordLabel}
                value={password}
                onValueChange={({ value }) => setPassword(value)}
                errorMessage={error}
                invalid={!!error}
              >
                <TextFieldInput ref={passwordRef} type="password" autoFocus />
              </TextField>
              <ActionButton type="submit" variant="brandSolid" size="medium">
                {t.open}
              </ActionButton>
              <ActionButton type="button" variant="neutralWeak" size="small" onClick={reset}>
                {t.chooseAnother}
              </ActionButton>
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
