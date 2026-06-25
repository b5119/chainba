# ChainBa Security Audit

Date: 2026-06-25
Scope: Smart contracts (`contracts/`), backend API (`chainba-backend/`), frontend (`chainba-frontend/`).

Severity scale: **Critical** (immediate compromise / loss of funds or data), **High**, **Medium**, **Low**.

---

## Summary

13 issues found. All backend issues — which are live and exploitable against the running
API — have been **fixed in this commit**. Smart-contract issues are documented with
recommended fixes; applying them requires **redeploying** the contracts and updating
`addresses.json`, so they are left for a coordinated deploy rather than silently changing
already-deployed bytecode.

| ID | Severity | Area | Status |
|----|----------|------|--------|
| B-1 | Critical | Hardcoded admin key in source (`chainba2026`) | ✅ Fixed |
| B-2 | High | Admin endpoint leaked NRC/national-ID PII | ✅ Fixed |
| B-3 | High | No rate limiting (brute-force on login/register) | ✅ Fixed |
| B-4 | High | Weak/known default JWT secret → token forgery | ✅ Fixed (startup guard + rotated) |
| B-5 | Medium | "List all complaints" exposed to any logged-in user | ✅ Fixed |
| B-6 | Medium | NoSQL injection via typed JSON in auth | ✅ Fixed |
| B-7 | Medium | Internal error messages leaked to clients | ✅ Fixed |
| B-8 | Medium | No security headers / no body-size limit | ✅ Fixed |
| B-9 | Low | User enumeration via distinct login errors | ✅ Fixed |
| SC-1 | High | Predictable rotation-order randomness | ⚠️ Documented |
| SC-2 | Medium | Stakes can become permanently stuck | ⚠️ Documented |
| SC-3 | Low | `flagDefault` DoS if reputation contract paused | ⚠️ Documented |
| SC-4 | Low | Dead `penaltyAmount` parameter (false expectation) | ⚠️ Documented |

---

## Backend findings (fixed)

### B-1 — Hardcoded admin key (Critical)
`routes/admin.js` contained `const ADMIN_KEY = "chainba2026";`. Anyone with the source
(or who guessed it) could call `GET /api/admin/users` and dump every user.
**Fix:** moved to `ADMIN_KEY` env var, constant-time comparison, **fails closed** when unset
(`middleware/adminAuth.js`). A fresh random key was generated into `.env`.

### B-2 — PII over-exposure (High)
`GET /api/admin/users` returned `nrcNumber` (national ID) and `identityHash`.
**Fix:** `identityHash` and `nrcNumber`-adjacent secrets removed from the projection
(`-passwordHash -encryptedKey -identityHash`). The endpoint is now also behind the
hardened admin gate.

### B-3 — No rate limiting (High)
`express-rate-limit` was a dependency but never wired up; login/register were unthrottled.
**Fix:** global limiter (300/15min) on `/api`, strict limiter (20/15min) on `/api/auth`.

### B-4 — Weak JWT secret → full account takeover (High)
`JWT_SECRET` was the guessable string `chainba_secret_key_2026_chain_keepers`. Knowing it
lets an attacker forge a token for any `userId`/`walletAddress`.
**Fix:** startup guard in `index.js` refuses to boot on a missing, <32-char, or known-default
secret; rotated `.env` to a 96-char random secret. (Existing tokens are invalidated — users
re-login once.)

### B-5 — Complaints list exposed to all users (Medium)
`GET /api/complaints` (every complaint, with reporter/defaulter names + addresses) was
gated only by `authMiddleware`, so any logged-in user could read all of them. The frontend
never uses this endpoint.
**Fix:** moved behind `adminAuth`. Per-group `GET /api/complaints/:groupAddress` keeps user
auth but now validates the address format.

### B-6 — NoSQL injection (Medium)
Auth used `User.findOne({ phone })` directly from JSON body. A payload like
`{"phone": {"$gt": ""}}` injects a Mongo operator.
**Fix:** strict `typeof === 'string'` validation on all auth inputs; address fields in
complaints validated against `0x[40-hex]`; numeric `cycle` coerced safely.

### B-7 — Error-message info disclosure (Medium)
`'Server error: ' + err.message` returned stack/driver internals to clients.
**Fix:** generic `'Server error'` to clients; full detail logged server-side only.

### B-8 — Missing hardening (Medium)
No security headers, no request-size cap.
**Fix:** added `X-Content-Type-Options`, `X-Frame-Options: DENY`, `Referrer-Policy`, CSP,
`x-powered-by` disabled, and `express.json({ limit: '16kb' })`. CORS origins are now
env-configurable (`CORS_ORIGINS`).

### B-9 — User enumeration (Low)
Login distinguished "No account found" vs "Incorrect password", and timing differed when
the user was missing.
**Fix:** single "Invalid phone number or password" message + a dummy bcrypt compare so
timing is constant whether or not the account exists.

### Admin auth — now JWT role-based (resolved)
The original shared-key admin auth has been **replaced** with JWT role-based access:
- `User` has an `isAdmin` flag (default `false`).
- `middleware/requireAdmin.js` runs after `authMiddleware` and reads the flag **from the
  database** (not from the token), so revoking admin takes effect immediately.
- `/api/admin/users` and `GET /api/complaints` now require `authMiddleware + requireAdmin`.
- The shared key (`x-admin-key` / `ADMIN_KEY` / `REACT_APP_ADMIN_KEY`) is fully removed.
- Grant admin with `node scripts/promote-admin.js <phone>` (from `chainba-backend/`).

---

## Smart-contract findings (documented — require redeploy)

### SC-1 — Predictable rotation order (High)
`ChilimbaGroup._activateGroup()` shuffles the payout rotation with
`keccak256(block.timestamp, block.prevrandao, i)`. These are influenceable by the block
proposer, who can bias who gets paid first (a real economic advantage in a ROSCA).
**Recommended fix:** use Chainlink VRF, or a commit-reveal scheme among members, for the
shuffle seed. On-chain block data is not a secure randomness source.

### SC-2 — Stakes can become permanently stuck (Medium)
In `_returnStakes()`, if a member's `call` fails, `stakeReturned` is reset to `false` but
there is no function to retry the withdrawal later. A member with a reverting fallback (or a
transient failure) loses their stake with no recovery path.
**Recommended fix:** switch to a pull-payment pattern — record an owed balance and add a
`claimStake()` the member calls themselves. Same applies to `_releasePayout` (a beneficiary
that reverts blocks the whole cycle).

### SC-3 — `flagDefault` DoS if reputation contract paused (Low)
`flagDefault` wraps the `record*` calls in try/catch but calls
`reputationContract.getScore(member)` unguarded. If the reputation contract is paused or
reverts, `flagDefault` reverts, so defaulters can't be flagged/ejected.
**Recommended fix:** wrap `getScore` in try/catch (skip ejection on failure) or read score
defensively.

### SC-4 — Dead `penaltyAmount` (Low)
`penaltyAmount` is stored and passed around but never used in any logic, implying a penalty
mechanism that doesn't exist. Either implement it or remove it to avoid false assumptions.

Note: reentrancy was checked — `payContribution`/`joinGroup` use `nonReentrant` and update
state before external calls, so the core flows are protected.

---

## How to run safely after this change
1. Backend `.env` now requires `JWT_SECRET` (≥32 chars) and `ADMIN_KEY`. Both were generated.
2. Frontend admin panel reads `REACT_APP_ADMIN_KEY` from `chainba-frontend/.env` (gitignored).
3. Restart the backend; users will need to log in again (JWT secret rotated).
