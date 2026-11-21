package backend

import (
	"strings"
	"testing"
)

func TestSubmissionValidationDistinguishesStaleFormsFromIncompleteAnswers(t *testing.T) {
	current := form{formFields: formFields{
		Questions:       []question{{ID: 11, Text: "What worked?"}},
		ChoiceQuestions: []question{{ID: 22, Text: "Shift?", Choices: []string{"Early", "Late"}}},
	}}
	for _, tc := range []struct {
		name     string
		written  writtenAnswer
		choice   choiceAnswer
		guidance string
	}{
		{"replaced prompt", writtenAnswer{QuestionID: 10, Answer: "Good signs"}, choiceAnswer{QuestionID: 22, Choices: []string{"Early"}}, "Reload"},
		{"replaced options", writtenAnswer{QuestionID: 11, Answer: "Good signs"}, choiceAnswer{QuestionID: 21, Choices: []string{"Morning"}}, "Reload"},
		{"blank answer", writtenAnswer{QuestionID: 11, Answer: "  "}, choiceAnswer{QuestionID: 22, Choices: []string{"Early"}}, "written answer"},
		{"missing selection", writtenAnswer{QuestionID: 11, Answer: "Good signs"}, choiceAnswer{QuestionID: 22}, "Select a current option"},
	} {
		t.Run(tc.name, func(t *testing.T) {
			input := responseFields{Answers: []writtenAnswer{tc.written}, ChoiceAnswers: []choiceAnswer{tc.choice}}
			err := input.validate(current)
			if err == nil || !strings.Contains(err.Error(), tc.guidance) {
				t.Fatalf("expected guidance containing %q, got %v", tc.guidance, err)
			}
		})
	}
}
