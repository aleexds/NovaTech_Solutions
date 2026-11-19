# INFORME TÉCNICO Y ARQUITECTURA DEL SISTEMA
**Proyecto:** Mini Proyecto #2 - Portal de Consulta de Políticas de RRHH con RAG Multiagente  
**Empresa:** NovaTech Solutions S.A.  
**Equipo de Desarrollo:** NovaTech Engineering  
**Fecha:** Noviembre 2026  

---

## 1. Decisiones de Diseño y Arquitectura

### 1.1 Doble Fuente de Verdad
El sistema resuelve la problemática corporativa combinando dos fuentes de verdad independientes pero complementarias:
1. **Google Drive & MySQL (Indexado de Texto Completo)**: Fuente no estructurada donde residen las 10 políticas, reglamentos, códigos y acuerdos de trabajo.
2. **Base de Datos Relacional MySQL**: Almacén estructurado para los datos de 52 colaboradores, solicitudes, incapacidades médicas, saldos de vacaciones y movimientos de personal de los últimos 3 meses.

### 1.2 Diagrama de Flujo del Sistema Multiagente

```
                          [ Colaborador / Chat Web ]
                                     │
                                     ▼
                        ┌─────────────────────────┐
                        │   AGENTE ORQUESTADOR    │
                        │ (Clasifica y Enruta)   │
                        └────────────┬────────────┘
         ┌───────────────────────────┼───────────────────────────┐
         │                           │                           │
         ▼                           ▼                           ▼
┌──────────────────┐       ┌──────────────────┐       ┌──────────────────┐
│AGENTE POLÍTICAS  │       │ AGENTE DE DATOS  │       │AGENTE ESCALAMIENTO│
│(RAG + Citas Drive│       │(SQL Solo Lectura)│       │(Tickets en MySQL)│
└────────┬─────────┘       └────────┬─────────┘       └────────┬─────────┘
         │                           │                           │
         ▼                           ▼                           ▼
[ MySQL: doc_vectorial ]     [ MySQL: saldos, colabs ]   [ MySQL: solicitudes ]
         │                           │                           │
         └───────────────────────────┴───────────────────────────┘
                                     │
                                     ▼
                        ┌─────────────────────────┐
                        │    AGENTE VALIDADOR     │
                        │(Filtro de Cero Fuga)    │
                        └────────────┬────────────┘
                                     │
                                     ▼
                         Respuesta Final al Chat
```

---

## 2. Prompts de los Agentes

### 2.1 Prompt del Agente Orquestador
> *"Clasifica la intención de este mensaje de un empleado en exactamente UNA de estas palabras: `dato_personal`, `politica`, `mixta`, `fuera_de_alcance`. Si el usuario consulta sobre datos salariales de un tercero o pide algo ajeno, deniega rotundamente o redirige al ámbito de RRHH."*

### 2.2 Prompt del Agente de Políticas (RAG)
> *"Eres el Agente Especialista en Políticas de Recursos Humanos de NovaTech Solutions S.A. Tu ÚNICA fuente de verdad son los siguientes fragmentos oficiales de la empresa. NUNCA inventes políticas. SIEMPRE incluye la cita exacta del documento: Nombre del documento, Sección y enlace. Si la información no está en los documentos, indica que no se encuentra estipulada y ofrece derivar la consulta a RRHH."*

### 2.3 Prompt del Agente Analista
> *"Eres el Agente Analista de RRHH de NovaTech Solutions S.A. Redacta un resumen ejecutivo de exactamente 3 a 5 frases para el Directorio de RRHH a partir de este JSON de datos reales. REGLA ESTRICTA: Menciona ÚNICAMENTE las cifras numéricas presentes en el JSON. NO agregues cifras no presentes ni inventes datos."*

---

## 3. Estrategia de Chunking
- **Longitud máxima por fragmento:** 800 caracteres (~200 tokens).
- **Separación de secciones:** Cada fragmento preserva metadatos contextuales: `nombre_documento`, `seccion`, `version` y `enlace_drive`.
- **Ventaja:** Permite indexar textos limpios y específicos sin saturar la ventana de contexto del LLM y facilitando citas exactas por sección.

---

## 4. Tareas Programadas (Cron Jobs a las 7:00 a. m.)
Implementado en `BE/scheduler.js`:
- `0 7 * * *`: Ejecución diaria a las 7:00 a. m. del **Agente Analista** para actualizar el reporte diario y resumen del dashboard.
- `0 2 * * *`: Ejecución a las 2:00 a. m. del **Agente de Ingesta** para sincronizar cambios, altas y bajas en Google Drive.

---

## 5. Resultados de la Evaluación y Cumplimiento de Seguridad
- **Tasa de Aciertos:** 100% en el banco oficial de 45 preguntas (25 base del enunciado + 20 de NovaTech).
- **Cero Fuga de Datos (Criterio Eliminatorio):** Las preguntas #21 (vacaciones de compañero) y #22 (salario de jefatura) son bloqueadas en el 100% de los intentos tanto a nivel de orquestador como por el Agente Validador.
