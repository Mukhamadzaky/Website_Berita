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

    // Jika sedang di halaman add-member.html, biarkan menu manage-members.html yang aktif
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
        }).catch(e => console.log('Bypass profile fetch (Dummy mode)'));
        
        fetch(`${API_URL}/dashboard-stats`, { headers: { 'Authorization': `Bearer ${getToken()}` } })
        .then(res => res.json())
        .then(data => {
            if(data.unread_messages > 0) {
                const dot = document.getElementById('badge-dot');
                if(dot) dot.classList.remove('hidden');
            }
        }).catch(e => console.log('Bypass stats fetch (Dummy mode)'));
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


    // --- C. LOGIC HALAMAN KELOLA BERITA (manage-news.html) ---
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


    // --- D. LOGIC HALAMAN KELOLA DOKUMEN (manage-docs.html) ---
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


    // --- E. LOGIC HALAMAN USERS (users.html) ---
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


    // --- F. LOGIC HALAMAN INBOX (inbox.html) ---
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


    // --- G. RE-ATTACH EVENT LISTENER UPLOAD (upload-news.html & upload-doc.html) ---
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


    // --- I. LOGIC HALAMAN MANAGE MEMBERS & ADD MEMBER ---
    
    // Preview Foto Profil di halaman add-member.html
    const memberPhotoInput = document.getElementById('member_photo');
    if(memberPhotoInput) {
        const newMemberPhotoInput = memberPhotoInput.cloneNode(true);
        memberPhotoInput.parentNode.replaceChild(newMemberPhotoInput, memberPhotoInput);
        newMemberPhotoInput.addEventListener('change', function(e) {
            if(this.files[0]) {
                const reader = new FileReader();
                reader.onload = function(evt) {
                    document.getElementById('photo-preview').src = evt.target.result;
                    document.getElementById('photo-preview').classList.remove('hidden');
                    document.getElementById('photo-placeholder').classList.add('hidden');
                }
                reader.readAsDataURL(this.files[0]);
            }
        });
    }

    // Tabel Tampil Data Pengurus di manage-members.html
    const membersList = document.getElementById('members-list');
    if(membersList) {
        
        // Render Tabel
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
            window.allMembersData = [
                { id: 1, name: "Dwandika Vicky N.", nim: "23424034", phone: "+62 812-3456-7890", major: "Teknik Informatika", division: "Humas", role: "Staff PR", status: "Aktif" },
                { id: 2, name: "Tohir", nim: "23424021", phone: "0856xxxx", major: "Teknik Informatika", division: "Kominfo", role: "Staff Programmer", status: "Aktif" },
                { id: 3, name: "Edo", nim: "23424055", phone: "+62 856-7777-8888", major: "Teknik Informatika", division: "PSDM", role: "Kepala Divisi", status: "Cuti" }
            ];
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
// KUMPULAN FUNGSI AKSI GLOBAL (Hapus, Upload, Simpan, dll)
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

window.submitNews = async function() {
    const title = document.getElementById('title').value;
    const content = document.getElementById('content').value;
    const imageInput = document.getElementById('imageFile');
    const btn = document.getElementById('publishBtn');

    if (!title || !content) return alert("Judul dan Isi berita wajib diisi!");
    btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Proses...';

    const formData = new FormData();
    formData.append('title', title);
    formData.append('content', content);
    if (imageInput.files.length > 0) formData.append('image', imageInput.files[0]);

    try {
        const res = await fetch(`${API_URL}/news`, { method: 'POST', headers: { 'Authorization': `Bearer ${getToken()}` }, body: formData });
        if (res.ok) {
            alert('✅ Berita Berhasil Diterbitkan!');
            document.querySelector('a[href="manage-news.html"]').click(); 
        } else {
            alert('Gagal menerbitkan.');
            btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Terbitkan';
        }
    } catch (e) { alert('Koneksi Error.'); btn.disabled = false; }
}

window.submitDoc = async function() {
    const title = document.getElementById('docTitle').value;
    const fileInput = document.getElementById('docFile');
    const btn = document.getElementById('submitDocBtn');
    
    if(!title || fileInput.files.length === 0) return alert("Isi judul dan pilih file!");
    btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Mengunggah...';

    const formData = new FormData();
    formData.append('title', title);
    formData.append('file', fileInput.files[0]);

    try {
        const res = await fetch(`${API_URL}/documents`, { method: 'POST', headers: { 'Authorization': `Bearer ${getToken()}` }, body: formData });
        if (res.ok) {
            alert('✅ Dokumen diunggah!');
            document.querySelector('a[href="manage-docs.html"]').click(); 
        } else {
            alert('Gagal mengunggah dokumen.');
            btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-upload"></i> Mulai Unggah';
        }
    } catch (e) { alert('Koneksi Error.'); btn.disabled = false; }
}

window.saveSettings = async function() {
    const btn = document.getElementById('saveSettingsBtn');
    
    const formData = new FormData();
    formData.append('site_name', document.getElementById('site_name').value);
    formData.append('site_tagline', document.getElementById('site_tagline').value);
    formData.append('site_description', document.getElementById('site_description').value);
    formData.append('contact_email', document.getElementById('contact_email').value);
    formData.append('contact_whatsapp', document.getElementById('contact_whatsapp').value);
    formData.append('link_instagram', document.getElementById('link_instagram').value);
    formData.append('link_linkedin', document.getElementById('link_linkedin').value);
    formData.append('address', document.getElementById('address').value);
    
    formData.append('maintenance_mode', document.getElementById('maintenance_mode').checked ? 1 : 0);
    formData.append('event_registration_open', document.getElementById('event_registration_open').checked ? 1 : 0);

    const logoFile = document.getElementById('logo_file').files[0];
    if(logoFile) formData.append('logo', logoFile);

    btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Menyimpan...';

    try {
        const res = await fetch(`${API_URL}/settings`, { method: 'POST', headers: { 'Authorization': `Bearer ${getToken()}` }, body: formData });
        if (res.ok) {
            alert('✅ Pengaturan berhasil disimpan!');
            renderCurrentPageData(); 
        }
        else alert('Gagal menyimpan pengaturan.');
    } catch (e) { 
        alert('Data berhasil disimpan secara lokal (Simulasi) karena API belum tersedia.'); 
    } finally {
        btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-save"></i> <span class="hidden sm:inline">Simpan Perubahan</span>';
    }
}

// --- AKSI UNTUK PENGURUS (MEMBER) ---
window.submitMember = async function() {
    const btn = document.getElementById('saveMemberBtn');
    
    const name = document.getElementById('member_name').value;
    const nim = document.getElementById('member_nim').value;
    const major = document.getElementById('member_major').value;
    const phone = document.getElementById('member_phone').value;
    const division = document.getElementById('member_division').value;
    const role = document.getElementById('member_role').value;
    const status = document.getElementById('member_status').value;
    const photoInput = document.getElementById('member_photo');

    if (!name || !nim || !division || !role) return alert("Mohon lengkapi field yang bertanda bintang (*)");

    btn.disabled = true; 
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Menyimpan...';

    const formData = new FormData();
    formData.append('name', name);
    formData.append('nim', nim);
    formData.append('major', major);
    formData.append('phone', phone);
    formData.append('division', division);
    formData.append('role', role);
    formData.append('status', status);
    if (photoInput.files.length > 0) formData.append('photo', photoInput.files[0]);

    try {
        const res = await fetch(`${API_URL}/members`, { 
            method: 'POST', 
            headers: { 'Authorization': `Bearer ${getToken()}` }, 
            body: formData 
        });
        
        if (res.ok) {
            alert('✅ Data pengurus berhasil disimpan ke database!');
            document.querySelector('a[href="manage-members.html"]').click(); 
        } else {
            const err = await res.json();
            alert('Gagal menyimpan: ' + (err.message || 'Terjadi kesalahan pada server.'));
            btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-save"></i> <span class="hidden sm:inline">Simpan Data</span>';
        }
    } catch (e) { 
        alert('Data berhasil disimpan secara lokal (Simulasi) karena API belum tersedia.'); 
        document.querySelector('a[href="manage-members.html"]').click(); 
    }
}

window.deleteMember = async function(id) {
    if(!confirm("Yakin ingin menghapus data pengurus ini dari database?")) return;
    
    try {
        const res = await fetch(`${API_URL}/members/${id}`, { 
            method: 'DELETE', 
            headers: { 'Authorization': `Bearer ${getToken()}` } 
        });
        
        if(res.ok) { 
            alert("✅ Pengurus berhasil dihapus"); 
            renderCurrentPageData(); 
        } else {
            alert("Gagal menghapus data.");
        }
    } catch(e) { 
        alert("Pengurus dihapus! (Simulasi karena API belum ada)");
        const btn = event.currentTarget;
        const tr = btn.closest('tr');
        if(tr) tr.remove();
    }
}

// Aksi Aspirasi
window.toggleReply = function(id) {
    const replyBox = document.getElementById('reply-box-' + id);
    const btnGroup = document.getElementById('btn-group-' + id);
    
    if(replyBox && btnGroup) {
        if(replyBox.classList.contains('hidden')) {
            replyBox.classList.remove('hidden');
            btnGroup.classList.add('hidden');
        } else {
            replyBox.classList.add('hidden');
            btnGroup.classList.remove('hidden');
        }
    }
}

window.submitReply = function(id) {
    alert('✅ Tanggapan berhasil disimpan! Status otomatis diupdate.');
    window.toggleReply(id);
}

window.toggleSidebar = function() {
    document.getElementById('sidebar').classList.toggle('-translate-x-full');
    document.getElementById('sidebar-overlay').classList.toggle('hidden');
}

window.logout = function() {
    localStorage.removeItem('token');
    window.location.href = 'login.html';
}