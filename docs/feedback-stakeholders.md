# Feedback de la finca — Requerimientos y visión

Documento de referencia con lo solicitado por el equipo de la finca (fuera del PDF inicial). Usar junto con `especificacion_sistema_finca` y `.cursor/rules/project-context.mdc`.

---

## 1. Productos — filtros por badge (propio / comprado)

### Lo que piden
- Al filtrar por badge, cada categoría debe mostrar **lo que corresponde**.
- Hoy perciben que productos que **se compran** aparecen como **propios**.
- **No quieren duplicar** el mismo producto en el catálogo (ej. un Plátano propio y otro Plátano comprado).
- La idea: **un solo producto** en catálogo y, al filtrar “comprado”, ver **qué se compró y cuánto** según la base de datos (tabla `compras`), no según un campo fijo `category`.

### Interpretación de negocio
Un producto puede tener **origen mixto** en la realidad (ej. plátano de la finca + plátano de vecinos). El catálogo es único; el **origen** se infiere de:
- producción propia (cosecha / stock inicial / transformación),
- compras registradas (`purchases` → proveedor),
- ventas y movimientos.

El badge `own` / `purchased` en `products.category` es una **etiqueta de catálogo**, no un historial de transacciones.

---

## 2. Inventario — insumos y abonos

### Lo que piden
- Mostrar en inventario los **insumos/abonos** usados en labores (fertilizantes, químicos, etc.).
- Control **superficial**: cuánto hay, cuánto se gastó o compró para mantenimiento de la finca.

### Estado técnico esperado
- Backend: tabla `supplies`, API `/insumos`, stock en `current_stock`, descuento al registrar labores.
- Falta: **pantalla** en el módulo Inventario (o sección dedicada) visible en la UI.

---

## 3. Compras — productos para venta vs insumos de finca

### Lo que piden
- Además de comprar productos para **reventa**, comprar **insumos/abonos** para trabajos.
- **Filtrar compras por concepto**: ej. “para trabajos de la finca” vs “para la venta / reventa”.

---

## 4. Precios al inicio del día (una vez por día)

### Lo que piden
- Al entrar al programa **una vez al día** (no en cada login del mismo día), poder **actualizar precios** de productos.
- Los precios de algunos productos cambian **todos los días**.

### Nota
Ya existe historial de precios (detal / mayorista + `valid_from`). Falta el **flujo UX**: recordatorio o pantalla al primer acceso del día.

---

## 5. Labores — cosecha y pago a colaboradores

### Lo que piden (cosecha y labores en general)
- Al elegir **Cosecha**, habilitar campos para:
  - **precio por kilo**,
  - **total pagado al colaborador**,
  - **varios colaboradores** en la misma labor sin salir del formulario,
  - **kg cogidos** por colaborador.
- Todo agrupado **por día**.
- Tipo de pago: **por kg cogido** o **por día trabajado** (además del `task_type` actual).
- Si se usan insumos: cantidad usada y **en qué labor específica** (incluso si no encaja en categorías predefinidas → texto libre / “Otro”).

### Estado actual (referencia)
- Labores: tipo, cultivo, responsable, descripción, insumos con cantidad (backend + UI básica).
- Sin: líneas de colaborador, modo de pago, kg por persona, totales de nómina de cosecha.

---

## 6. Reportes — rentabilidad y labores

### Lo que piden
- Filtrar por **producto**: cuánto se compró, cuánto se vendió, **margen de ganancia** (¿es rentable?).
- Reporte de **labores**: kg cosechados (café, plátano, etc.).
- **Insumos por producto/cultivo**: cuánto se produjo, usó, días de trabajo, etc.

---

## 7. Lotes, márgenes y pérdidas (visión avanzada)

### Lo que piden
- Manejar **lotes** al comprar en distintas partes / precios para calcular margen real.
- Ver **margen por producto en el dashboard**.
- **Pérdidas** digitables; costo de pérdida = **costo del lote más alto** (conservador).

### Ejemplo numérico (ilustrativo)
| Lote | kg | Costo compra | Rango venta referencia |
|------|-----|--------------|-------------------------|
| 1 | 30 | $0 (producción propia) | $100.000 |
| 2 | 20 | $150.000 | $200.000 |
| 3 | 15 | $100.000 | $120.000 |
| Venta total | — | — | $400.000 |

Implica modelo **FIFO o costo por lote**, no solo `unit_price` en una línea de compra.

---

## Priorización sugerida (para desarrollo)

| Fase | Alcance | Complejidad |
|------|---------|-------------|
| **A** | Inventario insumos en UI; compras de insumos + filtro concepto; arreglar UX productos (catálogo único + vista “comprado” desde `compras`) | Media |
| **B** | Modal precios 1×/día al login; reportes margen simple (promedio compra vs venta por producto) | Media |
| **C** | Labores cosecha: colaboradores, pago kg/día, kg por persona | Alta |
| **D** | Reportes labores + insumos por cultivo; dashboard margen | Alta |
| **E** | Lotes de inventario + costo por lote + pérdidas (costo lote más alto) | Muy alta |

Ver `docs/estado-vs-feedback.md` para matriz detallada implementado vs pendiente.
