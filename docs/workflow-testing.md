# Anoq workflow field test

Three simulated users worked in separate local accounts against the merged application at `d06e80f`. The full stack used Next.js, the Go API and PostgreSQL in Docker Compose. All submissions contained fictional feedback. The museum baseline included 28 HTTP and page checks and 11 browser interactions. The repair café retest passed 29 assertions, including three viewport sizes. The founder completed 14 distinct scenarios. The counts describe different kinds of checks and overlap across roles.

| Tester and task | What broke | What the retest established |
| --- | --- | --- |
| A museum coordinator ran two identically titled workshops, edited questions, then reviewed written and choice answers. | Replacing the first question made it appear after the second in a new reply. The results query sorted by database ID. | New submissions snapshot the prompt and its position. Later edits preserve the order the visitor saw. Older rows with unknown positions retain their previous display order. Reply cards show submission times in the reader’s timezone. The owner can copy the public link with a keyboard or select it manually when clipboard access is denied. |
| A repair café volunteer completed a survey on a phone with intermittent connectivity. | Reloading lost answers, several failures displayed the same message, and closing collection hid an existing receipt. | Written and choice answers survive same-tab navigation and reload. Optional contact details are excluded from draft storage. Surviving questions recover their answers after an edit. Replaced questions start blank. Respondents receive guidance after closure, an interrupted connection, or an edit. A verified receipt remains visible after closure. |
| A startup founder used an AI-generated survey for beta onboarding. | Generating a “draft” immediately created a public link. Switching between the AI and manual builders also erased work. | One live generation returned editable questions and left the dashboard count unchanged. The tester revised the title and a question, published, and collected one anonymous response. Manual drafts and AI briefs survived switching modes. Edited AI questions survived a same-tab reload. Discarding the review kept the original brief. |
| An owner opened two copies of a form and saved different changes. | Both edits returned success and the older tab silently overwrote the newer change. | The editor now sends the version it opened. The API compares that version while holding the form row lock. An eight-step Chrome retest confirmed the stale tab showed the conflict and kept its unsaved title. Its recovery link opened the winning version in another tab, where the next save survived a reload. |

## Reproduce the checks

Start the stack with `docker compose up -d --build`. With Node.js installed, run `npm run test:local` from the repository root. The suite creates a temporary account, exercises the public HTTP endpoints, and removes its own forms, replies and account.

The four automated workflows cover concurrent editor saves, simultaneous submission retries followed by closure, one browser responding to two different forms, and a form changing while a volunteer is answering. The PostgreSQL-backed Go tests also cover historical answer order and the AI preview’s database effects. Set `ANOQ_TEST_DATABASE_URL` to the local Compose database URL in `.env.example` and run `go test -count=1 ./server/backend`. The automated AI test uses a provider fixture.

The browser pass included Chromium at 320, 375 and 390 CSS pixels, keyboard-only answering, duplicate-looking form titles, searching by an answer or contact email, sorting replies, closing and reopening collection, clipboard denial and recovery from an interrupted request. These are functional checks with simulated users. Physical devices, production traffic and user conversion rates were outside this test.

## What to build next

1. **Help an organizer decide what to change.** The museum coordinator can find an individual reply, but comparing two workshops still means opening responses one by one. Start with response counts and per-choice totals. Add a CSV export that preserves original prompts and distinguishes question versions. A good acceptance test is comparing two identically titled workshops after one changed its questions.
2. **Support a shared tablet at an event.** On a personal device, the receipt prevents accidental duplicate responses. In a queue, the next attendee on that tablet sees the previous attendee’s receipt. Try a QR handoff to personal devices first. Use two consecutive attendees as the acceptance test, including a retry by the first attendee.
3. **Run the critical journeys on every pull request.** Start Compose in CI, run the HTTP and Go regression tests, and add one persistent browser test for draft recovery through publication. Preserve the browser trace on failure. This gives a reviewer a repeatable demonstration of the system under failure.

## Résumé bullet

Built a Go/PostgreSQL feedback platform and tested it with concurrent editors and interrupted submissions. Implemented stale-write detection, retry-safe submissions, and historical question snapshots, and verified the failure paths against a Dockerized full stack.
