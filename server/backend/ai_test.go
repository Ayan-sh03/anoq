package backend

import (
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"path"
	"strings"
	"testing"
	"time"
)

type transportFunc func(*http.Request) (*http.Response, error)

func (f transportFunc) RoundTrip(r *http.Request) (*http.Response, error) { return f(r) }

func TestGeminiTransientFailure(t *testing.T) {
	const flash = "gemini-flash-latest"
	const lite = "gemini-flash-lite-latest"
	const success = `{"candidates":[{"finishReason":"STOP","content":{"parts":[{"text":"{\"title\":\"Feedback\",\"questions\":[{\"question_text\":\"How was it?\"}]}"}]}}]}`
	for _, tc := range []struct {
		name      string
		override  string
		models    []string
		responses []int
		wantError int
	}{
		{"capacity recovers on fallback", "", []string{lite, flash}, []int{503, 200}, 0},
		{"both models unavailable", "", []string{lite, flash}, []int{503, 503}, 503},
		{"explicit model stays selected", "chosen-model", []string{"chosen-model"}, []int{503}, 503},
		{"explicit default stays selected", lite, []string{lite}, []int{503}, 503},
		{"quota gets no fallback", "", []string{lite}, []int{429}, 429},
		{"quota during fallback", "", []string{lite, flash}, []int{503, 429}, 429},
	} {
		t.Run(tc.name, func(t *testing.T) {
			t.Setenv("GEMINI_MODEL", tc.override)
			calls := 0
			var deadline time.Time
			client := &http.Client{Transport: transportFunc(func(r *http.Request) (*http.Response, error) {
				if calls >= len(tc.models) {
					t.Fatal("unexpected extra request")
				}
				model := strings.TrimSuffix(path.Base(r.URL.Path), ":generateContent")
				if model != tc.models[calls] {
					t.Fatalf("attempt %d used %s, want %s", calls+1, model, tc.models[calls])
				}
				current, ok := r.Context().Deadline()
				if !ok || (!deadline.IsZero() && !current.Equal(deadline)) {
					t.Fatal("attempts must share one deadline")
				}
				deadline = current
				status := tc.responses[calls]
				calls++
				return &http.Response{StatusCode: status, Body: io.NopCloser(strings.NewReader(success))}, nil
			})}
			f, err := generateForm(t.Context(), client, "fixture-key", "Feedback for a calendar.")
			if calls != len(tc.models) {
				t.Fatalf("got %d requests, want %d", calls, len(tc.models))
			}
			if tc.wantError == 0 {
				if err != nil || f.Title != "Feedback" {
					t.Fatalf("form %q, error %v", f.Title, err)
				}
				return
			}
			var api *apiError
			if !errors.As(err, &api) || api.status != tc.wantError {
				t.Fatalf("got %v, want status %d", err, tc.wantError)
			}
		})
	}
}

func TestGeminiFeedbackForm(t *testing.T) {
	const formJSON = `{"title":"Launch","description":"Tell us about your experience","questions":[{"question_text":"What would you change?"}],"choice_questions":[{"question_text":"Would you recommend it?","choices":["Yes","No"]}]}`
	for _, tc := range []struct {
		name, prompt string
		withURL      bool
	}{
		{"description", "Calendar for small clinics", false},
		{"product hunt link", "Calendar for clinics\nhttps://www.producthunt.com/posts/clinic-calendar", true},
	} {
		t.Run(tc.name, func(t *testing.T) {
			client := &http.Client{Transport: transportFunc(func(r *http.Request) (*http.Response, error) {
				if r.Method != http.MethodPost || r.URL.Host != "generativelanguage.googleapis.com" || r.Header.Get("x-goog-api-key") != "test" {
					t.Fatal("wrong Gemini request")
				}
				var payload map[string]json.RawMessage
				if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
					t.Fatal(err)
				}
				_, hasTools := payload["tools"]
				_, hasSchema := payload["generationConfig"]
				if tc.withURL != hasTools || hasTools == hasSchema {
					t.Fatalf("URL context %v, schema %v", hasTools, hasSchema)
				}
				text := formJSON
				if tc.withURL {
					text = "```json\n" + text + "\n```"
				}
				result := map[string]any{"candidates": []any{map[string]any{"finishReason": "STOP", "content": content{[]contentPart{{Text: "scratch", Thought: true}, {Text: text}}}}}}
				encoded, err := json.Marshal(result)
				if err != nil {
					t.Fatal(err)
				}
				return &http.Response{StatusCode: 200, Body: io.NopCloser(strings.NewReader(string(encoded)))}, nil
			})}
			generated, err := generateForm(t.Context(), client, "test", tc.prompt)
			if err != nil {
				t.Fatal(err)
			}
			if generated.Title != "Launch" || len(generated.Questions) != 1 || len(generated.ChoiceQuestions) != 1 {
				t.Fatalf("unexpected form: %+v", generated)
			}
		})
	}
}
