// ======================
// GLOBAL VARIABLES
// ======================
let workers = [];
let currentSection = 'home';
let synth = window.speechSynthesis;

// ======================
// LOGIN & APP INIT
// ======================
function login() {
    let name = document.getElementById('username').value;
    if(name.trim() === '') return alert("Enter name");
    document.getElementById('loginPage').style.display = 'none';
    document.getElementById('app').style.display = 'block';
    loadChart();
    loadMap();
}

// ======================
// NAVIGATION
// ======================
function toggleMenu(){
    document.getElementById("sidebar").classList.toggle("active");
}

function showSection(section) {
    document.querySelectorAll('.section').forEach(s => s.classList.add('hidden'));
    document.getElementById(section).classList.remove('hidden');
    currentSection = section;
    if(section==='chatbot') showSuggestions();
}

// ======================
// DASHBOARD AI ANALYSIS
// ======================
function analyze(){
    let earnings = Number(document.getElementById('earnings').value);
    let avg = Number(document.getElementById('avg').value);
    let weather = document.getElementById('weather').value;
    let movement = document.getElementById('movement').value;

    let risk = 0;
    if(weather==='rain') risk+=30;
    if(weather==='pollution') risk+=20;
    if(movement==='idle') risk+=40;
    if(earnings < avg) risk+=10;

    document.getElementById('risk').innerText = risk+'%';
}

// ======================
// CHART.JS SIMULATION
// ======================
function loadChart(){
    const ctx = document.getElementById('chart').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
            datasets:[{
                label:'Weekly Earnings',
                data:[500,600,550,700,650,620,580],
                borderColor:'#22c55e', fill:false
            }]
        }
    });
}

// ======================
// MAP & WORKERS
// ======================
let map;
function loadMap(){
    map = L.map('map').setView([13.0827, 80.2707], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
        attribution:'&copy; OpenStreetMap contributors'
    }).addTo(map);
    renderWorkers();
}

function renderWorkers(){
    if(!map) return;
    map.eachLayer(layer=>{
        if(layer.options && layer.options.pane==='markerPane') map.removeLayer(layer);
    });
    workers.forEach(w=>{
        let color = w.fraud ? 'red':'green';
        L.circle([w.lat,w.lon], {radius:50,color}).addTo(map)
            .bindPopup(`${w.name} | Earnings: ₹${w.earnings} | Premium: ₹${calculateWorkerPremium(w)} | Payout: ₹${calculateWorkerPayout(w)} | ${w.fraud?'Fraud':'Safe'}`);
    });
}

// ======================
// FRAUD DETECTION
// ======================
function detectFraud(){
    workers.forEach(w=>{
        w.fraud = false;
        if(w.weather==='red-alert' && w.movement==='idle') w.fraud=true;
        if(w.earnings > w.avgEarnings*1.5) w.fraud=true;
    });
    updateDashboard();
    renderWorkers();
}

// ======================
// DASHBOARD UPDATES
// ======================
function updateDashboard(){
    let fraudCount = workers.filter(w=>w.fraud).length;
    let totalPayout = workers.filter(w=>!w.fraud)
        .reduce((sum,w)=>sum+calculateWorkerPayout(w),0);
    let trust = workers.length ? Math.round((workers.length-fraudCount)/workers.length*100) : 0;
    document.getElementById('fraud').innerText = fraudCount;
    document.getElementById('payout').innerText = totalPayout;
    document.getElementById('trust').innerText = trust+'%';
}

// ======================
// PREMIUM & PAYOUT CALCULATION
// ======================
function calculatePremium(){
    let base = Number(document.getElementById('baseEarnings').value);
    let sev = Number(document.getElementById('severity').value);

    if(isNaN(base) || base <= 0) { alert("Enter valid Base Earnings"); return; }
    if(isNaN(sev) || sev < 1 || sev > 5) { alert("Severity must be 1-5"); return; }

    let premium = Math.round(base * 0.05 * sev);
    let payoutMultiplier = 0.8; 
    let payout = Math.round(base * (sev/5) * payoutMultiplier);

    document.getElementById('premium').innerText = premium;
    document.getElementById('payoutSim').innerText = payout;
}

// Individual worker calculations
function calculateWorkerPremium(worker){
    return Math.round(worker.earnings * 0.05); // 5% of earnings
}

function calculateWorkerPayout(worker){
    if(worker.fraud) return 0;
    let severityFactor = (worker.weather==='red-alert') ? 1 : 0.5;
    return Math.round(worker.earnings * severityFactor * 0.8);
}

// ======================
// VOICE & CHATBOT
// ======================
function speak(text, lang='en-US'){
    let utter = new SpeechSynthesisUtterance(text);
    utter.lang = lang;
    synth.speak(utter);
}

function startVoice(){
    let recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = 'en-US';
    recognition.start();
    recognition.onresult = e=>{
        document.getElementById('userInput').value = e.results[0][0].transcript;
    };
}

function offlineAI(question){
    let ans="Sorry, I can’t answer right now.";
    question = question.toLowerCase();
    if(question.includes('payout')) ans="You can check payouts in the dashboard.";
    if(question.includes('fraud')) ans="Fraud alerts appear in the alerts section.";
    if(question.includes('premium')) ans="Premium is calculated based on earnings and disruption severity.";
    if(question.includes('market crash')) {
        simulateMarketCrash();
        ans="Market Crash simulation executed!";
    }
    return ans;
}

function chat(){
    let msg = document.getElementById('userInput').value;
    if(msg.trim()==='') return;
    let chatBox = document.getElementById('chat');
    let userP = document.createElement('p'); userP.innerText = 'You: '+msg;
    chatBox.appendChild(userP);

    let lang=document.getElementById('lang').value==='ta'?'ta-IN':'en-US';
    let response = offlineAI(msg);
    let botP = document.createElement('p'); botP.innerText = 'Bot: '+response;
    chatBox.appendChild(botP);
    chatBox.scrollTop = chatBox.scrollHeight;
    speak(response,lang);
    document.getElementById('userInput').value='';
}

// ======================
// CLICKABLE CHATBOT SUGGESTIONS
// ======================
const suggestions = [
    "Check my payout",
    "Show fraud alerts",
    "How to calculate premium?",
    "Run market crash simulation"
];

function showSuggestions() {
    const container = document.getElementById('chatSuggestions');
    container.innerHTML = '';
    suggestions.forEach(text => {
        const btn = document.createElement('button');
        btn.innerText = text;
        btn.style.margin='5px';
        btn.style.padding='5px 10px';
        btn.style.border='none';
        btn.style.borderRadius='5px';
        btn.style.background='#22c55e';
        btn.style.color='white';
        btn.style.cursor='pointer';
        btn.onclick = () => handleSuggestion(text);
        container.appendChild(btn);
    });
}

function handleSuggestion(text){
    document.getElementById('userInput').value = text;
    chat();
}

// ======================
// MARKET CRASH SIMULATION
// ======================
function simulateMarketCrash(){
    workers=[];
    for(let i=1;i<=500;i++){
        let lat = 13.0827 + (Math.random()-0.5)*0.05;
        let lon = 80.2707 + (Math.random()-0.5)*0.05;
        let movement = Math.random()>0.7?'moving':'idle';
        let weather = 'red-alert';
        let earnings = Math.floor(Math.random()*500+300);
        let avgEarnings = earnings + Math.floor(Math.random()*100);
        workers.push({id:i,name:'Worker'+i,lat,lon,movement,weather,earnings,avgEarnings});
    }
    detectFraud();
    updateDashboard();
    renderWorkers();
}