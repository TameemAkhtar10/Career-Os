import { env } from "../config/env.js";
import { ApiError } from "../utils/ApiError.js";

let _verifierOverride = null;
let _oauthClient = null;

/**
 * Injects a custom verifier function for tests.
 * Signature: async (idToken: string, audience?: string) => { sub, email, email_verified, name, picture }
 * Pass null to restore the real verifier.
 */
export function setGoogleTokenVerifier(verifier) {
  _verifierOverride = verifier;
}

export function getGoogleTokenVerifier() {
  return _verifierOverride;
}

async function getOAuthClient() {
  if (!_oauthClient) {
    let OAuth2Client;
    try {
      const mod = await import("google-auth-library");
      OAuth2Client = mod.OAuth2Client;
    } catch {
      console.error("[auth:google] Error: config missing");
      throw new ApiError(503, "Google sign-in is not configured.");
    }
    _oauthClient = new OAuth2Client(env.GOOGLE_CLIENT_ID);
  }
  return _oauthClient;
}

/**
 * Verifies a Google ID token (credential).
 * Returns verified payload: { sub, email, email_verified, name, picture }
 *
 * Security:
 * - Never trusts client-supplied user data
 * - Validates audience against GOOGLE_CLIENT_ID
 * - Requires email_verified === true
 * - Generic error to client ("Google sign-in failed")
 * - Sanitized logging: only provider and error category, never tokens or payloads
 */
export async function verifyGoogleIdToken(idToken) {
  // If verifier is overridden (e.g. in tests)
  if (_verifierOverride) {
    try {
      const payload = await _verifierOverride(idToken, env.GOOGLE_CLIENT_ID);
      if (!payload || !payload.sub || !payload.email) {
        console.warn("[auth:google] Error: invalid signature or malformed token");
        throw new ApiError(401, "Google sign-in failed.");
      }
      if (payload.email_verified !== true) {
        console.warn("[auth:google] Error: email not verified");
        throw new ApiError(401, "Google sign-in failed.");
      }
      return {
        sub: payload.sub,
        email: payload.email.toLowerCase(),
        email_verified: Boolean(payload.email_verified),
        name: payload.name || "",
        picture: payload.picture || "",
      };
    } catch (err) {
      if (err instanceof ApiError) throw err;
      const msg = String(err?.message || "").toLowerCase();
      let category = "invalid signature or malformed token";
      if (msg.includes("recipient") || msg.includes("audience") || msg.includes("aud")) {
        category = "audience mismatch";
      } else if (msg.includes("too early") || msg.includes("too late") || msg.includes("expired") || msg.includes("exp")) {
        category = "token used too early or too late";
      } else if (msg.includes("email")) {
        category = "email not verified";
      }
      console.warn(`[auth:google] Error: ${category}`);
      throw new ApiError(401, "Google sign-in failed.");
    }
  }

  // Production path
  if (!env.GOOGLE_CLIENT_ID) {
    console.error("[auth:google] Error: config missing");
    throw new ApiError(503, "Google sign-in is not configured.");
  }

  try {
    const client = await getOAuthClient();
    const ticket = await client.verifyIdToken({
      idToken,
      audience: env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.sub || !payload.email) {
      console.warn("[auth:google] Error: invalid signature or malformed token");
      throw new ApiError(401, "Google sign-in failed.");
    }

    if (payload.aud !== env.GOOGLE_CLIENT_ID) {
      console.warn("[auth:google] Error: audience mismatch");
      throw new ApiError(401, "Google sign-in failed.");
    }

    if (payload.email_verified !== true) {
      console.warn("[auth:google] Error: email not verified");
      throw new ApiError(401, "Google sign-in failed.");
    }

    return {
      sub: payload.sub,
      email: payload.email.toLowerCase(),
      email_verified: true,
      name: payload.name || "",
      picture: payload.picture || "",
    };
  } catch (err) {
    if (err instanceof ApiError) throw err;
    const msg = String(err?.message || "").toLowerCase();
    let category = "invalid signature or malformed token";
    if (msg.includes("recipient") || msg.includes("audience") || msg.includes("aud")) {
      category = "audience mismatch";
    } else if (msg.includes("too early") || msg.includes("too late") || msg.includes("expired") || msg.includes("exp")) {
      category = "token used too early or too late";
    }
    console.warn(`[auth:google] Error: ${category}`);
    throw new ApiError(401, "Google sign-in failed.");
  }
}


