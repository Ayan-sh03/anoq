package backend

import (
	"bytes"
	"encoding/csv"
	"slices"
	"testing"
	"time"
)

func TestCSVPreservesPromptSnapshotsAndSpreadsheetText(t *testing.T) {
	submitted := time.Date(2026, 3, 2, 12, 0, 0, 0, time.FixedZone("fixture", 3600))
	replies := []reply{{ID: 7, Submitted: submitted, responseFields: responseFields{
		Name:          "=1+1",
		Answers:       []writtenAnswer{{QuestionID: 2, Prompt: "First, what worked?", Answer: "The “café”\nsaid \"yes\"."}},
		ChoiceAnswers: []choiceAnswer{{QuestionID: 5, Prompt: "Original wording?", Choices: []string{"A, B", "C"}}},
	}}}
	var buf bytes.Buffer
	if err := writeResponsesCSV(&buf, "workshop", replies); err != nil {
		t.Fatal(err)
	}
	rows, err := csv.NewReader(&buf).ReadAll()
	if err != nil || len(rows) != 4 {
		t.Fatalf("unexpected export: %v, %v", rows, err)
	}
	want := []string{"workshop", "7", "2026-03-02T11:00:00Z", "'=1+1", "", "written", "2", "First, what worked?", "The “café”\nsaid \"yes\"."}
	if !slices.Equal(rows[1], want) || rows[2][7] != "Original wording?" || rows[2][8] != "A, B" || rows[3][8] != "C" {
		t.Fatalf("unexpected answer rows: %v", rows[1:])
	}
}
