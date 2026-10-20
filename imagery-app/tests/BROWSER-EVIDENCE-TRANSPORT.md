# Lossless native-evidence transport repair

This is a reporting/transport repair, not a change to the runtime, native
assertions, scenario order, screenshot settings, performance criteria, CI
actions, permissions, sandbox, or cleanup. Local transport tests and replaying
retained evidence do **not** constitute a new native, performance, screenshot,
package, or integration pass. Earlier failed, incomplete, or green-but-unreviewed
runs retain their original status.

## Records and exact bytes

The runner uses a controlled Node `Console` with separate stdout/stderr sinks.
Each original formatted UTF-8 write is stored in order, with stream identity, in
the temporary `evidence-records.jsonl` spool. Original multiline errors, timing
records, reports, capture metadata and capture base64 remain in that stream.
Case-start records are additional reporting records, not assertions.

Independent built-in Brotli quality-6 blocks contain at most 1 MiB of
uncompressed bytes. A case boundary also seals a pending block of at least
256 KiB. Each compressed block is split into at most 48 KiB base64 pieces. Each emitted
`IMAGERY_EVIDENCE_V1` envelope carries contiguous block indices, raw/compressed
lengths and SHA-256 values, contiguous piece indices/counts and canonical base64.
The decoder rejects missing, conflicting or interleaved pieces before bounded
block decompression. Raw payloads are not printed
again. Bounded `IMAGERY_EVIDENCE_STATUS` lines are human progress summaries only;
the decoder does not substitute them for original records.

Every original `IMAGERY_VISUAL_CAPTURE` is checked against its original decoded
byte length and SHA-256. No JPEG is resized, transcoded, re-encoded, deduplicated,
or replaced. Its other metadata is preserved exactly, not promoted into an
independently verified geometric claim. Existing review captures already use
their documented scale/quality settings; they are not unscaled native-resolution
screenshots.

The final envelope follows the original final report and browser/profile cleanup
outcome. It binds transcript length/hash, ordered capture manifest/hash, observed
counts, original report/hash, test status, cleanup, and `suiteCompleted`. The
decoder correlates all case starts with the ordered original result list.

## Completeness is not execution acceptance

`decodeEvidence` verifies strict canonical envelope/record JSON, bounded input,
encoded lines, Brotli output, records and captures, contiguous ordering, all
hashes/lengths/counts, the original report, and final completion. Duplicated,
missing, corrupt, reordered, truncated, or trailing conflicting records fail.
Unrelated Actions/setup/TAP lines and Actions timestamp prefixes, including a
leading BOM at a log-segment boundary, are supported without changing original
compressed record bytes.
No input is evaluated as code or used as an output pathname.

`complete: true` means that the emitted evidence reconstructed consistently.
It does not mean the browser tests passed. `accepted: true` additionally requires
the caller to supply independently verified terminal `jobConclusion: "success"`,
the expected case count, and the exact expected source/runtime identity; that
identity must include a clean checkout. Native PASS, completed suite, all PASS
results and successful browser/profile cleanup are also required. Expected
capture count can be supplied as an additional gate. PR16 and PR17 counts must
be selected from their actual source; the transport helper does not hardcode a
feature's scenario count.

If final output acknowledgement fails after a complete marker may have reached
the reader, an explicit abort marker invalidates it when output remains usable.
If the pipe stays broken, delivery of an abort cannot be guaranteed. The runner
therefore exits unsuccessfully, and self-reported log bytes alone cannot supply
the required independently verified terminal job success.

`allowPartial: true` can recover previously sealed blocks and complete records
from an interrupted or capped stream. It always returns nonacceptance without
complete transport. A missing final marker is never inferred from elapsed time,
a last PASS line, or a job summary.

## Bounded failure behavior

The helper enforces fixed maximums: 64 MiB decoded/spooled records, 4 MiB per
record, 20,000 records, 1,024 captures, 51,200 bytes per envelope line, and 32 MiB
decoder input. It bounds output using the explicitly configured native-output
budget, including envelopes and status lines, and reserves 8 KiB for terminal
failure/abort reporting.

An encoded-output cap, invalid payload, zero-progress disk write, disk failure,
or output failure latches an independent evidence failure instead of throwing
through a native scenario. Original assertions and browser/profile cleanup
continue. After an output cap, original records are still retained in the
bounded local spool. If the spool itself fails or exceeds its record/aggregate
bound, later spool retention stops explicitly and completeness fails; the
runner's original results report remains separate. No failed or truncated
transport is reported as successful delivery.

The temporary spool is not an uploaded artifact and is not a remotely
retrievable substitute once an ephemeral runner is gone. There is no new action,
credential, permission, package, upload, or external-storage destination.

## Budget evidence and limitations

The explicit native output budget is 7,350,000 bytes, not a published GitHub or
connector limit. A retained PR17 partial log contained 6,353,998 bytes and 198
captures. Its unchanged setup/Node prefix was 545,876 bytes. Replay of its
timestamp-stripped native text through the final Brotli framing design emitted
3,604,354 bytes when new case boundaries were approximated from recorded results.
Forcing a case boundary before every retained text line, to exercise more
frequent eligible sealing, emitted 3,713,830 bytes. These are transport replay
experiments, not native reruns. The analogous retained failed PR16 native corpus,
214 captures, emitted 4,656,563 and 4,687,258 bytes. Maximum emitted line length
was 49,433 bytes in all four experiments; each entire reconstructed spool matched
its original bytes. Synthetic replay reports remained BLOCKED and nonaccepted.

Original retained logs lacked case-start markers, so neither replay reconstructs
their exact historical case boundaries. The every-line experiment is a
sensitivity measurement, not a proven worst-case bound. A linear 350-capture
projection from the latter PR17 replay is approximately 6,564,851 native-output
bytes. Added transport-test logs, Actions timestamp overhead and package output
remain outside the native budget. The fixed cap leaves room above that estimate,
not a guarantee that the unknown remaining corpus will fit.

The less favorable 350/214 scaling from the older PR16 every-line replay is
approximately 7,666,076 native-output bytes, above the chosen cap. It must not be
hidden: neither linear projection is a bound. Current observed group captures
average about 18.6 kB (18,600 bytes) per JPEG, versus about 20,200 bytes
for current inherited captures; the old run had a larger mobile share. The
current group-bearing corpus is therefore the more directly relevant estimate,
but actual remaining images and reporting can still exhaust the cap.

A single local quality-8/9 sensitivity experiment used the same sealing policy
and exact reconstruction checks. Quality 9 reduced both retained replay sizes by
about 1.6%, but did not bring the less favorable PR16 linear 350-capture estimate
under the cap. Observed every-line replay CPU totals were approximately 0.46–0.98 seconds.
These are local transport measurements, not native/UI performance results.
Quality 6 remains selected; no additional tuning or silent cap increase follows.

That projection is not an upper bound: the observed desktop/mobile and
inherited/group capture mix is not homogeneous, and the complete target corpus
was not available. A previous failed PR16 run's 7,970,903-character raw response
was retrieved successfully; this is an observation, not proof of a service
boundary. Its 214 captures were also an incomplete planned corpus. The budget
must remain explicitly reviewed against observed output, including newly added
transport-test logs and non-native steps. A cap failure remains nonacceptance,
not permission to drop evidence, loosen assertions, or increase the budget
silently.

The 23 added transport tests emitted 5,510 TAP bytes across 148 lines in the local
check, approximately 9,950 bytes if each receives a 30-byte Actions timestamp.
A retained successful earlier run's package/post-job tail measured 3,035 bytes
across 38 timestamp-stripped lines, approximately 4,175 bytes with that prefix.
These measured examples, additional native-envelope timestamps, and the
545,876-byte prior setup prefix must be accounted for outside the 7,350,000-byte
native cap. They are not fixed service-overhead guarantees.

Splitting lines into independently compressed blocks does **not** create bounded
connector reads. The current dedicated connector reads a whole job, without
tail, range, or step-filter arguments. Compact encoding can reduce that response;
it cannot guarantee delivery through an undocumented whole-response limit.

## Local verification

Run `node --test imagery-app/tests/browser-evidence-transport.test.cjs`.
The helper exports `createConsoleTransport` and `decodeEvidence`; the latter
returns the exact ordered output records, original report and verified capture
manifest, without writing files. Consumers may reconstruct original stdout and
stderr by filtering the output records, or inspect exact capture bytes from the
original capture JSON. Generated filenames must not come from capture metadata.

Apply this helper, its tests, and the narrow runner reporting integration to an
evidence-harness-only source change when appropriate. Preserve exact runtime
bytes. A subsequent authorized changed-head CI run is fresh evidence, not a
retroactive reconstruction of the earlier unavailable complete log.
