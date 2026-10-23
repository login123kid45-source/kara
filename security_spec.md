# Firestore Security Specification — KARA AI

## 1. Data Invariants
1. **Master Gate & Ownership Invariant**: Every subcollection document under `/users/{userId}/...` (`memories`, `messages`, `soapIncidents`) belongs exclusively to `userId` (`request.auth.uid == userId`), and requires the parent `/users/{userId}` document to exist (`exists(/databases/$(database)/documents/users/$(userId))`).
2. **Verified Identity Invariant**: All write operations require an authenticated user with `request.auth.token.email_verified == true`.
3. **Strict Schema & Key Whitelisting**: Every `create` and `update` operation validates exact required and allowed keys via `hasAll` and `hasOnly`, strict types, bounded string lengths, and integer ranges.
4. **Temporal Integrity**: `createdAt` must equal `request.time` on `create` and remain immutable (`incoming().createdAt == existing().createdAt`) on `update`. `updatedAt` must equal `request.time` on `create` and `update`.
5. **Query Enforcer**: Every `allow list` rule enforces `resource.data.userId == request.auth.uid` without calling `get()` or `exists()` inside `list`.

## 2. The "Dirty Dozen" Payloads (All Must Return PERMISSION_DENIED)
1. **Unverified Email Write**: `{ uid: "user1", ... }` where `request.auth.token.email_verified == false`.
2. **Cross-User Profile Read (PII/Profile Isolation)**: Authenticated `user2` attempting `get /users/user1`.
3. **Shadow Field Injection on Profile**: Creating `/users/user1` with extra key `{ ..., isAdmin: true }`.
4. **UID Spoofing in Subcollection**: Creating `/users/user1/memories/mem1` where `data.userId == "user2"`.
5. **Orphaned Subcollection Write**: Creating `/users/user1/messages/msg1` when `/users/user1` does not exist.
6. **Denial-of-Wallet String Overflow**: Creating `/users/user1/messages/msg1` with `content.size() > 8000`.
7. **Invalid Mode Enum**: Updating `preferredMode` on `/users/user1` to `"hacker_mode"`.
8. **Timestamp Forgery on Create**: Creating `/users/user1/memories/mem1` with a past client timestamp (`createdAt != request.time`).
9. **Immutable Timestamp Mutation**: Updating `/users/user1` while changing `createdAt`.
10. **ID Poisoning Attack**: Creating `/users/user1/memories/bad$id!` failing regex `^[a-zA-Z0-9_\-]+$`.
11. **Terminal State Violation on SoapIncident**: Attempting to update a `SoapIncident` after `existing().resolved == true`.
12. **Unauthorized List Scraping**: Listing `/users/user1/messages` as `user2`.
