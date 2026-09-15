# Threat model

What treadling defends, against whom, and which security reports are in scope.
[SECURITY.md](../SECURITY.md) is the route for a report and what happens after it; this file is the project detail behind it.

## Scope

treadling is a command-line tool that runs on your own machine and edits work-item files in a directory you point it at.
It opens no network connection in any code path, and the files it reads and writes are the workspace you gave it.
Its trust boundary is that repository content is untrusted: a workspace you cloned from someone else is attacker-controlled input, and the tool's job is to parse it, render it, and refuse the parts that are malformed without ever executing them.
Reports are in scope when they break that boundary.

In scope:

- Code execution of any kind, a write outside the resolved workspace, or a read outside it, caused by the content of a cloned workspace: a crafted record, event line, or configuration value. treadling runs no program and evaluates no string, by the decision in `docs/architecture/adr/0012-the-extension-surface-that-does-not-ship.md`, so any execution at all is a report against that record.
- Output that forges the tool's own agent-facing lines, so a consumer reads a field, an envelope, or a state the tool did not emit, from a crafted title, body, or field.
- A crafted field that rewrites or spoofs a terminal, or reorders a rendered row, past the store's own validation.
- An export (CSV, Markdown) that carries an attacker's content into a formula or a script when a person opens it.
- A malformed record that refuses service for the whole store rather than being quarantined to that one record.
- Resource exhaustion that gets past the tool's stated file-size, record-count, and depth ceilings rather than merely reaching a performance budget.
- A prototype-pollution or parser-abuse path through the record grammar or the event log.
- Any outbound connection opened by the process.
- State written where another user on the machine can read or redirect it: a predictable temp file, a followed symlink, or a world-writable store directory.

Out of scope:

- Anything a process already running as your own user can do. The workspace is your files; the tool defends against hostile repository content and against other users on the machine, not against yourself.
- The text of a work item read as instructions by an agent that was told the text is data. Titles, descriptions, reasons and notes are untrusted third-party content, the agent contract marks them as such, and an agent that executes them as instructions has a defect of its own. A field that forges the tool's own output lines, rather than merely reading as an instruction, is in scope, above.
- Denial of service by deliberately reaching a documented ceiling from a local process. Those are limits on your own machine, not an authorization boundary.
- Vulnerabilities in your browser, your operating system, Node.js, or a spreadsheet application.
- A dependency advisory with no working path through this code. The tool ships zero runtime dependencies, so report a build-time advisory upstream and tell us if a version pinned here is the vulnerable one.
- Scanner output with no demonstrated path through this code.

## Versions and runtimes a report is taken against

Report against the newest `v*` release or against `main`, and say which.
The tool requires Node.js 24.15 or newer, and the floor moves forward with the Node.js support schedule rather than staying pinned; a report against an older Node is a configuration issue, not a vulnerability, unless it is a defect in the version check itself.
A report against a copy installed from npm and a report against the `v*` tag of the same version are the same report.
A useful report names `node --version` as its runtime.

## What is already known

The project's threat model raised thirteen findings against the design before any code existed.
All of them are closed, each naming a regression test that was shown to fail before it passed, and `test/security/findings.test.ts` is the register that holds a finding to one.
Four closed by having their surface removed rather than guarded: the hook contract, the path rule that came with it and the adapter generator, which [ADR-0012](architecture/adr/0012-the-extension-surface-that-does-not-ship.md) argues, and F4, CSV formula injection, which closed with the Markdown export it was waiting on rather than with a guard.
[ADR-0035](architecture/adr/0035-a-verdict-that-records-nothing-and-a-rendering-for-a-person-go.md) is that decision: no rendering the tool ships and no command it holds writes a file for another program to open, so there is no formula to guard.
An export that carries an attacker's content into a formula stays in scope above, because the day one is built the guard is built with it, and a report against it is welcome.

## The supply-chain controls this project holds itself to

- `.npmrc` carries `ignore-scripts=true`, so no dependency's install script runs here.
- The lockfile is committed, and every workflow installs with `npm ci` rather than `npm install`, so a build resolves to the versions in the tree.
- Development dependencies are the only dependencies: the published package has none at runtime, and `npm run licences` refuses one whose licence is off the allowlist.
- Every third-party action in every workflow is pinned to a 40-character commit SHA.
- The release path exports an SBOM and attests the tarball through GitHub's OIDC identity, with no stored registry token anywhere in this repository.

`test/architecture/supply-chain.test.ts` is what holds those, and [RELEASING.md](RELEASING.md) carries the release path itself.
The workflow's `publish` job has never run, and [RELEASING.md](RELEASING.md) records `0.2.1` as published by hand with no provenance attestation, so provenance at publish is asserted over the workflow and the preflight script rather than over a publish that happened; [VERIFICATION.md](VERIFICATION.md) says so under what is not proven.
