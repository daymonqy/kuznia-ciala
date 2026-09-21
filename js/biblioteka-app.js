var auth=null,db=null,currentUser=null,programs=[],exercises=[],pendingMedia=null;
var MAX_MEDIA_MB=0.7;

try{
  auth=firebase.auth();
  db=firebase.firestore();
}catch(e){
  setTimeout(function(){showErr('Firebase nie wystartował: '+e.message);},0);
}

function showErr(msg){
  var box=document.getElementById('errBox');
  if(!box)return;
  box.innerHTML=String(msg).replace(/\n/g,'<br>');
  box.classList.add('show');
}
function clearErr(){
  var box=document.getElementById('errBox');
  if(box)box.classList.remove('show');
}
function toast(t,type){
  var el=document.getElementById('toast');
  if(!el)return;
  el.textContent=t;el.className='toast '+(type||'info')+' show';
  setTimeout(function(){el.classList.remove('show');},3500);
}

function bindMI(sel){
  document.querySelectorAll(sel+' .muscle-item input').forEach(function(cb){
    cb.addEventListener('change',function(){
      cb.closest('.muscle-item').classList.toggle('selected',cb.checked);
    });
  });
}
bindMI('#filterMuscles');
bindMI('#createMuscles');

function requireAuth(){
  if(!currentUser){toast('Najpierw zaloguj się w zakładce Ty','err');showErr('Nie jesteś zalogowany.');return false;}
  if(!db){toast('Brak bazy Firestore','err');return false;}
  return true;
}

function setAuthUI(user){
  var gate=document.getElementById('loginGate');
  var app=document.getElementById('appContent');
  var status=document.getElementById('status');
  if(user){
    gate.classList.add('hidden');
    app.classList.remove('hidden');
    status.innerHTML='<i class="fas fa-user-check"></i> '+(user.displayName||user.email);
    status.classList.add('on');
    clearErr();
  }else{
    gate.classList.remove('hidden');
    app.classList.add('hidden');
    status.innerHTML='<i class="fas fa-user"></i> Gość';
    status.classList.remove('on');
    programs=[];exercises=[];
  }
}

async function persistAll(){
  if(typeof firestoreSaveUserData==='function'){
    await firestoreSaveUserData(db, currentUser.uid, {
      programs: programs,
      exercises: exercises,
      updatedAt: new Date().toISOString()
    });
  }else{
    if(db.enableNetwork) await db.enableNetwork();
    await db.collection('users').doc(currentUser.uid).set({
      programs: programs,
      exercises: exercises,
      updatedAt: new Date().toISOString()
    }, {merge:true});
  }
}

async function loadFromAccount(){
  if(!currentUser||!db)return;
  try{
    toast('Wczytywanie konta...','info');
    if(db.enableNetwork) await db.enableNetwork();
    var snap = (typeof firestoreGetUserDoc==='function')
      ? await firestoreGetUserDoc(db, currentUser.uid, 4)
      : await db.collection('users').doc(currentUser.uid).get({source:'server'});
    if(snap.exists){
      var data=snap.data()||{};
      programs=Array.isArray(data.programs)?data.programs:[];
      exercises=Array.isArray(data.exercises)?data.exercises:[];
    }else{
      programs=[];exercises=[];
      await db.collection('users').doc(currentUser.uid).set({
        programs:[],exercises:[],email:currentUser.email||'',createdAt:new Date().toISOString()
      },{merge:true});
    }
    renderPrograms();renderExercises();renderExercisePicker();
    toast('Konto wczytane ('+exercises.length+' ćw.)','ok');
    clearErr();
  }catch(e){
    console.error(e);
    var hint = (typeof firestoreOfflineHint==='function') ? firestoreOfflineHint(e) : (e.message||'');
    showErr(hint);
    toast('Błąd odczytu konta','err');
  }
}

function openProgramForm(){if(!requireAuth())return;document.getElementById('formProgram').classList.add('show');renderExercisePicker();}
function closeProgramForm(){
  document.getElementById('formProgram').classList.remove('show');
  document.getElementById('progName').value='';
  document.getElementById('progDesc').value='';
  document.querySelectorAll('input[name=progEx]').forEach(function(cb){
    cb.checked=false;
    var i=cb.closest('.ex-pick-item');
    if(i)i.classList.remove('selected');
  });
}
function openExerciseForm(){if(!requireAuth())return;document.getElementById('formExercise').classList.add('show');}
function closeExerciseForm(){
  document.getElementById('formExercise').classList.remove('show');
  document.getElementById('exName').value='';
  document.getElementById('exDesc').value='';
  clearMuscleSelection();clearMedia();
}

function onMediaSelect(ev,type){
  var f=ev.target.files&&ev.target.files[0];if(!f)return;
  if(f.size>MAX_MEDIA_MB*1024*1024){toast('Plik za duży (max '+MAX_MEDIA_MB+' MB)','err');ev.target.value='';return;}
  var r=new FileReader();
  r.onload=function(e){
    pendingMedia={type:type,dataUrl:e.target.result,name:f.name};
    document.getElementById('mediaContent').innerHTML=type==='image'
      ? '<img src="'+e.target.result+'">'
      : '<video src="'+e.target.result+'" controls>';
    document.getElementById('mediaPreview').classList.add('show');
  };
  r.readAsDataURL(f);
}
function clearMedia(){
  pendingMedia=null;
  document.getElementById('mediaPreview').classList.remove('show');
  document.getElementById('mediaContent').innerHTML='';
  document.getElementById('exImage').value='';
  document.getElementById('exVideo').value='';
}

function getSelectedMuscles(){
  return Array.prototype.map.call(document.querySelectorAll('input[name=muscle]:checked'),function(el){return el.value;});
}
function clearMuscleSelection(){
  document.querySelectorAll('input[name=muscle]').forEach(function(cb){
    cb.checked=false;
    cb.closest('.muscle-item').classList.remove('selected');
  });
}
function getFilterMuscles(){
  return Array.prototype.map.call(document.querySelectorAll('input[name=filterMuscle]:checked'),function(el){return el.value;});
}
function toggleFilter(){
  document.querySelector('#panelCwiczenia .filter-box').classList.toggle('collapsed');
}
function clearFilter(){
  document.querySelectorAll('input[name=filterMuscle]').forEach(function(cb){
    cb.checked=false;
    cb.closest('.muscle-item').classList.remove('selected');
  });
  applyFilter();
}
function applyFilter(){
  document.querySelectorAll('#filterMuscles .muscle-item input').forEach(function(cb){
    cb.closest('.muscle-item').classList.toggle('selected',cb.checked);
  });
  renderExercises();
}
function getFilteredExercises(){
  var f=getFilterMuscles();
  if(!f.length)return exercises;
  return exercises.filter(function(ex){
    return (ex.muscles||[]).some(function(m){return f.indexOf(m)!==-1;});
  });
}
function getSelectedExerciseIds(){
  return Array.prototype.map.call(document.querySelectorAll('input[name=progEx]:checked'),function(el){return el.value;});
}

function showProgram(){
  document.getElementById('panelProgram').classList.add('show');
  document.getElementById('panelCwiczenia').classList.remove('show');
  document.getElementById('tabProgram').classList.add('on');
  document.getElementById('tabCwiczenia').classList.remove('on');
  renderExercisePicker();
}
function showCwiczenia(){
  document.getElementById('panelCwiczenia').classList.add('show');
  document.getElementById('panelProgram').classList.remove('show');
  document.getElementById('tabCwiczenia').classList.add('on');
  document.getElementById('tabProgram').classList.remove('on');
  applyFilter();
}

function renderExercisePicker(){
  var el=document.getElementById('exPickList');
  if(!exercises.length){el.innerHTML='<div class="ex-pick-empty">Brak ćwiczeń na koncie</div>';return;}
  el.innerHTML=exercises.map(function(ex){
    return '<label class="ex-pick-item"><input type="checkbox" name="progEx" value="'+ex.id+'"><div><div class="ex-pick-name">'+escapeHtml(ex.name)+'</div><div class="ex-pick-meta">'+escapeHtml((ex.muscles||[]).join(', '))+'</div></div></label>';
  }).join('');
  el.querySelectorAll('.ex-pick-item input').forEach(function(cb){
    cb.addEventListener('change',function(){cb.closest('.ex-pick-item').classList.toggle('selected',cb.checked);});
  });
}

async function saveExercise(){
  if(!requireAuth())return;
  var name=document.getElementById('exName').value.trim();
  var muscles=getSelectedMuscles();
  var desc=document.getElementById('exDesc').value.trim();
  if(!name){toast('Podaj nazwę','err');return;}
  if(!muscles.length){toast('Wybierz partię mięśniową','err');return;}

  var item={id:String(Date.now()),name:name,muscles:muscles,description:desc,createdAt:new Date().toISOString()};
  if(pendingMedia)item.media={type:pendingMedia.type,dataUrl:pendingMedia.dataUrl,name:pendingMedia.name};

  var btn=document.getElementById('btnSaveEx');
  btn.disabled=true;btn.textContent='Zapisywanie...';

  try{
    exercises.unshift(item);
    await persistAll();
    renderExercises();renderExercisePicker();
    closeExerciseForm();
    clearErr();
    toast('Ćwiczenie zapisane na koncie ✓','ok');
  }catch(e){
    exercises=exercises.filter(function(x){return x.id!==item.id;});
    console.error(e);
    var msg='Zapis nieudany. ';
    if(e.code==='permission-denied'){
      msg='Firestore: brak uprawnień. Ustaw reguły w Firebase Console.';
    }else if(e.message&&e.message.indexOf('offline')!==-1){
      msg=(typeof firestoreOfflineHint==='function')?firestoreOfflineHint(e):e.message;
    }else{
      msg+=(e.code||'')+' '+(e.message||'');
    }
    showErr(msg);
    toast('Nie zapisano','err');
  }
  btn.disabled=false;btn.textContent='Zapisz na konto';
}

async function saveProgram(){
  if(!requireAuth())return;
  var name=document.getElementById('progName').value.trim();
  var desc=document.getElementById('progDesc').value.trim();
  var ids=getSelectedExerciseIds();
  if(!name){toast('Podaj nazwę programu','err');return;}
  if(!ids.length){toast('Wybierz ćwiczenia','err');return;}
  var selected=ids.map(function(id){
    var f=exercises.find(function(e){return e.id===id;});
    return f?{id:f.id,name:f.name,muscles:f.muscles||[]}:null;
  }).filter(Boolean);
  var item={id:String(Date.now()),name:name,description:desc,exercises:selected,createdAt:new Date().toISOString()};
  try{
    programs.unshift(item);
    await persistAll();
    renderPrograms();closeProgramForm();
    toast('Program zapisany na koncie ✓','ok');
    clearErr();
  }catch(e){
    programs=programs.filter(function(p){return p.id!==item.id;});
    console.error(e);
    showErr('Program nie zapisany: '+(e.code||'')+' '+(e.message||''));
    toast('Nie zapisano programu','err');
  }
}

async function deleteProgram(id){
  if(!requireAuth())return;
  if(!confirm('Usunąć program z konta?'))return;
  var backup=programs.slice();
  programs=programs.filter(function(p){return p.id!==id;});
  try{await persistAll();renderPrograms();toast('Usunięto','info');}
  catch(e){programs=backup;renderPrograms();showErr('Usuwanie nieudane: '+e.message);toast('Błąd','err');}
}

async function deleteExercise(id){
  if(!requireAuth())return;
  if(!confirm('Usunąć ćwiczenie z konta?'))return;
  var backupEx=exercises.slice(),backupPr=programs.slice();
  exercises=exercises.filter(function(e){return e.id!==id;});
  programs=programs.map(function(p){
    if(p.exercises)p.exercises=p.exercises.filter(function(x){return x.id!==id;});
    return p;
  });
  try{await persistAll();renderExercises();renderPrograms();renderExercisePicker();toast('Usunięto','info');}
  catch(e){exercises=backupEx;programs=backupPr;renderExercises();renderPrograms();showErr('Usuwanie nieudane: '+e.message);toast('Błąd','err');}
}

function escapeHtml(s){
  if(!s)return'';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function formatDate(iso){
  if(!iso)return'';
  try{return new Date(iso).toLocaleDateString('pl-PL');}catch(e){return'';}
}

function renderPrograms(){
  var el=document.getElementById('listProgram');
  if(!programs.length){el.innerHTML='<div class="empty">Brak programów na koncie</div>';return;}
  el.innerHTML=programs.map(function(p){
    var list=(p.exercises&&p.exercises.length)?'<ul class="card-ex-list">'+p.exercises.map(function(x){return '<li>'+escapeHtml(x.name)+'</li>';}).join('')+'</ul>':'';
    return '<div class="card"><div class="card-title">'+escapeHtml(p.name)+'</div><div class="card-meta">'+(p.exercises?p.exercises.length:0)+' ćw. · '+formatDate(p.createdAt)+'</div>'+(p.description?'<div class="card-desc">'+escapeHtml(p.description)+'</div>':'')+list+'<div class="card-actions"><button type="button" onclick="deleteProgram(\''+p.id+'\')">Usuń</button></div></div>';
  }).join('');
}

function renderExercises(){
  var el=document.getElementById('listExercise');
  var filtered=getFilteredExercises();
  var filters=getFilterMuscles();
  document.getElementById('filterCount').textContent=filters.length?('Filtr: '+filtered.length+' / '+exercises.length):(exercises.length?('Na koncie: '+exercises.length):'');
  if(!filtered.length){
    el.innerHTML='<div class="empty">'+(exercises.length?'Brak wyników filtra':'Brak ćwiczeń – utwórz pierwsze')+'</div>';
    return;
  }
  el.innerHTML=filtered.map(function(e){
    var media='';
    if(e.media&&e.media.dataUrl){
      media=e.media.type==='image'
        ? '<div class="card-media"><img src="'+e.media.dataUrl+'"></div>'
        : '<div class="card-media"><video src="'+e.media.dataUrl+'" controls></div>';
    }
    return '<div class="card"><div class="card-title">'+escapeHtml(e.name)+'</div><div class="card-meta">'+escapeHtml((e.muscles||[]).join(', '))+' · '+formatDate(e.createdAt)+'</div>'+media+(e.description?'<div class="card-desc">'+escapeHtml(e.description)+'</div>':'')+'<div class="card-actions"><button type="button" onclick="deleteExercise(\''+e.id+'\')">Usuń</button></div></div>';
  }).join('');
}

if(auth){
  auth.onAuthStateChanged(function(user){
    currentUser=user;
    setAuthUI(user);
    if(user)loadFromAccount();
  });
}else{
  setAuthUI(null);
  showErr('Brak Firebase Auth');
}
