import {
  Controller,
  Get,
  Post,
  Param,
  Patch,
  Body,
  Res,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { InvoicesService } from './invoices.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';

/**
 * Replace @Request() + req.user with your real JwtAuthGuard + TenantGuard.
 * The tenantId is extracted from the JWT payload so tenants can only
 * see their own invoices.
 *
 * Routes:
 *   POST   /invoices              → create invoice
 *   GET    /invoices              → list invoices for tenant
 *   GET    /invoices/:id          → get single invoice
 *   GET    /invoices/:id/pdf      → download PDF
 *   PATCH  /invoices/:id/pay      → mark as paid
 *   PATCH  /invoices/:id/void     → void invoice
 */
@Controller('invoices')
// @UseGuards(JwtAuthGuard)   ← uncomment when guards are wired
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  // ── CREATE ────────────────────────────────────────────────────────────────
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() dto: CreateInvoiceDto,
    @Request() req: any,
  ) {
    // const tenantId = req.user.tenantId;
    const tenantId = dto.tenantId; // temporary — replace with JWT claim
    return this.invoicesService.create({ ...dto, tenantId });
  }

  // ── LIST ──────────────────────────────────────────────────────────────────
  @Get()
  findAll(@Request() req: any) {
    // const tenantId = req.user.tenantId;
    const tenantId = 'demo-tenant'; // replace with JWT claim
    return this.invoicesService.findAll(tenantId);
  }

  // ── GET ONE ───────────────────────────────────────────────────────────────
  @Get(':id')
  findOne(@Param('id') id: string, @Request() req: any) {
    const tenantId = 'demo-tenant'; // replace with JWT claim
    return this.invoicesService.findOne(id, tenantId);
  }

  // ── PDF DOWNLOAD ──────────────────────────────────────────────────────────
  @Get(':id/pdf')
  async downloadPdf(
    @Param('id') id: string,
    @Request() req: any,
    @Res() res: Response,
  ) {
    const tenantId = 'demo-tenant'; // replace with JWT claim
    const pdfBuffer = await this.invoicesService.getPdf(id, tenantId);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="invoice-${id}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });

    res.end(pdfBuffer);
  }

  // ── MARK AS PAID ──────────────────────────────────────────────────────────
  @Patch(':id/pay')
  markAsPaid(@Param('id') id: string, @Request() req: any) {
    const tenantId = 'demo-tenant'; // replace with JWT claim
    return this.invoicesService.markAsPaid(id, tenantId);
  }

  // ── VOID ──────────────────────────────────────────────────────────────────
  @Patch(':id/void')
  markAsVoid(@Param('id') id: string, @Request() req: any) {
    const tenantId = 'demo-tenant'; // replace with JWT claim
    return this.invoicesService.markAsVoid(id, tenantId);
  }
}
