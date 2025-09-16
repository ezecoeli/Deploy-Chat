import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js";

const BOT_USER_ID = '00000000-0000-0000-0000-000000000001';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL'),
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
);

serve(async (req) => {
  try {
    // 1. Buscar eventos activos y listos
    const { data: events, error: eventsError } = await supabase
      .from('bot_events')
      .select('*')
      .eq('is_active', true)
      .lte('next_execution', new Date().toISOString());

    if (eventsError) throw eventsError;

    let executed = 0;
    let errors = [];

    for (const event of events) {
      // 2. Insertar mensaje en messages
      const content = `[${event.title}]\n${event.message}`;
      const { error: msgError } = await supabase
        .from('messages')
        .insert({
          channel_id: event.channel_id,
          user_id: BOT_USER_ID,
          content,
          created_at: new Date().toISOString()
        });

      if (msgError) {
        errors.push({ event_id: event.id, error: msgError.message });
        continue;
      }

      executed++;

      // 3. Actualizar evento según tipo
      if (event.schedule_type === 'once') {
        await supabase
          .from('bot_events')
          .update({ is_active: false })
          .eq('id', event.id);
      } else {
        // Calcular próxima ejecución según cron_expression (simplificado)
        // Aquí deberías usar una librería de cron para calcular el siguiente timestamp
        // Por ahora, solo suma 1 día como ejemplo para 'daily'
        let next;
        if (event.schedule_type === 'daily') {
          next = new Date(Date.parse(event.next_execution) + 24 * 60 * 60 * 1000).toISOString();
        } else if (event.schedule_type === 'weekly') {
          next = new Date(Date.parse(event.next_execution) + 7 * 24 * 60 * 60 * 1000).toISOString();
        } else if (event.schedule_type === 'monthly') {
          const d = new Date(event.next_execution);
          d.setMonth(d.getMonth() + 1);
          next = d.toISOString();
        }
        if (next) {
          await supabase
            .from('bot_events')
            .update({ next_execution: next })
            .eq('id', event.id);
        }
      }
    }

    return new Response(
      JSON.stringify({ executed, errors }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});