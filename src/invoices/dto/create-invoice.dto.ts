import { IsString, IsEmail, IsEnum, IsNumber, IsOptional, IsArray, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';

export enum PlanInterval {
  MONTHLY = 'MONTHLY',
  ANNUAL = 'ANNUAL',
}

export enum InvoiceStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  VOID = 'VOID',
}

export class InvoiceLineItemDto {
  @IsString()
  description: string;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsNumber()
  @Min(0)
  unitPrice: number; // in CRC or USD

  @IsString()
  @IsOptional()
  currency?: string; // defaults to 'USD'
}

export class CreateInvoiceDto {
  // Tenant / Client info
  @IsString()
  tenantId: string;

  @IsString()
  clientName: string;

  @IsEmail()
  clientEmail: string;

  @IsString()
  @IsOptional()
  clientCompany?: string;

  @IsString()
  @IsOptional()
  clientAddress?: string;

  @IsString()
  @IsOptional()
  clientTaxId?: string; // Cédula jurídica or cédula física

  // Subscription info
  @IsString()
  planName: string; // e.g. "Starter", "Pro", "Enterprise"

  @IsEnum(PlanInterval)
  planInterval: PlanInterval;

  @IsNumber()
  seats: number;

  // Line items
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InvoiceLineItemDto)
  lineItems: InvoiceLineItemDto[];

  // Tax
  @IsNumber()
  @Min(0)
  @IsOptional()
  taxRate?: number; // percentage, e.g. 13 for Costa Rica IVA

  // Dates
  @IsString()
  @IsOptional()
  dueDate?: string; // ISO date string

  @IsString()
  @IsOptional()
  notes?: string;
}
