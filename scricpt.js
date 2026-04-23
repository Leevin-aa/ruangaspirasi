// 1. MOBILE MENU LOGIC
const hamburger = document.getElementById('hamburger');
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('overlay');
const navLinks = document.querySelectorAll('.nav-link');

function toggleSidebar() {
    sidebar.classList.toggle('active');
    overlay.classList.toggle('active');
    const icon = hamburger.querySelector('i');
    icon.classList.toggle('fa-bars');
    icon.classList.toggle('fa-times');
}

hamburger.addEventListener('click', toggleSidebar);
overlay.addEventListener('click', toggleSidebar);

// 2. NAVIGATION CLICK (BIRU TUA)
navLinks.forEach(link => {
    link.addEventListener('click', function() {
        navLinks.forEach(l => l.classList.remove('active'));
        this.classList.add('active');
        
        // Auto-close on mobile
        if (window.innerWidth <= 992) toggleSidebar();
    });
});

// 3. STATS LOGIC (SIAP CONNECT KE DATABASE)
const dummyData = {
    kritik: 45,
    lapor: 50,
    selesai: 33
};

function updateDashboardStats(data) {
    const total = data.kritik + data.lapor + data.selesai;
    const pKritik = Math.round((data.kritik / total) * 100);
    const pLapor = Math.round((data.lapor / total) * 100);
    const pSelesai = 100 - (pKritik + pLapor);

    // Update UI Text
    document.getElementById('totalCount').innerText = total;
    document.getElementById('percKritik').innerText = pKritik;
    document.getElementById('percLapor').innerText = pLapor;
    document.getElementById('percSelesai').innerText = pSelesai;

    // Update Chart Visual
    const chart = document.getElementById('statChart');
    chart.style.background = `conic-gradient(
        #4a90e2 0% ${pKritik}%, 
        #f1c40f ${pKritik}% ${pKritik + pLapor}%, 
        #2ecc71 ${pKritik + pLapor}% 100%
    )`;
}

// Initialize on Load
window.onload = () => updateDashboardStats(dummyData);