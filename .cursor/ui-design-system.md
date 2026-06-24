# PrimaveraAPP — Sistema de diseño UI (Flux)

Guía de referencia para mantener consistencia visual al editar módulos existentes o crear pantallas nuevas. Basada en el **Dashboard**, **Layout** y componentes en `frontend/src/components/dashboard/`.

> **Fuente de verdad en código:** `frontend/src/lib/dashboard.js` → objeto `FLUX`  
> Importar siempre desde ahí en lugar de repetir hex sueltos cuando sea posible.

---

## Paleta principal (FLUX)

Inspirada en Flux Dashboard. Reemplaza la paleta antigua (`#1a365d` azul + `#f56523` naranja) en pantallas nuevas o al refactorizar módulos.

| Token JS      | Hex       | Uso |
|---------------|-----------|-----|
| `FLUX.purple` | `#6366F1` | Botones primarios, gráficos, iconos activos, FAB móvil |
| `FLUX.purpleDark` | `#5C27FE` | Hover de primarios, enlaces “Ver todo”, ítem de nav activo (texto) |
| `FLUX.cyan`   | `#06B6D4` | Acento secundario (stats compras, métricas alternas) |
| `FLUX.success`| `#10B981` | Totales positivos, montos de venta |
| `FLUX.warning`| `#F59E0B` | Stock bajo, alertas suaves |
| `FLUX.lavender` | `#F3F0FF` | Fondo ítem nav activo, hover de filas, botón ojo |
| `FLUX.bg`     | `#F8F9FA` | Fondo de página (área de contenido y shell) |

### Equivalentes Tailwind frecuentes

| Rol | Clases / valores |
|-----|------------------|
| Fondo página | `bg-[#F8F9FA]` o `style={{ backgroundColor: FLUX.bg }}` |
| Superficie (tarjeta) | `bg-white` |
| Texto principal | `text-slate-800` |
| Texto secundario | `text-slate-500` / `text-slate-400` |
| Bordes suaves | `border-slate-100`, `border-gray-100`, `border-slate-200` |
| Enlace / acción | `text-[#5C27FE] hover:text-[#6366F1] hover:underline` |

### Variantes de acento (tarjetas y botones)

Usar en stats, accesos rápidos y badges. Cada variante combina borde + color de valor + subtexto:

| Variante | Borde | Valor | Subtexto |
|----------|-------|-------|----------|
| `purple` | `border-indigo-100` | `text-[#5C27FE]` | `text-indigo-400` |
| `cyan` | `border-cyan-100` | `text-[#06B6D4]` | `text-cyan-500` |
| `indigo` | `border-violet-100` | `text-[#6366F1]` | `text-violet-400` |
| `warning` | `border-amber-100` | `text-[#F59E0B]` | `text-amber-500` |

Hover en accesos rápidos: `hover:bg-[#F3F0FF]` (purple), `hover:bg-cyan-50`, `hover:bg-violet-50`, `hover:bg-amber-50`.

### Semántica de color

- **Dinero / éxito:** `FLUX.success` (`#10B981`)
- **Advertencia stock:** `FLUX.warning` (`#F59E0B`); crítico (0 kg): `text-rose-500`
- **Interactivo principal:** `FLUX.purple` → hover `FLUX.purpleDark`
- **No usar** naranja `#f56523` ni azul `#1a365d` en pantallas ya migradas al estilo Flux

---

## Tipografía

| Elemento | Clases |
|----------|--------|
| Título de página | `text-xl font-bold text-slate-800` |
| Subtítulo / fecha | `text-sm text-slate-400 capitalize` |
| Título de panel | `font-semibold text-slate-800 text-sm` (o `text-sm md:text-base` en gráficos) |
| Subtítulo de panel | `text-xs text-slate-400 mt-0.5` |
| Label de stat | `text-xs font-medium text-slate-500` |
| Valor destacado | `text-xl font-bold` + color de acento |
| Fila de lista — título | `text-sm font-medium text-slate-800 truncate` |
| Fila de lista — meta | `text-xs text-slate-400` |
| Botón / enlace pequeño | `text-xs font-medium` |

Fuente del sistema: `system-ui, 'Segoe UI', Roboto, sans-serif` (definida en `index.css`).

---

## Formas, sombras y espaciado

| Patrón | Clases |
|--------|--------|
| Tarjeta / panel | `rounded-2xl border bg-white shadow-sm` |
| Borde de tarjeta | `border-gray-100` o `border-slate-100` |
| Botón primario | `rounded-xl py-2.5 text-sm font-medium` |
| Botón secundario / ojo | `rounded-lg` |
| Padding página | `p-4 md:p-6` + `pb-24 md:pb-6` (espacio para nav móvil) |
| Gap entre bloques | `gap-3` (stats), `gap-4 md:gap-6` (secciones) |
| Grid stats | `grid grid-cols-2 md:grid-cols-4 gap-3` |
| Grid contenido | `grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6` |

Sombras:
- Tarjetas: `shadow-sm`
- Nav móvil inferior: `shadow-[0_-4px_12px_rgba(0,0,0,0.06)]`
- Modal: `shadow-2xl`
- FAB menú móvil: `shadow-lg`

---

## Componentes de referencia

### Contenedor de página

```jsx
<div className="p-4 md:p-6 pb-24 md:pb-6 min-h-full bg-[#F8F9FA]">
```

### Tarjeta stat (KPI)

```jsx
<div className="rounded-2xl p-4 border bg-white shadow-sm border-indigo-100">
  <span className="text-xs font-medium text-slate-500">Etiqueta</span>
  <p className="text-xl font-bold leading-tight mt-1 text-[#5C27FE]">$ 0</p>
  <p className="text-xs mt-1 text-indigo-400">subtítulo</p>
</div>
```

### Panel con lista (`PanelWidget`)

- Contenedor: `bg-white rounded-2xl border border-gray-100 shadow-sm`
- Cabecera: `px-4 py-3 border-b border-slate-100`
- Enlace “Ver todo →”: `text-xs font-medium text-[#5C27FE] hover:text-[#6366F1] hover:underline`
- Cuerpo con scroll: `flex-1 overflow-y-auto min-h-0`
- Altura típica en sidebar: `max-h-72 md:max-h-80`

### Fila de lista

```jsx
<div className="flex items-center gap-3 px-4 py-3 border-b border-slate-50 last:border-0 hover:bg-[#F3F0FF]/40 transition-colors">
```

### Botón primario (modal / CTA)

```jsx
className="w-full bg-[#6366F1] text-white py-2.5 rounded-xl text-sm font-medium hover:bg-[#5C27FE] transition-colors"
```

### Botón ojo (detalle)

Componente: `frontend/src/components/dashboard/BotonOjo.jsx`  
Fondo lavanda, borde `border-slate-200`, icono en `public/assets/icons/ojo icon.png`.

### Modal

Componente: `frontend/src/components/ui/Modal.jsx`  
- Overlay: `bg-black/40`
- Panel: `bg-white md:rounded-2xl rounded-t-2xl shadow-2xl`
- Labels de detalle: `text-xs text-gray-400`; valores: `font-medium text-gray-700` / `font-semibold text-gray-900`

### Skeleton / loading

```jsx
<div className="h-24 bg-gray-100 rounded-xl animate-pulse" />
```

---

## Navegación (Layout)

| Zona | Estilo |
|------|--------|
| Sidebar | `bg-white border-r border-slate-100` |
| Ítem activo | fondo `FLUX.lavender`, texto `FLUX.purpleDark` |
| Ítem inactivo | `text-slate-500 hover:bg-slate-50 hover:text-slate-800` |
| Nav móvil inferior | `bg-white border-t border-slate-200` |
| Ítem móvil activo | `color: FLUX.purpleDark`, `font-semibold` |
| FAB abrir menú | `bg-[#6366F1] hover:bg-[#5C27FE] text-white rounded-full` |

Iconos de módulos: `frontend/public/assets/icons/` (PNG, nombres con espacio URL-encoded en rutas).

---

## Gráficos (Recharts)

Usar colores de `FLUX`:

- Línea / área: `stroke={FLUX.purple}`, gradiente con `stopColor={FLUX.purple}`
- Punto activo: `fill={FLUX.purpleDark}`
- Grid: `stroke="#f1f5f9"`
- Ejes: `fill: '#94a3b8'`, `fontSize: 11`
- Tooltip: `borderRadius: 12px`, `border: 1px solid #e2e8f0`, sombra suave índigo

---

## Formularios (al migrar módulos)

Preferir el estilo Flux sobre el legado:

| Antes (legado) | Después (Flux) |
|----------------|----------------|
| `focus:ring-[#f56523]` | `focus:ring-[#6366F1]` o `focus:ring-indigo-300` |
| `bg-[#1a365d]` botón | `bg-[#6366F1] hover:bg-[#5C27FE]` |
| `bg-[#f56523]` CTA | `bg-[#6366F1] hover:bg-[#5C27FE]` |
| `text-[#1a365d]` títulos | `text-slate-800` |
| `border-gray-300` | `border-gray-200` / `border-slate-200` |
| `rounded-lg` inputs | `rounded-xl` en pantallas tipo dashboard |

Input base sugerido:

```jsx
const inputClass =
  'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#6366F1]/30 focus:border-indigo-300'
```

---

## Layout responsive

- **Mobile-first:** una columna; stats en 2×2; accesos rápidos en `grid-cols-2 sm:grid-cols-4`
- **lg+:** grid 3 columnas — contenido principal `lg:col-span-2`, sidebar de paneles 1 columna
- **Padding inferior móvil:** `pb-24` por la barra de navegación fija
- **Modales:** sheet desde abajo en móvil (`items-end`), centrado en desktop (`md:items-center`)

---

## Formato de datos (UI)

Funciones en `frontend/src/lib/dashboard.js`:

- Moneda: `formatCOP(valor)` → locale `es-CO`, COP sin decimales
- Peso: `formatKg(valor)` → `X kg` con 1 decimal máximo
- Fechas relativas: `tiempoRelativo(fechaISO)`

---

## Checklist al crear o editar un módulo

1. Fondo de página `FLUX.bg` (`#F8F9FA`)
2. Tarjetas blancas `rounded-2xl shadow-sm`, no fondos grises planos
3. Títulos en `slate-800`, no `#1a365d`
4. Acciones primarias en índigo/púrpura Flux, no naranja
5. Importar `FLUX` desde `lib/dashboard.js` para estilos inline
6. Reutilizar `Modal`, `PanelWidget`, `BotonOjo` cuando aplique
7. Iconos desde `public/assets/icons/`
8. Textos y formatos en español (`es-CO`)
9. Probar en móvil (nav inferior + padding `pb-24`)

---

## Archivos de referencia

| Archivo | Qué mirar |
|---------|-----------|
| `frontend/src/lib/dashboard.js` | `FLUX`, formatters |
| `frontend/src/pages/dashboard/Dashboard.jsx` | Stats, layout, accesos rápidos |
| `frontend/src/components/Layout.jsx` | Shell, nav, colores activos |
| `frontend/src/components/dashboard/PanelWidget.jsx` | Paneles con lista |
| `frontend/src/components/dashboard/GraficoVentasSemanal.jsx` | Gráficos |
| `frontend/src/components/dashboard/BotonOjo.jsx` | Acción ver detalle |

### Módulos aún con paleta legada (migrar gradualmente)

`Login`, `Productos`, `Ventas`, `Compras`, `FormCompra`, `Reportes` — usan `#1a365d` / `#f56523`. Al tocarlos, alinear con esta guía.
