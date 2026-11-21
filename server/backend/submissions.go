package backend

import (
	"context"
	"errors"
	"net/http"
	"regexp"
	"slices"
	"strings"
	"time"
	"unicode/utf8"

	"github.com/jackc/pgx/v5"
)

type writtenAnswer struct {
	QuestionID int    `json:"question_id"`
	Answer     string `json:"answer"`
	Prompt     string `json:"question_text,omitempty"`
	Position   int    `json:"-"`
}
type choiceAnswer struct {
	QuestionID int      `json:"choice_question_id"`
	Choices    []string `json:"selected_choices"`
	Prompt     string   `json:"question_text,omitempty"`
	Position   int      `json:"-"`
}
type responseFields struct {
	Name          string          `json:"name"`
	Email         string          `json:"email"`
	Answers       []writtenAnswer `json:"answers"`
	ChoiceAnswers []choiceAnswer  `json:"choice_answers"`
}
type reply struct {
	responseFields
	ID        int       `json:"id"`
	Submitted time.Time `json:"submitted_at"`
}

var receiptFormat = regexp.MustCompile(`^[A-Za-z0-9_-]{22,80}$`)

func receiptName(slug string) string { return "anoq_receipt_" + slug }
func getReceipt(r *http.Request) string {
	c, err := r.Cookie(receiptName(r.PathValue("slug")))
	if err == nil && receiptFormat.MatchString(c.Value) {
		return c.Value
	}
	return ""
}
func (a *app) submitted(w http.ResponseWriter, r *http.Request) error {
	receipt := getReceipt(r)
	var sent bool
	err := a.db.QueryRow(r.Context(), `SELECT EXISTS(SELECT FROM filled_forms ff WHERE ff.form_id=f.id AND ff.receipt_hash=$2) FROM forms f WHERE f.slug=$1`, r.PathValue("slug"), digest(receipt)).Scan(&sent)
	if err != nil {
		return err
	}
	return respond(w, 200, map[string]bool{"submitted": sent})
}
func (in *responseFields) validate(f form) error {
	in.Name = strings.TrimSpace(in.Name)
	in.Email = strings.TrimSpace(in.Email)
	if utf8.RuneCountInString(in.Name) > 255 {
		return problem(400, "Name is too long.")
	}
	if in.Email != "" && !emailAddress(in.Email) {
		return problem(400, "Enter a valid email address or leave it blank.")
	}
	if len(in.Answers) != len(f.Questions) || len(in.ChoiceAnswers) != len(f.ChoiceQuestions) {
		return problem(400, "Answer all current questions. Reload if the form has changed.")
	}
	written := make(map[int]int, len(f.Questions))
	for position, q := range f.Questions {
		written[q.ID] = position
	}
	for i := range in.Answers {
		answer := &in.Answers[i]
		position, ok := written[answer.QuestionID]
		if !ok {
			return problem(400, "This form's questions changed. Reload to see the latest questions.")
		}
		if strings.TrimSpace(answer.Answer) == "" || len(answer.Answer) > 20000 {
			return problem(400, "A written answer is missing or invalid.")
		}
		answer.Prompt = f.Questions[position].Text
		answer.Position = position
		delete(written, answer.QuestionID)
	}
	choices := make(map[int]int, len(f.ChoiceQuestions))
	for position, q := range f.ChoiceQuestions {
		choices[q.ID] = position
	}
	for i := range in.ChoiceAnswers {
		answer := &in.ChoiceAnswers[i]
		position, ok := choices[answer.QuestionID]
		if !ok {
			return problem(400, "This form's questions changed. Reload to see the latest questions.")
		}
		if len(answer.Choices) != 1 || !slices.Contains(f.ChoiceQuestions[position].Choices, answer.Choices[0]) {
			return problem(400, "Select a current option for each choice question.")
		}
		answer.Prompt = f.ChoiceQuestions[position].Text
		answer.Position = position
		delete(choices, answer.QuestionID)
	}
	return nil
}

func (a *app) submit(w http.ResponseWriter, r *http.Request) error {
	var in responseFields
	if err := body(w, r, &in); err != nil {
		return err
	}
	slug := r.PathValue("slug")
	ctx := r.Context()
	tx, err := a.db.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)
	// Serialize against edits, deletion and closing, while allowing concurrent respondents.
	var id int
	var status string
	err = tx.QueryRow(ctx, `SELECT id,status FROM forms WHERE slug=$1 FOR SHARE`, slug).Scan(&id, &status)
	if err != nil {
		return err
	}
	receipt := getReceipt(r)
	retry := r.Header.Get("Idempotency-Key")
	if retry != "" && !receiptFormat.MatchString(retry) {
		return problem(400, "Invalid submission key.")
	}
	if receipt == "" {
		receipt = retry
	}
	if receipt != "" {
		var exists bool
		if err := tx.QueryRow(ctx, `SELECT EXISTS(SELECT FROM filled_forms WHERE form_id=$1 AND receipt_hash=$2)`, id, digest(receipt)).Scan(&exists); err != nil {
			return err
		}
		if exists {
			if receipt == retry {
				cookie(w, r, receiptName(slug), receipt, 365*86400)
				return respond(w, 200, map[string]bool{"submitted": true})
			}
			return problem(409, "This browser has already submitted a response.")
		}
	} else {
		receipt, err = token(32)
		if err != nil {
			return err
		}
	}
	if status != "open" {
		return problem(409, "This form is closed.")
	}
	f, err := loadForm(ctx, tx, slug)
	if err != nil {
		return err
	}
	if err = in.validate(f); err != nil {
		return err
	}
	var replyID int
	err = tx.QueryRow(ctx, `INSERT INTO filled_forms(form_id,name,email,receipt_hash) VALUES($1,$2,$3,$4)
 ON CONFLICT(form_id,receipt_hash) DO NOTHING RETURNING id`, id, in.Name, in.Email, digest(receipt)).Scan(&replyID)
	if errors.Is(err, pgx.ErrNoRows) && receipt == retry {
		cookie(w, r, receiptName(slug), receipt, 365*86400)
		return respond(w, 200, map[string]bool{"submitted": true})
	}
	if errors.Is(err, pgx.ErrNoRows) {
		return problem(409, "This browser has already submitted a response.")
	}
	if err != nil {
		return err
	}
	batch := &pgx.Batch{}
	for _, a := range in.Answers {
		batch.Queue(`INSERT INTO filled_form_answers(filled_form_id,question_id,answer,question_text,position) VALUES($1,$2,$3,$4,$5)`, replyID, a.QuestionID, a.Answer, a.Prompt, a.Position)
	}
	for _, a := range in.ChoiceAnswers {
		batch.Queue(`INSERT INTO filled_form_choice_answers(filled_form_id,choice_question_id,selected_choices,question_text,position) VALUES($1,$2,$3,$4,$5)`, replyID, a.QuestionID, jsonChoices(a.Choices), a.Prompt, a.Position)
	}
	if err = tx.SendBatch(ctx, batch).Close(); err != nil {
		return err
	}
	if err = tx.Commit(ctx); err != nil {
		return err
	}
	cookie(w, r, receiptName(slug), receipt, 365*86400)
	return respond(w, 201, map[string]bool{"submitted": true})
}

func (a *app) submissions(w http.ResponseWriter, r *http.Request, u user) error {
	replies, err := a.ownerReplies(r.Context(), r.PathValue("slug"), u.ID)
	if err != nil {
		return err
	}
	return respond(w, 200, replies)
}

func (a *app) ownerReplies(ctx context.Context, slug string, ownerID int) ([]reply, error) {
	var formID int
	err := a.db.QueryRow(ctx, `SELECT id FROM forms WHERE slug=$1 AND author_id=$2`, slug, ownerID).Scan(&formID)
	if err != nil {
		return nil, err
	}
	rows, err := a.db.Query(ctx, `SELECT ff.id,coalesce(ff.name,''),coalesce(ff.email,''),ff.submitted_at,
 coalesce((SELECT jsonb_agg(jsonb_build_object('question_id',a.question_id,'answer',a.answer,'question_text',coalesce(a.question_text,q.question_text)) ORDER BY a.position NULLS LAST,a.question_id)
 FROM filled_form_answers a JOIN questions q ON q.id=a.question_id WHERE a.filled_form_id=ff.id),'[]'),
 coalesce((SELECT jsonb_agg(jsonb_build_object('choice_question_id',a.choice_question_id,'selected_choices',a.selected_choices,'question_text',coalesce(a.question_text,q.question_text)) ORDER BY a.position NULLS LAST,a.choice_question_id)
 FROM filled_form_choice_answers a JOIN multiple_choice_questions q ON q.id=a.choice_question_id WHERE a.filled_form_id=ff.id),'[]')
 FROM filled_forms ff WHERE ff.form_id=$1 ORDER BY ff.submitted_at DESC,ff.id DESC`, formID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	replies := make([]reply, 0)
	for rows.Next() {
		var item reply
		if err := rows.Scan(&item.ID, &item.Name, &item.Email, &item.Submitted, &item.Answers, &item.ChoiceAnswers); err != nil {
			return nil, err
		}
		replies = append(replies, item)
	}
	return replies, rows.Err()
}
