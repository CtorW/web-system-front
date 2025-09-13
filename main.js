        // ========= STATE AND CONFIGURATION =========
        let currentPortalRole = 'Student';
        let loggedInUser = null;
        let activeView = 'dashboard';
        let users = [];
        let attendanceRecords = [];
        let facultyNotifications = [];
        let editingUserRow = null;
        let clockInterval = null;

        const classSchedule = [
            { id: 1, subject: 'Web Development', time: '09:00 - 10:30', startHour: 9, startMinute: 0, endHour: 10, endMinute: 30 },
            { id: 2, subject: 'Data Structures', time: '11:00 - 12:30', startHour: 11, startMinute: 0, endHour: 12, endMinute: 30 },
            { id: 3, subject: 'Calculus I', time: '14:00 - 15:30', startHour: 14, startMinute: 0, endHour: 15, endMinute: 30 }
        ];

        // ========= ELEMENT REFERENCES =========
        const getEl = (id) => document.getElementById(id);

        // ========= LANDING PAGE FLOW LOGIC =========
        const showRoleSelection = () => { getEl('role-selection-panel').classList.remove('hidden'); getEl('auth-choice-panel').classList.add('hidden'); getEl('auth-forms-panel').classList.add('hidden'); };
        const showAuthChoice = (role) => { currentPortalRole = role || currentPortalRole; getEl('auth-choice-title').innerText = `${currentPortalRole} Portal`; getEl('role-selection-panel').classList.add('hidden'); getEl('auth-choice-panel').classList.remove('hidden'); getEl('auth-forms-panel').classList.add('hidden'); };
        const showAuthForm = (type) => { getEl('auth-choice-panel').classList.add('hidden'); getEl('auth-forms-panel').classList.remove('hidden'); const isLogin = type === 'login'; getEl('login-form').classList.toggle('hidden', !isLogin); getEl('signup-form').classList.toggle('hidden', isLogin); getEl('login-title').innerText = `Log In as ${currentPortalRole}`; getEl('signup-title').innerText = `Sign Up as ${currentPortalRole}`; getEl('login-error').classList.add('hidden'); getEl('signup-error').classList.add('hidden'); };

        // ========= AUTHENTICATION LOGIC =========
        const handleSignUp = (event) => { event.preventDefault(); const name = getEl('signup-name').value; const email = getEl('signup-email').value; const errorDiv = getEl('signup-error'); if (users.find(u => u.email === email && u.role === currentPortalRole)) { errorDiv.innerText = "This email is already registered."; errorDiv.classList.remove('hidden'); return; } const newUser = { id: Date.now(), name, email, role: currentPortalRole }; users.push(newUser); logUserIn(newUser); };
        const handleLogIn = (event) => { event.preventDefault(); const email = getEl('login-email').value; const errorDiv = getEl('login-error'); const user = users.find(u => u.email === email && u.role === currentPortalRole); if (!user) { errorDiv.innerText = "Account not found. Please Sign Up."; errorDiv.classList.remove('hidden'); return; } logUserIn(user); };
        const logUserIn = (user) => { loggedInUser = user; getEl('landing-container').classList.add('hidden'); getEl('app-container').classList.remove('hidden'); renderAppShell(); switchView('dashboard'); getEl('login-form').reset(); getEl('signup-form').reset(); if(user.role === 'Student') startClock(); };
        const handleLogout = () => { loggedInUser = null; clearInterval(clockInterval); getEl('app-container').classList.add('hidden'); getEl('landing-container').classList.remove('hidden'); showRoleSelection(); };

        // ========= CORE APPLICATION RENDERING =========
        const renderAppShell = () => {
            getEl('app-container').innerHTML = 
                `<div class="flex h-full max-w-7xl mx-auto">
                    <nav id="sidebar" class="w-64 bg-[var(--md-sys-color-surface-variant)] rounded-3xl flex flex-col p-4">
                        <div class="flex items-center gap-4 p-2 mb-6">
                            <div class="w-12 h-12 rounded-full flex items-center justify-center bg-[var(--md-sys-color-primary-container)]">
                                <span class="material-symbols-outlined text-4xl text-[var(--md-sys-color-primary)]">account_circle</span>
                            </div>
                            <div>
                                <p class="font-bold text-lg">${loggedInUser.name}</p>
                                <p class="text-sm">Role: ${loggedInUser.role}</p>
                            </div>
                        </div>
                        <ul id="nav-links" class="flex flex-col gap-2 flex-grow"></ul>
                        <button onclick="handleLogout()" class="mt-auto w-full flex items-center justify-center gap-3 py-3 px-4 text-[var(--md-sys-color-primary)] hover:bg-[var(--md-sys-color-primary-container)] rounded-full transition-colors">
                            <span class="material-symbols-outlined">logout</span><span class="font-semibold">Logout</span>
                        </button>
                    </nav>
                    <main id="main-content-area" class="flex-1 p-8 overflow-y-auto"></main>
                </div>`;
            renderNavLinks(); 
        };

        const renderNavLinks = () => { const navConfig = {'Student': [{ id: 'dashboard', icon: 'dashboard', text: 'Dashboard' }], 'Faculty': [{ id: 'dashboard', icon: 'dashboard', text: 'Dashboard' }, { id: 'roster', icon: 'groups', text: 'Class Roster'}, { id: 'usermanagement', icon: 'manage_accounts', text: 'User Management' }]}; const links = navConfig[loggedInUser.role]; getEl('nav-links').innerHTML = links.map(link => `<li><a href="#" onclick="switchView('${link.id}', this)" class="nav-link flex items-center gap-3 p-3 rounded-full text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-primary-container)] transition-colors"><span class="material-symbols-outlined">${link.icon}</span><span class="font-medium">${link.text}</span></a></li>`).join(''); };
        
        // ========= VIEW AND CONTENT SWITCHING =========
        const switchView = (viewId, clickedElement) => {
            activeView = viewId;
            const mainContent = getEl('main-content-area');
            const studentDashboardHTML = `<div class="flex justify-between items-center mb-8"><h1 class="text-4xl font-bold">Today's Schedule</h1><div class="text-xl font-mono p-2 bg-[var(--md-sys-color-surface-variant)] rounded-lg" id="live-clock"></div></div><div class="space-y-4" id="student-schedule-container"></div>`;
            const facultyDashboardHTML = `<h1 class="text-4xl font-bold mb-8">Attendance Dashboard</h1><div id="faculty-stats-container" class="grid grid-cols-1 md:grid-cols-4 gap-6"></div><h2 class="text-2xl font-bold mt-8 mb-4">Notifications</h2><div id="notifications-container" class="space-y-3"></div>`;
            const userManagementHTML = `<h1 class="text-4xl font-bold mb-8">User Management</h1><div class="flex border-b mb-4"><button id="tab-students" onclick="renderUserManagement('Students')" class="tab-button py-2 px-4 border-b-2">Students</button><button id="tab-faculty" onclick="renderUserManagement('Faculty')" class="tab-button py-2 px-4 border-b-2">Faculty</button></div><div id="user-management-content"></div>`;
            const classRosterHTML = `<h1 class="text-4xl font-bold mb-8">Class Roster: Web Development</h1><div class="bg-[var(--md-sys-color-surface-variant)] rounded-2xl p-4 overflow-x-auto"><table class="w-full text-left"><thead><tr class="border-b-2"><th class="p-4">Student Name</th><th class="p-4">Email</th><th class="p-4">Attendance Status</th></tr></thead><tbody id="roster-table-body"></tbody></table></div>`;
            
            const viewMap = { dashboard: loggedInUser.role === 'Student' ? studentDashboardHTML : facultyDashboardHTML, usermanagement: userManagementHTML, roster: classRosterHTML };
            mainContent.innerHTML = `<div class="view-container">${viewMap[viewId]}</div>`;
            
            if (loggedInUser.role === 'Student') { if(viewId === 'dashboard') renderStudentSchedule(); } 
            else { if (viewId === 'dashboard') renderFacultyDashboard(); if (viewId === 'usermanagement') renderUserManagement(); if (viewId === 'roster') renderFacultyRoster(); }

            document.querySelectorAll('.nav-link').forEach(link => { link.classList.remove('active', 'bg-[var(--md-sys-color-primary-container)]');});
            if (clickedElement) clickedElement.classList.add('active', 'bg-[var(--md-sys-color-primary-container)]');
        };

        // ========= ATTENDANCE SYSTEM LOGIC =========
        const startClock = () => { if(clockInterval) clearInterval(clockInterval); clockInterval = setInterval(() => { const clockEl = getEl('live-clock'); if (clockEl) clockEl.innerText = new Date().toLocaleTimeString(); }, 1000); };
        const markAttendance = (subjectId) => {
            const now = new Date(); const subject = classSchedule.find(s => s.id === subjectId); const startTime = new Date(); startTime.setHours(subject.startHour, subject.startMinute, 0); const gracePeriodEndTime = new Date(startTime.getTime() + 15 * 60000); const endTime = new Date(); endTime.setHours(subject.endHour, subject.endMinute, 0);
            let status = '';
            if (now < startTime) { alert("It's too early to check in for this class."); return; }
            if (now >= startTime && now <= gracePeriodEndTime) { status = 'Present'; alert('Success! You have been marked Present.'); }
            if (now > gracePeriodEndTime && now <= endTime) { status = 'Late'; alert("You're late! Your attendance has been marked as Late."); }
            if (now > endTime) { alert("This class has already ended."); return; }
            const record = { studentId: loggedInUser.id, subjectId, status, date: new Date().toDateString() };
            attendanceRecords = attendanceRecords.filter(r => !(r.studentId === loggedInUser.id && r.subjectId === subjectId));
            attendanceRecords.push(record);
            renderStudentSchedule();
        };
        const renderStudentSchedule = () => {
            const container = getEl('student-schedule-container'); if(!container) return; const today = new Date().toDateString();
            container.innerHTML = classSchedule.map(subject => {
                const record = attendanceRecords.find(r => r.studentId === loggedInUser.id && r.subjectId === subject.id && r.date === today);
                let statusHTML = `<button onclick="markAttendance(${subject.id})" class="px-6 py-2 bg-[var(--md-sys-color-primary)] text-white font-semibold rounded-full btn-ripple">[ In ]</button>`;
                if(record){ const color = record.status === 'Present' ? 'bg-green-200 text-green-800' : 'bg-yellow-200 text-yellow-800'; statusHTML = `<span class="px-3 py-1 font-semibold rounded-full ${color}">${record.status}</span>`; }
                return `<div class="p-4 bg-[var(--md-sys-color-surface-variant)] rounded-2xl flex justify-between items-center"><div><p class="font-bold text-lg">${subject.subject}</p><p class="text-sm text-gray-600">${subject.time}</p></div><div>${statusHTML}</div></div>`;
            }).join('');
        };
        const updateAbsences = () => {
             const now = new Date(); const today = new Date().toDateString(); const students = users.filter(u => u.role === 'Student');
             students.forEach(student => {
                 classSchedule.forEach(subject => {
                    const endTime = new Date(); endTime.setHours(subject.endHour, subject.endMinute, 0);
                    if(now > endTime) { 
                        const hasRecord = attendanceRecords.some(r => r.studentId === student.id && r.subjectId === subject.id && r.date === today);
                        if (!hasRecord) { 
                             const alreadyReported = facultyNotifications.some(n => n.reportKey === `${student.id}-${subject.id}`);
                             if (!alreadyReported) {
                                attendanceRecords.push({ studentId: student.id, subjectId: subject.id, status: 'Absent', date: today });
                                facultyNotifications.push({ id: Date.now(), message: `${student.name} was marked Absent for ${subject.subject}.`, reportKey: `${student.id}-${subject.id}` });
                             }
                        }
                    }
                 });
             });
        };
        const renderFacultyDashboard = () => {
             updateAbsences(); const container = getEl('faculty-stats-container'); const notificationsContainer = getEl('notifications-container'); if(!container) return;
             const students = users.filter(u => u.role === 'Student'); const today = new Date().toDateString();
             const presentCount = [...new Set(attendanceRecords.filter(r => r.date === today && r.status === 'Present').map(r=>r.studentId))].length;
             const lateCount = [...new Set(attendanceRecords.filter(r => r.date === today && r.status === 'Late').map(r=>r.studentId))].length;
             const absentCount = [...new Set(attendanceRecords.filter(r => r.date === today && r.status === 'Absent').map(r=>r.studentId))].length;
             container.innerHTML = `<div class="p-4 rounded-xl bg-gray-200"><h4>Total Students</h4><p class="text-3xl font-bold">${students.length}</p></div><div class="p-4 rounded-xl bg-green-100"><h4>Present</h4><p class="text-3xl font-bold">${presentCount}</p></div><div class="p-4 rounded-xl bg-yellow-100"><h4>Late</h4><p class="text-3xl font-bold">${lateCount}</p></div><div class="p-4 rounded-xl bg-red-100"><h4>Absent</h4><p class="text-3xl font-bold">${absentCount}</p></div>`;
             if (facultyNotifications.length > 0) { notificationsContainer.innerHTML = facultyNotifications.map(n => `<div class="p-3 bg-[var(--md-sys-color-error-container)] text-[var(--md-sys-color-on-error-container)] rounded-lg flex items-center gap-2"><span class="material-symbols-outlined">campaign</span> ${n.message}</div>`).join('');
             } else { notificationsContainer.innerHTML = `<p class="text-gray-500 italic">No new notifications.</p>`; }
        };
        const renderFacultyRoster = () => { updateAbsences(); const tbody = getEl('roster-table-body'); if(!tbody) return; const students = users.filter(u => u.role === 'Student'); const today = new Date().toDateString(); tbody.innerHTML = students.map(student => { const record = attendanceRecords.find(r => r.studentId === student.id && r.subjectId === 1 && r.date === today); const status = record ? record.status : 'Upcoming'; const colorMap = { Present: 'text-green-600', Late: 'text-yellow-600', Absent: 'text-red-600', Upcoming: 'text-gray-500' }; return `<tr><td class="p-4">${student.name}</td><td class="p-4">${student.email}</td><td class="p-4 font-bold ${colorMap[status]}">${status}</td></tr>`; }).join(''); };
        const renderUserManagement = (tab = 'Students') => {
            const contentDiv = getEl('user-management-content'); if(!contentDiv) return;
            getEl('tab-students').classList.toggle('active', tab === 'Students'); getEl('tab-faculty').classList.toggle('active', tab === 'Faculty');
            let tableHTML = `<div class="bg-[var(--md-sys-color-surface-variant)] rounded-2xl p-4 overflow-x-auto"><table class="w-full text-left"><thead><tr class="border-b-2"><th class="p-4">Name</th><th class="p-4">Email</th><th class="p-4 text-center">Actions</th></tr></thead><tbody>`;
            if (tab === 'Students') { const students = users.filter(user => user.role === 'Student'); tableHTML += students.map(u => `<tr data-user-id="${u.id}"><td class="p-4">${u.name}</td><td class="p-4">${u.email}</td><td class="p-4 text-center"><button onclick="openUserModal(this)" class="p-2 rounded-full"><span class="material-symbols-outlined">edit</span></button><button onclick="handleDeleteRow(this,'user')" class="p-2 rounded-full"><span class="material-symbols-outlined">delete</span></button></td></tr>`).join('');
            } else { const faculties = users.filter(user => user.role === 'Faculty'); tableHTML += faculties.map(u => `<tr data-user-id="${u.id}"><td class="p-4">${u.name}</td><td class="p-4">${u.email}</td><td class="p-4 text-center text-gray-400 italic">No actions available</td></tr>`).join(''); }
            tableHTML += '</tbody></table></div>';
            contentDiv.innerHTML = tableHTML;
        };
        
        // ========= MODAL & ACTION HANDLERS =========
        const handleDeleteRow = (button) => { const row = button.closest('tr'); row.classList.add('fade-out'); setTimeout(() => { users = users.filter(u => u.id != row.dataset.userId); switchView(activeView, document.querySelector(`.nav-link[onclick*="'${activeView}'"]`)); }, 300); };
        const openUserModal = (button) => { editingUserRow = button ? button.closest('tr') : null; getEl('modal-title').innerText = button ? 'Edit User' : 'Add New User'; if (button) { const user = users.find(u => u.id == editingUserRow.dataset.userId); getEl('modal-name').value = user.name; getEl('modal-email').value = user.email; getEl('modal-role').value = user.role; } else getEl('user-modal').querySelector('form').reset(); getEl('user-modal').classList.add('active'); };
        const closeUserModal = () => getEl('user-modal').classList.remove('active');
        const handleSaveUser = (e) => { e.preventDefault(); const name = getEl('modal-name').value; const email = getEl('modal-email').value; const role = getEl('modal-role').value; if (editingUserRow) { const userIndex = users.findIndex(u => u.id == editingUserRow.dataset.userId); users[userIndex] = { ...users[userIndex], name, email, role }; } else users.push({ id: Date.now(), name, email, role }); switchView('usermanagement', document.querySelector(`.nav-link[onclick*="'usermanagement'"]`)); closeUserModal(); };

        // ========= INITIALIZATION =========
        document.addEventListener('DOMContentLoaded', showRoleSelection);