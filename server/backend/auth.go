package backend

import (
	"context"
	"errors"
	"net/http"
	"net/mail"
	"strings"
	"time"
	"unicode/utf8"

	"github.com/jackc/pgx/v5"
	"golang.org/x/crypto/bcrypt"
)

type user struct {
	ID         int       `json:"id"`
	Email      string    `json:"email"`
	Username   *string   `json:"username,omitempty"`
	FamilyName *string   `json:"family_name,omitempty"`
	GivenName  *string   `json:"given_name,omitempty"`
	CreatedAt  time.Time `json:"created_at"`
}

func (u *user) columns() []any {
	return []any{&u.ID, &u.Email, &u.Username, &u.FamilyName, &u.GivenName, &u.CreatedAt}
}

type credentials struct {
	Email      string  `json:"email"`
	Password   string  `json:"password"`
	Username   *string `json:"username"`
	FamilyName *string `json:"family_name"`
	GivenName  *string `json:"given_name"`
}

func emailAddress(value string) bool {
	addr, err := mail.ParseAddress(value)
	return err == nil && addr.Address == value && len(value) <= 254 && strings.Contains(value, "@")
}
func (a *app) currentUser(r *http.Request) (user, error) {
	var u user
	auth, err := r.Cookie("access_token")
	if err != nil || len(auth.Value) != 43 {
		return u, problem(401, "Sign in to continue.")
	}
	err = a.db.QueryRow(r.Context(), `SELECT u.id,u.email,u.username,u.family_name,u.given_name,u.created_at FROM users u JOIN web_sessions s ON s.user_id=u.id WHERE s.token_hash=$1 AND s.expires_at>now()`, digest(auth.Value)).Scan(u.columns()...)
	if errors.Is(err, pgx.ErrNoRows) {
		return u, problem(401, "Sign in to continue.")
	}
	return u, err
}

const sessionDays = 30

func newSession(ctx context.Context, tx pgx.Tx, id int) (string, error) {
	value, err := token(32)
	if err != nil {
		return "", err
	}
	if _, err = tx.Exec(ctx, `DELETE FROM web_sessions WHERE user_id=$1 AND expires_at<=now()`, id); err != nil {
		return "", err
	}
	_, err = tx.Exec(ctx, `INSERT INTO web_sessions(token_hash,user_id,expires_at) VALUES ($1,$2,now()+make_interval(days => $3))`, digest(value), id, sessionDays)
	return value, err
}

func (a *app) register(w http.ResponseWriter, r *http.Request) error {
	var in credentials
	if err := body(w, r, &in); err != nil {
		return err
	}
	in.Email = strings.ToLower(strings.TrimSpace(in.Email))
	if !emailAddress(in.Email) {
		return problem(400, "Enter a valid email address.")
	}
	if len(in.Password) < 8 || len(in.Password) > 72 {
		return problem(400, "Use a password between 8 and 72 bytes.")
	}
	for _, ptr := range []**string{&in.Username, &in.FamilyName, &in.GivenName} {
		if *ptr == nil {
			continue
		}
		value := strings.TrimSpace(**ptr)
		if utf8.RuneCountInString(value) > 255 {
			return problem(400, "Profile values must be 255 characters or shorter.")
		}
		if value == "" {
			*ptr = nil
		} else {
			*ptr = &value
		}
	}
	hash, err := bcrypt.GenerateFromPassword([]byte(in.Password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	ctx := r.Context()
	tx, err := a.db.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)
	var u user
	err = tx.QueryRow(ctx, `INSERT INTO users(email,password_hash,username,family_name,given_name) VALUES($1,$2,$3,$4,$5) RETURNING id,email,username,family_name,given_name,created_at`, in.Email, string(hash), in.Username, in.FamilyName, in.GivenName).Scan(u.columns()...)
	if uniqueViolation(err) {
		return problem(409, "Email or username is already registered.")
	}
	if err != nil {
		return err
	}
	value, err := newSession(ctx, tx, u.ID)
	if err != nil {
		return err
	}
	if err = tx.Commit(ctx); err != nil {
		return err
	}
	cookie(w, r, "access_token", value, sessionDays*86400)
	return respond(w, 201, map[string]any{"user": u})
}

func (a *app) login(w http.ResponseWriter, r *http.Request) error {
	var in credentials
	if err := body(w, r, &in); err != nil {
		return err
	}
	var u user
	var hash string
	ctx := r.Context()
	err := a.db.QueryRow(ctx, `SELECT id,email,username,family_name,given_name,created_at,password_hash FROM users WHERE email=$1`, strings.ToLower(strings.TrimSpace(in.Email))).Scan(append(u.columns(), &hash)...)
	if err != nil && !errors.Is(err, pgx.ErrNoRows) {
		return err
	}
	if err != nil {
		// Perform the same bcrypt work for unknown email addresses.
		hash = "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy"
	}
	if check := bcrypt.CompareHashAndPassword([]byte(hash), []byte(in.Password)); check != nil || err != nil || len(in.Password) > 72 {
		return problem(401, "Email or password is incorrect.")
	}
	tx, err := a.db.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)
	value, err := newSession(ctx, tx, u.ID)
	if err != nil {
		return err
	}
	if err = tx.Commit(ctx); err != nil {
		return err
	}
	cookie(w, r, "access_token", value, sessionDays*86400)
	return respond(w, 200, map[string]any{"user": u})
}
func (a *app) logout(w http.ResponseWriter, r *http.Request) error {
	if auth, err := r.Cookie("access_token"); err == nil {
		if _, err = a.db.Exec(r.Context(), "DELETE FROM web_sessions WHERE token_hash=$1", digest(auth.Value)); err != nil {
			return err
		}
	}
	cookie(w, r, "access_token", "", -1)
	return respond(w, 200, map[string]bool{"ok": true})
}
