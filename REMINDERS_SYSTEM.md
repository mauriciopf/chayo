# 📧 Sistema de Recordatorios - Documentación Completa

## 📋 Resumen

El Sistema de Recordatorios permite a las organizaciones enviar recordatorios personalizados por email a sus clientes. Utiliza IA (OpenAI) para generar plantillas HTML profesionales y Supabase Edge Functions para envíos programados.

---

## 🏗️ Arquitectura

### 1. **Base de Datos**

#### Tabla `reminders_tool`
```sql
CREATE TABLE reminders_tool (
  id UUID PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id),
  customer_id UUID REFERENCES customers(id),
  original_message TEXT NOT NULL,
  ai_generated_html TEXT,
  subject TEXT NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  recurrence TEXT CHECK (recurrence IN ('once', 'daily', 'weekly', 'monthly')),
  last_sent_at TIMESTAMPTZ,
  next_send_at TIMESTAMPTZ,
  status TEXT CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
  sent_count INTEGER DEFAULT 0,
  error_message TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
)
```

#### Tabla `customers` (modificada)
- **Nueva columna**: `organization_ids UUID[]`
- **Propósito**: Rastrear todas las organizaciones a las que un cliente ha iniciado sesión
- **Trigger**: Auto-actualiza el array cuando cambia `organization_id`

### 2. **API Routes**

#### `/api/organizations/[id]/customers` (GET)
- Obtiene lista de clientes asociados a una organización
- Filtra por `organization_ids` (contiene el ID de la organización)

#### `/api/organizations/[id]/reminders` (GET, POST)
- **GET**: Lista todos los recordatorios de una organización
- **POST**: Crea un nuevo recordatorio programado

#### `/api/organizations/[id]/reminders/[reminderId]` (PUT, DELETE)
- **PUT**: Actualiza un recordatorio existente
- **DELETE**: Elimina un recordatorio

#### `/api/ai/generate-email-template` (POST)
- Genera plantillas HTML usando OpenAI GPT-4o-mini
- Parámetros: `message`, `subject`, `businessName`, `regenerate`
- Temperatura: 0.7 (inicial), 0.9 (regenerar)

### 3. **Supabase Edge Function**

**Función**: `send-reminder-emails`
**Trigger**: Cron job (cada 5 minutos recomendado)
**Propósito**: Enviar recordatorios pendientes

**Flujo**:
1. Llama a `get_pending_reminders()` para obtener recordatorios listos
2. Envía emails vía Resend (`reminders@chayo.ai`)
3. Marca recordatorios como enviados con `mark_reminder_sent()`
4. Para recordatorios recurrentes, calcula `next_send_at`
5. En caso de error, marca con `mark_reminder_failed()`

### 4. **Funciones de Base de Datos**

#### `get_pending_reminders()`
Retorna recordatorios que deben enviarse:
- `status = 'pending'`
- `scheduled_at <= NOW()` (una vez)
- `next_send_at <= NOW()` (recurrentes)

#### `mark_reminder_sent(reminder_id)`
- Incrementa `sent_count`
- Actualiza `last_sent_at`
- Calcula `next_send_at` (si es recurrente)
- Cambia `status` a `'sent'` (solo para "once")

#### `mark_reminder_failed(reminder_id, error_message)`
- Cambia `status` a `'failed'`
- Guarda `error_message`

#### `calculate_next_send_time(current_time, recurrence)`
- **daily**: +1 día
- **weekly**: +1 semana
- **monthly**: +1 mes
- **once**: NULL

---

## 🎨 Componente UI

**Archivo**: `apps/web/lib/features/tools/reminders/components/RemindersToolConfig.tsx`

### Características

1. **Selección de Cliente**
   - Lista con búsqueda en tiempo real
   - Muestra avatar, nombre completo y email
   - Selección visual destacada

2. **Creación de Recordatorio**
   - Campo de asunto
   - Área de mensaje (texto plano)
   - Botón "Generar Plantilla con IA"
   - Vista previa HTML
   - Botón "Regenerar" para nuevas versiones

3. **Programación**
   - Selector de fecha (mínimo: hoy)
   - Selector de hora
   - Frecuencia: Una vez, Diario, Semanal, Mensual

4. **Lista de Recordatorios**
   - Vista de todos los recordatorios programados
   - Estados: Pendiente, Enviado, Fallido, Cancelado
   - Indicador de recurrencia
   - Contador de envíos
   - Botón de eliminar

---

## 🔗 Integración

### ActionableHintChips
```typescript
{
  id: 'send_reminders',
  label: '📧 Recordatorios',
  icon: '📧',
  description: 'Envía recordatorios personalizados a tus clientes por email con IA.',
  category: 'reminders'
}
```

### ActionableHintShareModal
- **Título**: "Recordatorios por Email"
- **Descripción**: "Envía recordatorios personalizados a tus clientes con plantillas generadas por IA"
- **Features**:
  - Plantillas de email generadas por IA
  - Programación de recordatorios (una vez, diario, semanal, mensual)
  - Selección de clientes desde tu lista
  - Vista previa de emails antes de enviar

---

## 🚀 Deployment

### 1. Migración de Base de Datos
```bash
npx supabase db push
# Archivo: migrations/create_reminders_system.sql
```

### 2. Desplegar Edge Function
```bash
supabase functions deploy send-reminder-emails
```

### 3. Configurar Variables de Entorno
En Supabase Dashboard > Edge Functions > Settings:
```
RESEND_API_KEY=re_...
SUPABASE_URL=https://...
SUPABASE_SERVICE_ROLE_KEY=...
CRON_SECRET=your-secret-key
```

### 4. Configurar Cron Job
Crear un cron job (via cron-job.org, GitHub Actions, o similar):
```bash
curl -X POST https://your-project.supabase.co/functions/v1/send-reminder-emails \
  -H "Authorization: Bearer your-cron-secret"
```
**Frecuencia recomendada**: Cada 5 minutos

### 5. Habilitar Tool en Agent Tools
Los negocios pueden habilitar/deshabilitar el tool desde:
- Dashboard > Chat > "📧 Recordatorios" chip
- Toggle en el modal

---

## 🎯 Flujo de Usuario

### Para el Negocio:
1. Hacer clic en "📧 Recordatorios" en el chat
2. Habilitar el tool (si no está activo)
3. Seleccionar un cliente de la lista
4. Escribir asunto y mensaje
5. Generar plantilla con IA (puede regenerar múltiples veces)
6. Previsualizar el email
7. Seleccionar fecha, hora y frecuencia
8. Programar recordatorio

### Para el Cliente:
1. Recibe email en la fecha/hora programada
2. Email con diseño profesional generado por IA
3. Si es recurrente, recibirá el siguiente según la frecuencia

---

## 📊 Estados de Recordatorio

| Estado | Descripción |
|--------|-------------|
| `pending` | Esperando a ser enviado |
| `sent` | Enviado exitosamente (solo "once") |
| `failed` | Falló al enviar (revisa `error_message`) |
| `cancelled` | Cancelado manualmente |

**Nota**: Los recordatorios recurrentes permanecen en `pending` y se actualizan `next_send_at` después de cada envío.

---

## 🔧 Mantenimiento

### Monitorear Edge Function
```bash
supabase functions logs send-reminder-emails
```

### Consultar Recordatorios Pendientes
```sql
SELECT * FROM reminders_tool 
WHERE status = 'pending' 
  AND (
    (recurrence = 'once' AND scheduled_at <= NOW())
    OR (recurrence != 'once' AND next_send_at <= NOW())
  );
```

### Limpiar Recordatorios Antiguos
```sql
DELETE FROM reminders_tool 
WHERE status = 'sent' 
  AND recurrence = 'once' 
  AND sent_at < NOW() - INTERVAL '90 days';
```

---

## ⚠️ Límites y Consideraciones

1. **Resend Email Limits**: Verificar plan de Resend para límites de envío
2. **Edge Function Timeout**: 150 segundos (procesa recordatorios en batch)
3. **Cron Frequency**: Ejecutar cada 5-10 minutos para precisión
4. **No Email Tracking**: Sistema actual no rastrea opens/clicks (puede agregarse después)

---

## 🔮 Futuras Mejoras

- [ ] Email open/click tracking
- [ ] Templates predefinidos (no solo IA)
- [ ] Adjuntar archivos
- [ ] Recordatorios basados en eventos (ej: 24h antes de cita)
- [ ] Dashboard de estadísticas de envío
- [ ] Cancelar recordatorios recurrentes
- [ ] Pausar/reanudar recordatorios
- [ ] Testing A/B de plantillas

---

## 📝 Notas Técnicas

- **OpenAI Model**: GPT-4o-mini (rápido y económico)
- **Email Service**: Resend (superior a SendGrid/Mailgun)
- **From Address**: `reminders@chayo.ai` (debe estar verificado en Resend)
- **Time Zone**: UTC (convertir según necesidad del negocio)
- **HTML Sanitization**: OpenAI genera HTML seguro, pero siempre validar

---

## ✅ Checklist de Implementación

- [x] Migración de base de datos
- [x] API routes CRUD
- [x] OpenAI template generator
- [x] Supabase Edge Function
- [x] UI Component (RemindersToolConfig)
- [x] Integración en ActionableHintChips
- [x] Integración en ActionableHintShareModal
- [x] Textos en español (sin necesidad de i18n)
- [ ] Deploy Edge Function a producción
- [ ] Configurar cron job
- [ ] Probar envío de recordatorio
- [ ] Documentar para usuarios finales

---

**Sistema creado**: 2025-01-10
**Última actualización**: 2025-01-10

