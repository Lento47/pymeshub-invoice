import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateInvoiceDto, PlanInterval } from './dto/create-invoice.dto';
import { Invoice, InvoiceLineItem } from './invoice.entity';
import { generateInvoicePdf } from './invoice-pdf.service';
import { v4 as uuidv4 } from 'uuid';

/**
 * InvoicesService
 *
 * Handles SaaS subscription invoice creation and PDF generation.
 * Replace the in-memory store with your PrismaService calls.
 *
 * Depends on:
 *   - pdfkit         → PDF generation
 *   - uuid           → unique invoice IDs
 *   - (optional) MinioService → store PDF and return a signed URL
 */
@Injectable()
export class InvoicesService {
  // ── Replace with PrismaService in production ──────────────────────────────
  private readonly invoices: Map<string, Invoice> = new Map();
  private invoiceCounter = 1;

  // ─────────────────────────────────────────────────────────────────────────
  // PUBLIC API
  // ─────────────────────────────────────────────────────────────────────────

  async create(dto: CreateInvoiceDto): Promise<Invoice> {
    const lineItems = this.buildLineItems(dto);
    const { subtotal, taxAmount, total } = this.calcTotals(lineItems, dto.taxRate ?? 0);
    const currency = dto.lineItems[0]?.currency ?? 'USD';

    const invoice: Invoice = {
      id: uuidv4(),
      number: this.generateNumber(),
      tenantId: dto.tenantId,
      clientName: dto.clientName,
      clientEmail: dto.clientEmail,
      clientCompany: dto.clientCompany,
      clientAddress: dto.clientAddress,
      clientTaxId: dto.clientTaxId,
      planName: dto.planName,
      planInterval: dto.planInterval,
      seats: dto.seats,
      lineItems,
      subtotal,
      taxRate: dto.taxRate ?? 0,
      taxAmount,
      total,
      currency,
      status: 'DRAFT',
      notes: dto.notes,
      issuedAt: new Date(),
      dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
    };

    // Persist → replace with: await this.prisma.invoice.create({ data: ... })
    this.invoices.set(invoice.id, invoice);

    return invoice;
  }

  async findAll(tenantId: string): Promise<Invoice[]> {
    // Replace with: return this.prisma.invoice.findMany({ where: { tenantId } })
    return [...this.invoices.values()].filter((i) => i.tenantId === tenantId);
  }

  async findOne(id: string, tenantId: string): Promise<Invoice> {
    const invoice = this.invoices.get(id);
    if (!invoice || invoice.tenantId !== tenantId) {
      throw new NotFoundException(`Invoice ${id} not found`);
    }
    return invoice;
  }

  async markAsPaid(id: string, tenantId: string): Promise<Invoice> {
    const invoice = await this.findOne(id, tenantId);
    invoice.status = 'PAID';
    invoice.paidAt = new Date();
    // Replace with: await this.prisma.invoice.update(...)
    this.invoices.set(id, invoice);
    return invoice;
  }

  async markAsVoid(id: string, tenantId: string): Promise<Invoice> {
    const invoice = await this.findOne(id, tenantId);
    invoice.status = 'VOID';
    this.invoices.set(id, invoice);
    return invoice;
  }

  /**
   * Generates the PDF for an invoice and returns a Buffer.
   * You can pipe this Buffer into:
   *   - Response (download via HTTP)
   *   - MinIO / S3 (store and return signed URL)
   *   - Nodemailer attachment (email delivery)
   */
  async getPdf(id: string, tenantId: string): Promise<Buffer> {
    const invoice = await this.findOne(id, tenantId);
    return generateInvoicePdf(invoice);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PRIVATE HELPERS
  // ─────────────────────────────────────────────────────────────────────────

  private buildLineItems(dto: CreateInvoiceDto): InvoiceLineItem[] {
    return dto.lineItems.map((item) => ({
      id: uuidv4(),
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      total: item.quantity * item.unitPrice,
      currency: item.currency ?? 'USD',
    }));
  }

  private calcTotals(
    items: InvoiceLineItem[],
    taxRate: number,
  ): { subtotal: number; taxAmount: number; total: number } {
    const subtotal = items.reduce((sum, i) => sum + i.total, 0);
    const taxAmount = Math.round(subtotal * (taxRate / 100) * 100) / 100;
    const total = Math.round((subtotal + taxAmount) * 100) / 100;
    return { subtotal, taxAmount, total };
  }

  private generateNumber(): string {
    const year = new Date().getFullYear();
    const seq = String(this.invoiceCounter++).padStart(4, '0');
    return `PH-${year}-${seq}`;
  }
}
