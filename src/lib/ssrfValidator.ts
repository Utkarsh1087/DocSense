/**
 * ssrfValidator.ts — Security utility to validate URLs and prevent Server-Side Request Forgery (SSRF).
 * Blocks loopback, private networks, cloud metadata endpoints, and non-HTTP(S) protocols.
 */

// Forbidden hostnames and IP patterns (IPv4 and IPv6)
const FORBIDDEN_HOSTS = [
  "localhost",
  "127.0.0.1",
  "::1",
  "0.0.0.0",
  "169.254.169.254", // AWS/GCP/Azure Instance Metadata
  "metadata.google.internal",
  "instance-data",
];

// Check if an IPv4 address falls within private/reserved ranges
function isPrivateIPv4(ip: string): boolean {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((p) => isNaN(p) || p < 0 || p > 255)) {
    return false;
  }

  const [a, b] = parts;
  // 10.0.0.0/8 (Private)
  if (a === 10) return true;
  // 172.16.0.0/12 (Private)
  if (a === 172 && b >= 16 && b <= 31) return true;
  // 192.168.0.0/16 (Private)
  if (a === 192 && b === 168) return true;
  // 127.0.0.0/8 (Loopback)
  if (a === 127) return true;
  // 169.254.0.0/16 (Link-Local / Cloud Metadata)
  if (a === 169 && b === 254) return true;
  // 0.0.0.0/8 (Current network)
  if (a === 0) return true;

  return false;
}

/**
 * Validates a user-provided URL against SSRF vulnerabilities.
 * @param urlStr - The input URL to test
 * @returns { isValid: boolean, error?: string, parsedUrl?: URL }
 */
export function validateSafeUrl(urlStr: string): { isValid: boolean; error?: string; parsedUrl?: URL } {
  try {
    const parsed = new URL(urlStr);

    // 1. Enforce strict HTTP/HTTPS protocol
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return { isValid: false, error: "Only standard HTTP and HTTPS URLs are permitted." };
    }

    const hostname = parsed.hostname.toLowerCase();

    // 2. Reject known forbidden hostnames
    if (FORBIDDEN_HOSTS.includes(hostname)) {
      return { isValid: false, error: "Access to loopback or metadata endpoints is strictly forbidden." };
    }

    // 3. Reject private IP addresses
    if (isPrivateIPv4(hostname)) {
      return { isValid: false, error: "Access to private or local network addresses is forbidden." };
    }

    // 4. Reject suspicious schemes/ports (e.g. internal admin ports)
    const port = parsed.port ? parseInt(parsed.port, 10) : parsed.protocol === "https:" ? 443 : 80;
    const dangerousPorts = [22, 23, 25, 3306, 5432, 6379, 27017, 9200];
    if (dangerousPorts.includes(port)) {
      return { isValid: false, error: `Connections to port ${port} are restricted.` };
    }

    return { isValid: true, parsedUrl: parsed };
  } catch {
    return { isValid: false, error: "Invalid URL format." };
  }
}
