# PymesHub — Invoice Module

Módulo NestJS para generación de facturas PDF de suscripción SaaS para PymesHub.

## Stack
- **NestJS** (modular monolith)
- **PDFKit** — generación de PDF server-side
- **class-validator / class-transformer** — validación de DTOs
- **uuid** — numeración única de facturas

## Estructura

```
src/invoices/
├── dto/
│   └── create-invoice.dto.ts      ← DTOs con validación
├── invoice.entity.ts              ← Interfaces + schema Prisma (comentado)
├── invoice-pdf.service.ts         ← Generación PDF con branding PymesHub
├── invoices.service.ts            ← Lógica de negocio
├── invoices.controller.ts         ← REST endpoints
└── invoices.module.ts             ← Módulo NestJS
assets/
└── pymeshub-logo.svg              ← Logo vectorial PymesHub
```

## Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/invoices` | Crear factura |
| `GET` | `/invoices` | Listar facturas del tenant |
| `GET` | `/invoices/:id` | Ver factura |
| `GET` | `/invoices/:id/pdf` | Descargar PDF |
| `PATCH` | `/invoices/:id/pay` | Marcar como pagada |
| `PATCH` | `/invoices/:id/void` | Anular factura |

## Instalación

```bash
npm install pdfkit uuid @types/pdfkit class-validator class-transformer
```

## Integración en AppModule

```typescript
import { InvoicesModule } from './invoices/invoices.module';

@Module({
  imports: [InvoicesModule],
})
export class AppModule {}
```

## Pasos siguientes

1. Reemplazar el store en memoria con `PrismaService` (schema en `invoice.entity.ts`)
2. Descomentar `JwtAuthGuard` y extraer `tenantId` del JWT payload
3. Guardar PDF en MinIO usando tu `MinioService`
4. Conectar con Stripe webhook para marcar facturas como pagadas automáticamente
5. Adaptar a factura electrónica Hacienda CR (XML) cuando sea requerido

## Numeración

Las facturas siguen el formato `PH-YYYY-XXXX` (ej. `PH-2026-0001`).

## IVA

Configurado al 13% por defecto (IVA Costa Rica). Ajustable por factura vía `taxRate`.
