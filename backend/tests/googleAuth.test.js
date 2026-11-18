import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { User } from "../src/models/user.model.js";
import { googleSignIn, login } from "../src/controllers/auth.controller.js";
import { googleSignInSchema } from "../src/validators/auth.schemas.js";
import { setGoogleTokenVerifier } from "../src/services/googleAuth.service.js";
import { ApiError } from "../src/utils/ApiError.js";

function createMockResponse() {
  const res = {
    statusCode: 200,
    headers: {},
    cookies: {},
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    },
    cookie(name, val, opts) {
      this.cookies[name] = { val, opts };
      return this;
    },
    clearCookie(name) {
      delete this.cookies[name];
      return this;
    },
    setHeader(name, val) {
      this.headers[name] = val;
      return this;
    },
  };
  return res;
}

describe("Google Identity Services Authentication", () => {
  const originalFindOne = User.findOne;
  const originalCreate = User.create;

  beforeEach(() => {
    setGoogleTokenVerifier(null);
  });

  afterEach(() => {
    User.findOne = originalFindOne;
    User.create = originalCreate;
    setGoogleTokenVerifier(null);
  });

  it("1) valid token for a new user without role returns needsRole", async () => {
    setGoogleTokenVerifier(async () => ({
      sub: "google-sub-new-1",
      email: "newcandidate@example.com",
      email_verified: true,
      name: "New Candidate",
      picture: "https://example.com/avatar.png",
    }));

    User.findOne = () => ({
      select: () => null,
    });

    const req = { body: { credential: "mock-valid-id-token" } };
    const res = createMockResponse();

    await googleSignIn(req, res, () => {});

    assert.equal(res.statusCode, 200);
    assert.equal(res.body?.success, true);
    assert.equal(res.body?.data?.needsRole, true);
  });

  it("2) new user with role creates a verified passwordless user", async () => {
    setGoogleTokenVerifier(async () => ({
      sub: "google-sub-new-2",
      email: "brandnew@example.com",
      email_verified: true,
      name: "Brand New User",
      picture: "https://example.com/avatar.png",
    }));

    let createdData = null;
    User.findOne = () => ({
      select: () => null,
    });
    User.create = async (payload) => {
      createdData = payload;
      return {
        ...payload,
        _id: "mock-new-id-2",
        createdAt: new Date().toISOString(),
        save: async () => {},
      };
    };

    const req = { body: { credential: "mock-token", role: "candidate" } };
    const res = createMockResponse();

    await googleSignIn(req, res, () => {});

    assert.equal(res.statusCode, 200);
    assert.equal(createdData.email, "brandnew@example.com");
    assert.equal(createdData.role, "candidate");
    assert.equal(createdData.isEmailVerified, true);
    assert.equal(createdData.googleId, "google-sub-new-2");
    assert.equal(createdData.password, undefined);
    assert.equal(res.body?.data?.isNewUser, true);
    assert.equal(res.body?.data?.user?.email, "brandnew@example.com");
    assert.ok(res.cookies?.accessToken);
    assert.ok(res.cookies?.refreshToken);
  });

  it("3) existing email links googleId", async () => {
    setGoogleTokenVerifier(async () => ({
      sub: "google-sub-existing",
      email: "existinguser@example.com",
      email_verified: true,
      name: "Existing User",
    }));

    const mockExistingUser = {
      _id: "existing-user-id-3",
      email: "existinguser@example.com",
      name: "Existing User",
      role: "candidate",
      status: "active",
      isEmailVerified: false,
      googleId: undefined,
      authProviders: ["password"],
      createdAt: new Date().toISOString(),
      saveCalled: false,
      async save() {
        this.saveCalled = true;
      },
    };

    User.findOne = (query) => {
      if (query.googleId) return { select: () => null };
      if (query.email) return { select: () => mockExistingUser };
      return { select: () => null };
    };

    const req = { body: { credential: "mock-token" } };
    const res = createMockResponse();

    await googleSignIn(req, res, () => {});

    assert.equal(res.statusCode, 200);
    assert.equal(mockExistingUser.googleId, "google-sub-existing");
    assert.equal(mockExistingUser.isEmailVerified, true);
    assert.ok(mockExistingUser.authProviders.includes("google"));
    assert.equal(mockExistingUser.saveCalled, true);
    assert.equal(res.body?.data?.isNewUser, false);
    assert.equal(res.body?.data?.user?.googleLinked, true);
  });

  it("4) email_verified false is rejected with 401", async () => {
    setGoogleTokenVerifier(async () => ({
      sub: "google-sub-unverified",
      email: "unverified@example.com",
      email_verified: false,
    }));

    const req = { body: { credential: "unverified-token" } };
    const res = createMockResponse();
    let caughtError = null;

    await googleSignIn(req, res, (err) => {
      caughtError = err;
    });

    assert.ok(caughtError instanceof ApiError, "Expected ApiError to be passed to next");
    assert.equal(caughtError.statusCode, 401);
  });

  it("5) wrong audience is rejected with 401", async () => {
    setGoogleTokenVerifier(async () => {
      // Simulate audience mismatch rejection
      throw new ApiError(401, "Google sign-in failed.");
    });

    const req = { body: { credential: "wrong-aud-token" } };
    const res = createMockResponse();
    let caughtError = null;

    await googleSignIn(req, res, (err) => {
      caughtError = err;
    });

    assert.ok(caughtError instanceof ApiError, "Expected ApiError to be passed to next");
    assert.equal(caughtError.statusCode, 401);
  });

  it("6) admin account is rejected with 403", async () => {
    setGoogleTokenVerifier(async () => ({
      sub: "google-admin-sub",
      email: "admin@careeros.com",
      email_verified: true,
      name: "Admin User",
    }));

    const mockAdmin = {
      _id: "admin-id-4",
      email: "admin@careeros.com",
      role: "admin",
      status: "active",
      googleId: "google-admin-sub",
      isEmailVerified: true,
      save: async () => {},
    };

    User.findOne = () => ({
      select: () => mockAdmin,
    });

    const req = { body: { credential: "admin-token" } };
    const res = createMockResponse();
    let caughtError = null;

    await googleSignIn(req, res, (err) => {
      caughtError = err;
    });

    assert.ok(caughtError instanceof ApiError, "Expected ApiError to be passed to next");
    assert.equal(caughtError.statusCode, 403);
    assert.equal(caughtError.message, "Admin accounts must use email and password.");
  });

  it("7) role 'admin' in the body is rejected by validation", () => {
    const result = googleSignInSchema.safeParse({
      credential: "valid-token",
      role: "admin",
    });

    assert.equal(result.success, false);
    assert.ok(result.error.issues.some((issue) => issue.path.includes("role")));
  });

  it("8) passwordless user cannot log in with a password", async () => {
    const passwordlessUser = new User({
      name: "Google Passwordless",
      email: "googleonly@example.com",
      role: "candidate",
      googleId: "google-sub-pwless",
      isEmailVerified: true,
    });

    // comparePassword on passwordless account must return false safely
    const isMatch = await passwordlessUser.comparePassword("AttemptedPassword123!");
    assert.equal(isMatch, false);

    User.findOne = () => ({
      select: () => passwordlessUser,
    });

    const req = {
      body: { email: "googleonly@example.com", password: "AttemptedPassword123!" },
    };
    const res = createMockResponse();
    let caughtError = null;

    await login(req, res, (err) => {
      caughtError = err;
    });

    assert.ok(caughtError instanceof ApiError, "Expected ApiError to be passed to next");
    assert.equal(caughtError.statusCode, 401);
    assert.equal(caughtError.message, "Invalid email or password.");
  });

  it("9) blocked user is rejected with 403", async () => {
    setGoogleTokenVerifier(async () => ({
      sub: "google-sub-blocked",
      email: "blocked@example.com",
      email_verified: true,
    }));

    const mockSuspendedUser = {
      _id: "suspended-user-id",
      email: "blocked@example.com",
      role: "candidate",
      status: "suspended",
      isEmailVerified: true,
      googleId: "google-sub-blocked",
      save: async () => {},
    };

    User.findOne = () => ({
      select: () => mockSuspendedUser,
    });

    const req = { body: { credential: "blocked-token" } };
    const res = createMockResponse();
    let caughtError = null;

    await googleSignIn(req, res, (err) => {
      caughtError = err;
    });

    assert.ok(caughtError instanceof ApiError, "Expected ApiError to be passed to next");
    assert.equal(caughtError.statusCode, 403);
    assert.ok(caughtError.message.includes("suspended"));
  });

  it("10) unverified password user links via Google => old password login fails", async () => {
    const unverifiedUser = new User({
      name: "Unverified Person",
      email: "unverified.user@example.com",
      password: "OriginalPassword123!",
      role: "candidate",
      status: "active",
      isEmailVerified: false,
      authProviders: ["password"],
      refreshTokenHash: "old-refresh-token-hash",
    });

    User.findOne = (query) => {
      if (query.googleId) return { select: () => null };
      if (query.email) return { select: () => unverifiedUser };
      return { select: () => null };
    };

    setGoogleTokenVerifier(async () => ({
      sub: "google-sub-unverified-linked",
      email: "unverified.user@example.com",
      email_verified: true,
      name: "Unverified Person",
    }));

    const reqGoogle = { body: { credential: "mock-google-token" } };
    const resGoogle = createMockResponse();

    await googleSignIn(reqGoogle, resGoogle, () => {});
    assert.equal(resGoogle.statusCode, 200);

    // Password must be cleared, "password" removed from authProviders, refreshTokenHash invalidated
    assert.equal(unverifiedUser.password, undefined);
    assert.ok(!unverifiedUser.authProviders.includes("password"));
    assert.ok(unverifiedUser.authProviders.includes("google"));
    assert.equal(unverifiedUser.refreshTokenHash, null);
    assert.equal(unverifiedUser.isEmailVerified, true);
    assert.equal(unverifiedUser.googleId, "google-sub-unverified-linked");

    // Old password login must now fail with 401
    User.findOne = () => ({
      select: () => unverifiedUser,
    });

    const reqLogin = {
      body: {
        email: "unverified.user@example.com",
        password: "OriginalPassword123!",
      },
    };
    const resLogin = createMockResponse();
    let loginError = null;

    await login(reqLogin, resLogin, (err) => {
      loginError = err;
    });

    assert.ok(loginError instanceof ApiError, "Expected ApiError on old password login");
    assert.equal(loginError.statusCode, 401);
    assert.equal(loginError.message, "Invalid email or password.");
  });
});
