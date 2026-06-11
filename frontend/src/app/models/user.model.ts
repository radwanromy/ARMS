export interface User {
  id?: number;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  profilePicture?: string;
  passportNumber?: string;
  nationality?: string;
  dateOfBirth?: string;
  role: string;
  theme?: string;
}

export interface AuthResponse {
  token: string;
  username: string;
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
  profilePicture?: string;
  theme?: string;
}

