import { Type } from "class-transformer";
import { IsEmail, IsNotEmpty, IsOptional, IsString, IsUUID, Length, MinLength, ValidateNested } from "class-validator";

export class CreateAdminDto {
  @Length(8, 8, { message: "El DNI debe tener 8 caracteres" })
  @IsString({ message: "El DNI debe ser una cadena de texto" })
  @IsNotEmpty({ message: "El DNI es obligatorio" })
  ic: string;

  @MinLength(3, { message: "El nombre de usuario debe tener al menos 3 caracteres" })
  @IsString({ message: "El nombre de usuario debe ser una cadena de texto" })
  @IsNotEmpty({ message: "El nombre de usuario es obligatorio" })
  userName: string;

  @MinLength(3, { message: "El nombre debe tener al menos 3 caracteres" })
  @IsString({ message: "El nombre debe ser una cadena de texto" })
  @IsNotEmpty({ message: "El nombre es obligatorio" })
  firstName: string;

  @MinLength(3, { message: "El apellido debe tener al menos 3 caracteres" })
  @IsString({ message: "El apellido debe ser una cadena de texto" })
  @IsNotEmpty({ message: "El apellido es obligatorio" })
  lastName: string;

  @IsEmail({}, { message: "El correo electrónico no es válido" })
  @IsNotEmpty({ message: "El correo electrónico es obligatorio" })
  email: string;

  @MinLength(8, { message: "La contraseña debe tener al menos 8 caracteres" })
  @IsString({ message: "La contraseña debe ser una cadena de texto" })
  @IsNotEmpty({ message: "La contraseña es obligatoria" })
  password: string;

  @Length(10, 10, { message: "El número de teléfono debe tener 10 caracteres" })
  @IsString({ message: "El número de teléfono debe ser una cadena de texto" })
  @IsNotEmpty({ message: "El número de teléfono es obligatorio" })
  phoneNumber: string;

  @IsUUID("4", { message: "El rol debe ser un UUID válido" })
  @IsNotEmpty({ message: "El rol es obligatorio" })
  roleId: string;
}

export class CreateBusinessDataDto {
  @MinLength(3, { message: "El subdominio debe tener al menos 3 caracteres" })
  @IsString({ message: "El subdominio debe ser una cadena de texto" })
  @IsNotEmpty({ message: "El subdominio es obligatorio" })
  slug: string;

  @Length(11, 11, { message: "El CUIT debe tener 11 dígitos" })
  @IsString({ message: "El CUIT debe ser una cadena de texto" })
  @IsNotEmpty({ message: "El CUIT es obligatorio" })
  taxId: string;

  @MinLength(3, { message: "La razón social debe tener al menos 3 caracteres" })
  @IsString({ message: "La razón social debe ser una cadena de texto" })
  @IsNotEmpty({ message: "La razón social es obligatoria" })
  companyName: string;

  @MinLength(3, { message: "El nombre comercial debe tener al menos 3 caracteres" })
  @IsString({ message: "El nombre comercial debe ser una cadena de texto" })
  @IsNotEmpty({ message: "El nombre comercial es obligatorio" })
  tradeName: string;

  @MinLength(3, { message: "La descripción debe tener al menos 3 caracteres" })
  @IsString({ message: "La descripción debe ser una cadena de texto" })
  @IsNotEmpty({ message: "La descripción es obligatoria" })
  description: string;

  @MinLength(3, { message: "La calle debe tener al menos 3 caracteres" })
  @IsString({ message: "La calle debe ser una cadena de texto" })
  @IsNotEmpty({ message: "La calle es obligatoria" })
  street: string;

  @MinLength(3, { message: "La ciudad debe tener al menos 3 caracteres" })
  @IsString({ message: "La ciudad debe ser una cadena de texto" })
  @IsNotEmpty({ message: "La ciudad es obligatoria" })
  city: string;

  @MinLength(3, { message: "La provincia debe tener al menos 3 caracteres" })
  @IsString({ message: "La provincia debe ser una cadena de texto" })
  @IsNotEmpty({ message: "La provincia es obligatoria" })
  province: string;

  @MinLength(3, { message: "El país debe tener al menos 3 caracteres" })
  @IsString({ message: "El país debe ser una cadena de texto" })
  @IsNotEmpty({ message: "El país es obligatorio" })
  country: string;

  @MinLength(4, { message: "El código postal debe tener al menos 4 caracteres" })
  @IsString({ message: "El código postal debe ser una cadena de texto" })
  @IsNotEmpty({ message: "El código postal es obligatorio" })
  zipCode: string;
}

export class CreateContactDto {
  @IsEmail({}, { message: "El correo electrónico no es válido" })
  @IsNotEmpty({ message: "El correo electrónico es obligatorio" })
  email: string;

  @Length(10, 10, { message: "El número de teléfono debe tener 10 caracteres" })
  @IsString({ message: "El número de teléfono debe ser una cadena de texto" })
  @IsNotEmpty({ message: "El número de teléfono es obligatorio" })
  phoneNumber: string;

  @Length(10, 10, { message: "El número de WhatsApp debe tener 10 caracteres" })
  @IsString({ message: "El número de WhatsApp debe ser una cadena de texto" })
  @IsOptional()
  whatsAppNumber?: string;

  @MinLength(7, { message: "La página web debe tener al menos 7 caracteres" })
  @IsString({ message: "La página web debe ser una cadena de texto" })
  @IsOptional()
  website?: string;
}

export class CreateBusinessFullDto {
  @ValidateNested()
  @Type(() => CreateAdminDto)
  admin: CreateAdminDto;

  @ValidateNested()
  @Type(() => CreateBusinessDataDto)
  business: CreateBusinessDataDto;

  @ValidateNested()
  @Type(() => CreateContactDto)
  contact: CreateContactDto;
}
