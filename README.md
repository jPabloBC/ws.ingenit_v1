This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## SII: Simulación y registros (Chile)

- Modos de simulación:
	- Global: define la variable de entorno `SII_SIMULATION=true` para permitir simulación incluso si no existe configuración por negocio.
	- Por negocio: el flag `simulate` en la tabla `ws_sii_config` (configurable en la página de Configuración SII) fuerza simulación solo para ese tenant.
- Envío seguro:
	- El envío al SII se realiza vía endpoint server-side `POST /api/sii/send` y requiere sesión válida (Authorization: Bearer <token>).
	- El backend valida que la boleta pertenezca al usuario autenticado (403 si no corresponde).
- Historial y estado:
	- La página `/invoices/sii-logs` muestra los registros de envíos con `trackId`, estado y detalles por usuario/negocio.
- Impresión rápida:
	- En Ventas Rápidas, tras una venta en efectivo aparece la tarjeta “Boleta emitida” con acciones Ver / Descargar / Imprimir.
