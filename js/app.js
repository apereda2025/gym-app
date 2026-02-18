const supabaseUrl = "https://bhxaxgberlkrwvyywmdw.supabase.co";
const supabaseKey = "sb_publishable__EjKGx5DzWBaMvoZB_QwOQ_7-mAoVBP";
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

let routines = JSON.parse(localStorage.getItem("routines")) || {};
let activeWorkout = null;

/* ===========================
   CREAR RUTINAS (BUILDER)
=========================== */

async function createRoutine(){
    const name = document.getElementById("routineName").value.trim();
    if(!name) return;

    await supabase.from("routines").insert([{ name }]);

    document.getElementById("routineName").value = "";
    loadRoutines();
}

function addExerciseToRoutine(){
    if(!activeWorkout){
        alert("Selecciona una rutina primero");
        return;
    }

    const name = document.getElementById("exerciseName").value.trim();
    const imageInput = document.getElementById("exerciseImage");

    if(!name) return;

    const reader = new FileReader();

    reader.onload = function(){
        routines[activeWorkout].push({
            name,
            image: reader.result || "",
            history: []
        });

        save();
        renderBuilderExercises(activeWorkout);
    }

    if(imageInput.files[0]){
        reader.readAsDataURL(imageInput.files[0]);
    } else {
        reader.onload();
    }

    document.getElementById("exerciseName").value = "";
    imageInput.value = "";
}


function renderBuilderExercises(routine){
    const container = document.getElementById("builderExerciseList");
    if(!container) return;

    container.innerHTML = "";

    routines[routine]?.forEach((ex, index)=>{
        container.innerHTML += `
            <div class="card exercise-card">
                <img src="${ex.image}">
                <div class="exercise-info">
                    <h3>${ex.name}</h3>
                    <button class="secondary-btn"
                        onclick="deleteExercise('${routine}', ${index})">
                        Borrar
                    </button>
                </div>
            </div>
        `;
    });
}
function deleteExercise(routine, index){
    routines[routine].splice(index, 1);
    save();
    renderBuilderExercises(routine);
}
function deleteRoutine(){
    if(!activeWorkout) return;

    const confirmDelete = confirm(
        `¿Seguro que quieres eliminar la rutina "${activeWorkout}"?`
    );

    if(!confirmDelete) return;

    delete routines[activeWorkout];
    activeWorkout = null;

    save();
    renderBuilderRoutineButtons();
    renderRoutineButtons();

    document.getElementById("builderExerciseList").innerHTML = "";
}
/* ===========================
   WORKOUT CON PROGRESO
=========================== */

function startWorkout(routine){
    activeWorkout = routine;

    const pendingList = document.getElementById("pendingList");
    const completedList = document.getElementById("completedList");
    const progressSection = document.getElementById("progressSection");

    pendingList.innerHTML = "";
    completedList.innerHTML = "";

    document.getElementById("pendingSection").classList.remove("hidden");
    document.getElementById("completedSection").classList.remove("hidden");
    progressSection.classList.remove("hidden");

    routines[routine].forEach((ex, index)=>{

        const card = document.createElement("div");
        card.classList.add("exercise-card");

        if(ex._completedSession){

            // 🔹 COMPLETADO (sin inputs)
            card.innerHTML = `
                <img src="${ex.image}">
                <div class="exercise-info">
                    <h3>${ex.name}</h3>
                    <div class="history">
                        Últimos pesos: ${ex.history.slice(-3).join("kg - ")} kg
                    </div>
                    <p style="color: var(--primary); font-weight:600;">
                        ✓ Completado
                    </p>
                </div>
            `;

            completedList.appendChild(card);

        } else {

            // 🔹 PENDIENTE (solo KG)
            card.innerHTML = `
                <img src="${ex.image}">
                <div class="exercise-info">
                    <h3>${ex.name}</h3>
                    <div class="history">
                        Últimos pesos: ${ex.history.slice(-3).join("kg - ")} kg
                    </div>
                    <input type="number" placeholder="Kg" id="kg-${index}">
                    <button class="primary-btn"
                        onclick="completeExercise(${index})">
                        Completar
                    </button>
                </div>
            `;

            pendingList.appendChild(card);
        }
    });

    updateProgress();
}


function completeExercise(index){
    const kgInput = document.getElementById(`kg-${index}`);
    if(!kgInput.value) return;

    const exercise = routines[activeWorkout][index];

    exercise.history.push(kgInput.value);
    exercise._completedSession = true;

    save();
    startWorkout(activeWorkout);
}

function updateProgress(){
    const exercises = routines[activeWorkout];
    const total = exercises.length;
    const completed = exercises.filter(ex => ex._completedSession).length;

    const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

    document.getElementById("progressPercent").textContent = percent + "%";
    document.getElementById("progressFill").style.width = percent + "%";

    if(percent === 100 && total > 0){
        showCelebration();
    }
}

function resetWorkout(){
    routines[activeWorkout].forEach(ex=>{
        ex._completedSession = false;
    });

    save();
    startWorkout(activeWorkout);
}

function showCelebration(){
    document.getElementById("celebration").classList.remove("hidden");
}

function closeCelebration(){
    document.getElementById("celebration").classList.add("hidden");
}


/* ===========================
   UTILIDADES
=========================== */

function updateSelectors(){
    const builderSelect = document.getElementById("builderRoutineSelector");
    const workoutSelect = document.getElementById("workoutRoutineSelector");

    if(builderSelect){
        builderSelect.innerHTML = "";
        Object.keys(routines).forEach(name=>{
            builderSelect.innerHTML += `<option>${name}</option>`;
        });
        builderSelect.onchange = ()=> renderBuilderExercises(builderSelect.value);
        renderBuilderExercises(builderSelect.value);
    }

    if(workoutSelect){
        workoutSelect.innerHTML = "";
        Object.keys(routines).forEach(name=>{
            workoutSelect.innerHTML += `<option>${name}</option>`;
        });
        workoutSelect.onchange = ()=> loadWorkout(workoutSelect.value);
        loadWorkout(workoutSelect.value);
    }
}

function save(){
    localStorage.setItem("routines", JSON.stringify(routines));
}



/* ===========================
   BOTONES BONITOS DE RUTINAS
=========================== */

function renderRoutineButtons(){
    const container = document.getElementById("routineButtons");
    if(!container) return;

    container.innerHTML = "";

    const names = Object.keys(routines);

    if(names.length === 0){
        container.innerHTML = `
            <p style="opacity:.6">No hay rutinas creadas todavía.</p>
        `;
        return;
    }

    names.forEach(name=>{
        const btn = document.createElement("button");
        btn.classList.add("routine-btn");
        btn.textContent = name;

        btn.onclick = ()=>{
            document.querySelectorAll(".routine-btn")
                .forEach(b=>b.classList.remove("active"));

            btn.classList.add("active");
            startWorkout(name);
        };

        container.appendChild(btn);
    });
}
document.addEventListener("DOMContentLoaded", () => {

    updateSelectors();
    renderRoutineButtons();
    renderBuilderRoutineButtons();

    const today = new Date();
    const options = { weekday: 'long' };

    const todayLabel = document.getElementById("todayLabel");
    if(todayLabel){
        todayLabel.textContent =
            "Hoy · " + today.toLocaleDateString("es-ES", options);
    }
});
function renderBuilderRoutineButtons(){
    const container = document.getElementById("builderRoutineButtons");
    if(!container) return;

    container.innerHTML = "";

    const names = Object.keys(routines);

    if(names.length === 0){
        container.innerHTML = `
            <p style="opacity:.6">No hay rutinas creadas todavía.</p>
        `;
        return;
    }

    names.forEach(name=>{
        const btn = document.createElement("button");
        btn.classList.add("routine-btn");
        btn.textContent = name;

        btn.onclick = ()=>{
            document.querySelectorAll("#builderRoutineButtons .routine-btn")
                .forEach(b=>b.classList.remove("active"));

            btn.classList.add("active");
            activeWorkout = name;
            renderBuilderExercises(name);
        };

        container.appendChild(btn);
    });
}
async function loadRoutines(){
    const { data } = await supabase
        .from("routines")
        .select("*")
        .order("created_at");

    renderRoutineButtonsFromDB(data);
    renderBuilderRoutineButtonsFromDB(data);
}