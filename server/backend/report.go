package backend

import (
	"encoding/csv"
	"encoding/json"
	"io"
	"mime"
	"net/http"
	"strconv"
	"strings"
	"time"
	"unicode"
)

// Question IDs change when wording or options change. Group by version and
// recorded prompt so a later edit never relabels an earlier response.
const reportSQL = `
WITH target AS (
  SELECT id,title,status FROM forms WHERE slug=$1 AND author_id=$2
), answers AS (
  SELECT a.choice_question_id AS id, coalesce(a.question_text,q.question_text) AS prompt,
         a.filled_form_id, a.selected_choices
  FROM target f JOIN filled_forms ff ON ff.form_id=f.id
  JOIN filled_form_choice_answers a ON a.filled_form_id=ff.id
  JOIN multiple_choice_questions q ON q.id=a.choice_question_id
), current_questions AS (
  SELECT q.id,q.question_text AS prompt,m.position
  FROM target f JOIN form_choice_questions m ON m.form_id=f.id
  JOIN multiple_choice_questions q ON q.id=m.choice_question_id
), versions AS (
  SELECT id,prompt FROM current_questions UNION SELECT id,prompt FROM answers
), votes AS (
  SELECT a.id,a.prompt,p.label,count(DISTINCT a.filled_form_id) AS n
  FROM answers a CROSS JOIN LATERAL jsonb_array_elements_text(a.selected_choices) p(label)
  GROUP BY a.id,a.prompt,p.label
), options AS (
  SELECT v.id,v.prompt,o.label,min(o.ord) AS ord
  FROM versions v JOIN multiple_choice_questions q ON q.id=v.id
  CROSS JOIN LATERAL jsonb_array_elements_text(q.choices) WITH ORDINALITY o(label,ord)
  GROUP BY v.id,v.prompt,o.label
  UNION ALL
  SELECT t.id,t.prompt,t.label,NULL FROM votes t JOIN multiple_choice_questions q ON q.id=t.id
  WHERE NOT (q.choices ? t.label)
), breakdown AS (
  SELECT v.id,v.prompt,c.position,coalesce(jsonb_agg(jsonb_build_object(
    'label',o.label,'count',coalesce(t.n,0)) ORDER BY o.ord NULLS LAST,o.label)
    FILTER (WHERE o.label IS NOT NULL),'[]') AS options
  FROM versions v LEFT JOIN current_questions c USING(id,prompt)
  LEFT JOIN options o USING(id,prompt) LEFT JOIN votes t ON (t.id,t.prompt,t.label)=(o.id,o.prompt,o.label)
  GROUP BY v.id,v.prompt,c.position
)
SELECT f.title,f.status,(SELECT count(*) FROM filled_forms WHERE form_id=f.id),
  coalesce((SELECT jsonb_agg(jsonb_build_object('id',id,'prompt',prompt,'previous',position IS NULL,
    'options',options) ORDER BY position NULLS LAST,id,prompt) FROM breakdown),'[]')
FROM target f`

func (a *app) report(w http.ResponseWriter, r *http.Request, u user) error {
	var report struct {
		Title         string          `json:"title"`
		Status        string          `json:"status"`
		ResponseCount int             `json:"response_count"`
		Questions     json.RawMessage `json:"choice_questions"`
	}
	err := a.db.QueryRow(r.Context(), reportSQL, r.PathValue("slug"), u.ID).
		Scan(&report.Title, &report.Status, &report.ResponseCount, &report.Questions)
	if err != nil {
		return err
	}
	return respond(w, http.StatusOK, report)
}

func spreadsheetText(value string) string {
	trimmed := strings.TrimLeftFunc(value, unicode.IsSpace)
	if (trimmed != "" && strings.ContainsAny(trimmed[:1], "=+-@")) || strings.HasPrefix(value, "\t") ||
		strings.HasPrefix(value, "\r") || strings.HasPrefix(value, "\n") {
		return "'" + value
	}
	return value
}

func writeResponsesCSV(dst io.Writer, slug string, replies []reply) error {
	out := csv.NewWriter(dst)
	if err := out.Write([]string{"Form slug", "Response ID", "Submitted at (UTC)", "Name", "Email", "Question type", "Question ID", "Question", "Answer"}); err != nil {
		return err
	}
	for _, item := range replies {
		base := []string{spreadsheetText(slug), strconv.Itoa(item.ID), item.Submitted.UTC().Format(time.RFC3339Nano),
			spreadsheetText(item.Name), spreadsheetText(item.Email)}
		for _, a := range item.Answers {
			if err := out.Write(append(base, "written", strconv.Itoa(a.QuestionID), spreadsheetText(a.Prompt), spreadsheetText(a.Answer))); err != nil {
				return err
			}
		}
		for _, a := range item.ChoiceAnswers {
			choices := a.Choices
			if len(choices) == 0 {
				choices = []string{""}
			}
			for _, option := range choices {
				if err := out.Write(append(base, "choice", strconv.Itoa(a.QuestionID), spreadsheetText(a.Prompt), spreadsheetText(option))); err != nil {
					return err
				}
			}
		}
		if len(item.Answers)+len(item.ChoiceAnswers) == 0 {
			if err := out.Write(append(base, "", "", "", "")); err != nil {
				return err
			}
		}
	}
	out.Flush()
	return out.Error()
}

func (a *app) exportCSV(w http.ResponseWriter, r *http.Request, u user) error {
	slug := r.PathValue("slug")
	replies, err := a.ownerReplies(r.Context(), slug, u.ID)
	if err != nil {
		return err
	}
	w.Header().Set("Content-Type", "text/csv; charset=utf-8")
	w.Header().Set("Content-Disposition", mime.FormatMediaType("attachment", map[string]string{"filename": "anoq-" + slug + "-responses.csv"}))
	return writeResponsesCSV(w, slug, replies)
}
