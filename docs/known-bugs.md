# Known bugs

All seven findings below were verified against the code and **fixed** (2026-07-02).
The former TODO regressions under `test/` are now enforced tests (`npm test`,
22 passing). Live verification: freshly published projects contain no
`write_key` (existing Supabase rows were scrubbed with
`update projects set data = data - 'share'`), and a clean client device shows
the correct project in the header.

Fix summary:

- Write-key leak → `shareProject()` and `encodeShare()` strip `share` from
  every client-readable payload; the key travels only as an RPC argument.
- Duplicate reuses cloud identity → `duplicate()` deletes `share` from copies.
- Encode crash → `encodePayload()` converts bytes in 32KB chunks.
- Wrong client header → the Client view reports the fetched payload up to
  `App` (`onLoaded`), which never uses local projects for client routes.
- Orphaned option IDs → `resolveAnswer()` validates choice values against the
  question's current options (contractor answers and client picks alike).
- Room counts → `getRoomCount()` floors to an integer and clamps to the source
  question's configured `min`/`max` (fallback cap 12).
- Stale sync overwrite → `setProjects` accepts updater functions; the dashboard
  sync merges submissions against the latest state after its awaits.

Original findings follow for reference.

## High severity

### Cloud write key can reach clients

After the first cloud publish, `project.share` contains both the public ID and
the contractor-only `write_key`. A later publish sends the complete project as
`p_data`, so Supabase stores that secret inside the client-readable project
data. Offline sharing also encodes `project.share` unchanged.

Expected: remove private sharing metadata from every client-readable project
snapshot while still passing the key separately to the authenticated RPC
arguments.

Coverage: `shared payloads never expose the cloud write key` in
`test/link.test.js` covers the offline form of the leak.

### Duplicating a shared project reuses its cloud identity

`Projects.duplicate()` spreads `newProject()` over the source project, but
`newProject()` has no `share` property. The source `share.id` and `write_key`
therefore remain on the copy. Publishing the copy updates the original cloud
project instead of creating a separate share.

Expected: duplicated projects must omit `share`.

### Large offline shares can crash before image fallback

`encodePayload()` spreads the complete encoded byte array into
`String.fromCharCode()`. A catalog photo around 150 KB is enough to exceed V8's
function-argument limit. The exception occurs before `encodeShare()` can check
the URL length and strip catalog photos.

Expected: encode bytes in chunks, or strip/size-check photos before encoding.

Coverage: `large catalog photos reach the size fallback without throwing` in
`test/link.test.js`.

## Medium severity

### Cloud client header shows the wrong project

`App` only decodes metadata for offline `?d=` client links. For cloud `?id=`
links, the global title block reads the active project from that browser's
local storage. A new client device is seeded with the sample project, so the
header can say “Alder St Residence” while the loaded client form is for a
different project.

Expected: lift the loaded cloud payload metadata to `App`, or let the client
route render its own header from the fetched project.

### Removed option IDs are counted as completed selections

`resolveAnswer()` accepts any truthy client pick without verifying that the ID
still exists in the question's options. Progress then counts the item as a
client selection and the client form omits it, while the printed sheet cannot
find the option and renders the row as open.

Expected: validate contractor answers and client picks against current choice
options before treating them as resolved.

Coverage: `invalid or removed option IDs remain open instead of counting as
client selections` in `test/model.test.js`.

### Fractional and out-of-range room counts produce inconsistent totals

`getRoomCount()` returns fractional values and clamps to a hard-coded 12 rather
than the source question's integer `max` of 6. `Array.from({ length: 2.5 })`
renders two rooms, but the selection loops using `i < 2.5` count three rooms.

Expected: normalize to an integer and honor the count source's configured
minimum and maximum.

Coverage: `room counts honor the source question's integer range` in
`test/model.test.js`.

### Dashboard sync can overwrite edits made while requests are in flight

The mount-only cloud sync effect snapshots `projects`, awaits submissions, and
later saves a map cloned from that old snapshot. Intake or project edits made
before the requests complete can be replaced by stale data.

Expected: merge submissions through a functional state update against the
latest projects map.
