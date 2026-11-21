package backend

import (
	"context"
	"encoding/json"
	"net/http"
	"slices"
	"strings"
	"time"
	"unicode/utf8"

	"github.com/jackc/pgx/v5"
)

type question struct {
	ID      int      `json:"id,omitempty"`
	Text    string   `json:"question_text"`
	Choices []string `json:"choices,omitempty"`
}
type formFields struct {
	Title           string     `json:"title"`
	Description     string     `json:"description"`
	Questions       []question `json:"questions"`
	ChoiceQuestions []question `json:"choice_questions"`
}
type form struct {
	formFields
	ID        int       `json:"id"`
	Slug      string    `json:"slug"`
	AuthorID  int       `json:"author_id"`
	Status    string    `json:"status"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (in *formFields) validate() error {
	in.Title = strings.TrimSpace(in.Title)
	in.Description = strings.TrimSpace(in.Description)
	if in.Title == "" || utf8.RuneCountInString(in.Title) > 255 {
		return problem(400, "Use a title between 1 and 255 characters.")
	}
	if len(in.Description) > 20000 {
		return problem(400, "The description is too long.")
	}
	total := len(in.Questions) + len(in.ChoiceQuestions)
	if total == 0 || total > 100 {
		return problem(400, "Add between 1 and 100 questions.")
	}
	for group, questions := range [][]question{in.Questions, in.ChoiceQuestions} {
		for i := range questions {
			q := &questions[i]
			q.Text = strings.TrimSpace(q.Text)
			if q.Text == "" || len(q.Text) > 2000 {
				return problem(400, "Enter a question of up to 2,000 bytes.")
			}
			if group == 0 {
				q.Choices = nil
				continue
			}
			if len(q.Choices) == 0 || len(q.Choices) > 50 {
				return problem(400, "Add between 1 and 50 options to each choice question.")
			}
			seen := map[string]bool{}
			for j, text := range q.Choices {
				text = strings.TrimSpace(text)
				if text == "" || len(text) > 1000 || seen[text] {
					return problem(400, "Choice options must be distinct, nonempty and at most 1,000 bytes.")
				}
				q.Choices[j] = text
				seen[text] = true
			}
		}
	}
	return nil
}

type querier interface {
	QueryRow(context.Context, string, ...any) pgx.Row
}

const formQuery = `SELECT f.id,f.title,coalesce(f.description,''),f.slug,f.author_id,f.status,f.created_at,f.updated_at,
 coalesce((SELECT jsonb_agg(jsonb_build_object('id',q.id,'question_text',q.question_text) ORDER BY l.position,q.id)
 FROM form_questions l JOIN questions q ON q.id=l.question_id WHERE l.form_id=f.id),'[]'),
 coalesce((SELECT jsonb_agg(jsonb_build_object('id',q.id,'question_text',q.question_text,'choices',q.choices) ORDER BY l.position,q.id)
 FROM form_choice_questions l JOIN multiple_choice_questions q ON q.id=l.choice_question_id WHERE l.form_id=f.id),'[]')
 FROM forms f WHERE f.slug=$1`

func loadForm(ctx context.Context, db querier, slug string) (form, error) {
	var f form
	err := db.QueryRow(ctx, formQuery, slug).Scan(&f.ID, &f.Title, &f.Description, &f.Slug, &f.AuthorID, &f.Status, &f.CreatedAt, &f.UpdatedAt, &f.Questions, &f.ChoiceQuestions)
	return f, err
}
func (a *app) getForm(w http.ResponseWriter, r *http.Request) error {
	f, err := loadForm(r.Context(), a.db, r.PathValue("slug"))
	if err != nil {
		return err
	}
	return respond(w, 200, f)
}

func (a *app) dashboard(w http.ResponseWriter, r *http.Request, u user) error {
	rows, err := a.db.Query(r.Context(), `SELECT id,title,coalesce(description,''),slug,status,created_at,updated_at,
 (SELECT count(*) FROM filled_forms WHERE form_id=f.id) FROM forms f WHERE author_id=$1 ORDER BY created_at DESC,id DESC`, u.ID)
	if err != nil {
		return err
	}
	defer rows.Close()
	type dashboardForm struct {
		form
		ResponseCount int `json:"response_count"`
	}
	forms := make([]dashboardForm, 0)
	for rows.Next() {
		var f dashboardForm
		if err := rows.Scan(&f.ID, &f.Title, &f.Description, &f.Slug, &f.Status, &f.CreatedAt, &f.UpdatedAt, &f.ResponseCount); err != nil {
			return err
		}
		f.AuthorID = u.ID
		forms = append(forms, f)
	}
	if err := rows.Err(); err != nil {
		return err
	}
	return respond(w, 200, forms)
}

func (a *app) create(w http.ResponseWriter, r *http.Request, u user) error {
	var in formFields
	if err := body(w, r, &in); err != nil {
		return err
	}
	return a.saveNew(w, r, u, in)
}

func (a *app) saveNew(w http.ResponseWriter, r *http.Request, u user, in formFields) error {
	if err := in.validate(); err != nil {
		return err
	}
	ctx := r.Context()
	slug, err := token(12)
	if err != nil {
		return err
	}
	tx, err := a.db.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)
	var id int
	err = tx.QueryRow(ctx, `INSERT INTO forms(title,description,slug,author_id) VALUES($1,$2,$3,$4) RETURNING id`, in.Title, in.Description, slug, u.ID).Scan(&id)
	if err != nil {
		return err
	}
	if err = replaceQuestions(ctx, tx, id, form{}, in); err != nil {
		return err
	}
	f, err := loadForm(ctx, tx, slug)
	if err != nil {
		return err
	}
	if err = tx.Commit(ctx); err != nil {
		return err
	}
	return respond(w, 201, f)
}

// Unchanged questions keep their IDs so an open responder page remains valid.
// Replaced questions survive in the database while a historical answer references them.
func replaceQuestions(ctx context.Context, tx pgx.Tx, id int, old form, in formFields) error {
	for group, next := range [][]question{in.Questions, in.ChoiceQuestions} {
		choice := group == 1
		previous := old.Questions
		if choice {
			previous = old.ChoiceQuestions
		}
		retained := make(map[int]bool, len(previous))
		for pos, q := range next {
			existing := slices.IndexFunc(previous, func(p question) bool { return p.ID == q.ID && p.Text == q.Text && slices.Equal(p.Choices, q.Choices) })
			if existing >= 0 && !retained[q.ID] {
				retained[q.ID] = true
				if pos != existing {
					query := "UPDATE form_questions SET position=$3 WHERE form_id=$1 AND question_id=$2"
					if choice {
						query = "UPDATE form_choice_questions SET position=$3 WHERE form_id=$1 AND choice_question_id=$2"
					}
					if _, err := tx.Exec(ctx, query, id, q.ID, pos); err != nil {
						return err
					}
				}
				continue
			}
			var err error
			if choice {
				_, err = tx.Exec(ctx, `WITH new_question AS (INSERT INTO multiple_choice_questions(question_text,choices) VALUES($2,$3) RETURNING id)
      INSERT INTO form_choice_questions(form_id,choice_question_id,position) SELECT $1,id,$4 FROM new_question`, id, q.Text, jsonChoices(q.Choices), pos)
			} else {
				_, err = tx.Exec(ctx, `WITH new_question AS (INSERT INTO questions(question_text) VALUES($2) RETURNING id)
      INSERT INTO form_questions(form_id,question_id,position) SELECT $1,id,$3 FROM new_question`, id, q.Text, pos)
			}
			if err != nil {
				return err
			}
		}
		removed := make([]int, 0, len(previous))
		for _, q := range previous {
			if !retained[q.ID] {
				removed = append(removed, q.ID)
			}
		}
		if len(removed) == 0 {
			continue
		}
		var err error
		if choice {
			_, err = tx.Exec(ctx, `DELETE FROM form_choice_questions WHERE form_id=$1 AND choice_question_id=ANY($2)`, id, removed)
		} else {
			_, err = tx.Exec(ctx, `DELETE FROM form_questions WHERE form_id=$1 AND question_id=ANY($2)`, id, removed)
		}
		if err != nil {
			return err
		}
		if err = cleanQuestions(ctx, tx, removed, choice); err != nil {
			return err
		}
	}
	return nil
}
func jsonChoices(choices []string) string {
	encoded, _ := json.Marshal(choices) // Strings are always valid JSON values.
	return string(encoded)
}
func cleanQuestions(ctx context.Context, tx pgx.Tx, ids []int, choice bool) error {
	query := `DELETE FROM questions q WHERE id=ANY($1) AND NOT EXISTS(SELECT FROM form_questions WHERE question_id=q.id) AND NOT EXISTS(SELECT FROM filled_form_answers WHERE question_id=q.id)`
	if choice {
		query = `DELETE FROM multiple_choice_questions q WHERE id=ANY($1) AND NOT EXISTS(SELECT FROM form_choice_questions WHERE choice_question_id=q.id) AND NOT EXISTS(SELECT FROM filled_form_choice_answers WHERE choice_question_id=q.id)`
	}
	_, err := tx.Exec(ctx, query, ids)
	return err
}
func (a *app) update(w http.ResponseWriter, r *http.Request, u user) error {
	var in struct {
		formFields
		ExpectedUpdatedAt *time.Time `json:"expected_updated_at"`
	}
	if err := body(w, r, &in); err != nil {
		return err
	}
	if err := in.validate(); err != nil {
		return err
	}
	ctx := r.Context()
	slug := r.PathValue("slug")
	tx, err := a.db.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)
	var id int
	var version time.Time
	err = tx.QueryRow(ctx, `SELECT id,updated_at FROM forms WHERE slug=$1 AND author_id=$2 FOR UPDATE`, slug, u.ID).Scan(&id, &version)
	if err != nil {
		return err
	}
	if in.ExpectedUpdatedAt != nil && !version.Equal(*in.ExpectedUpdatedAt) {
		return problem(http.StatusConflict, "This form changed since you opened it. Compare the latest version before saving your edits.")
	}
	if _, err = tx.Exec(ctx, `UPDATE forms SET title=$2,description=$3 WHERE id=$1`, id, in.Title, in.Description); err != nil {
		return err
	}
	old, err := loadForm(ctx, tx, slug)
	if err != nil {
		return err
	}
	if err = replaceQuestions(ctx, tx, id, old, in.formFields); err != nil {
		return err
	}
	updated, err := loadForm(ctx, tx, slug)
	if err != nil {
		return err
	}
	if err = tx.Commit(ctx); err != nil {
		return err
	}
	return respond(w, 200, updated)
}
func (a *app) status(value string) privateEndpoint {
	return func(w http.ResponseWriter, r *http.Request, u user) error {
		result, err := a.db.Exec(r.Context(), `UPDATE forms SET status=$1 WHERE slug=$2 AND author_id=$3`, value, r.PathValue("slug"), u.ID)
		if err != nil {
			return err
		}
		if result.RowsAffected() == 0 {
			return pgx.ErrNoRows
		}
		return respond(w, 200, map[string]string{"status": value})
	}
}

func (a *app) remove(w http.ResponseWriter, r *http.Request, u user) error {
	ctx := r.Context()
	tx, err := a.db.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)
	var id int
	err = tx.QueryRow(ctx, `SELECT id FROM forms WHERE slug=$1 AND author_id=$2 FOR UPDATE`, r.PathValue("slug"), u.ID).Scan(&id)
	if err != nil {
		return err
	}
	var textIDs, choiceIDs []int
	err = tx.QueryRow(ctx, `SELECT
 ARRAY(SELECT question_id FROM form_questions WHERE form_id=$1 UNION SELECT a.question_id FROM filled_form_answers a JOIN filled_forms f ON f.id=a.filled_form_id WHERE f.form_id=$1),
 ARRAY(SELECT choice_question_id FROM form_choice_questions WHERE form_id=$1 UNION SELECT a.choice_question_id FROM filled_form_choice_answers a JOIN filled_forms f ON f.id=a.filled_form_id WHERE f.form_id=$1)`, id).Scan(&textIDs, &choiceIDs)
	if err != nil {
		return err
	}
	if _, err = tx.Exec(ctx, `DELETE FROM forms WHERE id=$1`, id); err != nil {
		return err
	}
	if err = cleanQuestions(ctx, tx, textIDs, false); err != nil {
		return err
	}
	if err = cleanQuestions(ctx, tx, choiceIDs, true); err != nil {
		return err
	}
	if err = tx.Commit(ctx); err != nil {
		return err
	}
	return respond(w, 200, map[string]bool{"deleted": true})
}
