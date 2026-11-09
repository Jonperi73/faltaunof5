# Base de datos para Mercado de Pases — Fulbito 5

## Objetivo
Preparar perfiles públicos, equipos permanentes/casuales y el flujo de publicaciones/solicitudes sin modificar el esquema actual de torneos.

## Colecciones propuestas

- `users/{uid}`: cuenta privada y datos de autenticación/permisos. No usar el cliente para asignar roles privilegiados.
- `player_profiles/{uid}`: información pública del jugador: username, name, position, zone, description, lookingForTeam, status y updatedAt.
- `player_private/{uid}`: datos privados de contacto, incluido WhatsApp y showWhatsapp. No leer esta colección desde listados públicos.
- `teams/{teamId}`: name, description, zone, teamType (permanent/casual), createdBy, adminId, captainId, status y fechas.
- `teams/{teamId}/members/{uid}`: userId, role, status, joinedAt.
- `transfer_listings/{listingId}`: kind (player/team), ownerId, título, descripción, zona, estado y campos específicos.
- `transfer_requests/{requestId}`: type (team_invitation/player_application), teamId, playerId, senderId, recipientId, status, fechas.
- `notifications/{notificationId}`: userId, type, title, message, relatedId, read, createdAt.
- `team_membership_history/{eventId}`: altas, bajas, cambios de rol y origen de la incorporación.

## Reglas de negocio

1. El creador queda como admin y capitán inicial; son responsabilidades separadas.
2. Sólo admin/capitán puede publicar búsquedas e invitar jugadores.
3. Un jugador puede integrar varios equipos permanentes. Su equipo principal se elige en una configuración aparte.
4. Los equipos casuales sirven para partidos/torneos puntuales y no alteran el equipo principal.
5. WhatsApp es opcional. Sólo se expone si el dueño habilita compartirlo; el número nunca va en el documento público.
6. Aceptar una solicitud debe incorporar al jugador una sola vez, actualizar membresía e historial y generar notificación de forma atómica.
7. La inscripción de un equipo a un torneo no debe crear membresía permanente automáticamente.

## Estado de implementación en esta rama

- Se agregaron helpers de Firebase para guardar y consultar perfiles públicos.
- Se agregó creación de equipos permanentes con admin/capitán inicial y miembro inicial.
- Se agregaron publicaciones player/team y consultas de publicaciones activas.
- Se agregó creación de solicitudes e inserción de notificación, con ID determinístico por tipo/equipo/jugador para evitar solicitudes pendientes duplicadas.
- No se implementó todavía aceptación/rechazo, equipos casuales, lectura de WhatsApp ni interfaz visual del Mercado.

## Seguridad: no desplegar reglas todavía

Las reglas actuales dejan operaciones demasiado abiertas en `users` y `tournaments`. Además, las operaciones de aceptación deben validarse en backend (Cloud Functions o endpoint confiable) para que la incorporación, historial y notificación sean atómicos y no manipulables desde el navegador.

Antes de publicar reglas definitivas:
- revisar todos los accesos actuales de torneos y canchas;
- mover roles y permisos privilegiados a datos no editables por el usuario;
- restringir lectura de perfiles privados;
- definir permisos por admin/capitán y destinatario de cada solicitud;
- validar todas las transiciones de estado en backend.

## Compatibilidad

Esta etapa no cambia el documento `tournaments`, la estructura de sus equipos ni la lógica actual de inscripción/inicio. La sincronización general de salas y estadísticas queda fuera de este primer corte.
