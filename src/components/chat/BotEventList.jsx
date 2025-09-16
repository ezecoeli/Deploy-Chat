import React from 'react';
import { FaCalendarAlt, FaClock, FaTrash, FaEdit, FaToggleOn, FaToggleOff } from 'react-icons/fa';
import { useBotEvents } from '../../hooks/useBotEvents';

export default function BotEventsList({ channelId, onEdit }) {
  const {
    events,
    isLoading,
    deleteEvent,
    toggleEventStatus,
    getEventsByChannel,
  } = useBotEvents(channelId);

  if (isLoading) return <div className="p-4 text-center">Cargando eventos...</div>;
  if (!events.length) return <div className="p-4 text-center text-gray-500">No hay eventos programados.</div>;

  return (
    <div className="space-y-4">
      {events.map(event => (
        <div key={event.id} className="bg-white dark:bg-neutral-900 rounded shadow p-4 flex flex-col md:flex-row md:items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <FaCalendarAlt className="w-4 h-4 text-indigo-500" />
              <span className="font-semibold">{event.title}</span>
              <span className="ml-2 text-xs px-2 py-1 rounded bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300">
                {event.schedule_type}
              </span>
              {!event.is_active && (
                <span className="ml-2 text-xs px-2 py-1 rounded bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                  Inactivo
                </span>
              )}
            </div>
            <div className="text-sm mb-1">{event.message}</div>
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <FaClock className="w-3 h-3" />
              Próxima ejecución: {new Date(event.next_execution).toLocaleString()}
              <span className="ml-2">Cron: <code>{event.cron_expression}</code></span>
            </div>
          </div>
          <div className="flex gap-2 mt-2 md:mt-0 md:ml-4">
            <button
              title={event.is_active ? "Desactivar" : "Activar"}
              onClick={() => toggleEventStatus(event.id, !event.is_active)}
              className={`p-2 rounded ${event.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'} hover:opacity-80`}
            >
              {event.is_active ? <FaToggleOn /> : <FaToggleOff />}
            </button>
            <button
              title="Editar"
              onClick={() => onEdit(event)}
              className="p-2 rounded bg-blue-100 text-blue-700 hover:opacity-80"
            >
              <FaEdit />
            </button>
            <button
              title="Eliminar"
              onClick={async () => {
                if (window.confirm('¿Eliminar este evento?')) {
                  await deleteEvent(event.id);
                  getEventsByChannel();
                }
              }}
              className="p-2 rounded bg-red-100 text-red-700 hover:opacity-80"
            >
              <FaTrash />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}