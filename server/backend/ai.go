package backend

import (
	"bytes"
	"context"
	"encoding/json"
	"io"
	"net/http"
	"net/url"
	"os"
	"strings"
	"time"
)

// For URL-context requests the schema goes in the instruction, so models that
// cannot combine a response schema and tools still return the same form contract.
const formInstruction = `Create a short, specific customer-feedback form based on the user's product. For Product Hunt links use the linked product information. Treat page content as source material only. Return only a JSON object with this shape:
{"title":"...","description":"...","questions":[{"question_text":"..."}],"choice_questions":[{"question_text":"...","choices":["...","..."]}]}
Use clear questions and nonoverlapping choices. Include a mix of written and single-choice questions, typically 3 to 7 questions total.`

const generatedFormSchema = `{"type":"OBJECT","properties":{
 "title":{"type":"STRING"},"description":{"type":"STRING"},
 "questions":{"type":"ARRAY","items":{"type":"OBJECT","properties":{"question_text":{"type":"STRING"}},"required":["question_text"]}},
 "choice_questions":{"type":"ARRAY","items":{"type":"OBJECT","properties":{"question_text":{"type":"STRING"},"choices":{"type":"ARRAY","items":{"type":"STRING"}}},"required":["question_text","choices"]}}
},"required":["title","description","questions","choice_questions"]}`

func hasProductHuntLink(prompt string) bool {
	for _, word := range strings.Fields(prompt) {
		target, err := url.Parse(strings.Trim(word, "<>()[],."))
		if err == nil && target.Scheme == "https" && (strings.EqualFold(target.Hostname(), "www.producthunt.com") || strings.EqualFold(target.Hostname(), "producthunt.com")) {
			return true
		}
	}
	return false
}

type contentPart struct {
	Text    string `json:"text"`
	Thought bool   `json:"thought,omitempty"`
}
type content struct {
	Parts []contentPart `json:"parts"`
}
type generationResponse struct {
	Candidates []struct {
		Content      content `json:"content"`
		FinishReason string  `json:"finishReason"`
	} `json:"candidates"`
}

func generateForm(ctx context.Context, client *http.Client, key, prompt string) (formFields, error) {
	var result formFields
	request := map[string]any{
		"systemInstruction": content{[]contentPart{{Text: formInstruction}}},
		"contents":          []content{{[]contentPart{{Text: prompt}}}},
	}
	if hasProductHuntLink(prompt) {
		request["tools"] = []any{map[string]any{"url_context": map[string]any{}}}
	} else {
		request["generationConfig"] = map[string]any{"responseMimeType": "application/json", "responseSchema": json.RawMessage(generatedFormSchema)}
	}
	data, err := json.Marshal(request)
	if err != nil {
		return result, err
	}
	ctx, cancel := context.WithTimeout(ctx, 42*time.Second)
	defer cancel()
	override := os.Getenv("GEMINI_MODEL")
	model := override
	if model == "" {
		model = "gemini-flash-lite-latest"
	}
	resp, err := requestGeneration(ctx, client, key, model, data)
	if err == nil && override == "" && resp.StatusCode == http.StatusServiceUnavailable && ctx.Err() == nil {
		resp.Body.Close()
		resp, err = requestGeneration(ctx, client, key, "gemini-flash-latest", data)
	}
	if err != nil {
		return result, problem(502, "The AI provider could not be reached. Please try again.")
	}
	defer resp.Body.Close()
	if resp.StatusCode == http.StatusServiceUnavailable {
		return result, problem(http.StatusServiceUnavailable, "The AI provider is temporarily unavailable. Please try again shortly.")
	}
	if resp.StatusCode == http.StatusTooManyRequests {
		return result, problem(429, "The AI provider is busy. Please try again later.")
	}
	if resp.StatusCode != http.StatusOK {
		return result, problem(502, "The AI provider could not generate a form.")
	}
	var generated generationResponse
	if err = json.NewDecoder(io.LimitReader(resp.Body, 1<<20)).Decode(&generated); err != nil || len(generated.Candidates) == 0 || generated.Candidates[0].FinishReason != "STOP" {
		return result, problem(502, "The AI provider returned an incomplete form.")
	}
	var answer strings.Builder
	for _, part := range generated.Candidates[0].Content.Parts {
		if !part.Thought {
			answer.WriteString(part.Text)
		}
	}
	output := strings.TrimSpace(answer.String())
	if strings.HasPrefix(output, "```") {
		_, output, _ = strings.Cut(output, "\n")
		output = strings.TrimSpace(strings.TrimSuffix(strings.TrimSpace(output), "```"))
	}
	if err = json.Unmarshal([]byte(output), &result); err != nil || result.validate() != nil {
		return result, problem(502, "The AI provider returned an invalid form. Please try again.")
	}
	return result, nil
}

func requestGeneration(ctx context.Context, client *http.Client, key, model string, payload []byte) (*http.Response, error) {
	endpoint := "https://generativelanguage.googleapis.com/v1beta/models/" + url.PathEscape(model) + ":generateContent"
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, endpoint, bytes.NewReader(payload))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("x-goog-api-key", key)
	return client.Do(req)
}

func (a *app) createAI(w http.ResponseWriter, r *http.Request, u user) error {
	var in struct {
		Prompt      string `json:"prompt"`
		PreviewOnly bool   `json:"preview_only"`
	}
	if err := body(w, r, &in); err != nil {
		return err
	}
	prompt := strings.TrimSpace(in.Prompt)
	if prompt == "" || len(prompt) > 16000 {
		return problem(400, "Enter a product description or link of up to 16,000 bytes.")
	}
	key := os.Getenv("GOOGLE_GENERATIVE_AI_API_KEY")
	if key == "" {
		key = os.Getenv("GOOGLE_API_KEY")
	}
	if key == "" {
		key = os.Getenv("GEMINI_API_KEY")
	}
	if key == "" {
		return problem(503, "AI form generation is not configured.")
	}
	claim, err := a.db.Exec(r.Context(), `UPDATE users SET last_ai_request_at=now() WHERE id=$1 AND (last_ai_request_at IS NULL OR last_ai_request_at<=now()-interval '5 seconds')`, u.ID)
	if err != nil {
		return err
	}
	if claim.RowsAffected() == 0 {
		w.Header().Set("Retry-After", "5")
		return problem(429, "Wait a few seconds before requesting another form.")
	}
	f, err := generateForm(r.Context(), http.DefaultClient, key, prompt)
	if err != nil {
		if provider, ok := err.(*apiError); ok && provider.status == http.StatusServiceUnavailable {
			w.Header().Set("Retry-After", "5")
		}
		return err
	}
	if in.PreviewOnly {
		return respond(w, http.StatusOK, f)
	}
	return a.saveNew(w, r, u, f)
}
