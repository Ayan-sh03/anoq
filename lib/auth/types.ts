/**
 * Authentication type definitions
 */

export interface User {
  id: number;
  email: string;
  username?: string;
  family_name?: string;
  given_name?: string;
  created_at: string;
}

export interface Question {
  question_text: string;
  answer_text: string;
}

export interface MultipleChoiceQuestionInput {
  question_text: string;
  choices: string[];
}


export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

export interface AuthResponse {
  user: User;
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  username?: string;
  family_name?: string;
  given_name?: string;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

export interface AuthContextValue extends AuthState {
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}