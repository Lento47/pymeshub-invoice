// Prisma schema equivalent — use this as reference for your schema.prisma

/*
model Invoice {
  id          String        @id @default(uuid())
  number      String        @unique   // e.g. "PH-2026-0001"
  tenantId    String
  clientName  String
  clientEmail String
  clientCompany String?
  clientAddress String?
  clientTaxId String?

  planName    String
  planInterval String        // MONTHLY | ANNUAL
  seats       Int

  subtotal    Float
  taxRate     Float          @default(0)
  taxAmount   Float
  total       Float
  currency    String         @default("USD")

  status      String         @default("DRAFT") // DRAFT | SENT | PAID | OVERDUE | VOID
  notes       String?
  pdfUrl      String?        // URL stored in MinIO after generation

  issuedAt    DateTime       @default(now())
  dueDate     DateTime?
  paidAt      DateTime?

  lineItems   InvoiceLineItem[]

  createdAt   DateTime       @default(now())
  updatedAt   DateTime       @updatedAt
}

model InvoiceLineItem {
  id          String   @id @default(uuid())
  invoiceId   String
  invoice     Invoice  @relation(fields: [invoiceId], references: [id])
  description String
  quantity    Int
  unitPrice   Float
  total       Float
}
*/

// TypeScript interface for in-memory / service layer use

export interface InvoiceLineItem {
  id?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  currency: string;
}

export interface Invoice {
  id: string;
  number: string;
  tenantId: string;

  clientName: string;
  clientEmail: string;
  clientCompany?: string;
  clientAddress?: string;
  clientTaxId?: string;

  planName: string;
  planInterval: 'MONTHLY' | 'ANNUAL';
  seats: number;

  lineItems: InvoiceLineItem[];

  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  currency: string;

  status: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'VOID';
  notes?: string;
  pdfUrl?: string;

  issuedAt: Date;
  dueDate?: Date;
  paidAt?: Date;
}
