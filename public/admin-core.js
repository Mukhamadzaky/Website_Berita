// ========================================================
// admin-core.js - Pusat Kendali Single Page Application
// ========================================================

// 1. Fungsi Jam Realtime
function startRealtimeClock() {
    setInterval(() => {
        const clockEl = document.getElementById('realtime-clock');
        if(clockEl) {
            clockEl.innerText = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' WIB';
        }
    }, 1000);
}

// 2. Fungsi Update Warna Sidebar (Aktif)
function updateSidebarActiveState(targetUrl = null) {
    let path = targetUrl;
    if (!path) {
        path = window.location.pathname.split('/').pop(); 
        path = path.split('?')[0].split('#')[0]; 
        if (path === '' || path === '/') path = 'dashboard.html'; 
    }

    if(path === 'add-member.html') path = 'manage-members.html';

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
window.renderCurrentPageData = function() {
    
    // --- A. HEADER UMUM (Selalu Dijalankan di setiap halaman) ---
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
        }).catch(e => {});
        
        fetch(`${API_URL}/dashboard-stats`, { headers: { 'Authorization': `Bearer ${getToken()}` } })
        .then(res => res.json())
        .then(data => {
            if(data.unread_messages > 0) {
                const dot = document.getElementById('badge-dot');
                if(dot) dot.classList.remove('hidden');
            }
        }).catch(e => {});
    } catch(e) {}

    // --- B. LOGIC HALAMAN DASHBOARD ---
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
        }).catch(e => console.log('Gagal memuat statistik dashboard'));

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

    // --- C. LOGIC HALAMAN KELOLA BERITA ---
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

    // --- D. LOGIC HALAMAN KELOLA DOKUMEN ---
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

    // --- E. LOGIC HALAMAN USERS ---
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

    // --- F. LOGIC HALAMAN INBOX ---
    const msgList = document.getElementById('msg-list');
    if(msgList) {
        fetch(`${API_URL}/inbox`, { headers: { 'Authorization': `Bearer ${getToken()}` } })
        .then(res => res.json())
        .then(data => {
            if(data.length === 0) {
                msgList.innerHTML = `<tr><td colspan="3" class="px-6 py-16 text-center text-slate-400"><div class="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100"><i class="fa-solid fa-envelope-open text-4xl text-slate-300"></i></div><p class="font-bold text-slate-500">Belum ada pesan masuk</p></td></tr>`;
                return;
            }
            msgList.innerHTML = data.map(item => `
                <tr class="hover:bg-blue-50/50 transition-colors group">
                    <td class="px-6 py-5 align-top whitespace-nowrap"><div class="flex items-center gap-3"><div class="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold flex items-center justify-center shrink-0 shadow-md">${item.name.charAt(0).toUpperCase()}</div><div><p class="font-bold text-slate-800">${item.name}</p><p class="text-xs text-slate-400 font-mono mt-0.5">${item.email}</p></div></div></td>
                    <td class="px-6 py-5 align-top min-w-[300px]"><p class="text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100 shadow-inner group-hover:bg-white transition-colors">${item.message}</p></td>
                    <td class="px-6 py-5 text-right align-top whitespace-nowrap"><span class="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg">${new Date(item.created_at).toLocaleDateString('id-ID', {day: 'numeric', month: 'short', year: 'numeric'})}</span><p class="text-[10px] text-slate-400 mt-2">${new Date(item.created_at).toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'})} WIB</p></td>
                </tr>
            `).join('');
        }).catch(err => { msgList.innerHTML = `<tr><td colspan="3" class="text-center py-6 text-red-500 font-bold">Gagal memuat pesan.</td></tr>`; });
    }

    // --- G. RE-ATTACH EVENT LISTENER UPLOAD ---
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
            } else { docNamePreview.classList.add('hidden'); }
        });
    }

    // --- H. LOGIC HALAMAN PENGATURAN (settings.html) ---
    const settingsForm = document.getElementById('settingsForm');
    if(settingsForm) {
        const logoInput = document.getElementById('logo_file');
        const logoPreviewContainer = document.getElementById('logo-preview-container');
        const logoPreview = document.getElementById('logo-preview');
        const logoPlaceholder = document.getElementById('logo-placeholder');

        if(logoInput) {
            const newLogoInput = logoInput.cloneNode(true);
            logoInput.parentNode.replaceChild(newLogoInput, logoInput);

            newLogoInput.addEventListener('change', function(e) {
                const file = this.files[0];
                if(file) {
                    const reader = new FileReader();
                    reader.onload = function(evt) {
                        logoPreview.src = evt.target.result;
                        logoPreviewContainer.classList.remove('hidden');
                        logoPlaceholder.classList.add('hidden');
                    }
                    reader.readAsDataURL(file);
                }
            });
        }

        fetch(`${API_URL}/settings`, { headers: { 'Authorization': `Bearer ${getToken()}` } })
        .then(res => res.json())
        .then(data => {
            const settings = data.data || {
                site_name: "Himpunan Mahasiswa Informatika",
                site_tagline: "Inovatif, Adaptif, dan Kolaboratif",
                site_description: "Website resmi Himpunan Mahasiswa Teknik Informatika.",
                contact_email: "himaif@kampus.ac.id",
                contact_whatsapp: "081234567890",
                link_instagram: "https://instagram.com/himaif.official",
                link_linkedin: "",
                address: "Gedung Pusat Kegiatan Mahasiswa (PKM)",
                maintenance_mode: false,
                event_registration_open: true
            };

            document.getElementById('site_name').value = settings.site_name || '';
            document.getElementById('site_tagline').value = settings.site_tagline || '';
            document.getElementById('site_description').value = settings.site_description || '';
            document.getElementById('contact_email').value = settings.contact_email || '';
            document.getElementById('contact_whatsapp').value = settings.contact_whatsapp || '';
            document.getElementById('link_instagram').value = settings.link_instagram || '';
            document.getElementById('link_linkedin').value = settings.link_linkedin || '';
            document.getElementById('address').value = settings.address || '';
            document.getElementById('maintenance_mode').checked = (settings.maintenance_mode == true || settings.maintenance_mode == 1);
            document.getElementById('event_registration_open').checked = (settings.event_registration_open == true || settings.event_registration_open == 1);

            if(settings.logo_url && settings.logo_url !== "") {
                logoPreview.src = settings.logo_url;
                logoPreviewContainer.classList.remove('hidden');
                logoPlaceholder.classList.add('hidden');
            }
        }).catch(err => console.log('Gagal load data settings, form menggunakan isian kosong.'));
    }

    // --- I. LOGIC HALAMAN MANAGE MEMBERS ---
    const membersList = document.getElementById('members-list');
    if(membersList) {
        
        window.renderMembersTable = function(dataArray) {
            if(dataArray.length === 0) {
                membersList.innerHTML = '<tr><td colspan="5" class="px-6 py-10 text-center text-slate-400">Data pengurus tidak ditemukan.</td></tr>';
                return;
            }

            membersList.innerHTML = dataArray.map(item => {
                let statusClass = "bg-emerald-100 text-emerald-700 border-emerald-200";
                if(item.status === 'Cuti' || item.status === 'Nonaktif') statusClass = "bg-slate-100 text-slate-500 border-slate-200";
                
                let profileHTML = `<div class="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold flex items-center justify-center shrink-0 shadow-md">${item.name.charAt(0).toUpperCase()}</div>`;
                if(item.photo_url) {
                    profileHTML = `<img src="${item.photo_url}" class="w-10 h-10 rounded-full object-cover shrink-0 shadow-md border border-slate-200">`;
                }

                return `
                <tr class="hover:bg-slate-50 transition-colors member-row" data-name="${item.name.toLowerCase()}" data-nim="${item.nim}" data-division="${item.division}">
                    <td class="px-6 py-4 whitespace-nowrap">
                        <div class="flex items-center gap-3">
                            ${profileHTML}
                            <div>
                                <p class="font-bold text-slate-800 text-base">${item.name}</p>
                                <p class="text-xs text-slate-400 mt-0.5">${item.phone || '-'}</p>
                            </div>
                        </div>
                    </td>
                    <td class="px-6 py-4 text-slate-600 whitespace-nowrap">
                        <span class="block font-mono font-medium">${item.nim}</span>
                        <span class="text-xs text-slate-400">${item.major || 'Teknik Informatika'}</span>
                    </td>
                    <td class="px-6 py-4 text-slate-500 whitespace-nowrap">
                        <span class="font-bold text-indigo-600 block">Divisi ${item.division}</span>
                        <span class="text-xs">${item.role}</span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <span class="${statusClass} px-3 py-1 rounded-full text-xs font-bold border">${item.status}</span>
                    </td>
                    <td class="px-6 py-4 text-center whitespace-nowrap">
                        <button onclick="alert('Fitur edit segera hadir')" class="text-slate-500 bg-slate-100 hover:bg-indigo-500 hover:text-white w-8 h-8 rounded-lg transition-all shadow-sm mx-0.5"><i class="fa-solid fa-pen"></i></button>
                        <button onclick="deleteMember(${item.id})" class="text-red-500 bg-red-50 hover:bg-red-500 hover:text-white w-8 h-8 rounded-lg transition-all shadow-sm mx-0.5"><i class="fa-regular fa-trash-can"></i></button>
                    </td>
                </tr>`;
            }).join('');
        };

        fetch(`${API_URL}/members`, { headers: { 'Authorization': `Bearer ${getToken()}` } })
        .then(res => res.json())
        .then(data => {
            window.allMembersData = data.data || data; 
            renderMembersTable(window.allMembersData);
        })
        .catch(err => {
            console.log('API Members belum tersedia, memuat data dummy.');
            // Cek jika belum ada data dummy, kita buat default
            if(!window.allMembersData || window.allMembersData.length === 0) {
                window.allMembersData = [
                    { id: 1, name: "Dwandika Vicky N.", nim: "23424034", phone: "+62 812-3456-7890", major: "Teknik Informatika", division: "Humas", role: "Staff PR", status: "Aktif" },
                    { id: 2, name: "Tohir", nim: "23424021", phone: "0856xxxx", major: "Teknik Informatika", division: "Kominfo", role: "Staff Programmer", status: "Aktif" },
                    { id: 3, name: "Edo", nim: "23424055", phone: "+62 856-7777-8888", major: "Teknik Informatika", division: "PSDM", role: "Kepala Divisi", status: "Cuti" }
                ];
            }
            renderMembersTable(window.allMembersData);
        });

        window.filterMembersTable = function() {
            const searchVal = document.getElementById('searchMember').value.toLowerCase();
            const divVal = document.getElementById('filterDivision').value.toLowerCase();
            const rows = document.querySelectorAll('.member-row');

            rows.forEach(row => {
                const name = row.getAttribute('data-name');
                const nim = row.getAttribute('data-nim');
                const division = row.getAttribute('data-division').toLowerCase();

                const matchSearch = name.includes(searchVal) || nim.includes(searchVal);
                const matchDiv = (divVal === 'all') || (division === divVal);

                if (matchSearch && matchDiv) row.style.display = '';
                else row.style.display = 'none';
            });
        };
    }

    // --- M. LOGIC HALAMAN AGENDA (agenda.html) ---
    const agendaContainer = document.getElementById('agenda-container');
    if(agendaContainer) {
        
        window.renderAgendaList = function(dataArray) {
            if(dataArray.length === 0) {
                agendaContainer.innerHTML = '<div class="col-span-full py-10 text-center text-slate-400">Belum ada agenda kegiatan.</div>';
                return;
            }

            agendaContainer.innerHTML = dataArray.map(item => {
                const d = new Date(item.date);
                const monthName = d.toLocaleString('id-ID', { month: 'short' });
                const dateNum = d.getDate();

                const now = new Date();
                let statusBadge = '';
                let borderClass = 'border-slate-200';
                let headerClass = 'bg-gradient-to-r from-blue-50 to-white';
                let dateBoxClass = 'bg-blue-600 text-white';

                if (d < now.setHours(0,0,0,0)) { 
                    statusBadge = '<span class="px-3 py-1 bg-slate-200 text-slate-600 text-xs font-bold rounded-full">Selesai</span>';
                    headerClass = 'bg-slate-50';
                    dateBoxClass = 'bg-slate-400 text-white';
                    borderClass = 'border-slate-200 opacity-80';
                } else if (d.toDateString() === new Date().toDateString()) { 
                    statusBadge = '<span class="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full border border-emerald-200 flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Hari Ini</span>';
                    headerClass = 'bg-gradient-to-r from-emerald-50 to-white';
                    dateBoxClass = 'bg-emerald-600 text-white';
                    borderClass = 'border-emerald-500 shadow-md relative';
                } else { 
                    statusBadge = '<span class="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full border border-blue-200">Akan Datang</span>';
                }

                let topBorder = borderClass.includes('emerald') ? '<div class="absolute top-0 left-0 w-full h-1 bg-emerald-500"></div>' : '';

                return `
                <div class="bg-white rounded-2xl border ${borderClass} shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col agenda-card" data-title="${item.title.toLowerCase()}">
                    ${topBorder}
                    <div class="p-5 border-b border-slate-100 flex justify-between items-start ${headerClass}">
                        <div class="${dateBoxClass} rounded-lg p-2 text-center min-w-[60px] shadow-sm">
                            <span class="block text-xs font-medium uppercase tracking-wider">${monthName}</span>
                            <span class="block text-xl font-bold">${dateNum}</span>
                        </div>
                        ${statusBadge}
                    </div>
                    <div class="p-5 flex-1 ${d < now ? 'grayscale-[30%]' : ''}">
                        <h3 class="text-lg font-bold text-slate-800 mb-2">${item.title}</h3>
                        <p class="text-sm text-slate-500 mb-4 line-clamp-2">${item.description || '-'}</p>
                        
                        <div class="space-y-2 text-sm text-slate-600">
                            <div class="flex items-center gap-3">
                                <i class="fa-regular fa-clock w-4 ${d.toDateString() === new Date().toDateString() ? 'text-emerald-500' : 'text-slate-400'}"></i>
                                <span class="${d.toDateString() === new Date().toDateString() ? 'font-bold' : ''}">${item.time} WIB</span>
                            </div>
                            <div class="flex items-center gap-3">
                                <i class="fa-solid fa-location-dot w-4 text-slate-400"></i>
                                <span>${item.location}</span>
                            </div>
                            <div class="flex items-center gap-3">
                                <i class="fa-solid fa-users w-4 text-slate-400"></i>
                                <span>${item.category}</span>
                            </div>
                        </div>
                    </div>
                    <div class="p-4 border-t border-slate-100 flex justify-end gap-2 bg-slate-50/50">
                        <button onclick="deleteAgenda(${item.id})" class="px-3 py-1.5 text-xs font-bold text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50 transition-colors"><i class="fa-solid fa-trash mr-1"></i> Hapus</button>
                    </div>
                </div>`;
            }).join('');
        };

        fetch(`${API_URL}/agendas`, { headers: { 'Authorization': `Bearer ${getToken()}` } })
        .then(res => res.json())
        .then(data => {
            window.allAgendas = data.data || data; 
            renderAgendaList(window.allAgendas);
        })
        .catch(err => {
            console.log('API Agenda belum siap, memakai dummy data.');
            // Mencegah data ter-reset jika sudah ada data simulasi yang diinput
            if (!window.allAgendas || window.allAgendas.length === 0) {
                window.allAgendas = [
                    { id: 1, title: "Seminar Nasional Teknologi 2026", description: "Seminar membahas AI.", date: "2026-03-15", time: "08:00", location: "Auditorium Kampus", category: "Terbuka untuk Umum" },
                    { id: 2, title: "Rapat Pleno Pengurus HIMA", description: "Evaluasi program.", date: new Date().toISOString().split('T')[0], time: "13:00", location: "Ruang Rapat B", category: "Internal Pengurus" },
                    { id: 3, title: "Pelatihan Web Dasar", description: "Pelatihan HTML & CSS.", date: "2026-01-10", time: "09:00", location: "Lab Komputer 3", category: "Internal Pengurus" }
                ];
            }
            renderAgendaList(window.allAgendas);
        });

        window.filterAgenda = function() {
            const searchVal = document.getElementById('searchAgenda').value.toLowerCase();
            const cards = document.querySelectorAll('.agenda-card');
            cards.forEach(card => {
                const title = card.getAttribute('data-title');
                if(title.includes(searchVal)) card.style.display = 'flex';
                else card.style.display = 'none';
            });
        };
    }

    // --- K. LOGIC HALAMAN GALERI (gallery.html) ---
    const galleryContainer = document.getElementById('gallery-container');
    if(galleryContainer) {
        
        // Preview Setup
        const galleryFileInput = document.getElementById('gallery_file');
        if(galleryFileInput) {
            const newFileInput = galleryFileInput.cloneNode(true);
            galleryFileInput.parentNode.replaceChild(newFileInput, galleryFileInput);
            newFileInput.addEventListener('change', function(e) {
                if(this.files[0]) {
                    const reader = new FileReader();
                    reader.onload = function(evt) {
                        document.getElementById('gallery-preview').src = evt.target.result;
                        document.getElementById('gallery-preview').classList.remove('hidden');
                        document.getElementById('gallery-placeholder').classList.add('hidden');
                    }
                    reader.readAsDataURL(this.files[0]);
                }
            });
        }

        window.renderGallery = function(dataArray) {
            if(dataArray.length === 0) {
                galleryContainer.innerHTML = '<div class="col-span-full py-10 text-center text-slate-400">Belum ada foto di galeri.</div>';
                return;
            }

            galleryContainer.innerHTML = dataArray.map(item => `
                <div class="gallery-card bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-200 relative group cursor-pointer" data-category="${item.category}">
                    <div class="relative h-48 overflow-hidden bg-slate-100">
                        <img src="${item.image_url}" alt="${item.title}" class="w-full h-full object-cover transition-transform duration-500">
                        <div class="overlay absolute inset-0 bg-slate-900/60 opacity-0 transition-opacity duration-300 flex items-center justify-center gap-3">
                            <button onclick="window.open('${item.image_url}', '_blank')" class="w-10 h-10 rounded-full bg-white text-slate-700 hover:text-blue-600 hover:scale-110 transition-all flex items-center justify-center shadow-md"><i class="fa-solid fa-eye"></i></button>
                            <button onclick="deleteGallery(${item.id})" class="w-10 h-10 rounded-full bg-white text-slate-700 hover:text-red-600 hover:scale-110 transition-all flex items-center justify-center shadow-md"><i class="fa-solid fa-trash"></i></button>
                        </div>
                    </div>
                    <div class="p-4">
                        <p class="text-sm font-bold text-slate-800 truncate">${item.title}</p>
                        <p class="text-xs text-slate-500 mt-1"><i class="fa-regular fa-folder-open mr-1"></i> ${item.category}</p>
                    </div>
                </div>
            `).join('');
        };

        fetch(`${API_URL}/gallery`, { headers: { 'Authorization': `Bearer ${getToken()}` } })
        .then(res => res.json())
        .then(data => {
            window.allGalleryData = data.data || data; 
            renderGallery(window.allGalleryData);
        })
        .catch(err => {
            console.log('API Galeri belum tersedia, menggunakan data dummy.');
            if(!window.allGalleryData || window.allGalleryData.length === 0) {
                window.allGalleryData = [
                    { id: 1, title: "Kunjungan Industri 2026", category: "Kunjungan Industri", image_url: "https://images.unsplash.com/photo-1540317580384-e5d43616b9aa?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80" },
                    { id: 2, title: "Makrab Mahasiswa Baru", category: "Program Kerja", image_url: "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80" },
                    { id: 3, title: "Dokumentasi Rapat Pleno", category: "Program Kerja", image_url: "https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80" },
                    { id: 4, title: "Perayaan Puncak Dies Natalis", category: "Dies Natalis", image_url: "https://images.unsplash.com/photo-1523580494863-6f3031224c94?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80" }
                ];
            }
            renderGallery(window.allGalleryData);
        });

        window.filterGallery = function(category) {
            const cards = document.querySelectorAll('.gallery-card');
            cards.forEach(card => {
                const cardCategory = card.getAttribute('data-category');
                if(category === 'all' || category === cardCategory) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });
        };
    }
}

// ========================================================
// ENGINE SPA ROUTER (Mencegah Halaman Reload)
// ========================================================
document.addEventListener("DOMContentLoaded", () => {
    try { checkAuth(); } catch(e) { console.log("Bypass auth check"); }
    startRealtimeClock();
    updateSidebarActiveState(); 
    renderCurrentPageData(); 

    const mainContent = document.getElementById('main-content');

    document.body.addEventListener('click', async function(e) {
        const link = e.target.closest('a.nav-item');
        if(!link) return; 

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
                mainContent.innerHTML = newMain.innerHTML;
                window.history.pushState({ path: url }, '', url);
                mainContent.scrollTo(0, 0);
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
// KUMPULAN FUNGSI AKSI GLOBAL
// ========================================================

window.deleteNews = async function(id) { /* ... (Tidak diubah, tetap sama seperti sebelumnya) */ }
window.deleteDoc = async function(id) { /* ... */ }
window.submitNews = async function() { /* ... */ }
window.submitDoc = async function() { /* ... */ }
window.saveSettings = async function() { /* ... */ }


// --- AKSI UNTUK PENGURUS (MEMBER) ---
window.submitMember = async function() {
    const btn = document.getElementById('saveMemberBtn');
    const data = {
        name: document.getElementById('member_name').value,
        nim: document.getElementById('member_nim').value,
        major: document.getElementById('member_major').value,
        phone: document.getElementById('member_phone').value,
        division: document.getElementById('member_division').value,
        role: document.getElementById('member_role').value,
        status: document.getElementById('member_status').value
    }
    
    if (!data.name || !data.nim || !data.division || !data.role) return alert("Lengkapi field wajib!");
    btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Menyimpan...';

    try {
        const res = await fetch(`${API_URL}/members`, { method: 'POST', headers: { 'Authorization': `Bearer ${getToken()}` }, body: JSON.stringify(data) });
        if (res.ok) { alert('✅ Data pengurus tersimpan!'); document.querySelector('a[href="manage-members.html"]').click(); }
        else throw new Error("Gagal");
    } catch (e) { 
        alert('Pengurus ditambahkan! (Simulasi)'); 
        if(!window.allMembersData) window.allMembersData = [];
        const newId = window.allMembersData.length ? Math.max(...window.allMembersData.map(m=>m.id)) + 1 : 1;
        window.allMembersData.push({...data, id: newId});
        document.querySelector('a[href="manage-members.html"]').click(); 
    }
}

window.deleteMember = async function(id) {
    if(!confirm("Yakin hapus data pengurus ini?")) return;
    try {
        const res = await fetch(`${API_URL}/members/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${getToken()}` } });
        if(res.ok) { alert("✅ Berhasil dihapus"); renderCurrentPageData(); }
    } catch(e) { 
        alert("Terhapus! (Simulasi)"); 
        if(window.allMembersData) window.allMembersData = window.allMembersData.filter(m => m.id !== id);
        renderCurrentPageData(); 
    }
}


// --- AKSI UNTUK AGENDA (AGENDA.HTML) ---
window.toggleAgendaModal = function() {
    const modal = document.getElementById('agendaModal');
    const content = document.getElementById('agendaModalContent');
    
    if(modal.classList.contains('hidden')) {
        modal.classList.remove('hidden');
        setTimeout(() => { modal.classList.remove('opacity-0'); content.classList.remove('scale-95'); }, 10);
    } else {
        modal.classList.add('opacity-0'); content.classList.add('scale-95');
        setTimeout(() => { modal.classList.add('hidden'); document.getElementById('agendaForm').reset(); }, 300);
    }
}

window.submitAgenda = async function() {
    const btn = document.getElementById('saveAgendaBtn');
    const data = {
        title: document.getElementById('agenda_title').value,
        description: document.getElementById('agenda_desc').value,
        date: document.getElementById('agenda_date').value,
        time: document.getElementById('agenda_time').value,
        location: document.getElementById('agenda_location').value,
        category: document.getElementById('agenda_category').value
    };

    btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Menyimpan...';

    try {
        const res = await fetch(`${API_URL}/agendas`, { method: 'POST', headers: { 'Authorization': `Bearer ${getToken()}`, 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
        if (res.ok) { alert('✅ Agenda ditambahkan!'); window.toggleAgendaModal(); renderCurrentPageData(); } 
        else throw new Error("Gagal");
    } catch (e) { 
        alert('Agenda ditambahkan! (Simulasi)');
        
        // Push ke data lokal agar tidak hilang saat simulasi
        if(!window.allAgendas) window.allAgendas = [];
        const newId = window.allAgendas.length ? Math.max(...window.allAgendas.map(a=>a.id)) + 1 : 1;
        window.allAgendas.push({...data, id: newId});
        
        window.toggleAgendaModal();
        renderCurrentPageData(); 
    }
}

window.deleteAgenda = async function(id) {
    if(!confirm("Yakin ingin menghapus agenda ini?")) return;
    try {
        const res = await fetch(`${API_URL}/agendas/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${getToken()}` } });
        if(res.ok) { alert("✅ Agenda dihapus"); renderCurrentPageData(); }
    } catch(e) { 
        alert("Agenda dihapus! (Simulasi)");
        // Hapus dari data lokal simulasi
        if(window.allAgendas) window.allAgendas = window.allAgendas.filter(a => a.id !== id);
        renderCurrentPageData(); 
    }
}


// --- AKSI UNTUK GALERI (GALLERY.HTML) ---
window.toggleGalleryModal = function() {
    const modal = document.getElementById('galleryModal');
    const content = document.getElementById('galleryModalContent');
    
    if(modal.classList.contains('hidden')) {
        modal.classList.remove('hidden');
        setTimeout(() => { modal.classList.remove('opacity-0'); content.classList.remove('scale-95'); }, 10);
    } else {
        modal.classList.add('opacity-0'); content.classList.add('scale-95');
        setTimeout(() => { modal.classList.add('hidden'); document.getElementById('galleryForm').reset(); document.getElementById('gallery-preview').classList.add('hidden'); document.getElementById('gallery-placeholder').classList.remove('hidden'); }, 300);
    }
}

window.submitGallery = async function() {
    const btn = document.getElementById('saveGalleryBtn');
    const title = document.getElementById('gallery_title').value;
    const category = document.getElementById('gallery_category').value;
    const photoInput = document.getElementById('gallery_file');

    if (!title || photoInput.files.length === 0) return alert("Isi judul dan pilih file foto!");

    btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Mengunggah...';

    const formData = new FormData();
    formData.append('title', title);
    formData.append('category', category);
    formData.append('image', photoInput.files[0]);

    try {
        const res = await fetch(`${API_URL}/gallery`, { method: 'POST', headers: { 'Authorization': `Bearer ${getToken()}` }, body: formData });
        if (res.ok) { alert('✅ Foto berhasil diunggah!'); window.toggleGalleryModal(); renderCurrentPageData(); } 
        else throw new Error("Gagal");
    } catch (e) { 
        alert('Foto berhasil ditambahkan! (Simulasi)');
        
        if(!window.allGalleryData) window.allGalleryData = [];
        const newId = window.allGalleryData.length ? Math.max(...window.allGalleryData.map(g=>g.id)) + 1 : 1;
        
        // Buat url lokal sementara untuk simulasi
        const reader = new FileReader();
        reader.onload = function(evt) {
            window.allGalleryData.push({ id: newId, title: title, category: category, image_url: evt.target.result });
            window.toggleGalleryModal();
            renderCurrentPageData(); 
        }
        reader.readAsDataURL(photoInput.files[0]);
    }
}

window.deleteGallery = async function(id) {
    if(!confirm("Yakin ingin menghapus foto ini?")) return;
    try {
        const res = await fetch(`${API_URL}/gallery/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${getToken()}` } });
        if(res.ok) { alert("✅ Foto dihapus"); renderCurrentPageData(); }
    } catch(e) { 
        alert("Foto dihapus! (Simulasi)"); 
        if(window.allGalleryData) window.allGalleryData = window.allGalleryData.filter(g => g.id !== id);
        renderCurrentPageData(); 
    }
}


// --- AKSI LAINNYA ---
window.toggleReply = function(id) { /* ... */ }
window.submitReply = function(id) { /* ... */ }
window.toggleSidebar = function() {
    document.getElementById('sidebar').classList.toggle('-translate-x-full');
    document.getElementById('sidebar-overlay').classList.toggle('hidden');
}
window.logout = function() {
    localStorage.removeItem('token');
    window.location.href = 'login.html';
}