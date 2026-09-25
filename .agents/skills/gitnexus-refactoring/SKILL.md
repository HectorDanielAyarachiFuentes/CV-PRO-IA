---
name: gitnexus-refactoring
description: "Úsalo cuando el usuario quiera renombrar, extraer, dividir, mover o reestructurar código de forma segura. Ejemplos: \"Renombra esta función\", \"Extrae esto a un módulo\", \"Refactoriza esta clase\", \"Mueve esto a otro archivo\""
---

# Refactorización con GitNexus

## Cuándo usar esta habilidad

- "Renombra esta función de forma segura en todo el proyecto"
- "Extrae esta lógica en un módulo separado"
- "Divide este servicio o archivo grande"
- "Mueve esta función a otro archivo sin romper llamadas"
- Cualquier refactorización que abarque múltiples archivos

---

## Flujo de Trabajo

```
0. list_repos {}
1. impact({target: "X", direction: "upstream"})  → Mapear todas las dependencias
2. query({search_query: "X"})                    → Encontrar flujos donde participa X
3. context({name: "X"})                           → Ver todas las referencias entrantes/salientes
4. Planificar orden: Interfaces/Estado → Implementaciones → Llamadores → Pruebas
```

---

## Listas de Verificación (Checklists)

### Renombrar Símbolo
- [ ] Ejecutar `rename({ symbol_name: "nombreAntiguo", new_name: "nombreNuevo", dry_run: true })` para previsualizar los cambios.
- [ ] Verificar que las rutas correspondan al repositorio actual.
- [ ] Revisar cambios del grafo (alta confianza) y coincidencias de texto.
- [ ] Aplicar con `dry_run: false`.
- [ ] Ejecutar `detect_changes()` para validar que solo cambiaron los archivos esperados.

### Extraer Módulo
- [ ] Usar `context({ name: objetivo })` para conocer todas las llamadas y usos.
- [ ] Usar `impact({ target: objetivo, direction: "upstream" })` para listar invocadores externos.
- [ ] Definir la interfaz del nuevo módulo.
- [ ] Mover el código y actualizar imports.
- [ ] Validar con `detect_changes()`.
