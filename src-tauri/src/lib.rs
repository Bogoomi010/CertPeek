use p12_keystore::Pkcs12Archive;
use serde::Serialize;
use sha1::Sha1;
use sha2::{Digest, Sha256};
use x509_parser::oid_registry::OidRegistry;
use x509_parser::prelude::*;
use x509_parser::public_key::PublicKey;
use x509_parser::der_parser::oid::Oid;

#[derive(Serialize)]
pub struct Extension {
    name: String,
    critical: bool,
}

#[derive(Serialize)]
pub struct CertInfo {
    subject: String,
    issuer: String,
    serial: String,
    version: u32,
    not_before: String,
    not_after: String,
    is_valid_now: bool,
    is_ca: bool,
    signature_algorithm: String,
    public_key: String,
    san: Vec<String>,
    key_usage: Vec<String>,
    extended_key_usage: Vec<String>,
    sha1: String,
    sha256: String,
    extensions: Vec<Extension>,
}

fn hex(bytes: &[u8]) -> String {
    bytes.iter().map(|b| format!("{b:02X}")).collect::<Vec<_>>().join(":")
}

fn oid_name(reg: &OidRegistry, oid: &Oid) -> String {
    reg.get(oid)
        .map(|e| e.sn().to_string())
        .unwrap_or_else(|| oid.to_id_string())
}

fn describe(der: &[u8], reg: &OidRegistry) -> Result<CertInfo, String> {
    let (_, cert) = X509Certificate::from_der(der).map_err(|e| e.to_string())?;

    let public_key = match cert.public_key().parsed() {
        Ok(PublicKey::RSA(k)) => format!("RSA {} bit", k.key_size()),
        Ok(PublicKey::EC(k)) => format!("EC {} bit", k.key_size()),
        Ok(PublicKey::DSA(_)) => "DSA".into(),
        _ => oid_name(reg, &cert.public_key().algorithm.algorithm),
    };

    let san = cert
        .subject_alternative_name()
        .ok()
        .flatten()
        .map(|s| s.value.general_names.iter().map(|n| n.to_string()).collect())
        .unwrap_or_default();

    let key_usage = cert
        .key_usage()
        .ok()
        .flatten()
        .map(|k| k.value.to_string().split(", ").map(String::from).collect())
        .unwrap_or_default();

    let extended_key_usage = cert
        .extended_key_usage()
        .ok()
        .flatten()
        .map(|e| {
            let e = e.value;
            let mut v = Vec::new();
            if e.any { v.push("Any".to_string()); }
            if e.server_auth { v.push("Server Auth".to_string()); }
            if e.client_auth { v.push("Client Auth".to_string()); }
            if e.code_signing { v.push("Code Signing".to_string()); }
            if e.email_protection { v.push("Email Protection".to_string()); }
            if e.time_stamping { v.push("Time Stamping".to_string()); }
            if e.ocsp_signing { v.push("OCSP Signing".to_string()); }
            v.extend(e.other.iter().map(|o| o.to_id_string()));
            v
        })
        .unwrap_or_default();

    let is_ca = cert
        .basic_constraints()
        .ok()
        .flatten()
        .map(|b| b.value.ca)
        .unwrap_or(false);

    Ok(CertInfo {
        subject: cert.subject().to_string(),
        issuer: cert.issuer().to_string(),
        serial: cert.raw_serial_as_string().to_uppercase(),
        version: cert.version().0 + 1,
        not_before: cert.validity().not_before.to_rfc2822().map_err(|e| e.to_string())?,
        not_after: cert.validity().not_after.to_rfc2822().map_err(|e| e.to_string())?,
        is_valid_now: cert.validity().is_valid(),
        is_ca,
        signature_algorithm: oid_name(reg, &cert.signature_algorithm.algorithm),
        public_key,
        san,
        key_usage,
        extended_key_usage,
        sha1: hex(&Sha1::digest(der)),
        sha256: hex(&Sha256::digest(der)),
        extensions: cert
            .extensions()
            .iter()
            .map(|e| Extension { name: oid_name(reg, &e.oid), critical: e.critical })
            .collect(),
    })
}

/// Error string the frontend matches on to prompt for a PKCS#12 password.
pub const WRONG_PASSWORD: &str = "WRONG_PASSWORD";

/// Parses a PEM (one or more CERTIFICATE blocks), a single DER certificate,
/// or a PKCS#12 archive (all certificates it contains).
#[tauri::command]
fn parse_cert(data: Vec<u8>, password: Option<String>) -> Result<Vec<CertInfo>, String> {
    let reg = OidRegistry::default().with_all_crypto().with_x509();
    let is_pem = data
        .iter()
        .position(|b| !b.is_ascii_whitespace())
        .is_some_and(|i| data[i..].starts_with(b"-----BEGIN"));

    let certs = if is_pem {
        Pem::iter_from_buffer(&data)
            .filter_map(|p| p.ok())
            .filter(|p| p.label == "CERTIFICATE")
            .map(|p| describe(&p.contents, &reg))
            .collect::<Result<Vec<_>, _>>()?
    } else if let Ok(info) = describe(&data, &reg) {
        vec![info]
    } else {
        // ponytail: not X.509 DER → assume PKCS#12; MAC mismatch is the only wrong-password signal we surface
        let archive = Pkcs12Archive::from_pkcs12(&data, password.as_deref().unwrap_or(""))
            .map_err(|e| match e {
                p12_keystore::error::Error::MacError(_) => WRONG_PASSWORD.to_string(),
                e => e.to_string(),
            })?;
        archive
            .certs
            .iter()
            .map(|c| describe(c.cert.as_der(), &reg))
            .collect::<Result<Vec<_>, _>>()?
    };

    if certs.is_empty() {
        return Err("No certificate found in file".into());
    }
    Ok(certs)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![parse_cert])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_der_and_pem_chain() {
        let der = parse_cert(include_bytes!("../tests/fixtures/root.cer").to_vec(), None).unwrap();
        assert_eq!(der.len(), 1);
        assert!(der[0].is_ca);
        assert_eq!(der[0].sha256.len(), 32 * 3 - 1);

        let pem = parse_cert(include_bytes!("../tests/fixtures/chain.pem").to_vec(), None).unwrap();
        assert_eq!(pem.len(), 2);
        assert_eq!(pem[0].sha256, der[0].sha256);

        assert!(parse_cert(b"not a cert".to_vec(), None).is_err());
    }

    #[test]
    fn parses_password_protected_p12() {
        let p12 = include_bytes!("../tests/fixtures/test.p12").to_vec();
        let root = parse_cert(include_bytes!("../tests/fixtures/root.cer").to_vec(), None).unwrap();

        assert_eq!(parse_cert(p12.clone(), None).err().as_deref(), Some(WRONG_PASSWORD));
        assert_eq!(parse_cert(p12.clone(), Some("wrong".into())).err().as_deref(), Some(WRONG_PASSWORD));

        let certs = parse_cert(p12, Some("test1234".into())).unwrap();
        assert_eq!(certs.len(), 2);
        assert!(certs.iter().any(|c| c.subject == "CN=p12-test-leaf"));
        assert!(certs.iter().any(|c| c.sha256 == root[0].sha256));
    }
}
