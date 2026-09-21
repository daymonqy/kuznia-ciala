var auth=null,db=null,currentUser=null,programs=[],exercises=[],pendingMedia=null;
var MAX_MEDIA_MB=0.7;
var editingExerciseId=null;
var editingProgramId=null;
var draftProgramExercises=[];

try{auth=firebase.auth();db=firebase.firestore();}catch(e){setTimeout(function(){showErr("Firebase: "+e.message);},0);}

function showErr(msg){var box=document.getElementById("errBox");if(!box)return;box.innerHTML=String(msg).replace(/\n/g,"<br>");box.classList.add("show");}
function clearErr(){var box=document.getElementById("errBox");if(box)box.classList.remove("show");}
function toast(t,type){var el=document.getElementById("toast");if(!el)return;el.textContent=t;el.className="toast "+(type||"info")+" show";setTimeout(function(){el.classList.remove("show");},3500);}

function bindMI(sel){document.querySelectorAll(sel+" .muscle-item input").forEach(function(cb){cb.addEventListener("change",function(){cb.closest(".muscle-item").classList.toggle("selected",cb.checked);});});}
bindMI("#filterMuscles");bindMI("#createMuscles");

function requireAuth(){if(!currentUser){toast("Zaloguj sie w Ty","err");return false;}if(!db){toast("Brak Firestore","err");return false;}return true;}

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
    status.innerHTML='<i class="fas fa-user"></i> Gosc';
    status.classList.remove("on");
    programs=[];exercises=[];
  }
}

async function persistAll(){
  if(typeof firestoreSaveUserData==="function"){
    await firestoreSaveUserData(db,currentUser.uid,{programs:programs,exercises:exercises,updatedAt:new Date().toISOString()});
  }else{
    if(db.enableNetwork)await db.enableNetwork();
    await db.collection("users").doc(currentUser.uid).set({programs:programs,exercises:exercises,updatedAt:new Date().toISOString()},{merge:true});
  }
}

async function loadFromAccount(){
  if(!currentUser||!db)return;
  try{
    toast("Wczytywanie...","info");
    if(db.enableNetwork)await db.enableNetwork();
    var snap=(typeof firestoreGetUserDoc==="function")?await firestoreGetUserDoc(db,currentUser.uid,4):await db.collection("users").doc(currentUser.uid).get({source:"server"});
    if(snap.exists){
      var data=snap.data()||{};
      programs=Array.isArray(data.programs)?data.programs:[];
      exercises=Array.isArray(data.exercises)?data.exercises:[];
    }else{
      programs=[];exercises=[];
      await db.collection("users").doc(currentUser.uid).set({programs:[],exercises:[],email:currentUser.email||"",createdAt:new Date().toISOString()},{merge:true});
    }
    renderPrograms();renderExercises();
    toast("Konto OK ("+exercises.length+" cw.)","ok");
    clearErr();
  }catch(e){
    console.error(e);
    showErr((typeof firestoreOfflineHint==="function")?firestoreOfflineHint(e):(e.message||""));
    toast("Blad odczytu","err");
  }
}

function setProgramFormMode(isEdit){
  var title=document.querySelector("#formProgram h3");
  var btn=document.getElementById("btnSaveProg");
  if(title)title.textContent=isEdit?"Edytuj program":"Nowy program";
  if(btn)btn.textContent=isEdit?"Zapisz zmiany":"Zapisz program";
}

function openProgramForm(){
  if(!requireAuth())return;
  editingProgramId=null;draftProgramExercises=[];setProgramFormMode(false);
  document.getElementById("progName").value="";document.getElementById("progDesc").value="";
  hideExercisePicker();renderDraftProgramExercises();
  document.getElementById("formProgram").classList.add("show");
  document.getElementById("progName").focus();
}
function closeProgramForm(){
  document.getElementById("formProgram").classList.remove("show");
  editingProgramId=null;draftProgramExercises=[];setProgramFormMode(false);
  document.getElementById("progName").value="";document.getElementById("progDesc").value="";
  hideExercisePicker();renderDraftProgramExercises();
}
function editProgram(id){
  if(!requireAuth())return;
  var p=programs.find(function(x){return x.id===id;});
  if(!p){toast("Brak programu","err");return;}
  editingProgramId=id;setProgramFormMode(true);
  document.getElementById("progName").value=p.name||"";
  document.getElementById("progDesc").value=p.description||"";
  draftProgramExercises=(p.exercises||[]).map(function(x){
    return{id:x.id,name:x.name,muscles:x.muscles||[],setRows:normalizeSetRows(x)};
  });
  hideExercisePicker();renderDraftProgramExercises();
  document.getElementById("formProgram").classList.add("show");
  document.getElementById("formProgram").scrollIntoView({behavior:"smooth",block:"start"});
}
function showExercisePicker(){
  if(!exercises.length){toast("Najpierw dodaj cwiczenia","err");return;}
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
    if(q&&(ex.name||"").toLowerCase().indexOf(q)===-1)return false;
    if(muscle&&(ex.muscles||[]).indexOf(muscle)===-1)return false;
    return true;
  });
  var el=document.getElementById("pickerResults");
  if(!list.length){el.innerHTML='<div class="ex-pick-empty">Brak cwiczen</div>';return;}
  el.innerHTML=list.map(function(ex){
    return '<div class="picker-row"><div class="picker-info"><div class="ex-pick-name">'+escapeHtml(ex.name)+'</div><div class="ex-pick-meta">'+escapeHtml((ex.muscles||[]).join(", "))+'</div></div><button type="button" class="btn-add-ex" onclick="addExerciseToDraft(\''+ex.id+'\')"><i class="fas fa-plus"></i> Dodaj</button></div>';
  }).join("");
}

function normalizeSetRows(x){
  if(!x) return defaultSetRows();
  if(Array.isArray(x.setRows) && x.setRows.length){
    return x.setRows.map(function(s){
      if(typeof s==="string" || typeof s==="number"){
        return {kind:"N", weight:"", reps:String(s), previous:""};
      }
      return {
        kind: s.kind || "N",
        weight: s.weight!=null ? String(s.weight) : "",
        reps: s.reps!=null ? String(s.reps) : "8",
        previous: s.previous!=null ? String(s.previous) : ""
      };
    });
  }
  var n = (typeof x.sets==="number" && x.sets>0) ? Math.min(12, x.sets) : 3;
  var r = (x.reps!=null && String(x.reps)) ? String(x.reps) : "8";
  var arr=[];
  for(var i=0;i<n;i++) arr.push({kind:"N", weight:"", reps:r, previous:""});
  return arr;
}

function defaultSetRows(){
  return [
    {kind:"W", weight:"0", reps:"8", previous:""},
    {kind:"N", weight:"", reps:"12", previous:""},
    {kind:"N", weight:"", reps:"12", previous:""},
    {kind:"F", weight:"", reps:"10", previous:""}
  ];
}

function setLabel(s, workIndex){
  if(s.kind==="W") return "W";
  if(s.kind==="F") return "F";
  return String(workIndex);
}
function setLabelClass(s){
  if(s.kind==="W") return "set-lbl set-lbl-w";
  if(s.kind==="F") return "set-lbl set-lbl-f";
  return "set-lbl set-lbl-n";
}

function addExerciseToDraft(id){
  var ex=exercises.find(function(e){return e.id===id;});
  if(!ex)return;
  if(draftProgramExercises.some(function(d){return d.id===id;})){toast("Juz dodane","info");return;}
  draftProgramExercises.push({id:ex.id, name:ex.name, muscles:ex.muscles||[], setRows: defaultSetRows()});
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
  var t=draftProgramExercises[index];
  draftProgramExercises[index]=draftProgramExercises[j];
  draftProgramExercises[j]=t;
  renderDraftProgramExercises();
}
function updateSetField(exIndex, setIndex, field, value){
  var row = draftProgramExercises[exIndex] && draftProgramExercises[exIndex].setRows && draftProgramExercises[exIndex].setRows[setIndex];
  if(!row) return;
  if(field==="weight") row.weight = String(value||"").trim();
  else if(field==="reps") row.reps = String(value||"").trim() || "8";
}
function cycleSetKind(exIndex, setIndex){
  var row = draftProgramExercises[exIndex] && draftProgramExercises[exIndex].setRows && draftProgramExercises[exIndex].setRows[setIndex];
  if(!row) return;
  if(row.kind==="W") row.kind="N";
  else if(row.kind==="N") row.kind="F";
  else row.kind="W";
  renderDraftProgramExercises();
}
function addSetColumn(exIndex){
  if(!draftProgramExercises[exIndex]) return;
  if(!draftProgramExercises[exIndex].setRows) draftProgramExercises[exIndex].setRows=[];
  if(draftProgramExercises[exIndex].setRows.length>=15){toast("Max 15 serii","info");return;}
  var last = draftProgramExercises[exIndex].setRows;
  var prev = last.length ? last[last.length-1] : null;
  last.push({kind:"N", weight: prev ? prev.weight : "", reps: prev ? prev.reps : "12", previous:""});
  renderDraftProgramExercises();
}
function removeSetColumn(exIndex, setIndex){
  if(!draftProgramExercises[exIndex] || !draftProgramExercises[exIndex].setRows) return;
  if(draftProgramExercises[exIndex].setRows.length<=1){toast("Min. 1 seria","info");return;}
  draftProgramExercises[exIndex].setRows.splice(setIndex,1);
  renderDraftProgramExercises();
}

function renderDraftProgramExercises(){
  var el=document.getElementById("draftExList");
  if(!el) return;
  if(!draftProgramExercises.length){
    el.innerHTML='<div class="ex-pick-empty">Brak cwiczen. Kliknij Dodaj cwiczenie.</div>';
    return;
  }
  el.innerHTML = draftProgramExercises.map(function(d,i){
    if(!d.setRows || !d.setRows.length) d.setRows = defaultSetRows();
    var upDis = i===0 ? " disabled" : "";
    var downDis = i===draftProgramExercises.length-1 ? " disabled" : "";
    var workNum = 0;
    var rowsHtml = d.setRows.map(function(s,si){
      if(s.kind!=="W" && s.kind!=="F") workNum++;
      var lbl = setLabel(s, workNum);
      var cls = setLabelClass(s);
      var prevText = s.previous || (s.weight && s.reps ? (s.weight+"kg x "+s.reps) : "\u2014");
      return '<div class="set-line">'+
        '<button type="button" class="'+cls+'" title="Kliknij: W / numer / F" onclick="cycleSetKind('+i+','+si+')">'+lbl+'</button>'+
        '<div class="set-prev">'+escapeHtml(prevText)+'</div>'+
        '<input type="text" class="set-w" inputmode="decimal" placeholder="0" value="'+escapeHtml(String(s.weight||""))+'" onchange="updateSetField('+i+','+si+',\'weight\',this.value)" oninput="updateSetField('+i+','+si+',\'weight\',this.value)">'+
        '<input type="text" class="set-r" inputmode="numeric" placeholder="8" value="'+escapeHtml(String(s.reps||""))+'" onchange="updateSetField('+i+','+si+',\'reps\',this.value)" oninput="updateSetField('+i+','+si+',\'reps\',this.value)">'+
        '<button type="button" class="set-del" title="Usun serie" onclick="removeSetColumn('+i+','+si+')"><i class="fas fa-times"></i></button>'+
      '</div>';
    }).join("");
    return '<div class="draft-item">'+
      '<div class="draft-top">'+
        '<span class="draft-num">'+(i+1)+'.</span>'+
        '<div class="draft-name">'+escapeHtml(d.name)+'</div>'+
        '<div class="draft-order">'+
          '<button type="button" onclick="moveDraft('+i+',-1)"'+upDis+'><i class="fas fa-chevron-up"></i></button>'+
          '<button type="button" onclick="moveDraft('+i+',1)"'+downDis+'><i class="fas fa-chevron-down"></i></button>'+
          '<button type="button" class="draft-remove" onclick="removeFromDraft('+i+')"><i class="fas fa-times"></i></button>'+
        '</div>'+
      '</div>'+
      '<div class="draft-meta">'+escapeHtml((d.muscles||[]).join(", "))+'</div>'+
      '<div class="set-table">'+
        '<div class="set-head"><span>Seria</span><span>Poprzedni</span><span>(+Kg)</span><span>Powt.</span><span></span></div>'+
        rowsHtml+
        '<button type="button" class="btn-add-set-full" onclick="addSetColumn('+i+')"><i class="fas fa-plus"></i> Dodaj serie</button>'+
      '</div>'+
    '</div>';
  }).join("");
}

async function saveProgram(){
  if(!requireAuth())return;
  var name=document.getElementById("progName").value.trim();
  var desc=document.getElementById("progDesc").value.trim();
  if(!name){toast("Podaj nazwe","err");return;}
  if(!draftProgramExercises.length){toast("Dodaj cwiczenie","err");return;}
  var selected=draftProgramExercises.map(function(d){
    var rows=(d.setRows&&d.setRows.length)?d.setRows:defaultSetRows();
    return{id:d.id,name:d.name,muscles:d.muscles||[],setRows:rows,sets:rows.length,reps:rows[0]?rows[0].reps:"8"};
  });
  var btn=document.getElementById("btnSaveProg");
  if(btn){btn.disabled=true;btn.textContent="...";}
  var isEdit=!!editingProgramId;
  try{
    if(isEdit){
      var idx=programs.findIndex(function(p){return p.id===editingProgramId;});
      if(idx===-1)throw new Error("Brak");
      programs[idx]={id:editingProgramId,name:name,description:desc,exercises:selected,createdAt:programs[idx].createdAt||new Date().toISOString(),updatedAt:new Date().toISOString()};
    }else{
      programs.unshift({id:String(Date.now()),name:name,description:desc,exercises:selected,createdAt:new Date().toISOString()});
    }
    await persistAll();
    renderPrograms();
    closeProgramForm();
    toast(isEdit?"Zaktualizowano":"Zapisano","ok");
    clearErr();
  }catch(e){
    console.error(e);
    showErr("Blad: "+(e.message||""));
    toast("Nie zapisano","err");
  }
  if(btn){btn.disabled=false;btn.textContent=editingProgramId?"Zapisz zmiany":"Zapisz program";}
}

async function deleteProgram(id){
  if(!requireAuth())return;
  if(!confirm("Usunac program?"))return;
  if(editingProgramId===id)closeProgramForm();
  var backup=programs.slice();
  programs=programs.filter(function(p){return p.id!==id;});
  try{await persistAll();renderPrograms();toast("Usunieto","info");}
  catch(e){programs=backup;renderPrograms();toast("Blad","err");}
}

function renderPrograms(){
  var el=document.getElementById("listProgram");
  if(!programs.length){el.innerHTML='<div class="empty">Brak programow</div>';return;}
  el.innerHTML=programs.map(function(p){
    var list="";
    if(p.exercises&&p.exercises.length){
      list='<ul class="card-ex-list">'+p.exercises.map(function(x){
        var sr="";
        if(x.setRows&&x.setRows.length){
          var wn=0;
          sr=" - "+x.setRows.map(function(s){
            var lab=s.kind==="W"?"W":(s.kind==="F"?"F":(++wn));
            var w=s.weight?s.weight+"kg x ":"";
            return lab+":"+w+(s.reps||"");
          }).join(", ");
        }else if(x.sets!=null||x.reps!=null){
          sr=" - "+(x.sets!=null?x.sets+"x":"")+(x.reps!=null?x.reps:"");
        }
        return "<li>"+escapeHtml(x.name)+escapeHtml(sr)+"</li>";
      }).join("")+"</ul>";
    }
    return '<div class="card"><div class="card-title">'+escapeHtml(p.name)+'</div><div class="card-meta">'+(p.exercises?p.exercises.length:0)+" cw. - "+formatDate(p.updatedAt||p.createdAt)+'</div>'+(p.description?'<div class="card-desc">'+escapeHtml(p.description)+'</div>':'')+list+'<div class="card-actions"><button type="button" class="btn-edit" onclick="editProgram(\''+p.id+'\')"><i class="fas fa-pen"></i> Edytuj</button><button type="button" class="btn-del" onclick="deleteProgram(\''+p.id+'\')">Usun</button></div></div>';
  }).join("");
}

function setExerciseFormMode(isEdit){
  var title=document.querySelector("#formExercise h3");
  var btn=document.getElementById("btnSaveEx");
  if(title)title.textContent=isEdit?"Edytuj cwiczenie":"Nowe cwiczenie";
  if(btn)btn.textContent=isEdit?"Zapisz zmiany":"Zapisz na konto";
}
function openExerciseForm(){
  if(!requireAuth())return;
  editingExerciseId=null;setExerciseFormMode(false);closeExerciseFormFieldsOnly();
  document.getElementById("formExercise").classList.add("show");
  document.getElementById("exName").focus();
}
function closeExerciseFormFieldsOnly(){
  document.getElementById("exName").value="";
  document.getElementById("exDesc").value="";
  clearMuscleSelection();clearMedia();
}
function closeExerciseForm(){
  document.getElementById("formExercise").classList.remove("show");
  editingExerciseId=null;setExerciseFormMode(false);closeExerciseFormFieldsOnly();
}
function editExercise(id){
  if(!requireAuth())return;
  var ex=exercises.find(function(e){return e.id===id;});
  if(!ex){toast("Brak","err");return;}
  editingExerciseId=id;setExerciseFormMode(true);
  document.getElementById("exName").value=ex.name||"";
  document.getElementById("exDesc").value=ex.description||"";
  clearMuscleSelection();
  (ex.muscles||[]).forEach(function(m){
    var cb=document.querySelector('input[name=muscle][value="'+m.replace(/"/g,"")+'"]');
    if(cb){cb.checked=true;cb.closest(".muscle-item").classList.add("selected");}
  });
  if(ex.media&&ex.media.dataUrl){
    pendingMedia={type:ex.media.type,dataUrl:ex.media.dataUrl,name:ex.media.name||""};
    document.getElementById("mediaContent").innerHTML=ex.media.type==="image"?'<img src="'+ex.media.dataUrl+'">':'<video src="'+ex.media.dataUrl+'" controls>';
    document.getElementById("mediaPreview").classList.add("show");
  }else clearMedia();
  document.getElementById("formExercise").classList.add("show");
  document.getElementById("formExercise").scrollIntoView({behavior:"smooth",block:"start"});
}
function onMediaSelect(ev,type){
  var f=ev.target.files&&ev.target.files[0];if(!f)return;
  if(f.size>MAX_MEDIA_MB*1024*1024){toast("Plik za duzy","err");ev.target.value="";return;}
  var r=new FileReader();
  r.onload=function(e){
    pendingMedia={type:type,dataUrl:e.target.result,name:f.name};
    document.getElementById("mediaContent").innerHTML=type==="image"?'<img src="'+e.target.result+'">':'<video src="'+e.target.result+'" controls>';
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
function getSelectedMuscles(){return Array.prototype.map.call(document.querySelectorAll("input[name=muscle]:checked"),function(el){return el.value;});}
function clearMuscleSelection(){document.querySelectorAll("input[name=muscle]").forEach(function(cb){cb.checked=false;cb.closest(".muscle-item").classList.remove("selected");});}
function getFilterMuscles(){return Array.prototype.map.call(document.querySelectorAll("input[name=filterMuscle]:checked"),function(el){return el.value;});}
function toggleFilter(){document.querySelector("#panelCwiczenia .filter-box").classList.toggle("collapsed");}
function clearFilter(){document.querySelectorAll("input[name=filterMuscle]").forEach(function(cb){cb.checked=false;cb.closest(".muscle-item").classList.remove("selected");});applyFilter();}
function applyFilter(){document.querySelectorAll("#filterMuscles .muscle-item input").forEach(function(cb){cb.closest(".muscle-item").classList.toggle("selected",cb.checked);});renderExercises();}
function getFilteredExercises(){var f=getFilterMuscles();if(!f.length)return exercises;return exercises.filter(function(ex){return(ex.muscles||[]).some(function(m){return f.indexOf(m)!==-1;});});}
function showProgram(){document.getElementById("panelProgram").classList.add("show");document.getElementById("panelCwiczenia").classList.remove("show");document.getElementById("tabProgram").classList.add("on");document.getElementById("tabCwiczenia").classList.remove("on");}
function showCwiczenia(){document.getElementById("panelCwiczenia").classList.add("show");document.getElementById("panelProgram").classList.remove("show");document.getElementById("tabCwiczenia").classList.add("on");document.getElementById("tabProgram").classList.remove("on");applyFilter();}

async function saveExercise(){
  if(!requireAuth())return;
  var name=document.getElementById("exName").value.trim();
  var muscles=getSelectedMuscles();
  var desc=document.getElementById("exDesc").value.trim();
  if(!name){toast("Podaj nazwe","err");return;}
  if(!muscles.length){toast("Wybierz partie","err");return;}
  var btn=document.getElementById("btnSaveEx");btn.disabled=true;btn.textContent="...";
  var isEdit=!!editingExerciseId;var backup=null;
  try{
    if(isEdit){
      var idx=exercises.findIndex(function(e){return e.id===editingExerciseId;});
      if(idx===-1)throw new Error("Brak");
      backup=JSON.parse(JSON.stringify(exercises[idx]));
      var updated={id:editingExerciseId,name:name,muscles:muscles,description:desc,createdAt:exercises[idx].createdAt||new Date().toISOString(),updatedAt:new Date().toISOString()};
      if(pendingMedia)updated.media={type:pendingMedia.type,dataUrl:pendingMedia.dataUrl,name:pendingMedia.name};
      exercises[idx]=updated;
      programs=programs.map(function(p){
        if(p.exercises){
          p.exercises=p.exercises.map(function(x){
            if(x.id===editingExerciseId)return{id:x.id,name:name,muscles:muscles,setRows:x.setRows,sets:x.sets,reps:x.reps};
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
    closeExerciseForm();clearErr();
    toast(isEdit?"Zapisano":"Dodano","ok");
  }catch(e){
    if(isEdit&&backup){
      var i=exercises.findIndex(function(e){return e.id===editingExerciseId;});
      if(i!==-1)exercises[i]=backup;
    }
    console.error(e);
    showErr("Zapis nieudany: "+(e.message||""));
    toast("Blad","err");
  }
  btn.disabled=false;
  btn.textContent=editingExerciseId?"Zapisz zmiany":"Zapisz na konto";
}

async function deleteExercise(id){
  if(!requireAuth())return;
  if(!confirm("Usunac cwiczenie?"))return;
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
    toast("Usunieto","info");
  }catch(e){
    exercises=backupEx;programs=backupPr;
    renderExercises();renderPrograms();
    toast("Blad","err");
  }
}

function escapeHtml(s){
  if(!s)return"";
  var d=document.createElement("div");
  d.textContent=String(s);
  return d.innerHTML;
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
    el.innerHTML='<div class="empty">'+(exercises.length?"Brak wynikow":"Brak cwiczen")+'</div>';
    return;
  }
  el.innerHTML=filtered.map(function(e){
    var media="";
    if(e.media&&e.media.dataUrl){
      media=e.media.type==="image"?'<div class="card-media"><img src="'+e.media.dataUrl+'"></div>':'<div class="card-media"><video src="'+e.media.dataUrl+'" controls></div>';
    }
    return '<div class="card"><div class="card-title">'+escapeHtml(e.name)+'</div><div class="card-meta">'+escapeHtml((e.muscles||[]).join(", "))+" - "+formatDate(e.updatedAt||e.createdAt)+'</div>'+media+(e.description?'<div class="card-desc">'+escapeHtml(e.description)+'</div>':'')+'<div class="card-actions"><button type="button" class="btn-edit" onclick="editExercise(\''+e.id+'\')"><i class="fas fa-pen"></i> Edytuj</button><button type="button" class="btn-del" onclick="deleteExercise(\''+e.id+'\')">Usun</button></div></div>';
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
