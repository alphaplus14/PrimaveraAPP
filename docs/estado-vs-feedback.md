# Estado actual vs feedback de la finca

Última revisión: junio 2026. Comparar código en `frontend/src/pages/` y `backend/app/Http/Controllers/Api/`.

---

## Resumen ejecutivo

| Área | ¿Implementado? | Gap principal |
|------|----------------|---------------|
| Productos — filtro badge | Parcial | Filtro usa `category` estática, no historial de compras; catálogo separa `own`/`purchased` |
| Inventario insumos | Backend sí, UI no | No hay vista de stock de `supplies` |
| Compras insumos + filtro | No | Solo `product_id`; sin `supply_id` ni `purchase_concept` |
| Precios 1× al día | Parcial | Historial en producto; sin prompt al primer login del día |
| Labores cosecha / nómina | No | Sin colaboradores, kg/persona, pago kg vs día |
| Reportes margen | No | Ventas/compras listados; sin margen ni filtro producto unificado |
| Reportes labores | No | Sin tab ni API dedicada |
| Lotes + margen dashboard | No | Sin entidad `inventory_lots`; sin COGS por lote |

---

## 1. Productos y badges

### Hoy
- `Productos.jsx`: filtros `todos | own | purchased | pulp` sobre `product.category`.
- `ProductoSeeder`: listas distintas `own` y `purchased` (ej. Plátano solo en `own`; Maracuyá solo en `purchased`).
- No hay productos duplicados por nombre en el seeder actual.

### Problema reportado
- Confusión entre **“producto de catálogo comprado”** y **“kg que efectivamente compramos”**.
- Quieren filtro “comprado” = productos con **compras en el período** o con origen externo, no solo badge.

### ¿Hace falta implementar?
**Sí** — cambio de producto/UX, no solo bug.

### Pasos sugeridos
1. **Modelo:** un producto por ítem vendible; opcional `default_origin` o quitar dependencia de `purchased` para filtrar.
2. **API:** `GET /productos?con_compras=1&desde=&hasta=` o endpoint `GET /reportes/productos-origen`.
3. **UI Productos:** tab “Con compras” que lista productos con agregados de `compras` (kg y $ totales).
4. **Migración datos:** productos que son solo reventa mantienen `category=purchased`; los mixtos (plátano) pasan a `own` + compras de vecinos registradas en Compras.
5. Documentar en UI: “Propio = catálogo finca; Comprado = solo reventa; Ver compras = movimiento real”.

---

## 2. Inventario de insumos

### Hoy
- `Insumo` + `InsumoController` CRUD.
- Stock se descuenta en `LaborController` al usar insumos.
- `Inventario.jsx`: solo productos (`inventories` + `products`).
- Insumos solo se crean desde `FormLabor` al registrar labor.

### ¿Hace falta implementar?
**Sí** — capa UI mínima.

### Pasos sugeridos
1. **Inventario.jsx:** pestañas “Productos” | “Insumos”.
2. Listar `GET /insumos` con `current_stock`, tipo, unidad.
3. Opcional: ajuste manual de stock (migración + endpoint similar a inventario productos).
4. Opcional: compra de insumo incrementa `current_stock` (ver §3).

---

## 3. Compras de insumos y filtro por concepto

### Hoy
- `Compra` solo `product_id` → inventario de **productos**.
- Sin campo `concept` / `purchase_type`.

### ¿Hace falta implementar?
**Sí**.

### Pasos sugeridos
1. Migración: `purchases.purchase_type` enum `resale` | `farm_supply` (o `product` | `supply`).
2. Si `farm_supply`: `supply_id` nullable FK; validar XOR con `product_id`.
3. `CompraController@store`: si insumo → `Insumo::increment('current_stock')` (sin movimiento en `inventory_movements` de productos).
4. **FormCompra:** toggle “Para venta” / “Para finca (insumo)”; selector insumo vs producto.
5. **Compras.jsx:** filtro chips por `purchase_type`.
6. Reportes: incluir compras de insumos en tab separado o concepto.

---

## 4. Actualizar precios una vez al día

### Hoy
- `Precio` con `valid_from`, alta desde `FormProducto` al editar.
- Login → Dashboard directo; sin checklist diario.

### ¿Hace falta implementar?
**Sí** — UX, no modelo nuevo.

### Pasos sugeridos
1. `localStorage` clave `precios_actualizados_YYYY-MM-DD` o flag en backend (`user_settings.last_price_review_date`).
2. Tras login exitoso: si fecha ≠ hoy → `Modal` “¿Actualizar precios de hoy?” con lista de productos activos y campos detal/mayorista.
3. Reutilizar `POST productos/{id}/precios` existente.
4. Botón “Omitir hasta mañana”.

---

## 5. Labores — cosecha y pagos

### Hoy
- `farm_tasks`: `task_type`, `crop`, `responsible`, `description`.
- `farm_task_supply`: insumos y cantidades.
- Editar/eliminar labores con reversión de stock insumos.
- Sin tablas para colaboradores ni pagos.

### ¿Hace falta implementar?
**Sí** — módulo nuevo dentro de Labores.

### Pasos sugeridos
1. **Modelo:**
   - `farm_task_workers` o JSON: `worker_name`, `payment_mode` (`per_kg` | `per_day`), `quantity_kg`, `rate`, `total_paid`.
   - Opcional tabla `workers` para reutilizar nombres.
   - `farm_tasks.payment_mode` a nivel labor si aplica a todos.
2. **FormLabor:** si `task_type === 'Cosecha'` (o tipos configurables) → sección “Colaboradores” dinámica (+ fila, sin salir del modal).
3. **Validación:** al menos un colaborador o responsable; totales calculados.
4. **Reportes:** sumar kg por cultivo/producto/fecha desde líneas de cosecha.
5. Insumos: ya soportado; reforzar “Otro” en `task_type` para labores fuera de lista.

---

## 6. Reportes — margen y labores

### Hoy
- Tabs: Ventas, Compras, Movimientos.
- Filtro por producto solo en Movimientos.
- Agregados simples kg y $ en ventas/compras.
- Sin margen, sin tab Labores.

### ¿Hace falta implementar?
**Sí** — fase B (margen simple) y D (labores).

### Pasos sugeridos (margen simple, sin lotes)
1. `GET /reportes/rentabilidad?desde&hasta&product_id`
2. Por producto: `sum(compras.total)`, `sum(ventas.total)`, `kg` comprados/vendidos, `margen = ventas - compras` (promedio ponderado).
3. UI tab “Rentabilidad” con tabla y filtro producto.
4. **Labores:** `GET /reportes/labores?desde&hasta&crop&task_type=cosecha` con kg y pagos.

---

## 7. Lotes, margen real y pérdidas

### Hoy
- Una línea de compra = un precio; inventario = un número `quantity_kg`.
- Sin FIFO, sin lotes, sin pérdidas estructuradas.
- Dashboard: ventas/compras hoy, stock bajo; **sin margen**.

### ¿Hace falta implementar?
**Sí, pero fase posterior (E)** — impacto alto en modelo y ventas.

### Pasos sugeridos
1. Tabla `inventory_lots`: `product_id`, `quantity_remaining`, `unit_cost`, `source` (production/purchase), `purchase_id`, `created_at`.
2. Al comprar/vender: consumir lotes (FIFO configurable; pérdidas a **costo del lote más caro** según negocio).
3. Tabla `inventory_losses`: `product_id`, `quantity`, `reason`, `cost_applied` (max lot cost).
4. Ventas: COGS desde lotes consumidos → margen bruto real.
5. Dashboard widget: top productos por margen % período.
6. Coordinar con contador/finca si FIFO vs promedio vs “lote más alto solo en mermas”.

---

## Lo ya hecho recientemente (contexto)

- Labores: búsqueda/paginación server-side, edición, eliminación, íconos `taskTypes`.
- Ventas/Compras: edición/eliminación con reversión de inventario.
- Transformaciones: UI alineada; pulpas por paquetes.
- Vínculo fruta→pulpa centralizado (`ProductPulpLinker`).

Estos avances **no cubren** lotes, nómina de cosecha ni compras de insumos.
