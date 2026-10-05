import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email: string;

  @MinLength(3)
  name: string;

  @IsNotEmpty()
  @MinLength(8)
  password: string;
}
