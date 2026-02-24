// admin-core.js

// Fungsi Jam Realtime
function startRealtimeClock() {
    setInterval(() => {
        const clockEl = document.getElementById('realtime-clock');
        if(clockEl) {
            clockEl.innerText = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' WIB';
        }
    }, 1000);
}

// Fungsi Update Warna Sidebar
function updateSidebarActiveState(targetUrl = null) {
    let path = targetUrl;
    if (!path) {
        path = window.location.pathname.split('/').pop(); 
        path = path.split('?')[0].split('#')[0]; 
        if (path === '' || path === '/') path = 'dashboard.html'; 
    }

    document.querySelectorAll('#sidebar-nav a.nav-item').forEach(item => {
        item.classList.remove('bg-blue-600', 'text-white', 'shadow-lg', 'shadow-blue-900/50');
        item.classList.add('text-slate-400', 'hover:text-white', 'hover:bg-slate-800');
        const icon = item.querySelector('i');
        if(icon) icon.className = icon.className.replace(/group-hover:text-[a-z]+-\d+/g, '');
        
        if (item.getAttribute('href') === path) {
            item.classList.remove('text-slate-400', 'hover:text-white', 'hover:bg-slate-800');
            item.classList.add('bg-blue-600', 'text-white', 'shadow-lg', 'shadow-blue-900/50');
        }
    });
}

// ========================================================
// FUNGSI INTI: RENDER DATA BERDASARKAN HALAMAN SAAT INI
// ========================================================
function renderCurrentPageData() {
    
    // 1. HEADER UMUM (Selalu Dijalankan)
    try {
        fetch(`${API_URL}/profile`, { headers: { 'Authorization': `Bearer ${getToken()}` } })
        .then(res => res.json())
        .then(user => {
            if(user && user.name) {
                const nameEl = document.getElementById('admin-name');
                const avatarEl = document.getElementById('admin-avatar');
                if(nameEl) nameEl.innerText = user.name;
                if(avatarEl) avatarEl.innerText = user.name.charAt(0).toUpperCase();
            }
        }).catch(e => console.log('Error fetch profile'));
        
        fetch(`${API_URL}/dashboard-stats`, { headers: { 'Authorization': `Bearer ${getToken()}` } })
        .then(res => res.json())
        .then(data => {
            if(data.unread_messages > 0) {
                const dot = document.getElementById('badge-dot');
                if(dot) dot.classList.remove('hidden');
            }
        }).catch(e => console.log('Error fetch stats'));
    } catch(e) {}

    // 2. LOGIC HALAMAN DASHBOARD
    if(document.getElementById('stat-news')) {
        fetch(`${API_URL}/dashboard-stats`, { headers: { 'Authorization': `Bearer ${getToken()}` } })
        .then(res => res.json())
        .then(data => {
            document.getElementById('stat-news').innerText = data.total_news || 0;
            document.getElementById('stat-docs').innerText = data.total_docs || 0;
            document.getElementById('stat-msg').innerText = data.total_messages || 0;
            document.getElementById('stat-users').innerText = data.total_users || 0;

            const msgBadge = document.getElementById('msg-badge');
            if(msgBadge && data.unread_messages > 0) {
                msgBadge.classList.remove('hidden');
                msgBadge.innerText = data.unread_messages + " Pesan Baru";
            }
        });

        const chartCanvas = document.getElementById('uploadChart');
        if (chartCanvas) {
            if(window.myDashboardChart) window.myDashboardChart.destroy();
            const ctx = chartCanvas.getContext('2d');
            window.myDashboardChart = new Chart(ctx, {
                type: 'bar',
                data: { labels: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun'], datasets: [{ label: 'Berita', data: [15, 22, 18, 25, 30, 20], backgroundColor: '#2563eb', borderRadius: 6 }, { label: 'Dokumen', data: [5, 12, 8, 15, 10, 18], backgroundColor: '#f97316', borderRadius: 6 }] },
                options: { responsive: true, maintainAspectRatio: false }
            });
        }
    }

    // 3. LOGIC HALAMAN KELOLA BERITA (manage-news.html)
    const newsList = document.getElementById('news-list');
    if(newsList) {
        fetch(`${API_URL}/news`)
        .then(res => res.json())
        .then(data => {
            if(data.length === 0) { newsList.innerHTML = '<tr><td colspan="3" class="px-6 py-8 text-center text-slate-400">Belum ada berita.</td></tr>'; return; }
            newsList.innerHTML = data.map(item => `
                <tr class="hover:bg-slate-50 transition-colors">
                    <td class="px-6 py-4 font-bold text-slate-700">${item.title}</td>
                    <td class="px-6 py-4 text-slate-500">${new Date(item.created_at).toLocaleDateString('id-ID')}</td>
                    <td class="px-6 py-4 text-center">
                        <button onclick="deleteNews(${item.id})" class="text-red-500 bg-red-50 hover:bg-red-500 hover:text-white w-8 h-8 rounded-lg shadow-sm"><i class="fa-regular fa-trash-can"></i></button>
                    </td>
                </tr>
            `).join('');
        });
    }

    // 4. LOGIC HALAMAN KELOLA DOKUMEN (manage-docs.html)
    const docList = document.getElementById('doc-list');
    if(docList) {
        fetch(`${API_URL}/documents`)
        .then(res => res.json())
        .then(data => {
            if(data.length === 0) { docList.innerHTML = '<tr><td colspan="3" class="px-6 py-8 text-center text-slate-400">Belum ada dokumen.</td></tr>'; return; }
            docList.innerHTML = data.map(item => {
                let typeClass = 'bg-slate-100 text-slate-500 border-slate-200';
                const type = (item.file_type || '').toLowerCase();
                if(type.includes('pdf')) typeClass = 'bg-red-50 text-red-600 border-red-200';
                else if(type.includes('doc')) typeClass = 'bg-blue-50 text-blue-600 border-blue-200';
                else if(type.includes('xls')) typeClass = 'bg-green-50 text-green-600 border-green-200';

                return `
                <tr class="hover:bg-slate-50 transition-colors">
                    <td class="px-6 py-4 font-bold text-slate-700">${item.title}</td>
                    <td class="px-6 py-4"><span class="${typeClass} px-2 py-1 rounded text-[10px] font-bold uppercase border">${item.file_type || 'File'}</span></td>
                    <td class="px-6 py-4 text-center">
                        <button onclick="deleteDoc(${item.id})" class="text-red-500 bg-red-50 hover:bg-red-500 hover:text-white w-8 h-8 rounded-lg shadow-sm"><i class="fa-regular fa-trash-can"></i></button>
                    </td>
                </tr>`;
            }).join('');
        });
    }

    // 5. LOGIC HALAMAN USERS (users.html)
    const usersList = document.getElementById('users-list');
    if(usersList) {
        fetch(`${API_URL}/users`, { headers: { 'Authorization': `Bearer ${getToken()}` } })
        .then(res => res.json())
        .then(data => {
            if(data.length === 0) { usersList.innerHTML = '<tr><td colspan="3" class="px-6 py-8 text-center text-slate-400">Belum ada user.</td></tr>'; return; }
            usersList.innerHTML = data.map(item => `
                <tr class="hover:bg-slate-50 transition-colors">
                    <td class="px-6 py-4"><div class="flex items-center gap-3"><div class="w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold flex items-center justify-center">${item.name.charAt(0).toUpperCase()}</div><span class="font-bold text-slate-700">${item.name}</span></div></td>
                    <td class="px-6 py-4 text-slate-500 font-mono text-xs">${item.email}</td>
                    <td class="px-6 py-4 text-center text-slate-500"><span class="bg-slate-100 px-3 py-1 rounded-full text-[11px] font-bold">${new Date(item.created_at).toLocaleDateString('id-ID')}</span></td>
                </tr>
            `).join('');
        });
    }

    // 6. RE-ATTACH EVENT LISTENER (Upload News & Upload Doc)
    const imageInput = document.getElementById('imageFile');
    if(imageInput) {
        const newImageInput = imageInput.cloneNode(true);
        imageInput.parentNode.replaceChild(newImageInput, imageInput);
        newImageInput.addEventListener('change', function(e) {
            if(this.files[0]) {
                const reader = new FileReader();
                reader.onload = function(evt) {
                    document.getElementById('imagePreview').src = evt.target.result;
                    document.getElementById('imagePreviewContainer').classList.remove('hidden');
                    document.getElementById('uploadPlaceholder').classList.add('hidden');
                    document.getElementById('fileName').textContent = this.files[0].name;
                }.bind(this)
                reader.readAsDataURL(this.files[0]);
            }
        });
    }

    const docFile = document.getElementById('docFile');
    if(docFile) {
        const newDocFile = docFile.cloneNode(true);
        docFile.parentNode.replaceChild(newDocFile, docFile);
        newDocFile.addEventListener('change', function(e) {
            const docNamePreview = document.getElementById('docNamePreview');
            if(this.files[0]) {
                docNamePreview.innerHTML = '<i class="fa-solid fa-check-circle mr-1"></i> File siap diupload: ' + this.files[0].name;
                docNamePreview.classList.remove('hidden');
            } else {
                docNamePreview.classList.add('hidden');
            }
        });
    }
}

// ========================================================
// ENGINE SPA ROUTER
// ========================================================
document.addEventListener("DOMContentLoaded", () => {
    try { checkAuth(); } catch(e) { console.log("Bypass auth check"); }
    startRealtimeClock();
    updateSidebarActiveState(); 
    renderCurrentPageData(); // Render data untuk halaman yang pertama kali dibuka

    const mainContent = document.getElementById('main-content');

    // Tangani klik pada menu sidebar
    document.body.addEventListener('click', async function(e) {
        // Cari elemen a.nav-item terdekat dari elemen yang diklik
        const link = e.target.closest('a.nav-item');
        if(!link) return; // Jika yang diklik bukan menu sidebar, abaikan

        const url = link.getAttribute('href');
        if(url === '#' || url.startsWith('http')) return;
        
        e.preventDefault(); 
        updateSidebarActiveState(url);

        try {
            mainContent.style.opacity = '0.4';

            const response = await fetch(url);
            if (!response.ok) throw new Error('Halaman tidak ditemukan');
            const htmlText = await response.text();

            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlText, 'text/html');
            const newMain = doc.querySelector('main');

            if(newMain) {
                // Trik: Ganti isi HTML-nya
                mainContent.innerHTML = newMain.innerHTML;
                window.history.pushState({ path: url }, '', url);
                mainContent.scrollTo(0, 0);
                
                // SUPER PENTING: Panggil ulang fungsi render data!
                renderCurrentPageData(); 
            } else {
                window.location.href = url;
            }

            setTimeout(() => mainContent.style.opacity = '1', 50);
            if(window.innerWidth < 768) toggleSidebar();

        } catch(error) {
            console.error("SPA Error:", error);
            window.location.href = url; 
        }
    });

    window.addEventListener('popstate', () => window.location.reload());
});

// ========================================================
// FUNGSI AKSI GLOBAL (Hapus, Upload, dll)
// ========================================================
window.deleteNews = async function(id) {
    if(!confirm("Yakin hapus berita ini?")) return;
    try {
        const res = await fetch(`${API_URL}/news/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${getToken()}` } });
        if(res.ok) { alert("Berita dihapus"); renderCurrentPageData(); }
    } catch(e) { alert("Error koneksi"); }
}

window.deleteDoc = async function(id) {
    if(!confirm("Yakin hapus dokumen ini?")) return;
    try {
        const res = await fetch(`${API_URL}/documents/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${getToken()}` } });
        if(res.ok) { alert("Dokumen dihapus"); renderCurrentPageData(); }
    } catch(e) { alert("Error koneksi"); }
}

window.logout = function() {
    localStorage.removeItem('token');
    window.location.href = 'login.html';
}

function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('-translate-x-full');
    document.getElementById('sidebar-overlay').classList.toggle('hidden');
}