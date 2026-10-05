export type MinorUnit = number; // integer representing smallest currency unit (e.g., paise)

export interface Payment {
  userId: string;
  amount: MinorUnit;
}

export interface Split {
  userId: string;
  amount: MinorUnit;
}

export interface Balance {
  userId: string;
  balance: MinorUnit; // positive means user should receive, negative means owes
}

export interface Debt {
  from: string;
  to: string;
  amount: MinorUnit;
}
