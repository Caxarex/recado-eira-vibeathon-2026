# Contratos compartidos – RECADO

Carpeta `src/contracts/` = fuente de verdad entre la app web y el módulo de datos / Excel / indicadores (equipo de Ana).

| Archivo | Qué contiene |
|---|---|
| `types.ts` | Tipos TypeScript de todas las entidades + máquina de estados (`TRANSICIONES`, `puedeTransicionar`). |
| `schemas.ts` | Esquemas **zod** espejo. Úsalos para validar filas de Excel/CSV antes de cargarlas. |
| `indicadores.ts` | Tipo `IndicadorResumen` y un cálculo de referencia (`calcularIndicadores`) que Ana puede reemplazar. |
| `pdf.ts` | Validación de un PDF de prueba (tipo, formato, tamaño) y armado del resultado en estado `cargado`. El binario no entra en este contrato. |

> Todos los datos de la demo son **ficticios**. No usar datos reales de pacientes.

## Entidades

- **Paciente**: `id, nombre, curp (18 chars), fechaNacimiento, telefono, municipio`.
- **Expediente**: `id, folio, pacienteId, unidadMedica, fechaApertura`.
- **ResultadoPapanicolaou**: `id, expedienteId, fechaToma, fechaResultado, laboratorio, clasificacion, estado, documento, historial[]` y opcionales `autorizacion, notificacion, entrega, seguimiento`.
- **Documento**: metadatos del PDF (`nombreArchivo, tipo, tamanoKb, hashSimulado, almacenamiento`). `solo-metadatos` no tiene archivo. `local-navegador` apunta a un PDF guardado en IndexedDB de este equipo. Ninguno es un repositorio clínico seguro. El binario no se guarda en `localStorage`.
- **EventoHistorial**: cada cambio de estado con `actor, rol, fecha, nota`.

## Clasificación (Bethesda simplificada)

`Negativo | ASC-US | LSIL | HSIL | Insuficiente`

## Máquina de estados

```
cargado → en_revision → autorizado → notificado → entregado → en_seguimiento
                     └→ rechazado → cargado (recarga/corrección)
```

Toda transición debe pasar por `puedeTransicionar(desde, hacia)`. Si devuelve `false`, se rechaza.

## Roles simulados

`Capturista` (carga), `Revisor` (revisión documental), `Médico autorizador` (única persona que puede autorizar/rechazar), `Trabajo social` (notificación, entrega y seguimiento).

## Formato esperado desde Excel/CSV

Una fila = un resultado. Columnas (ver `filaExcelResultadoSchema`):

```csv
folio_expediente,curp,nombre_paciente,fecha_nacimiento,telefono,municipio,unidad_medica,fecha_toma,fecha_resultado,laboratorio,clasificacion,nombre_archivo
EXP-2026-0001,XXXX000000XXXXXX00,Paciente Ficticia Uno,1985-03-12,5550000001,Municipio Demo,CS Demo Norte,2026-10-01,2026-10-10,Laboratorio Ficticio A,Negativo,PAP-0001.pdf
```

Fechas en `yyyy-mm-dd`. `clasificacion` debe ser uno de los cinco valores exactos.

## Puntos de integración para el Bot de Ana

1. **Importador**: leer Excel/CSV → `filaExcelResultadoSchema.safeParse(fila)` → crear/actualizar `Paciente`, `Expediente`, `ResultadoPapanicolaou` en `src/data/repository`.
2. **Indicadores**: implementar `calcularIndicadores` real y alimentar `/indicadores`.
3. **Validación operativa**: duplicados por CURP+fechaToma, fechaResultado ≥ fechaToma, teléfonos válidos.
4. **Exportación**: generar CSV de resultados por estado.
