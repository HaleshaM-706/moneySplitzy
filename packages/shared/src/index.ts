export type UUID = string;

export interface UserDTO {
  id: UUID;
  email: string;
  name?: string;
}

export type Currency = 'INR' | string;
