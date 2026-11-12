(() => {
  const button = document.getElementById('syncButton');
  const linkKey = storageKey + '-sync';
  let busy = false;
  let status = '';
  const current = () => JSON.stringify(state);
  const link = () => JSON.parse(localStorage.getItem(linkKey) || 'null');
  const remember = (password, revision, base) => localStorage.setItem(linkKey, JSON.stringify({password, revision, base}));
  function display(label) {
    status = label;
    button.textContent = label;
  }
  async function request(password, update) {
    const response = await fetch('/api/agenda', {
      method: update ? 'PUT' : 'GET', cache:'no-store',
      headers:{Authorization:'Bearer '+password,'Content-Type':'application/json'},
      ...(update && {body:JSON.stringify(update)})
    });
    if (!response.ok) {
      const messages = {401:'Clave incorrecta',409:'Cambios en ambos aparatos',413:'Agenda demasiado grande',503:'Configura la conexión en Vercel'};
      throw Error(messages[response.status] || 'Sin conexión con la agenda');
    }
    return response.json();
  }
  function accept(password, remote) {
    const text = JSON.stringify(remote.agenda);
    localStorage.setItem(storageKey,text);
    Object.assign(state,remote.agenda);
    remember(password,remote.revision,text);
    render();
  }
  async function upload(password, revision) {
    const text = current();
    const result = await request(password,{revision,agenda:JSON.parse(text)});
    remember(password,result.revision,text);
  }
  async function sync(manual=false) {
    if (busy || dlg.open || (!manual && document.hidden)) return;
    busy=true;
    try {
      const saved=link();
      if (!saved && !manual) return;
      let password=saved?.password;
      if (!password || (manual && status==='Clave incorrecta')) {
        password=prompt('Introduce la clave privada de tu agenda configurada en Vercel.');
        if (!password) return;
      }
      display('Sincronizando…');
      const remote=await request(password);
      if (dlg.open) { display('Sincronización pendiente'); return; }
      const local=current(), cloud=JSON.stringify(remote.agenda);
      if (!remote.agenda) {
        if (!manual || !confirm('¿Guardar la agenda de este dispositivo como primera copia compartida?')) {
          display('Sincronizar'); return;
        }
        await upload(password,'');
      } else if (local===cloud) {
        remember(password,remote.revision,local);
      } else if (saved && local===saved.base) {
        accept(password,remote);
      } else if (saved && remote.revision===saved.revision) {
        await upload(password,saved.revision);
      } else {
        if (!manual) { display('Revisar sincronización'); return; }
        const choice=prompt('Las agendas son distintas. Escribe RECIBIR para usar aquí la copia compartida o ENVIAR para reemplazar la compartida con la de este aparato. Cancelar conserva ambas.');
        if (choice?.trim().toUpperCase()==='RECIBIR') accept(password,remote);
        else if (choice?.trim().toUpperCase()==='ENVIAR') await upload(password,remote.revision);
        else { display(saved?'Revisar sincronización':'Sincronizar'); return; }
      }
      display(current()===link().base?'Sincronizada':'Cambios pendientes');
    } catch(error) {
      display(error instanceof TypeError ? 'Sin conexión · Reintentar' : error.message);
    } finally { busy=false; }
  }
  button.onclick=()=>sync(true);
  window.addEventListener('agenda-edited',()=>sync());
  window.addEventListener('pageshow',()=>sync());
  window.addEventListener('online',()=>sync());
  document.addEventListener('visibilitychange',()=>sync());
  setInterval(()=>sync(),30000);
})();
