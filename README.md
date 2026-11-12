# Agenda de estudio

Web estática en español. El calendario, las calificaciones y la rueda de tareas funcionan con HTML, CSS y JavaScript. Para probarla en el ordenador, abre `index.html` en el navegador.

## Publicar en Vercel

1. Sube el contenido de esta carpeta a un repositorio de GitHub. Coloca index.html, sync.js, la carpeta api y este README en la raíz.
2. En Vercel, importa el repositorio como un proyecto nuevo y selecciona el preset **Other**.
3. Usa la raíz del repositorio como **Root Directory**, deja **Build Command** vacío y usa **.** como **Output Directory**.
4. Pulsa **Deploy** y abre la URL de producción desde tu iPhone.

## Aparecer en Google

Cuando la URL de producción sea pública, añádela como propiedad en Google Search Console y verifica la propiedad. En **Inspección de URLs**, introduce la dirección de la portada y pulsa **Solicitar indexación**. Google decide si incorpora la página y cuándo aparece en los resultados.

## Datos de la agenda

Las actividades, notas, colores y tareas se guardan en el navegador para el dominio que visitas. El dominio de Vercel empieza con una agenda vacía aunque ya hayas utilizado el artefacto en otro dominio.

## Sincronizar móvil y ordenador

Sube también la carpeta api a la raíz del repositorio, junto a index.html. En Vercel conecta una base Upstash Redis al proyecto y habilita sus variables para Production. La función lee UPSTASH_REDIS_REST_URL y UPSTASH_REDIS_REST_TOKEN (también admite KV_REST_API_URL y KV_REST_API_TOKEN). Añade en Settings → Environment Variables una variable de producción llamada AGENDA_CLAVE con una contraseña larga, aleatoria y privada. Usa caracteres ASCII y guarda la contraseña en tu gestor de contraseñas. Vuelve a desplegar el proyecto. Las credenciales de Redis solo se configuran en Vercel.

Abre primero el mismo dominio de siempre en el navegador del móvil donde ves tus datos. Toca Sincronizar, escribe tu clave y confirma la primera copia. Después abre la misma dirección en el ordenador, toca Sincronizar, introduce la misma clave y elige RECIBIR si se te pregunta. La clave permite leer y modificar la agenda. Una vez vinculados, los dispositivos actualizan al guardar, al volver a la página y cada 30 segundos mientras está visible. Si ambos han cambiado sin conexión, el botón permite elegir qué copia conservar.
