var auth=null,db=null,currentUser=null,programs=[],exercises=[],pendingMedia=null;
var MAX_MEDIA_MB=0.7;
var editingExerciseId=null;
var editingProgramId=null;
var draftProgramExercises=[];

try{
  auth=firebase.auth();
  db=firebase.firestore();
}catch(e){
  setTimeout(function(){showErr("Firebase nie wystartował: "+e.message);},0);
}

function showErr(msg){
  var box=document.getElementById("errBox");
  if(!box)return;
  box.innerHTML=String(msg).replace(/\n/g,"<br>");
  box.classList.add("show");
}
function clearErr(){
  var box=document.getElementById("errBox");
  if(box)box.classList.remove("show");
}
function toast(t,type){
  var el=document.getElementById("toast");
  if(!el)return;
  el.textContent=t;el.className="toast "+(type||"info")+" show";
  setTimeout(function(){el.classList.remove("show");},3500);
}

function bindMI(sel){
  document.querySelectorAll(sel+" .muscle-item input").forEach(function(cb){
    cb.addEventListener("change",function(){
      cb.closest(".muscle-item").classList.toggle("selected",cb.checked);
    });
  });
}
bindMI("#filterMuscles");
bindMI("#createMuscles");

function requireAuth(){
  if(!currentUser){toast("Najpierw zaloguj się w zakładce Ty","err");showErr("Nie jesteś zalogowany.");return false;}
  if(!db){toast("Brak bazy Firestore","err");return false;}
  return true;
}

function setAuthUI(user){
  var gate=document.getElementById("loginGate");
  var app=document.getElementById("appContent");
  var status=document.getElementById("status");
  if(user){
    gate.classList.add("hidden");
    app.classList.remove("hidden");
    status.innerHTML='<i class="fas fa-user-check"></i> '+(user.displayName||user.email);
    status.classList.add("on");
    clearErr();
  }else{
    gate.classList.remove("hidden");
    app.classList.add("hidden");
    status.innerHTML='<i class="fas fa-user"></i> Gość';
    status.classList.remove("on");
    programs=[];exercises=[];
  }
}

async function persistAll(){
  if(typeof firestoreSaveUserData==="function"){
    await firestoreSaveUserData(db, currentUser.uid, {
      programs: programs,
      exercises: exercises,
      updatedAt: new Date().toISOString()
    });
  }else{
    if(db.enableNetwork) await db.enableNetwork();
    await db.collection("users").doc(currentUser.uid).set({
      programs: programs,
      exercises: exercises,
      updatedAt: new Date().toISOString()
    }, {merge:true});
  }
}

async function loadFromAccount(){
  if(!currentUser||!db)return;
  try{
    toast("Wczytywanie konta...","info");
    if(db.enableNetwork) await db.enableNetwork();
    var snap = (typeof firestoreGetUserDoc==="function")
      ? await firestoreGetUserDoc(db, currentUser.uid, 4)
      : await db.collection("users").doc(currentUser.uid).get({source:"server"});
    if(snap.exists){
      var data=snap.data()||{};
      programs=Array.isArray(data.programs)?data.programs:[];
      exercises=Array.isArray(data.exercises)?data.exercises:[];
    }else{
      programs=[];exercises=[];
      await db.collection("users").doc(currentUser.uid).set({
        programs:[],exercises:[],email:currentUser.email||"",createdAt:new Date().toISOString()
      },{merge:true});
    }
    renderPrograms();renderExercises();
    toast("Konto wczytane ("+exercises.length+" ćw.)","ok");
    clearErr();
  }catch(e){
    console.error(e);
    var hint = (typeof firestoreOfflineHint==="function") ? firestoreOfflineHint(e) : (e.message||"");
    showErr(hint);
    toast("Błąd odczytu konta","err");
  }
}

function setProgramFormMode(isEdit){
  var title=document.querySelector("#formProgram h3");
  var btn=document.getElementById("btnSaveProg");
  if(title) title.textContent = isEdit ? "Edytuj program" : "Nowy program";
  if(btn) btn.textContent = isEdit ? "Zapisz zmiany" : "Zapisz program";
}

function openProgramForm(){
  if(!requireAuth())return;
  editingProgramId=null;
  draftProgramExercises=[];
  setProgramFormMode(false);
  document.getElementById("progName").value="";
  document.getElementById("progDesc").value="";
  hideExercisePicker();
  renderDraftProgramExercises();
  document.getElementById("formProgram").classList.add("show");
  document.getElementById("progName").focus();
}

function closeProgramForm(){
  document.getElementById("formProgram").classList.remove("show");
  editingProgramId=null;
  draftProgramExercises=[];
  setProgramFormMode(false);
  document.getElementById("progName").value="";
  document.getElementById("progDesc").value="";
  hideExercisePicker();
  renderDraftProgramExercises();
}

function editProgram(id){
  if(!requireAuth())return;
  var p=programs.find(function(x){return x.id===id;});
  if(!p){toast("Nie znaleziono programu","err");return;}
  editingProgramId=id;
  setProgramFormMode(true);
  document.getElementById("progName").value=p.name||"";
  document.getElementById("progDesc").value=p.description||"";
  draftProgramExercises=(p.exercises||[]).map(function(x){
    return {
      id:x.id,
      name:x.name,
      muscles:x.muscles||[],
      sets:x.sets!=null?x.sets:3,
      reps:x.reps!=null?x.reps:"8-12"
    };
  });
  hideExercisePicker();
  renderDraftProgramExercises();
  document.getElementById("formProgram").classList.add("show");
  document.getElementById("formProgram").scrollIntoView({behavior:"smooth",block:"start"});
}

function showExercisePicker(){
  if(!exercises.length){
    toast("Najpierw dodaj ćwiczenia w zakładce Ćwiczenia","err");
    return;
  }
  document.getElementById("exPickerBox").classList.add("show");
  document.getElementById("pickerSearch").value="";
  document.getElementById("pickerMuscle").value="";
  renderPickerResults();
  document.getElementById("pickerSearch").focus();
}
function hideExercisePicker(){
  var box=document.getElementById("exPickerBox");
  if(box)box.classList.remove("show");
}

function renderPickerResults(){
  var q=(document.getElementById("pickerSearch").value||"").trim().toLowerCase();
  var muscle=document.getElementById("pickerMuscle").value;
  var already={};
  draftProgramExercises.forEach(function(d){already[d.id]=true;});
  var list=exercises.filter(function(ex){
    if(already[ex.id])return false;
    if(q && (ex.name||"").toLowerCase().indexOf(q)===-1)return false;
    if(muscle){
      var m=ex.muscles||[];
      if(m.indexOf(muscle)===-1)return false;
    }
    return true;
  });
  var el=document.getElementById("pickerResults");
  if(!list.length){
    el.innerHTML='<div class="ex-pick-empty">Brak ćwiczeń do dodania</div>';
    return;
  }
  el.innerHTML=list.map(function(ex){
    return '<div class="picker-row"><div class="picker-info"><div class="ex-pick-name">'+escapeHtml(ex.name)+
      '</div><div class="ex-pick-meta">'+escapeHtml((ex.muscles||[]).join(", "))+
      '</div></div><button type="button" class="btn-add-ex" onclick="addExerciseToDraft(\''+ex.id+
      '\')"><i class="fas fa-plus"></i> Dodaj</button></div>';
  }).join("");
}

function addExerciseToDraft(id){
  var ex=exercises.find(function(e){return e.id===id;});
  if(!ex)return;
  if(draftProgramExercises.some(function(d){return d.id===id;})){
    toast("To ćwiczenie już jest w programie","info");
    return;
  }
  draftProgramExercises.push({
    id:ex.id, name:ex.name, muscles:ex.muscles||[], sets:3, reps:"8-12"
  });
  renderDraftProgramExercises();
  renderPickerResults();
  toast("Dodano: "+ex.name,"ok");
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
  if(field==="sets"){
    var n=parseInt(value,10);
    draftProgramExercises[index].sets=isNaN(n)?1:Math.max(1,Math.min(99,n));
  }else if(field==="reps"){
    draftProgramExercises[index].reps=String(value||"").trim()||"8-12";
  }
}

function renderDraftProgramExercises(){
  var el=document.getElementById("draftExList");
  if(!el)return;
  if(!draftProgramExercises.length){
    el.innerHTML='<div class="ex-pick-empty">Brak ćwiczeń w programie.<br>Kliknij „Dodaj ćwiczenie”.</div>';
    return;
  }
  el.innerHTML=draftProgramExercises.map(function(d,i){
    var setsVal=escapeHtml(String(d.sets));
    var repsVal=escapeHtml(String(d.reps));
    var upDis=i===0?" disabled":"";
    var downDis=i===draftProgramExercises.length-1?" disabled":"";
    return '<div class="draft-item">'+
      '<div class="draft-top">'+
        '<span class="draft-num">'+(i+1)+'.</span>'+
        '<div class="draft-name">'+escapeHtml(d.name)+'</div>'+
        '<div class="draft-order">'+
          '<button type="button" title="W górę" onclick="moveDraft('+i+',-1)"'+upDis+'><i class="fas fa-chevron-up"></i></button>'+
          '<button type="button" title="W dół" onclick="moveDraft('+i+',1)"'+downDis+'><i class="fas fa-chevron-down"></i></button>'+
          '<button type="button" class="draft-remove" title="Usuń" onclick="removeFromDraft('+i+')"><i class="fas fa-times"></i></button>'+
        '</div>'+
      '</div>'+
      '<div class="draft-meta">'+escapeHtml((d.muscles||[]).join(", "))+'</div>'+
      '<div class="draft-sets">'+
        '<label>Serie <input type="number" min="1" max="99" value="'+setsVal+'" onchange="updateDraftField('+i+',\'sets\',this.value)" oninput="updateDraftField('+i+',\'sets\',this.value)"></label>'+
        '<label>Powtórzenia <input type="text" value="'+repsVal+'" placeholder="np. 8-12" onchange="updateDraftField('+i+',\'reps\',this.value)" oninput="updateDraftField('+i+',\'reps\',this.value)"></label>'+
      '</div>'+
    '</div>';
  }).join("");
}

async function saveProgram(){
  if(!requireAuth())return;
  var name=document.getElementById("progName").value.trim();
  var desc=document.getElementById("progDesc").value.trim();
  if(!name){toast("Podaj nazwę programu","err");return;}
  if(!draftProgramExercises.length){toast("Dodaj przynajmniej jedno ćwiczenie","err");return;}
  var selected=draftProgramExercises.map(function(d){
    return {id:d.id,name:d.name,muscles:d.muscles||[],sets:d.sets,reps:d.reps};
  });
  var btn=document.getElementById("btnSaveProg");
  if(btn){btn.disabled=true;btn.textContent="Zapisywanie...";}
  var isEdit=!!editingProgramId;
  try{
    if(isEdit){
      var idx=programs.findIndex(function(p){return p.id===editingProgramId;});
      if(idx===-1)throw new Error("Program nie istnieje");
      programs[idx]={
        id:editingProgramId,name:name,description:desc,exercises:selected,
        createdAt:programs[idx].createdAt||new Date().toISOString(),
        updatedAt:new Date().toISOString()
      };
    }else{
      programs.unshift({
        id:String(Date.now()),name:name,description:desc,exercises:selected,
        createdAt:new Date().toISOString()
      });
    }
    await persistAll();
    renderPrograms();
    closeProgramForm();
    toast(isEdit?"Program zaktualizowany ✓":"Program zapisany ✓","ok");
    clearErr();
  }catch(e){
    console.error(e);
    showErr("Program nie zapisany: "+(e.code||"")+" "+(e.message||""));
    toast("Nie zapisano programu","err");
  }
  if(btn){btn.disabled=false;btn.textContent=editingProgramId?"Zapisz zmiany":"Zapisz program";}
}

async function deleteProgram(id){
  if(!requireAuth())return;
  if(!confirm("Usunąć program z konta?"))return;
  if(editingProgramId===id)closeProgramForm();
  var backup=programs.slice();
  programs=programs.filter(function(p){return p.id!==id;});
  try{await persistAll();renderPrograms();toast("Usunięto","info");}
  catch(e){programs=backup;renderPrograms();showErr("Usuwanie nieudane: "+e.message);toast("Błąd","err");}
}

function renderPrograms(){
  var el=document.getElementById("listProgram");
  if(!programs.length){el.innerHTML='<div class="empty">Brak programów na koncie</div>';return;}
  el.innerHTML=programs.map(function(p){
    var list="";
    if(p.exercises&&p.exercises.length){
      list='<ul class="card-ex-list">'+p.exercises.map(function(x){
        var sr="";
        if(x.sets!=null||x.reps!=null){
          sr=" — "+(x.sets!=null?x.sets+"×":"")+(x.reps!=null?x.reps:"");
        }
        return "<li>"+escapeHtml(x.name)+escapeHtml(sr)+"</li>";
      }).join("")+"</ul>";
    }
    return '<div class="card"><div class="card-title">'+escapeHtml(p.name)+
      '</div><div class="card-meta">'+(p.exercises?p.exercises.length:0)+" ćw. · "+formatDate(p.updatedAt||p.createdAt)+
      "</div>"+(p.description?'<div class="card-desc">'+escapeHtml(p.description)+"</div>":"")+list+
      '<div class="card-actions"><button type="button" class="btn-edit" onclick="editProgram(\''+p.id+
      '\')"><i class="fas fa-pen"></i> Edytuj</button><button type="button" class="btn-del" onclick="deleteProgram(\''+p.id+
      '\')">Usuń</button></div></div>';
  }).join("");
}

function setExerciseFormMode(isEdit){
  var title=document.querySelector("#formExercise h3");
  var btn=document.getElementById("btnSaveEx");
  if(title) title.textContent = isEdit ? "Edytuj ćwiczenie" : "Nowe ćwiczenie";
  if(btn) btn.textContent = isEdit ? "Zapisz zmiany" : "Zapisz na konto";
}

function openExerciseForm(){
  if(!requireAuth())return;
  editingExerciseId=null;
  setExerciseFormMode(false);
  closeExerciseFormFieldsOnly();
  document.getElementById("formExercise").classList.add("show");
  document.getElementById("exName").focus();
}

function closeExerciseFormFieldsOnly(){
  document.getElementById("exName").value="";
  document.getElementById("exDesc").value="";
  clearMuscleSelection();
  clearMedia();
}

function closeExerciseForm(){
  document.getElementById("formExercise").classList.remove("show");
  editingExerciseId=null;
  setExerciseFormMode(false);
  closeExerciseFormFieldsOnly();
}

function editExercise(id){
  if(!requireAuth())return;
  var ex=exercises.find(function(e){return e.id===id;});
  if(!ex){toast("Nie znaleziono ćwiczenia","err");return;}
  editingExerciseId=id;
  setExerciseFormMode(true);
  document.getElementById("exName").value=ex.name||"";
  document.getElementById("exDesc").value=ex.description||"";
  clearMuscleSelection();
  (ex.muscles||[]).forEach(function(m){
    var cb=document.querySelector('input[name=muscle][value="'+m.replace(/"/g,"")+'"]');
    if(cb){cb.checked=true;cb.closest(".muscle-item").classList.add("selected");}
  });
  if(ex.media&&ex.media.dataUrl){
    pendingMedia={type:ex.media.type,dataUrl:ex.media.dataUrl,name:ex.media.name||""};
    document.getElementById("mediaContent").innerHTML=ex.media.type==="image"
      ? '<img src="'+ex.media.dataUrl+'">'
      : '<video src="'+ex.media.dataUrl+'" controls>';
    document.getElementById("mediaPreview").classList.add("show");
  }else clearMedia();
  document.getElementById("formExercise").classList.add("show");
  document.getElementById("formExercise").scrollIntoView({behavior:"smooth",block:"start"});
}

function onMediaSelect(ev,type){
  var f=ev.target.files&&ev.target.files[0];if(!f)return;
  if(f.size>MAX_MEDIA_MB*1024*1024){toast("Plik za duży (max "+MAX_MEDIA_MB+" MB)","err");ev.target.value="";return;}
  var r=new FileReader();
  r.onload=function(e){
    pendingMedia={type:type,dataUrl:e.target.result,name:f.name};
    document.getElementById("mediaContent").innerHTML=type==="image"
      ? '<img src="'+e.target.result+'">'
      : '<video src="'+e.target.result+'" controls>';
    document.getElementById("mediaPreview").classList.add("show");
  };
  r.readAsDataURL(f);
}
function clearMedia(){
  pendingMedia=null;
  document.getElementById("mediaPreview").classList.remove("show");
  document.getElementById("mediaContent").innerHTML="";
  document.getElementById("exImage").value="";
  document.getElementById("exVideo").value="";
}

function getSelectedMuscles(){
  return Array.prototype.map.call(document.querySelectorAll("input[name=muscle]:checked"),function(el){return el.value;});
}
function clearMuscleSelection(){
  document.querySelectorAll("input[name=muscle]").forEach(function(cb){
    cb.checked=false;
    cb.closest(".muscle-item").classList.remove("selected");
  });
}
function getFilterMuscles(){
  return Array.prototype.map.call(document.querySelectorAll("input[name=filterMuscle]:checked"),function(el){return el.value;});
}
function toggleFilter(){
  document.querySelector("#panelCwiczenia .filter-box").classList.toggle("collapsed");
}
function clearFilter(){
  document.querySelectorAll("input[name=filterMuscle]").forEach(function(cb){
    cb.checked=false;
    cb.closest(".muscle-item").classList.remove("selected");
  });
  applyFilter();
}
function applyFilter(){
  document.querySelectorAll("#filterMuscles .muscle-item input").forEach(function(cb){
    cb.closest(".muscle-item").classList.toggle("selected",cb.checked);
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

function showProgram(){
  document.getElementById("panelProgram").classList.add("show");
  document.getElementById("panelCwiczenia").classList.remove("show");
  document.getElementById("tabProgram").classList.add("on");
  document.getElementById("tabCwiczenia").classList.remove("on");
}
function showCwiczenia(){
  document.getElementById("panelCwiczenia").classList.add("show");
  document.getElementById("panelProgram").classList.remove("show");
  document.getElementById("tabCwiczenia").classList.add("on");
  document.getElementById("tabProgram").classList.remove("on");
  applyFilter();
}

async function saveExercise(){
  if(!requireAuth())return;
  var name=document.getElementById("exName").value.trim();
  var muscles=getSelectedMuscles();
  var desc=document.getElementById("exDesc").value.trim();
  if(!name){toast("Podaj nazwę","err");return;}
  if(!muscles.length){toast("Wybierz partię mięśniową","err");return;}
  var btn=document.getElementById("btnSaveEx");
  btn.disabled=true;btn.textContent="Zapisywanie...";
  var isEdit=!!editingExerciseId;
  var backup=null;
  try{
    if(isEdit){
      var idx=exercises.findIndex(function(e){return e.id===editingExerciseId;});
      if(idx===-1)throw new Error("Ćwiczenie nie istnieje");
      backup=JSON.parse(JSON.stringify(exercises[idx]));
      var updated={
        id:editingExerciseId,name:name,muscles:muscles,description:desc,
        createdAt:exercises[idx].createdAt||new Date().toISOString(),
        updatedAt:new Date().toISOString()
      };
      if(pendingMedia)updated.media={type:pendingMedia.type,dataUrl:pendingMedia.dataUrl,name:pendingMedia.name};
      exercises[idx]=updated;
      programs=programs.map(function(p){
        if(p.exercises){
          p.exercises=p.exercises.map(function(x){
            if(x.id===editingExerciseId){
              return {id:x.id,name:name,muscles:muscles,sets:x.sets,reps:x.reps};
            }
            return x;
          });
        }
        return p;
      });
    }else{
      var item={id:String(Date.now()),name:name,muscles:muscles,description:desc,createdAt:new Date().toISOString()};
      if(pendingMedia)item.media={type:pendingMedia.type,dataUrl:pendingMedia.dataUrl,name:pendingMedia.name};
      exercises.unshift(item);
    }
    await persistAll();
    renderExercises();renderPrograms();
    closeExerciseForm();
    clearErr();
    toast(isEdit?"Zmiany zapisane ✓":"Ćwiczenie zapisane na koncie ✓","ok");
  }catch(e){
    if(isEdit&&backup){
      var i=exercises.findIndex(function(e){return e.id===editingExerciseId;});
      if(i!==-1)exercises[i]=backup;
    }
    console.error(e);
    var msg="Zapis nieudany. ";
    if(e.code==="permission-denied")msg="Firestore: brak uprawnień.";
    else if(e.message&&e.message.indexOf("offline")!==-1)msg=(typeof firestoreOfflineHint==="function")?firestoreOfflineHint(e):e.message;
    else msg+=(e.code||"")+" "+(e.message||"");
    showErr(msg);
    toast("Nie zapisano","err");
  }
  btn.disabled=false;
  btn.textContent=editingExerciseId?"Zapisz zmiany":"Zapisz na konto";
}

async function deleteExercise(id){
  if(!requireAuth())return;
  if(!confirm("Usunąć ćwiczenie z konta?"))return;
  if(editingExerciseId===id)closeExerciseForm();
  var backupEx=exercises.slice(),backupPr=programs.slice();
  exercises=exercises.filter(function(e){return e.id!==id;});
  programs=programs.map(function(p){
    if(p.exercises)p.exercises=p.exercises.filter(function(x){return x.id!==id;});
    return p;
  });
  draftProgramExercises=draftProgramExercises.filter(function(d){return d.id!==id;});
  try{
    await persistAll();
    renderExercises();renderPrograms();renderDraftProgramExercises();
    toast("Usunięto","info");
  }catch(e){
    exercises=backupEx;programs=backupPr;
    renderExercises();renderPrograms();
    showErr("Usuwanie nieudane: "+e.message);
    toast("Błąd","err");
  }
}

function escapeHtml(s){
  if(!s)return"";
  return String(s).replace(/&/g,"&").replace(/</g,"<").replace(/>/g,">").replace(/"/g,""");
}
function formatDate(iso){
  if(!iso)return"";
  try{return new Date(iso).toLocaleDateString("pl-PL");}catch(e){return"";}
}

function renderExercises(){
  var el=document.getElementById("listExercise");
  var filtered=getFilteredExercises();
  var filters=getFilterMuscles();
  var fc=document.getElementById("filterCount");
  if(fc)fc.textContent=filters.length?("Filtr: "+filtered.length+" / "+exercises.length):(exercises.length?("Na koncie: "+exercises.length):"");
  if(!filtered.length){
    el.innerHTML='<div class="empty">'+(exercises.length?"Brak wyników filtra":"Brak ćwiczeń – utwórz pierwsze")+"</div>";
    return;
  }
  el.innerHTML=filtered.map(function(e){
    var media="";
    if(e.media&&e.media.dataUrl){
      media=e.media.type==="image"
        ? '<div class="card-media"><img src="'+e.media.dataUrl+'"></div>'
        : '<div class="card-media"><video src="'+e.media.dataUrl+'" controls></div>';
    }
    return '<div class="card"><div class="card-title">'+escapeHtml(e.name)+
      '</div><div class="card-meta">'+escapeHtml((e.muscles||[]).join(", "))+" · "+formatDate(e.updatedAt||e.createdAt)+
      "</div>"+media+(e.description?'<div class="card-desc">'+escapeHtml(e.description)+"</div>":"")+
      '<div class="card-actions"><button type="button" class="btn-edit" onclick="editExercise(\''+e.id+
      '\')"><i class="fas fa-pen"></i> Edytuj</button><button type="button" class="btn-del" onclick="deleteExercise(\''+e.id+
      '\')">Usuń</button></div></div>';
  }).join("");
}

if(auth){
  auth.onAuthStateChanged(function(user){
    currentUser=user;
    setAuthUI(user);
    if(user)loadFromAccount();
  });
}else{
  setAuthUI(null);
  showErr("Brak Firebase Auth");
}
