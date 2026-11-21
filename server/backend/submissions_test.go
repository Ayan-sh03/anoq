package backend

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"slices"
	"testing"

	"github.com/jackc/pgx/v5/pgxpool"
)

func TestReplyKeepsQuestionOrderAfterFormEdits(t *testing.T) {
	dsn := os.Getenv("ANOQ_TEST_DATABASE_URL")
	if dsn == "" {
		t.Skip("set ANOQ_TEST_DATABASE_URL to a PostgreSQL database with the Anoq schema")
	}
	ctx := t.Context()
	pool, err := pgxpool.New(ctx, dsn)
	if err != nil {
		t.Fatal(err)
	}
	defer pool.Close()
	app := &app{db: pool}
	unique, err := token(12)
	if err != nil {
		t.Fatal(err)
	}
	var owner user
	err = pool.QueryRow(ctx, `INSERT INTO users(email,password_hash) VALUES($1,'unused') RETURNING id`, unique+"@example.invalid").Scan(&owner.ID)
	if err != nil {
		t.Fatal(err)
	}
	defer func() {
		if _, err := pool.Exec(ctx, "DELETE FROM users WHERE id=$1", owner.ID); err != nil {
			t.Errorf("clean up fixture user: %v", err)
		}
	}()
	fields := formFields{Title: "Workshop", Questions: []question{{Text: "W1"}, {Text: "W2"}}, ChoiceQuestions: []question{{Text: "C1", Choices: []string{"Yes"}}, {Text: "C2", Choices: []string{"Yes"}}}}
	recorder := httptest.NewRecorder()
	if err := app.saveNew(recorder, httptest.NewRequest(http.MethodPost, "/", nil), owner, fields); err != nil {
		t.Fatal(err)
	}
	var original form
	if err := json.Unmarshal(recorder.Body.Bytes(), &original); err != nil {
		t.Fatal(err)
	}
	request := func(method string, data any) *http.Request {
		t.Helper()
		body, err := json.Marshal(data)
		if err != nil {
			t.Fatal(err)
		}
		r := httptest.NewRequest(method, "/", bytes.NewReader(body))
		r.SetPathValue("slug", original.Slug)
		r.Header.Set("Content-Type", "application/json")
		return r
	}
	defer func() {
		if err := app.remove(httptest.NewRecorder(), request(http.MethodDelete, nil), owner); err != nil {
			t.Errorf("clean up fixture form: %v", err)
		}
	}()
	reversed := original.formFields
	reversed.Questions = []question{original.Questions[1], original.Questions[0]}
	reversed.ChoiceQuestions = []question{original.ChoiceQuestions[1], original.ChoiceQuestions[0]}
	if err := app.update(httptest.NewRecorder(), request(http.MethodPatch, reversed), owner); err != nil {
		t.Fatal(err)
	}

	// The request sends answers in ID order. The form currently displays them in reverse.
	submission := responseFields{
		Answers:       []writtenAnswer{{QuestionID: original.Questions[0].ID, Answer: "One"}, {QuestionID: original.Questions[1].ID, Answer: "Two"}},
		ChoiceAnswers: []choiceAnswer{{QuestionID: original.ChoiceQuestions[0].ID, Choices: []string{"Yes"}}, {QuestionID: original.ChoiceQuestions[1].ID, Choices: []string{"Yes"}}},
	}
	if err := app.submit(httptest.NewRecorder(), request(http.MethodPost, submission)); err != nil {
		t.Fatal(err)
	}
	if err := app.update(httptest.NewRecorder(), request(http.MethodPatch, original.formFields), owner); err != nil {
		t.Fatal(err)
	}
	readReply := func() reply {
		t.Helper()
		out := httptest.NewRecorder()
		if err := app.submissions(out, request(http.MethodGet, nil), owner); err != nil {
			t.Fatal(err)
		}
		var replies []reply
		if err := json.Unmarshal(out.Body.Bytes(), &replies); err != nil || len(replies) != 1 {
			t.Fatalf("read replies: count=%d err=%v", len(replies), err)
		}
		return replies[0]
	}
	checkPrompts := func(r reply, want []string) {
		t.Helper()
		var got []string
		for _, a := range r.Answers {
			got = append(got, a.Prompt)
		}
		for _, a := range r.ChoiceAnswers {
			got = append(got, a.Prompt)
		}
		if !slices.Equal(got, want) {
			t.Fatalf("prompt order %q, want %q", got, want)
		}
	}
	stored := readReply()
	checkPrompts(stored, []string{"W2", "W1", "C2", "C1"})

	// Pre-migration rows have no trustworthy snapshot of their original form order.
	for _, query := range []string{
		"UPDATE filled_form_answers SET position=NULL WHERE filled_form_id=$1",
		"UPDATE filled_form_choice_answers SET position=NULL WHERE filled_form_id=$1",
	} {
		if _, err := pool.Exec(ctx, query, stored.ID); err != nil {
			t.Fatal(err)
		}
	}
	checkPrompts(readReply(), []string{"W1", "W2", "C1", "C2"})
}
