export interface User {
  id: number;
  email: string;
  username?: string;
  family_name?: string;
  given_name?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData extends LoginCredentials {
  username?: string;
  family_name?: string;
  given_name?: string;
}
