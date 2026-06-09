export interface User {
  id?: number;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  role: string;
}

export interface AuthResponse {
  token: string;
  username: string;
  email: string;
  role: string;
}
