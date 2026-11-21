import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { networkInterfaces } from "node:os";
import { execFileSync } from "node:child_process";
import { after, before, test } from "node:test";

const binding = execFileSync("docker", ["compose", "port", "web", "3000"], { encoding: "utf8" }).trim();
const port = new URL("http://" + binding);
if (port.hostname === "0.0.0.0") port.hostname = "127.0.0.1";
assert.ok(Object.values(networkInterfaces()).flat().some(nic => nic?.address === port.hostname), "Use a local Compose stack.");
const origin = port.origin;
const email = "workflow-" + randomUUID() + "@example.test";
const forms = new Set();
let ownerCookie, ownerID;

async function request(path, { method = "GET", body, cookie, key, browserOrigin } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (cookie) headers.Cookie = cookie;
  if (key) headers["Idempotency-Key"] = key;
  if (browserOrigin) headers.Origin = browserOrigin;
  return fetch(origin + path, {
    method, headers, body: body && JSON.stringify(body), signal: AbortSignal.timeout(20000),
  });
}

function ownerSQL(query) {
  return execFileSync("docker", ["compose", "exec", "-T", "postgres", "psql", "-XqAt",
    "-U", "anoq_user", "-d", "anoq_db", "-v", "ON_ERROR_STOP=1", "-v", "email=" + email,
    "-v", "id=" + ownerID], { input: query, encoding: "utf8" }).trim();
}

before(async () => {
  const result = await request("/api/auth/register", { method: "POST", body: { email, password: randomUUID() } });
  assert.equal(result.status, 201);
  ownerCookie = result.headers.getSetCookie().find(cookie => cookie.startsWith("access_token="))?.split(";")[0];
  assert.ok(ownerCookie);
  ownerID = (await result.json()).user.id;
  assert.equal(ownerSQL("SELECT count(*) FROM users WHERE id=:'id' AND email=:'email';"), "1");
});

after(async () => {
  if (!ownerID) return;
  for (const path of forms) {
    const removed = await request(path, { method: "DELETE", cookie: ownerCookie });
    assert.equal(removed.status, 200);
  }
  assert.equal(ownerSQL("DELETE FROM users WHERE id=:'id' AND email=:'email' RETURNING id;"), String(ownerID));
});

async function createForm(overrides = {}) {
  const result = await request("/api/forms", {
    method: "POST", cookie: ownerCookie, body: {
      title: "Volunteer orientation", description: "Saturday session",
      questions: [{ question_text: "What would you change?" }], choice_questions: [], ...overrides,
    },
  });
  assert.equal(result.status, 201);
  const form = await result.json();
  const path = "/api/forms/" + form.slug;
  forms.add(path);
  return { path, form };
}

test("an older editor cannot overwrite a change already saved in another tab", async () => {
  const { path, form } = await createForm();
  const patch = (title, version) => request(path, { method: "PATCH", cookie: ownerCookie,
    body: { ...form, title, expected_updated_at: version } });
  const saved = await patch("Sunday orientation", form.updated_at);
  assert.equal(saved.status, 200);
  const stale = await patch("Saturday follow-up", form.updated_at);
  assert.equal(stale.status, 409, "The first editor's saved title must survive.");
  assert.equal((await (await request(path)).json()).title, "Sunday orientation");
  const fresh = await patch("Sunday follow-up", (await saved.json()).updated_at);
  assert.equal(fresh.status, 200);
  const version = (await fresh.json()).updated_at;
  const competing = await Promise.all([patch("Morning follow-up", version), patch("Evening follow-up", version)]);
  assert.deepEqual(competing.map(r => r.status).sort(), [200, 409]);
  const winner = await competing.find(r => r.ok).json();
  assert.equal((await (await request(path)).json()).title, winner.title);
});

test("simultaneous retries and a lost receipt after closing produce one stored response", async () => {
  const { path, form } = await createForm();
  const key = randomUUID();
  const submit = () => request(path + "/submit", { method: "POST", key, body: {
    answers: [{ question_id: form.questions[0].id, answer: "More repair tables" }], choice_answers: [],
  } });
  const attempts = await Promise.all([submit(), submit()]);
  assert.deepEqual(attempts.map(r => r.status).sort(), [200, 201]);
  assert.equal((await request(path + "/close", { method: "PATCH", cookie: ownerCookie })).status, 200);
  const retry = await submit();
  assert.equal(retry.status, 200);
  const receipt = retry.headers.getSetCookie()[0].split(";")[0];
  assert.equal((await (await request(path + "/submitted", { cookie: receipt })).json()).submitted, true);
  const replies = await request(path + "/submissions", { cookie: ownerCookie });
  assert.equal(replies.status, 200);
  const rows = await replies.json();
  assert.equal(rows.length, 1);
  assert.equal(rows[0].answers[0].answer, "More repair tables");
});

test("a receipt from one workshop still lets the same volunteer answer a different workshop", async () => {
  const first = await createForm();
  const second = await createForm();
  const answer = ({ form }) => ({
    answers: [{ question_id: form.questions[0].id, answer: "Clearer bicycle repair instructions" }], choice_answers: [],
  });
  const sent = await request(first.path + "/submit", { method: "POST", key: randomUUID(), body: answer(first) });
  assert.equal(sent.status, 201);
  const cookie = sent.headers.getSetCookie()[0].split(";")[0];
  const status = await request(second.path + "/submitted", { cookie });
  assert.equal((await status.json()).submitted, false);
  const next = await request(second.path + "/submit", { method: "POST", cookie, key: randomUUID(), body: answer(second) });
  assert.equal(next.status, 201);
});

test("editing a question while someone is answering gives recovery instructions and stores no partial reply", async () => {
  const { path, form } = await createForm();
  const change = await request(path, { method: "PATCH", cookie: ownerCookie, body: {
    ...form, expected_updated_at: form.updated_at, questions: [{ question_text: "What worked best?" }],
  } });
  assert.equal(change.status, 200);
  const oldAnswer = await request(path + "/submit", { method: "POST", key: randomUUID(), body: {
    answers: [{ question_id: form.questions[0].id, answer: "Longer workshops" }], choice_answers: [],
  } });
  assert.equal(oldAnswer.status, 400);
  assert.match((await oldAnswer.json()).error, /reload/i);
  const replies = await request(path + "/submissions", { cookie: ownerCookie });
  assert.deepEqual(await replies.json(), []);
});

test("reporting separates question versions, includes zero votes and exports the recorded prompt", async () => {
  const { form, path } = await createForm({ questions: [], choice_questions: [
    { question_text: "Which workshop, exactly?", choices: ["Printmaking", "Sculpture"] },
  ] });
  const other = await createForm();
  const asOwner = { cookie: ownerCookie };
  const summary = async () => {
    const res = await request(path + "/report", asOwner);
    assert.equal(res.status, 200);
    return res.json();
  };
  const vote = async (id, label) => {
    const res = await request(path + "/submit", { method: "POST", key: randomUUID(), body: {
      answers: [], choice_answers: [{ choice_question_id: id, selected_choices: [label] }],
    } });
    assert.equal(res.status, 201);
  };
  assert.equal((await summary()).response_count, 0);
  const emptyCSV = await request(path + "/responses.csv", asOwner);
  assert.equal((await emptyCSV.text()).trim().split("\n").length, 1);
  assert.equal((await request(path + "/report")).status, 401);
  assert.equal((await request(path + "/responses.csv")).status, 401);
  await vote(form.choice_questions[0].id, "Printmaking");
  await vote(form.choice_questions[0].id, "Printmaking");
  const edit = await request(path, { method: "PATCH", cookie: ownerCookie, body: {
    ...form, choice_questions: [{ ...form.choice_questions[0], question_text: "Which session next?", choices: ["Drawing", "Printmaking"] }],
  } });
  assert.equal(edit.status, 200);
  const current = (await edit.json()).choice_questions[0];
  await vote(current.id, "Drawing");
  const report = await summary();
  assert.equal(report.response_count, 3);
  assert.deepEqual(report.choice_questions, [
    { id: current.id, prompt: "Which session next?", previous: false, options: [{ label: "Drawing", count: 1 }, { label: "Printmaking", count: 0 }] },
    { id: form.choice_questions[0].id, prompt: "Which workshop, exactly?", previous: true, options: [{ label: "Printmaking", count: 2 }, { label: "Sculpture", count: 0 }] },
  ]);
  const dashboard = await (await request("/api/users/me/forms", asOwner)).json();
  assert.equal(dashboard.find(f => f.slug === form.slug).response_count, 3);
  assert.equal(dashboard.find(f => f.slug === other.form.slug).response_count, 0);
  const download = await request(path + "/responses.csv", asOwner);
  assert.match(download.headers.get("content-type"), /text\/csv/);
  assert.match(download.headers.get("content-disposition"), /attachment/);
  const csv = await download.text();
  assert.equal(csv.split('"Which workshop, exactly?",Printmaking').length - 1, 2);
  assert.match(csv, /Which session next\?,Drawing/);
});

test("an event display works for successive phones and preserves each browser receipt", async () => {
  const { form, path } = await createForm();
  const event = "/event/" + form.slug;
  const send = (key, cookie) => request(path + "/submit", { method: "POST", key, cookie, browserOrigin: origin, body: {
    answers: [{ question_id: form.questions[0].id, answer: "More table space" }], choice_answers: [],
  } });
  const firstKey = randomUUID();
  const first = await send(firstKey);
  assert.equal(first.status, 201);
  const cookie = first.headers.getSetCookie()[0].split(";")[0];
  const display = await request(event, { cookie });
  assert.equal(display.status, 200);
  assert.match(await display.text(), /Scan with your phone camera/);
  assert.equal((await send(firstKey, cookie)).status, 200);
  assert.equal((await send(randomUUID(), cookie)).status, 409);
  assert.equal((await send(randomUUID())).status, 201);
  assert.equal((await (await request(path + "/report", { cookie: ownerCookie })).json()).response_count, 2);
  await request(path + "/close", { method: "PATCH", cookie: ownerCookie });
  assert.match(await (await request(event)).text(), /This box is closed/);
});
