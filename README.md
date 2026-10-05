# Jardín La Palapa · Página de enlaces

Página de enlaces (*link in bio*) de Jardín La Palapa, jardín de eventos en Tepepan, Tlalpan, CDMX. Está pensada para QR, NFC y redes sociales: primero WhatsApp, después agenda, ubicación, llamada, servicios, opiniones, sitio web y redes.

En línea: https://la-palapa-links.vercel.app/

## Qué tiene

- El logo se escribe solo con una pluma de oro (animación «Trazo de Oro»). Al tocarlo se vuelve a escribir. Los trazos salen de `assets/logo-palapa.svg` y el orden de escritura se calcula en el navegador.
- Las tres fotos del jardín van de fondo, con zoom lento y una transición en caracteres ASCII entre una y otra.
- Los botones tienen un reflejo que pasa, un barrido de caracteres y los íconos se dibujan solos.
- Botones de Guardar contacto (vCard) y Compartir (menú nativo del teléfono).
- Respeta la opción de reducir movimiento del sistema.

## Estructura

- `index.html`: contenido y metadatos (Open Graph y JSON-LD).
- `style.css`: estilos.
- `app.js`: animaciones del logo, del fondo y de los botones. Sin dependencias.
- `assets/`: fotos WEBP, fuentes WOFF, logo SVG e imagen para compartir. Los JPG y TTF originales se guardan como respaldo y no se publican.
- `vercel.json`: encabezados de seguridad y de caché.
- `animaciones/`: animaciones del logo. No se publican con la página (ver `.vercelignore`).

## Ejecutar localmente

```bash
python3 -m http.server 3000
```

## Publicar en Vercel

Proyecto estático (tipo **Other**, sin comando de compilación):

```bash
npx vercel --prod
```

La política de seguridad (CSP) de `vercel.json` incluye el hash del bloque JSON-LD de `index.html`. Si cambias ese bloque, calcula de nuevo el hash (SHA-256 en base64 del contenido exacto del `<script type='application/ld+json'>`) y actualízalo en `vercel.json`; si no, el navegador bloqueará ese bloque.

## Contacto y destinos

- WhatsApp y celular: +52 55 5435 3649
- Oficina: +52 55 5653 7842
- Correo: informes@jardinlapalapa.com
- Instagram: https://www.instagram.com/jardinlapalapaeventos/
- Facebook: https://www.facebook.com/jardinlapalapaeventos
- Bodas.com.mx: https://www.bodas.com.mx/jardines-para-bodas/jardin-la-palapa--e43219
- Video: https://www.youtube.com/watch?v=xv-FUfaO6so
- Ubicación: Prol. Abasolo 302, Valle Escondido, Tepepan, Tlalpan, CDMX.
