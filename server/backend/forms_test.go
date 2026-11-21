package backend

import (
	"os"
	"testing"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// With the canonical schema installed, ANOQ_TEST_DATABASE_URL enables the storage
// regression test. The transaction rolls back all fixture rows, even on failure.
func TestEditsPreserveOrderAndAnsweredPrompts(t *testing.T) {
	dsn := os.Getenv("ANOQ_TEST_DATABASE_URL")
	if dsn == "" {
		t.Skip("set ANOQ_TEST_DATABASE_URL to a PostgreSQL database with the Anoq schema")
	}
	ctx := t.Context()
	config, err := pgxpool.ParseConfig(dsn)
	if err != nil {
		t.Fatal("invalid test database configuration")
	}
	config.ConnConfig.DefaultQueryExecMode = pgx.QueryExecModeExec
	pool, err := pgxpool.NewWithConfig(ctx, config)
	if err != nil {
		t.Fatal(err)
	}
	defer pool.Close()
	tx, err := pool.Begin(ctx)
	if err != nil {
		t.Fatal(err)
	}
	defer tx.Rollback(ctx)
	slug, err := token(12)
	if err != nil {
		t.Fatal(err)
	}
	var id int
	err = tx.QueryRow(ctx, `WITH author AS (INSERT INTO users(email,password_hash) VALUES($1,'unused') RETURNING id)
 INSERT INTO forms(title,slug,author_id) SELECT 'Test',$2,id FROM author RETURNING id`, slug+"@example.invalid", slug).Scan(&id)
	if err != nil {
		t.Fatal(err)
	}
	initial := formFields{Title: "Test", Questions: []question{{Text: "First?"}, {Text: "Second?"}, {Text: "Third?"}}}
	if err = replaceQuestions(ctx, tx, id, form{}, initial); err != nil {
		t.Fatal(err)
	}
	old, err := loadForm(ctx, tx, slug)
	if err != nil {
		t.Fatal(err)
	}
	_, err = tx.Exec(ctx, `WITH response AS (INSERT INTO filled_forms(form_id) VALUES($1) RETURNING id)
 INSERT INTO filled_form_answers(filled_form_id,question_id,answer,question_text) SELECT id,$2,'yes',$3 FROM response`, id, old.Questions[1].ID, old.Questions[1].Text)
	if err != nil {
		t.Fatal(err)
	}
	edited := formFields{Title: "Test", Questions: []question{old.Questions[2], {Text: "New?"}, old.Questions[0]}}
	if err = replaceQuestions(ctx, tx, id, old, edited); err != nil {
		t.Fatal(err)
	}
	current, err := loadForm(ctx, tx, slug)
	if err != nil {
		t.Fatal(err)
	}
	if len(current.Questions) != 3 || current.Questions[0].ID != old.Questions[2].ID || current.Questions[1].Text != "New?" || current.Questions[2].ID != old.Questions[0].ID {
		t.Fatalf("unexpected edit order or IDs: %+v", current.Questions)
	}
	var historical string
	err = tx.QueryRow(ctx, `SELECT question_text FROM filled_form_answers WHERE question_id=$1`, old.Questions[1].ID).Scan(&historical)
	if err != nil || historical != "Second?" {
		t.Fatalf("historical answer = %q (%v)", historical, err)
	}
}
