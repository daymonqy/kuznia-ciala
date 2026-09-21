var auth=null,db=null,currentUser=null,programs=[],exercises=[],pendingMedia=null;
var MAX_MEDIA_MB=0.7;
var editingExerciseId=null;
var editingProgramId=null;
var draftProgramExercises=[]; // {id,name,muscles,sets,reps}

var MUSCLE_OPTIONS=[
  'Klatka piersiowa','Barki','Triceps','Plecy','Biceps','Przedramiona',
  'Czworogłowy uda','Kulszowo-goleniowe','Biodra','Łydki','Mięśnie brzucha'
];

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
    renderPrograms();renderExercises();
    toast('Konto wczytane ('+exercises.length+' ćw.)','ok');
    clearErr();
  }catch(e){
    console.error(e);
    var hint = (typeof firestoreOfflineHint==='function') ? firestoreOfflineHint(e) : (e.message||'');
    showErr(hint);
    toast('Błąd odczytu konta','err');
  }
}

/* ========== PROGRAMY ========= */

function setProgramFormMode(isEdit){
  var title=document.querySelector('#formProgram h3');
  var btn=document.getElementById('btnSaveProg');
  if(title) title.textContent = isEdit ? 'Edytuj program' : 'Nowy program';
  if(btn) btn.textContent = isEdit ? 'Zapisz zmiany' : 'Zapisz program';
}

function openProgramForm(){
  if(!requireAuth())return;
  editingProgramId=null;
  draftProgramExercises=[];
  setProgramFormMode(false);
  document.getElementById('progName').value='';
  document.getElementById('progDesc').value='';
  hideExercisePicker();
  renderDraftProgramExercises();
  document.getElementById('formProgram').classList.add('show');
  document.getElementById('progName').focus();
}

function closeProgramForm(){
  document.getElementById('formProgram').classList.remove('show');
  editingProgramId=null;
  draftProgramExercises=[];
  setProgramFormMode(false);
  document.getElementById('progName').value='';
  document.getElementById('progDesc').value='';
  hideExercisePicker();
  renderDraftProgramExercises();
}

function editProgram(id){
  if(!requireAuth())return;
  var p=programs.find(function(x){return x.id===id;});
  if(!p){toast('Nie znaleziono programu','err');return;}
  editingProgramId=id;
  setProgramFormMode(true);
  document.getElementById('progName').value=p.name||'';
  document.getElementById('progDesc').value=p.description||'';
  draftProgramExercises=(p.exercises||[]).map(function(x){
    return {
      id:x.id,
      name:x.name,
      muscles:x.muscles||[],
      sets:x.sets!=null?x.sets:3,
      reps:x.reps!=null?x.reps:'8-12'
    };
  });
  hideExercisePicker();
  renderDraftProgramExercises();
  document.getElementById('formProgram').classList.add('show');
  document.getElementById('formProgram').scrollIntoView({behavior:'smooth',block:'start'});
}

function showExercisePicker(){
  if(!exercises.length){
    toast('Najpierw dodaj ćwiczenia w zakładce Ćwiczenia','err');
    return;
  }
  var box=document.getElementById('exPickerBox');
  box.classList.add('show');
  document.getElementById('pickerSearch').value='';
  document.getElementById('pickerMuscle').value='';
  renderPickerResults();
  document.getElementById('pickerSearch').focus();
}
function hideExercisePicker(){
  var box=document.getElementById('exPickerBox');
  if(box)box.classList.remove('show');
}

function renderPickerResults(){
  var q=(document.getElementById('pickerSearch').value||'').trim().toLowerCase();
  var muscle=document.getElementById('pickerMuscle').value;
  var already={};
  draftProgramExercises.forEach(function(d){already[d.id]=true;});

  var list=exercises.filter(function(ex){
    if(already[ex.id])return false;
    if(q && (ex.name||'').toLowerCase().indexOf(q)===-1)return false;
    if(muscle){
      var m=ex.muscles||[];
      if(m.indexOf(muscle)===-1)return false;
    }
    return true;
  });

  var el=document.getElementById('pickerResults');
  if(!list.length){
    el.innerHTML='<div class="ex-pick-empty">Brak ćwiczeń do dodania</div>';
    return;
  }
  el.innerHTML=list.map(function(ex){
    return '<div class="picker-row">'+
      '<div class="picker-info"><div class="ex-pick-name">'+escapeHtml(ex.name)+'</div>'+
      '<div class="ex-pick-meta">'+escapeHtml((ex.muscles||[]).join(', '))+'</div></div>'+
      '<button type="button" class="btn-add-ex" onclick="addExerciseToDraft(\''+ex.id+'\')"><i class="fas fa-plus"></i> Dodaj</button>'+
      '</div>';
  }).join('');
}

function addExerciseToDraft(id){
  var ex=exercises.find(function(e){return e.id===id;});
  if(!ex)return;
  if(draftProgramExercises.some(function(d){return d.id===id;})){
    toast('To ćwiczenie już jest w programie','info');
    return;
  }
  draftProgramExercises.push({
    id:ex.id,
    name:ex.name,
    muscles:ex.muscles||[],
    sets:3,
    reps:'8-12'
  });
  renderDraftProgramExercises();
  renderPickerResults();
  toast('Dodano: '+ex.name,'ok');
}

function removeFromDraft(index){
  draftProgramExercises.splice(index,1);
  renderDraftProgramExercises();
  renderPickerResults();
}

function moveDraft(index,dir){
  var j=index+dir;
  if(j<0||j>=draftProgramExercises.length)return;
  var tmp=draftProgramExercises[index];
  draftProgramExercises[index]=draftProgramExercises[j];
  draftProgramExercises[j]=tmp;
  renderDraftProgramExercises();
}

function updateDraftField(index,field,value){
  if(!draftProgramExercises[index])return;
  if(field==='sets'){
    var n=parseInt(value,10);
    draftProgramExercises[index].sets=isNaN(n)?1:Math.max(1,Math.min(99,n));
  }else if(field==='reps'){
    draftProgramExercises[index].reps=String(value||'').trim()||'8-12';
  }
}

function renderDraftProgramExercises(){
  var el=document.getElementById('draftExList');
  if(!el)return;
  if(!draftProgramExercises.length){
    el.innerHTML='<div class="ex-pick-empty">Brak ćwiczeń w programie.<br>Kliknij „Dodaj ćwiczenie”.</div>';
    return;
  }
  el.innerHTML=draftProgramExercises.map(function(d,i){
    return '<div class="draft-item">'+
      '<div class="draft-top">'+
        '<span class="draft-num">'+(i+1)+'.</span>'+
        '<div class="draft-name">'+escapeHtml(d.name)+'</div>'+
        '<div class="draft-order">'+
          '<button type="button" title="W górę" onclick="moveDraft('+i+',-1)" '+(i===0?'disabled':'')+'><i class="fas fa-chevron-up"></i></button>'+
          '<button type="button" title="W dół" onclick="moveDraft('+i+',1)" '+(i===draftProgramExercises.length-1?'disabled':'')+'><i class="fas fa-chevron-down"></i></button>'+
          '<button type="button" class="draft-remove" title="Usuń" onclick="removeFromDraft('+i+')"><i class="fas fa-times"></i></button>'+
        '</div>'+
      '</div>'+
      '<div class="draft-meta">'+escapeHtml((d.muscles||[]).join(', '))+'</div>'+
      '<div class="draft-sets">'+
        '<label>Serie <input type="number" min="1" max="99" value="'+escapeHtml(String(d.sets))+'