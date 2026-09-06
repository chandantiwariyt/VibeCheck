# Security Specification & Threat Model

## 1. Data Invariants
1. **Strict User Isolation**: Every journal entry and message belongs strictly to the user identified by `request.auth.uid`. No user can read, list, create, edit, or delete another user's entries or messages.
2. **Relational Sync (Master Gate)**: A message in `/entries/{entryId}/messages/{messageId}` cannot be created or accessed unless its parent entry `/entries/{entryId}` exists and is owned by `request.auth.uid`.
3. **Identity Immutability**: The `userId` and `createdAt` fields on `/entries/{entryId}` and `/entries/{entryId}/messages/{messageId}` are immutable once created.
4. **Verified Authentication**: Write operations require `request.auth != null` and `request.auth.token.email_verified == true`.
5. **Payload Bounds & Key Validation**: 
   - Entry titles cannot exceed 200 characters.
   - Entry contents and message contents cannot exceed 10,000 characters.
   - Tags array cannot exceed 5 items.
   - Timestamps must equal `request.time`.
   - Update operations can only touch allowed fields (`title`, `content`, `mode`, `summary`, `tags`, `updatedAt`).

---

## 2. The "Dirty Dozen" Malicious Payloads

1. **Spoofed User Create (Entry)**: Attacker sends an entry where `userId` is another user's UID (`attacker_uid != victim_uid`). Target: `PERMISSION_DENIED`.
2. **Unauthenticated Read (Entry)**: Unauthenticated visitor attempts to fetch or list `/entries`. Target: `PERMISSION_DENIED`.
3. **Cross-User Entry Read**: Authenticated user B attempts to `get` `/entries/{entry_owned_by_A}`. Target: `PERMISSION_DENIED`.
4. **Blanket Query Scraping**: Authenticated user B attempts a collection query `collection(db, 'entries')` without filtering by `where('userId', '==', userB.uid)`. Target: `PERMISSION_DENIED`.
5. **Orphan Message Injection**: Attacker attempts to write a message under a non-existent `entryId`. Target: `PERMISSION_DENIED`.
6. **Cross-User Message Theft**: Attacker tries to write a message under user A's existing `entryId`. Target: `PERMISSION_DENIED`.
7. **Timestamp Tampering**: Attacker sends a fake historical or future `createdAt` / `updatedAt` instead of `request.time`. Target: `PERMISSION_DENIED`.
8. **Shadow Field Injection**: Attacker injects `{ isAdmin: true, role: 'superadmin' }` into an entry update or create payload. Target: `PERMISSION_DENIED`.
9. **Volumetric Overflow (Denial of Wallet)**: Attacker sends a 500,000-character string in `title` or `content`. Target: `PERMISSION_DENIED`.
10. **Tag Array Flooding**: Attacker submits an array of 5,000 tags. Target: `PERMISSION_DENIED`.
11. **Id Poisoning Attack**: Attacker attempts to target a document with an invalid 2KB ID with special characters like `/entries/../../../evil`. Target: `PERMISSION_DENIED`.
12. **Ownership Hijack Update**: Attacker attempts to update an entry they own by changing `userId` to transfer it to another account. Target: `PERMISSION_DENIED`.

---

## 3. Test Runner Specification
The rules enforce default deny, attribute checks, relational lookup on subcollections, and strict key validation so that all Dirty Dozen payloads fail with `PERMISSION_DENIED`.
