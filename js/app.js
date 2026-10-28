/**
 * Athena Central Digital Library - Core Application Controller
 * Handles routing, view rendering, search/filters, auth, admin CRUD, borrow/return workflows, and fine calculation.
 */

// Global State
let currentTab = "home";
let currentAdminTab = "books";
let currentStudentTab = "borrows";
let catalogSearchTerm = "";
let selectedCategory = "All";
let showOnlyAvailable = false;
let currentSort = "title-asc";

// Materials Filters
let matDeptFilter = "All";
let matYearFilter = "All";
let matSemFilter = "All";
let matCatFilter = "All";
let matSearchTerm = "";

// Initialize App
document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  setupEventListeners();
  handleRoute();
  window.addEventListener("hashchange", handleRoute);
  updateAuthUI();
});

/* ===================================================================
   Routing & Views
   =================================================================== */
function handleRoute() {
  const hash = window.location.hash.slice(1) || "home";
  const parts = hash.split("/");
  const route = parts[0];
  const param = parts[1];

  currentTab = route;

  // Hide all sections
  document.querySelectorAll(".view-section").forEach(sec => {
    sec.style.display = "none";
  });

  // Highlight Nav Link
  document.querySelectorAll(".nav-link").forEach(link => {
    link.classList.remove("active");
    if (link.getAttribute("href") === `#${route}`) {
      link.classList.add("active");
    }
  });

  // Render Target View
  const targetSection = document.getElementById(`view-${route}`);
  if (targetSection) {
    targetSection.style.display = "block";
    window.scrollTo({ top: 0, behavior: "smooth" });
  } else {
    document.getElementById("view-home").style.display = "block";
    currentTab = "home";
  }

  // View specific render hooks
  if (route === "home") {
    renderHomeView();
  } else if (route === "catalog") {
    renderCatalogView();
  } else if (route === "materials") {
    renderMaterialsView();
  } else if (route === "student") {
    renderStudentPortal();
  } else if (route === "admin") {
    renderAdminPortal();
  } else if (route === "contact") {
    // contact static
  }

  // Handle direct book detail if param provided
  if (route === "book" && param) {
    openBookDetailModal(param);
  }
}

function navigateTo(route) {
  if (window.location.hash === `#${route}`) {
    handleRoute();
  } else {
    window.location.hash = `#${route}`;
  }
}

/* ===================================================================
   Theme Engine (Dark / Light)
   =================================================================== */
function initTheme() {
  const saved = localStorage.getItem("athena_theme") || "dark";
  document.documentElement.setAttribute("data-theme", saved);
  updateThemeIcon(saved);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute("data-theme") || "dark";
  const next = current === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", next);
  localStorage.setItem("athena_theme", next);
  updateThemeIcon(next);
}

function updateThemeIcon(theme) {
  const btn = document.getElementById("themeToggleBtn");
  if (btn) {
    btn.innerHTML = theme === "dark" 
      ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`
      : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
  }
}

/* ===================================================================
   Authentication & Session Handling
   =================================================================== */
function updateAuthUI() {
  const user = window.libraryStorage.getCurrentUser();
  const authContainer = document.getElementById("navAuthArea");
  const demoBannerUser = document.getElementById("demoBannerUser");

  if (!authContainer) return;

  if (user) {
    const isAdm = user.role === "admin";
    const avatarLetter = (user.name || "U")[0].toUpperCase();

    authContainer.innerHTML = `
      <div class="user-chip" onclick="openUserProfileModal()">
        <div class="user-avatar ${isAdm ? 'admin' : ''}">${avatarLetter}</div>
        <span>${escapeHtml(user.name.split(" ")[0])}</span>
        <span class="role-badge ${isAdm ? 'admin' : 'student'}">${user.role}</span>
      </div>
      <button class="btn btn-sm btn-secondary" onclick="handleLogout()" title="Logout">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
      </button>
    `;

    if (demoBannerUser) {
      demoBannerUser.innerHTML = `Active Session: <strong>${escapeHtml(user.name)}</strong> (${user.role.toUpperCase()}) | <a href="javascript:void(0)" onclick="handleLogout()" style="text-decoration:underline;">Switch Account</a>`;
    }
  } else {
    authContainer.innerHTML = `
      <button class="btn btn-sm btn-secondary" onclick="openAuthModal('student-login')">Login</button>
      <button class="btn btn-sm btn-primary" onclick="openAuthModal('student-register')">Register</button>
    `;
    if (demoBannerUser) {
      demoBannerUser.innerHTML = `Guest Mode. Click Quick Switch:`;
    }
  }
}

function handleLogout() {
  window.libraryStorage.logout();
  updateAuthUI();
  showToast("Logged out successfully.", "info");
  navigateTo("home");
}

function quickLoginAs(role, idOrEmail) {
  closeModal();
  if (role === "admin") {
    const adm = window.libraryStorage.authenticate("admin@library.edu", "admin", "admin");
    if (adm) {
      window.libraryStorage.setCurrentUser(adm);
      updateAuthUI();
      showToast("Logged in as Chief Librarian Admin!", "success");
      navigateTo("admin");
      renderAdminPortal();
    }
  } else {
    const students = window.libraryStorage.getStudents();
    const target = idOrEmail ? students.find(s => s.rollNo === idOrEmail || s.id === idOrEmail) : students[0];
    if (target) {
      window.libraryStorage.setCurrentUser(target);
      updateAuthUI();
      showToast(`Logged in as Student ${target.name} (${target.rollNo})`, "success");
      navigateTo("student");
      renderStudentPortal();
    }
  }
}

/* ===================================================================
   Home View Rendering
   =================================================================== */
function renderHomeView() {
  const books = window.libraryStorage.getBooks();
  const materials = window.libraryStorage.getMaterials();
  const borrows = window.libraryStorage.getProcessedBorrows();
  const students = window.libraryStorage.getStudents();

  // Update Stats
  const statBooks = document.getElementById("statTotalBooks");
  if (statBooks) statBooks.textContent = books.length;

  const statBorrows = document.getElementById("statActiveBorrows");
  if (statBorrows) statBorrows.textContent = borrows.filter(b => b.status === "Active" || b.status === "Overdue").length;

  const statMaterials = document.getElementById("statMaterials");
  if (statMaterials) statMaterials.textContent = materials.length;

  const statStudents = document.getElementById("statStudents");
  if (statStudents) statStudents.textContent = students.length;

  // Mini showcase list in hero
  const heroList = document.getElementById("heroBookShowcase");
  if (heroList) {
    const featured = books.slice(0, 3);
    heroList.innerHTML = featured.map(b => `
      <div class="mini-book-item" onclick="openBookDetailModal('${b.id}')" style="cursor:pointer;">
        <img class="mini-book-thumb" src="${escapeHtml(b.coverUrl)}" alt="${escapeHtml(b.title)}" onerror="this.src='https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80'">
        <div class="mini-book-info">
          <div class="mini-book-title">${escapeHtml(b.title)}</div>
          <div class="mini-book-author">By ${escapeHtml(b.author)} • <em>${b.availableCopies} available</em></div>
        </div>
        <span class="status-pill ${b.availableCopies > 0 ? 'active' : 'overdue'}">
          ${b.availableCopies > 0 ? 'In Stock' : 'Issued'}
        </span>
      </div>
    `).join("");
  }

  // Home Featured Grid
  const homeGrid = document.getElementById("homeFeaturedGrid");
  if (homeGrid) {
    const popular = books.slice(0, 4);
    homeGrid.innerHTML = popular.map(b => renderBookCardHTML(b)).join("");
  }
}

/* ===================================================================
   Book Catalog View & Search Engine
   =================================================================== */
function renderCatalogView() {
  const books = window.libraryStorage.getBooks();

  // Filter by search query
  let filtered = books.filter(b => {
    const q = catalogSearchTerm.toLowerCase().trim();
    if (!q) return true;
    return (
      b.title.toLowerCase().includes(q) ||
      b.author.toLowerCase().includes(q) ||
      b.isbn.toLowerCase().includes(q) ||
      b.category.toLowerCase().includes(q) ||
      (b.department && b.department.toLowerCase().includes(q))
    );
  });

  // Filter by Category Chip
  if (selectedCategory !== "All") {
    filtered = filtered.filter(b => b.category === selectedCategory || b.department === selectedCategory);
  }

  // Filter by Availability
  if (showOnlyAvailable) {
    filtered = filtered.filter(b => b.availableCopies > 0);
  }

  // Sort
  if (currentSort === "title-asc") {
    filtered.sort((a, b) => a.title.localeCompare(b.title));
  } else if (currentSort === "title-desc") {
    filtered.sort((a, b) => b.title.localeCompare(a.title));
  } else if (currentSort === "year-desc") {
    filtered.sort((a, b) => (b.year || 0) - (a.year || 0));
  } else if (currentSort === "copies-desc") {
    filtered.sort((a, b) => b.availableCopies - a.availableCopies);
  }

  const grid = document.getElementById("catalogBooksGrid");
  const countEl = document.getElementById("catalogResultsCount");

  if (countEl) {
    countEl.textContent = `Showing ${filtered.length} of ${books.length} titles`;
  }

  if (grid) {
    if (filtered.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 1rem; color: var(--text-muted);">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin-bottom:1rem; opacity:0.6;"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <h3>No matching books found</h3>
          <p>Try refining your search keyword or clearing the active category filters.</p>
          <button class="btn btn-secondary btn-sm" style="margin-top:1rem;" onclick="resetCatalogFilters()">Reset All Filters</button>
        </div>
      `;
    } else {
      grid.innerHTML = filtered.map(b => renderBookCardHTML(b)).join("");
    }
  }
}

function renderBookCardHTML(book) {
  const isAvailable = book.availableCopies > 0;
  return `
    <div class="book-card" id="book-card-${book.id}">
      <div class="book-cover-wrap" onclick="openBookDetailModal('${book.id}')" style="cursor:pointer;">
        <img class="book-cover-img" src="${escapeHtml(book.coverUrl)}" alt="${escapeHtml(book.title)}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80'">
        <span class="stock-tag ${isAvailable ? 'in-stock' : 'out-stock'}">
          ${isAvailable ? `${book.availableCopies} in stock` : 'Checked Out'}
        </span>
        <span class="dept-tag">${escapeHtml(book.department || 'GEN')}</span>
      </div>

      <div class="book-content">
        <div class="book-category">${escapeHtml(book.category)}</div>
        <h3 class="book-card-title" title="${escapeHtml(book.title)}" onclick="openBookDetailModal('${book.id}')" style="cursor:pointer;">
          ${escapeHtml(book.title)}
        </h3>
        <p class="book-card-author">by ${escapeHtml(book.author)} (${book.year || 'N/A'})</p>

        <div class="book-meta-footer">
          <div class="book-location">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            <span>${escapeHtml(book.shelf || 'Main Library')}</span>
          </div>
          <span style="font-size:0.8rem; font-weight:700; color:var(--accent-gold);">★ ${book.rating || '4.8'}</span>
        </div>

        <div class="book-actions-row">
          <button class="btn btn-sm btn-secondary" style="flex:1;" onclick="openBookDetailModal('${book.id}')">
            Details
          </button>
          <button class="btn btn-sm ${isAvailable ? 'btn-primary' : 'btn-secondary'}" style="flex:1;" ${isAvailable ? '' : 'disabled'} onclick="handleUserDirectBorrow('${book.id}')">
            ${isAvailable ? 'Borrow' : 'Waitlist'}
          </button>
        </div>
      </div>
    </div>
  `;
}

function resetCatalogFilters() {
  catalogSearchTerm = "";
  selectedCategory = "All";
  showOnlyAvailable = false;
  currentSort = "title-asc";

  const searchInput = document.getElementById("catalogSearchInput");
  if (searchInput) searchInput.value = "";

  const availCheck = document.getElementById("catalogAvailCheck");
  if (availCheck) availCheck.checked = false;

  const sortSelect = document.getElementById("catalogSortSelect");
  if (sortSelect) sortSelect.value = "title-asc";

  document.querySelectorAll(".chip").forEach(c => {
    c.classList.remove("active");
    if (c.getAttribute("data-cat") === "All") c.classList.add("active");
  });

  renderCatalogView();
}

/* ===================================================================
   Book Details Modal
   =================================================================== */
function openBookDetailModal(bookId) {
  const book = window.libraryStorage.getBookById(bookId);
  if (!book) {
    showToast("Book not found!", "error");
    return;
  }

  const user = window.libraryStorage.getCurrentUser();
  const isAvailable = book.availableCopies > 0;

  const content = `
    <div style="display:grid; grid-template-columns: 200px 1fr; gap: 1.75rem; align-items: start;">
      <div>
        <img src="${escapeHtml(book.coverUrl)}" alt="${escapeHtml(book.title)}" style="width:100%; border-radius:12px; box-shadow:var(--shadow-xl); object-fit:cover; max-height:280px;" onerror="this.src='https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80'">
        <div style="margin-top:1rem; text-align:center;">
          <span class="status-pill ${isAvailable ? 'active' : 'overdue'}" style="font-size:0.85rem; padding:0.35rem 0.85rem;">
            ${isAvailable ? `In Stock (${book.availableCopies} / ${book.totalCopies} copies)` : 'Currently Checked Out'}
          </span>
        </div>
      </div>

      <div>
        <div class="book-category" style="margin-bottom:0.4rem;">${escapeHtml(book.category)} • Dept: ${escapeHtml(book.department || 'General')}</div>
        <h2 style="font-size:1.6rem; margin-bottom:0.5rem; line-height:1.25;">${escapeHtml(book.title)}</h2>
        <p style="color:var(--text-muted); font-size:0.95rem; margin-bottom:1rem;">Author: <strong>${escapeHtml(book.author)}</strong> | Year: ${book.year || 'N/A'}</p>

        <div style="background-color:var(--bg-subtle); padding:0.85rem 1.1rem; border-radius:10px; margin-bottom:1.25rem; font-size:0.88rem; display:grid; grid-template-columns: 1fr 1fr; gap:0.75rem;">
          <div><strong>ISBN:</strong> ${escapeHtml(book.isbn)}</div>
          <div><strong>Rating:</strong> ★ ${book.rating || '4.8'} / 5.0</div>
          <div><strong>Shelf Location:</strong> ${escapeHtml(book.shelf)}</div>
          <div><strong>Lending Duration:</strong> 14 Days Standard</div>
        </div>

        <h4 style="font-size:1rem; margin-bottom:0.4rem;">Overview & Synopsis</h4>
        <p style="color:var(--text-muted); font-size:0.92rem; line-height:1.6; margin-bottom:1.5rem;">
          ${escapeHtml(book.description || 'No description provided.')}
        </p>

        <div style="display:flex; gap:0.75rem; flex-wrap:wrap;">
          <button class="btn btn-primary" ${isAvailable ? '' : 'disabled'} onclick="handleUserDirectBorrow('${book.id}')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
            ${isAvailable ? 'Borrow This Book' : 'Unavailable (Checked Out)'}
          </button>
          ${user && user.role === 'admin' ? `
            <button class="btn btn-secondary" onclick="openEditBookModal('${book.id}')">
              Edit in Admin
            </button>
          ` : ''}
          <button class="btn btn-secondary" onclick="closeModal()">Close</button>
        </div>
      </div>
    </div>
  `;

  showModal(`Book Details #${book.id}`, content);
}

function handleUserDirectBorrow(bookId) {
  const user = window.libraryStorage.getCurrentUser();
  if (!user) {
    showToast("Please login as a student to borrow books.", "info");
    openAuthModal('student-login');
    return;
  }

  if (user.role === "admin") {
    showToast("You are logged in as Admin. Switch to Issue Book tab to issue to a student.", "info");
    navigateTo("admin");
    switchAdminTab("issue");
    closeModal();
    return;
  }

  try {
    const borrow = window.libraryStorage.issueBook(user.id, bookId);
    showToast(`Book successfully borrowed! Due date is ${borrow.dueDate}`, "success");
    closeModal();
    renderCatalogView();
    renderHomeView();
    // Navigate to student borrow history
    navigateTo("student");
    switchStudentTab("borrows");
  } catch (err) {
    showToast(err.message, "error");
  }
}

/* ===================================================================
   Academic Study Materials View (Year & Semester Wise)
   =================================================================== */
function renderMaterialsView() {
  const materials = window.libraryStorage.getMaterials();

  let filtered = materials.filter(m => {
    // Dept filter
    if (matDeptFilter !== "All" && m.department !== matDeptFilter && m.department !== "General") return false;
    // Year filter
    if (matYearFilter !== "All" && m.year.toString() !== matYearFilter.toString()) return false;
    // Sem filter
    if (matSemFilter !== "All" && m.semester.toString() !== matSemFilter.toString()) return false;
    // Category filter
    if (matCatFilter !== "All" && m.category !== matCatFilter) return false;
    // Search query
    if (matSearchTerm.trim()) {
      const q = matSearchTerm.toLowerCase();
      return (
        m.title.toLowerCase().includes(q) ||
        m.subjectName.toLowerCase().includes(q) ||
        m.subjectCode.toLowerCase().includes(q) ||
        m.summary.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const countEl = document.getElementById("materialsResultsCount");
  if (countEl) countEl.textContent = `Showing ${filtered.length} of ${materials.length} resources`;

  const grid = document.getElementById("materialsGrid");
  if (!grid) return;

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 1rem; color: var(--text-muted);">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin-bottom:1rem; opacity:0.6;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
        <h3>No academic materials match the selected filters</h3>
        <p>Try switching to another semester or clear the filters to view all repository items.</p>
        <button class="btn btn-secondary btn-sm" style="margin-top:1rem;" onclick="resetMaterialsFilters()">Reset Filters</button>
      </div>
    `;
    return;
  }

  grid.innerHTML = filtered.map(m => `
    <div class="material-card">
      <div class="material-top-meta">
        <span class="badge-academic">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
          Year ${m.year} • Sem ${m.semester}
        </span>
        <span class="badge-format">${escapeHtml(m.format)} (${m.fileSize || '3.5 MB'})</span>
      </div>

      <div class="material-subject">${escapeHtml(m.subjectCode)}: ${escapeHtml(m.subjectName)}</div>
      <h3 class="material-title">${escapeHtml(m.title)}</h3>
      <p class="material-summary">${escapeHtml(m.summary)}</p>

      <div class="material-footer">
        <div class="material-meta-info">
          <span>By ${escapeHtml(m.author)}</span> • <span>${m.downloads || 0} downloads</span>
        </div>
        <button class="btn btn-sm btn-primary" onclick="openMaterialPreviewModal('${m.id}')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          View / Read
        </button>
      </div>
    </div>
  `).join("");
}

function resetMaterialsFilters() {
  matDeptFilter = "All";
  matYearFilter = "All";
  matSemFilter = "All";
  matCatFilter = "All";
  matSearchTerm = "";

  const deptSel = document.getElementById("matDeptSelect");
  if (deptSel) deptSel.value = "All";
  const yearSel = document.getElementById("matYearSelect");
  if (yearSel) yearSel.value = "All";
  const semSel = document.getElementById("matSemSelect");
  if (semSel) semSel.value = "All";
  const catSel = document.getElementById("matCatSelect");
  if (catSel) catSel.value = "All";
  const searchInp = document.getElementById("matSearchInput");
  if (searchInp) searchInp.value = "";

  renderMaterialsView();
}

function openMaterialPreviewModal(matId) {
  const m = window.libraryStorage.getMaterialById(matId);
  if (!m) return;

  window.libraryStorage.incrementMaterialDownload(matId);

  const content = `
    <div>
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
        <span class="badge-academic">Year ${m.year} • Semester ${m.semester} • ${escapeHtml(m.department)}</span>
        <span class="badge-format">${escapeHtml(m.category)}</span>
      </div>

      <h2 style="font-size:1.4rem; margin-bottom:0.4rem;">${escapeHtml(m.title)}</h2>
      <p style="color:var(--secondary); font-weight:600; font-size:0.95rem; margin-bottom:1.25rem;">
        ${escapeHtml(m.subjectCode)} - ${escapeHtml(m.subjectName)}
      </p>

      <div style="background-color:var(--bg-subtle); padding:1rem; border-radius:10px; margin-bottom:1.5rem; font-size:0.88rem; display:grid; grid-template-columns: 1fr 1fr; gap:0.5rem;">
        <div><strong>Faculty Author:</strong> ${escapeHtml(m.author)}</div>
        <div><strong>Uploaded:</strong> ${escapeHtml(m.uploadDate)}</div>
        <div><strong>File Type:</strong> ${escapeHtml(m.format)} (${m.fileSize})</div>
        <div><strong>Verified:</strong> Academic Council Approved</div>
      </div>

      <h4 style="font-size:1rem; margin-bottom:0.5rem;">Course Outline & Content Preview</h4>
      <div style="background:var(--bg-card); border:1px solid var(--border-color); border-radius:8px; padding:1.25rem; font-family:monospace; font-size:0.85rem; line-height:1.7; white-space:pre-wrap; max-height:240px; overflow-y:auto; margin-bottom:1.5rem; color:var(--text-main);">
${escapeHtml(m.contentPreview || m.summary)}
      </div>

      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem;">
        <div style="font-size:0.85rem; color:var(--text-muted);">
          Downloads: <strong>${(m.downloads || 0) + 1}</strong>
        </div>
        <div style="display:flex; gap:0.75rem;">
          <button class="btn btn-secondary" onclick="closeModal()">Close</button>
          <button class="btn btn-primary" onclick="simulateFileDownload('${m.id}')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Download Resource (${m.format})
          </button>
        </div>
      </div>
    </div>
  `;

  showModal(`Academic Material: ${m.subjectCode}`, content);
  renderMaterialsView();
}

function simulateFileDownload(matId) {
  const m = window.libraryStorage.getMaterialById(matId);
  if (!m) return;
  showToast(`Downloading "${m.title}.${m.format.toLowerCase()}"...`, "success");
}

/* ===================================================================
   Student Portal (Borrow History & Fine Checker)
   =================================================================== */
function renderStudentPortal() {
  const user = window.libraryStorage.getCurrentUser();
  const container = document.getElementById("studentPortalContainer");
  if (!container) return;

  if (!user || user.role !== "student") {
    container.innerHTML = `
      <div style="text-align: center; padding: 4.5rem 1.5rem; background-color: var(--bg-surface); border:1px solid var(--border-color); border-radius: var(--radius-lg); max-width: 600px; margin: 2rem auto;">
        <div style="width:64px; height:64px; background:var(--primary-light); color:var(--primary); border-radius:50%; display:flex; align-items:center; justify-content:center; margin: 0 auto 1.25rem;">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        </div>
        <h2 style="margin-bottom: 0.5rem;">Student Portal Authentication Required</h2>
        <p style="color:var(--text-muted); margin-bottom: 1.75rem;">Please log in with your college credentials to track your borrowed books, due dates, calculated fines, and syllabus materials.</p>
        <div style="display:flex; justify-content:center; gap:0.75rem; flex-wrap:wrap;">
          <button class="btn btn-primary" onclick="openAuthModal('student-login')">Login as Student</button>
          <button class="btn btn-secondary" onclick="quickLoginAs('student', '21CS101')">Quick Demo Login (Aarav)</button>
        </div>
      </div>
    `;
    return;
  }

  // Get student's processed borrows
  const allBorrows = window.libraryStorage.getProcessedBorrows();
  const myBorrows = allBorrows.filter(b => b.studentId === user.id || b.studentRoll === user.rollNo);

  const activeBorrows = myBorrows.filter(b => b.status === "Active" || b.status === "Overdue");
  const returnedBorrows = myBorrows.filter(b => b.status === "Returned");
  const overdueBorrows = myBorrows.filter(b => b.status === "Overdue" && !b.finePaid);

  // Calculate student's total unpaid fines
  const totalUnpaidFine = myBorrows
    .filter(b => !b.finePaid)
    .reduce((acc, curr) => acc + (curr.calculatedFine || 0), 0);

  const totalPaidFine = myBorrows
    .filter(b => b.finePaid)
    .reduce((acc, curr) => acc + (curr.calculatedFine || 0), 0);

  container.innerHTML = `
    <!-- Student Header Banner -->
    <div class="student-banner">
      <div class="student-info-meta">
        <div class="student-avatar-lg">${(user.name || 'S')[0]}</div>
        <div>
          <h2 style="font-size:1.6rem; margin-bottom:0.25rem;">${escapeHtml(user.name)}</h2>
          <div style="color:var(--text-muted); font-size:0.9rem;">Roll No: <strong>${escapeHtml(user.rollNo)}</strong> • ${escapeHtml(user.email)}</div>
          <div class="student-pills">
            <span class="badge-academic">Dept: ${escapeHtml(user.department || 'CSE')}</span>
            <span class="badge-academic">Year ${user.year || 3}</span>
            <span class="badge-academic">Semester ${user.semester || 6}</span>
          </div>
        </div>
      </div>

      <div style="display:flex; gap:0.75rem; align-items:center;">
        <button class="btn btn-sm btn-secondary" onclick="handleLogout()">Logout</button>
      </div>
    </div>

    <!-- KPI Metric Cards -->
    <div class="stat-cards-grid">
      <div class="stat-card">
        <div class="stat-card-title">Currently Borrowed</div>
        <div class="stat-card-number" style="color:var(--primary);">${activeBorrows.length}</div>
        <div class="stat-card-desc">Active books in possession</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-title">Overdue Titles</div>
        <div class="stat-card-number" style="color:var(--danger);">${overdueBorrows.length}</div>
        <div class="stat-card-desc">Requires immediate return</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-title">Outstanding Fine</div>
        <div class="stat-card-number" style="color:${totalUnpaidFine > 0 ? 'var(--danger)' : 'var(--success)'};">
          ₹${totalUnpaidFine}
        </div>
        <div class="stat-card-desc">${totalUnpaidFine > 0 ? 'Penalty fee calculated at ₹5/day' : 'No pending dues'}</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-title">Completed Reads</div>
        <div class="stat-card-number" style="color:var(--success);">${returnedBorrows.length}</div>
        <div class="stat-card-desc">Lifetime returned books</div>
      </div>
    </div>

    <!-- Student Nav Tabs -->
    <div class="tab-pills" style="margin-bottom:1.5rem;">
      <button class="tab-pill ${currentStudentTab === 'borrows' ? 'active' : ''}" onclick="switchStudentTab('borrows')">
        📚 My Borrow History & Active Books (${myBorrows.length})
      </button>
      <button class="tab-pill ${currentStudentTab === 'fines' ? 'active' : ''}" onclick="switchStudentTab('fines')">
        💰 Check Fine & Pay Dues (${totalUnpaidFine > 0 ? `₹${totalUnpaidFine}` : 'All Clear'})
      </button>
      <button class="tab-pill ${currentStudentTab === 'materials' ? 'active' : ''}" onclick="switchStudentTab('materials')">
        🎓 My Semester Materials (Sem ${user.semester || 6})
      </button>
    </div>

    <!-- Dynamic Subtab Content -->
    <div id="studentSubtabContent">
      ${renderStudentSubtabContent(user, myBorrows, totalUnpaidFine, totalPaidFine)}
    </div>
  `;
}

function switchStudentTab(tab) {
  currentStudentTab = tab;
  renderStudentPortal();
}

function renderStudentSubtabContent(user, myBorrows, totalUnpaidFine, totalPaidFine) {
  if (currentStudentTab === "borrows") {
    if (myBorrows.length === 0) {
      return `
        <div style="background:var(--bg-surface); padding:3rem; border-radius:12px; text-align:center; border:1px solid var(--border-color);">
          <p style="color:var(--text-muted); margin-bottom:1rem;">You have not borrowed any books yet.</p>
          <button class="btn btn-primary" onclick="navigateTo('catalog')">Browse Catalog to Borrow</button>
        </div>
      `;
    }

    return `
      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Borrow ID</th>
              <th>Book Title</th>
              <th>Issue Date</th>
              <th>Exp / Due Date</th>
              <th>Status</th>
              <th>Fine Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            ${myBorrows.map(b => {
              const fineDue = !b.finePaid && b.calculatedFine > 0;
              return `
                <tr>
                  <td><code>${b.id}</code></td>
                  <td>
                    <strong>${escapeHtml(b.bookTitle)}</strong>
                  </td>
                  <td>${b.issueDate}</td>
                  <td>
                    <span style="${b.status === 'Overdue' ? 'color:var(--danger); font-weight:700;' : ''}">
                      ${b.dueDate}
                    </span>
                  </td>
                  <td>
                    <span class="status-pill ${b.status.toLowerCase()}">${b.status}</span>
                    ${b.overdueDays > 0 && b.status !== 'Returned' ? `<span style="font-size:0.75rem; color:var(--danger); display:block;">(${b.overdueDays} days late)</span>` : ''}
                  </td>
                  <td>
                    ${fineDue ? `<span class="fine-amount due">₹${b.calculatedFine} due</span>` : (b.calculatedFine > 0 ? `<span class="fine-amount cleared">₹${b.calculatedFine} (Paid)</span>` : `<span style="color:var(--text-muted);">None</span>`)}
                  </td>
                  <td>
                    ${b.status !== 'Returned' ? `
                      <button class="btn btn-sm btn-secondary" onclick="handleStudentRequestReturn('${b.id}')">
                        Return Book
                      </button>
                    ` : `
                      <span style="color:var(--success); font-size:0.82rem; font-weight:600;">✓ Completed</span>
                    `}
                  </td>
                </tr>
              `;
            }).join("")}
          </tbody>
        </table>
      </div>
    `;
  } else if (currentStudentTab === "fines") {
    const finesConfig = window.libraryStorage.getFinesConfig();
    const overdueBorrows = myBorrows.filter(b => b.calculatedFine > 0);

    return `
      <div style="display:grid; grid-template-columns: 1fr 340px; gap:2rem; align-items:start;">
        <div>
          <div style="background-color:var(--bg-surface); border:1px solid var(--border-color); border-radius:var(--radius-lg); padding:1.5rem; margin-bottom:1.5rem;">
            <h3 style="margin-bottom:0.4rem;">Library Fine & Overdue Assessment Ledger</h3>
            <p style="color:var(--text-muted); font-size:0.9rem;">
              According to library regulations, books retained beyond the 14-day expiry window incur a penalty of <strong>₹${finesConfig.dailyRate} per calendar day</strong>. Maximum cap is ₹${finesConfig.maxFinePerBook} per item.
            </p>
          </div>

          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Book Title</th>
                  <th>Due Date</th>
                  <th>Days Overdue</th>
                  <th>Calculated Fine</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                ${overdueBorrows.length === 0 ? `
                  <tr><td colspan="6" style="text-align:center; padding:2rem; color:var(--text-muted);">🎉 Great job! You have no fines or overdue books.</td></tr>
                ` : overdueBorrows.map(b => `
                  <tr>
                    <td><strong>${escapeHtml(b.bookTitle)}</strong></td>
                    <td>${b.dueDate}</td>
                    <td><strong style="color:var(--danger);">${b.overdueDays || 0} Days</strong></td>
                    <td><span class="fine-amount ${b.finePaid ? 'cleared' : 'due'}">₹${b.calculatedFine}</span></td>
                    <td>
                      <span class="status-pill ${b.finePaid ? 'returned' : 'overdue'}">
                        ${b.finePaid ? 'Settled' : 'Payment Due'}
                      </span>
                    </td>
                    <td>
                      ${!b.finePaid ? `
                        <button class="btn btn-sm btn-primary" onclick="openPayFineModal('${b.id}', ${b.calculatedFine})">
                          Pay Fine
                        </button>
                      ` : `
                        <button class="btn btn-sm btn-secondary" onclick="viewFineReceipt('${b.id}')">Receipt</button>
                      `}
                    </td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Fine Summary Box -->
        <div style="background:var(--bg-surface); border:1px solid var(--border-color); border-radius:var(--radius-lg); padding:1.75rem; box-shadow:var(--shadow-sm);">
          <h4 style="margin-bottom:1rem;">Dues Summary</h4>
          <div style="display:flex; justify-content:space-between; margin-bottom:0.75rem; font-size:0.95rem;">
            <span style="color:var(--text-muted);">Total Outstanding:</span>
            <strong style="color:var(--danger); font-size:1.2rem;">₹${totalUnpaidFine}</strong>
          </div>
          <div style="display:flex; justify-content:space-between; margin-bottom:1.25rem; font-size:0.9rem;">
            <span style="color:var(--text-muted);">Historical Paid Fines:</span>
            <span>₹${totalPaidFine}</span>
          </div>

          ${totalUnpaidFine > 0 ? `
            <button class="btn btn-primary" style="width:100%;" onclick="openPayFineAllModal(${totalUnpaidFine})">
              Pay Total Dues (₹${totalUnpaidFine})
            </button>
          ` : `
            <div style="background:var(--success-light); color:var(--success); padding:0.75rem; border-radius:8px; text-align:center; font-weight:600; font-size:0.9rem;">
              ✓ Account in Good Standing
            </div>
          `}
        </div>
      </div>
    `;
  } else if (currentStudentTab === "materials") {
    // Auto-filtered for student's semester
    const materials = window.libraryStorage.getMaterials().filter(
      m => m.semester === user.semester || m.year === user.year
    );

    return `
      <div>
        <div style="background-color:var(--bg-surface); border:1px solid var(--border-color); border-radius:var(--radius-lg); padding:1.5rem; margin-bottom:1.5rem; display:flex; justify-content:space-between; align-items:center;">
          <div>
            <h3>Recommended Academic Resources for Semester ${user.semester || 6}</h3>
            <p style="color:var(--text-muted); font-size:0.9rem;">Directly matched with your enrolled syllabus and department (${user.department || 'CSE'}).</p>
          </div>
          <button class="btn btn-sm btn-secondary" onclick="navigateTo('materials')">View All Semesters</button>
        </div>

        <div class="materials-grid">
          ${materials.length === 0 ? `
            <p style="color:var(--text-muted); padding:2rem;">No materials uploaded yet for Semester ${user.semester}.</p>
          ` : materials.map(m => `
            <div class="material-card">
              <div class="material-top-meta">
                <span class="badge-academic">Year ${m.year} • Sem ${m.semester}</span>
                <span class="badge-format">${m.format}</span>
              </div>
              <div class="material-subject">${escapeHtml(m.subjectCode)}: ${escapeHtml(m.subjectName)}</div>
              <h4 class="material-title" style="font-size:1.05rem;">${escapeHtml(m.title)}</h4>
              <p class="material-summary">${escapeHtml(m.summary)}</p>
              <div class="material-footer">
                <span class="material-meta-info">${m.fileSize}</span>
                <button class="btn btn-sm btn-primary" onclick="openMaterialPreviewModal('${m.id}')">View Notes</button>
              </div>
            </div>
          `).join("")}
        </div>
      </div>
    `;
  }
}

function handleStudentRequestReturn(borrowId) {
  try {
    const record = window.libraryStorage.returnBook(borrowId);
    if (record.calculatedFine > 0) {
      showToast(`Book returned! A fine of ₹${record.calculatedFine} was assessed for overdue submission.`, "warning");
    } else {
      showToast("Book returned on time! Thank you.", "success");
    }
    renderStudentPortal();
    renderHomeView();
    renderCatalogView();
  } catch (err) {
    showToast(err.message, "error");
  }
}

function openPayFineModal(borrowId, amount) {
  const content = `
    <div>
      <h3 style="margin-bottom:0.5rem;">Settle Library Fine</h3>
      <p style="color:var(--text-muted); font-size:0.9rem; margin-bottom:1.5rem;">
        Record online settlement for overdue book submission.
      </p>

      <div style="background-color:var(--bg-subtle); padding:1rem; border-radius:10px; margin-bottom:1.5rem;">
        <div style="display:flex; justify-content:space-between; margin-bottom:0.5rem;">
          <span>Borrow Record ID:</span>
          <strong>${borrowId}</strong>
        </div>
        <div style="display:flex; justify-content:space-between; font-size:1.1rem;">
          <span>Fine Amount Due:</span>
          <strong style="color:var(--danger);">₹${amount}</strong>
        </div>
      </div>

      <div class="form-group" style="margin-bottom:1rem;">
        <label class="form-label">Payment Method</label>
        <select id="payMethodSelect" class="form-control">
          <option value="upi">UPI / QR Code / NetBanking (Instant Clearance)</option>
          <option value="card">Debit / Credit Card</option>
          <option value="counter">Library Helpdesk Counter Cash</option>
        </select>
      </div>

      <div style="display:flex; justify-content:flex-end; gap:0.75rem; margin-top:1.5rem;">
        <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
        <button class="btn btn-success" onclick="confirmFinePayment('${borrowId}')">
          Confirm Payment of ₹${amount}
        </button>
      </div>
    </div>
  `;
  showModal("Fine Payment Gateway", content);
}

function confirmFinePayment(borrowId) {
  window.libraryStorage.payFine(borrowId);
  showToast("Payment processed successfully! Fine cleared.", "success");
  closeModal();
  renderStudentPortal();
}

function openPayFineAllModal(totalAmount) {
  const user = window.libraryStorage.getCurrentUser();
  if (!user) return;

  const content = `
    <div>
      <h3 style="margin-bottom:0.5rem;">Clear All Outstanding Library Dues</h3>
      <p style="color:var(--text-muted); font-size:0.9rem; margin-bottom:1.5rem;">
        Settle all pending overdue fees across all borrowed books for Roll No: <strong>${user.rollNo}</strong>.
      </p>

      <div style="background:var(--bg-subtle); padding:1.25rem; border-radius:10px; text-align:center; margin-bottom:1.5rem;">
        <div style="font-size:0.9rem; color:var(--text-muted);">Total Payable:</div>
        <div style="font-size:2rem; font-weight:800; color:var(--danger); font-family:'Outfit';">₹${totalAmount}</div>
      </div>

      <div style="display:flex; justify-content:flex-end; gap:0.75rem;">
        <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
        <button class="btn btn-success" onclick="confirmPayAllFines()">Proceed & Clear All</button>
      </div>
    </div>
  `;
  showModal("Bulk Fine Clearance", content);
}

function confirmPayAllFines() {
  const user = window.libraryStorage.getCurrentUser();
  if (!user) return;

  const myBorrows = window.libraryStorage.getProcessedBorrows().filter(
    b => (b.studentId === user.id || b.studentRoll === user.rollNo) && !b.finePaid
  );

  myBorrows.forEach(b => {
    window.libraryStorage.payFine(b.id);
  });

  showToast("All outstanding library fines cleared successfully!", "success");
  closeModal();
  renderStudentPortal();
}

function viewFineReceipt(borrowId) {
  const record = window.libraryStorage.getProcessedBorrows().find(b => b.id === borrowId);
  if (!record) return;

  const content = `
    <div style="border:1px dashed var(--border-color); padding:1.5rem; border-radius:10px; background:var(--bg-card);">
      <div style="text-align:center; margin-bottom:1rem; border-bottom:1px solid var(--border-subtle); padding-bottom:0.85rem;">
        <h3>Athena Central Digital Library</h3>
        <p style="font-size:0.8rem; color:var(--text-muted);">Official Electronic Fine Clearance Receipt</p>
      </div>
      <div style="font-size:0.9rem; line-height:1.8;">
        <div><strong>Receipt Ref:</strong> REC-${Date.now().toString().slice(-6)}</div>
        <div><strong>Borrow ID:</strong> ${record.id}</div>
        <div><strong>Student:</strong> ${escapeHtml(record.studentName)} (${record.studentRoll})</div>
        <div><strong>Book Title:</strong> ${escapeHtml(record.bookTitle)}</div>
        <div><strong>Due Date:</strong> ${record.dueDate}</div>
        <div><strong>Amount Paid:</strong> <strong style="color:var(--success);">₹${record.calculatedFine}</strong></div>
        <div><strong>Status:</strong> Cleared (Paid in Full)</div>
      </div>
      <div style="margin-top:1.5rem; text-align:right;">
        <button class="btn btn-sm btn-secondary" onclick="closeModal()">Close</button>
      </div>
    </div>
  `;
  showModal("Payment Receipt", content);
}

/* ===================================================================
   Librarian Admin Portal
   - Login
   - Add Book
   - Update/Delete Book
   - Issue Book for student
   - Return Book Status
   - Make Fine
   - Update material (year, semester wise)
   - View material
   =================================================================== */
function renderAdminPortal() {
  const user = window.libraryStorage.getCurrentUser();
  const container = document.getElementById("adminPortalContainer");
  if (!container) return;

  if (!user || user.role !== "admin") {
    container.innerHTML = `
      <div style="text-align: center; padding: 4.5rem 1.5rem; background-color: var(--bg-surface); border:1px solid var(--border-color); border-radius: var(--radius-lg); max-width: 580px; margin: 2rem auto;">
        <div style="width:64px; height:64px; background:var(--accent-gold-light); color:#b45309; border-radius:50%; display:flex; align-items:center; justify-content:center; margin: 0 auto 1.25rem;">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        </div>
        <h2 style="margin-bottom: 0.5rem;">Librarian Administrator Access</h2>
        <p style="color:var(--text-muted); margin-bottom: 1.75rem;">Authorized personnel only. Manage college library inventory, book issues, return status, fine rates, and semester study resources.</p>
        <div style="display:flex; justify-content:center; gap:0.75rem; flex-wrap:wrap;">
          <button class="btn btn-primary" onclick="openAuthModal('admin-login')">Admin Login</button>
          <button class="btn btn-secondary" onclick="quickLoginAs('admin')">1-Click Demo Admin Login</button>
        </div>
      </div>
    `;
    return;
  }

  const books = window.libraryStorage.getBooks();
  const borrows = window.libraryStorage.getProcessedBorrows();
  const materials = window.libraryStorage.getMaterials();
  const students = window.libraryStorage.getStudents();
  const activeIssues = borrows.filter(b => b.status === "Active" || b.status === "Overdue");
  const overdueCount = borrows.filter(b => b.status === "Overdue").length;

  container.innerHTML = `
    <!-- Admin Header -->
    <div class="admin-header-bar">
      <div>
        <h2 style="font-size:1.8rem; margin-bottom:0.25rem;">Librarian Control Center</h2>
        <p style="color:var(--text-muted); font-size:0.92rem;">Welcome, <strong>${escapeHtml(user.name)}</strong> (${user.designation || 'Librarian'})</p>
      </div>

      <div style="display:flex; gap:0.75rem;">
        <button class="btn btn-sm btn-secondary" onclick="handleLogout()">Admin Logout</button>
      </div>
    </div>

    <!-- Admin Top KPI Bar -->
    <div class="stat-cards-grid">
      <div class="stat-card">
        <div class="stat-card-title">Total Book Titles</div>
        <div class="stat-card-number" style="color:var(--primary);">${books.length}</div>
        <div class="stat-card-desc">In college central catalog</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-title">Currently Issued</div>
        <div class="stat-card-number" style="color:var(--secondary);">${activeIssues.length}</div>
        <div class="stat-card-desc">Active with students</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-title">Overdue Items</div>
        <div class="stat-card-number" style="color:var(--danger);">${overdueCount}</div>
        <div class="stat-card-desc">Fines actively accruing</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-title">Study Materials</div>
        <div class="stat-card-number" style="color:var(--accent-gold);">${materials.length}</div>
        <div class="stat-card-desc">Sem 1 - 8 notes & papers</div>
      </div>
    </div>

    <!-- Admin Subnavigation Tabs -->
    <div class="admin-tabs">
      <button class="admin-tab-btn ${currentAdminTab === 'books' ? 'active' : ''}" onclick="switchAdminTab('books')">
        📖 Book Inventory (Add/Edit/Delete)
      </button>
      <button class="admin-tab-btn ${currentAdminTab === 'issue' ? 'active' : ''}" onclick="switchAdminTab('issue')">
        ✍️ Issue Book for Student
      </button>
      <button class="admin-tab-btn ${currentAdminTab === 'returns' ? 'active' : ''}" onclick="switchAdminTab('returns')">
        🔄 Return Book Status (${activeIssues.length})
      </button>
      <button class="admin-tab-btn ${currentAdminTab === 'fines' ? 'active' : ''}" onclick="switchAdminTab('fines')">
        ⚖️ Make & Manage Fines
      </button>
      <button class="admin-tab-btn ${currentAdminTab === 'materials' ? 'active' : ''}" onclick="switchAdminTab('materials')">
        📁 Study Materials (Year/Sem Wise)
      </button>
    </div>

    <!-- Subpanel Content -->
    <div id="adminPanelContent">
      ${renderAdminPanelContent(currentAdminTab, books, borrows, materials, students)}
    </div>
  `;
}

function switchAdminTab(tab) {
  currentAdminTab = tab;
  renderAdminPortal();
}

function renderAdminPanelContent(tab, books, borrows, materials, students) {
  if (tab === "books") {
    return `
      <div class="action-bar">
        <div>
          <h3>Catalog Inventory Management</h3>
          <p style="color:var(--text-muted); font-size:0.88rem;">Add new titles, update shelf locations & stock, or delete obsolete records.</p>
        </div>
        <button class="btn btn-primary" onclick="openAddBookModal()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add New Book
        </button>
      </div>

      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Book Details</th>
              <th>Category / Dept</th>
              <th>Shelf Location</th>
              <th>Total Copies</th>
              <th>Available</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${books.map(b => `
              <tr>
                <td><code>${b.id}</code></td>
                <td>
                  <div style="display:flex; align-items:center; gap:0.75rem;">
                    <img src="${escapeHtml(b.coverUrl)}" style="width:36px; height:48px; border-radius:4px; object-fit:cover;" onerror="this.src='https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80'">
                    <div>
                      <strong>${escapeHtml(b.title)}</strong>
                      <div style="font-size:0.78rem; color:var(--text-muted);">${escapeHtml(b.author)} • ISBN: ${b.isbn}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <span class="badge-academic">${escapeHtml(b.category)}</span>
                  <div style="font-size:0.75rem; color:var(--text-muted);">${escapeHtml(b.department || 'GEN')}</div>
                </td>
                <td>${escapeHtml(b.shelf)}</td>
                <td><strong>${b.totalCopies}</strong></td>
                <td>
                  <span class="status-pill ${b.availableCopies > 0 ? 'active' : 'overdue'}">
                    ${b.availableCopies} available
                  </span>
                </td>
                <td>
                  <div style="display:flex; gap:0.4rem;">
                    <button class="btn btn-sm btn-secondary" onclick="openEditBookModal('${b.id}')">Edit</button>
                    <button class="btn btn-sm btn-danger" onclick="confirmDeleteBook('${b.id}')">Delete</button>
                  </div>
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `;
  } else if (tab === "issue") {
    const availableBooks = books.filter(b => b.availableCopies > 0);
    const today = new Date().toISOString().split("T")[0];
    const defaultDue = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    return `
      <div style="max-width:700px; background:var(--bg-surface); border:1px solid var(--border-color); border-radius:var(--radius-lg); padding:2rem; box-shadow:var(--shadow-sm);">
        <h3 style="margin-bottom:0.4rem;">Issue Book to Student</h3>
        <p style="color:var(--text-muted); font-size:0.88rem; margin-bottom:1.5rem;">Select registered student, book title, and loan period. Available stock will update automatically.</p>

        <form id="issueBookForm" onsubmit="handleAdminIssueBook(event)">
          <div class="form-grid">
            <div class="form-group form-full">
              <label class="form-label">Select Student *</label>
              <select id="issueStudentSelect" required class="form-control">
                <option value="">-- Choose Student --</option>
                ${students.map(s => `
                  <option value="${s.id}">${s.name} (${s.rollNo}) - Year ${s.year}, Sem ${s.semester} [${s.department}]</option>
                `).join("")}
              </select>
            </div>

            <div class="form-group form-full">
              <label class="form-label">Select Book Title (In Stock Only) *</label>
              <select id="issueBookSelect" required class="form-control">
                <option value="">-- Choose Available Book --</option>
                ${availableBooks.map(b => `
                  <option value="${b.id}">${b.title} [${b.availableCopies} copies left] (${b.shelf})</option>
                `).join("")}
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Issue Date *</label>
              <input type="date" id="issueDateInput" value="${today}" required class="form-control">
            </div>

            <div class="form-group">
              <label class="form-label">Due / Exp Date * (14 Days Standard)</label>
              <input type="date" id="issueDueDateInput" value="${defaultDue}" required class="form-control">
            </div>
          </div>

          <div style="margin-top:1.5rem; display:flex; justify-content:flex-end; gap:0.75rem;">
            <button type="submit" class="btn btn-primary">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
              Confirm Book Issue
            </button>
          </div>
        </form>
      </div>
    `;
  } else if (tab === "returns") {
    return `
      <div class="action-bar">
        <div>
          <h3>Return Book Status & Tracking</h3>
          <p style="color:var(--text-muted); font-size:0.88rem;">Monitor live status of issued items. Accept returns and verify fine calculations.</p>
        </div>
      </div>

      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Borrow ID</th>
              <th>Student Roll & Name</th>
              <th>Book Title</th>
              <th>Issue Date</th>
              <th>Exp Date</th>
              <th>Status</th>
              <th>Overdue Fine</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            ${borrows.map(b => {
              const fineDue = !b.finePaid && b.calculatedFine > 0;
              return `
                <tr>
                  <td><code>${b.id}</code></td>
                  <td>
                    <strong>${escapeHtml(b.studentName)}</strong>
                    <div style="font-size:0.75rem; color:var(--text-muted);">${b.studentRoll}</div>
                  </td>
                  <td>${escapeHtml(b.bookTitle)}</td>
                  <td>${b.issueDate}</td>
                  <td>
                    <span style="${b.status === 'Overdue' ? 'color:var(--danger); font-weight:700;' : ''}">${b.dueDate}</span>
                  </td>
                  <td>
                    <span class="status-pill ${b.status.toLowerCase()}">${b.status}</span>
                    ${b.overdueDays > 0 ? `<div style="font-size:0.75rem; color:var(--danger);">${b.overdueDays}d overdue</div>` : ''}
                  </td>
                  <td>
                    ${fineDue ? `<span class="fine-amount due">₹${b.calculatedFine}</span>` : (b.calculatedFine > 0 ? `<span class="fine-amount cleared">₹${b.calculatedFine} (Paid)</span>` : '<span style="color:var(--text-muted);">₹0</span>')}
                  </td>
                  <td>
                    ${b.status !== 'Returned' ? `
                      <button class="btn btn-sm btn-success" onclick="handleAdminAcceptReturn('${b.id}')">
                        Accept Return
                      </button>
                    ` : `
                      <span style="color:var(--text-muted); font-size:0.8rem;">Returned on ${b.returnDate}</span>
                    `}
                  </td>
                </tr>
              `;
            }).join("")}
          </tbody>
        </table>
      </div>
    `;
  } else if (tab === "fines") {
    const finesConfig = window.libraryStorage.getFinesConfig();
    const studentsWithFines = borrows.filter(b => b.calculatedFine > 0);

    return `
      <div style="display:grid; grid-template-columns: 1fr 340px; gap:2rem; align-items:start;">
        <div>
          <div class="action-bar">
            <div>
              <h3>Fine Ledger & Payment Collection</h3>
              <p style="color:var(--text-muted); font-size:0.88rem;">Track fines, record offline/counter receipts, or assess manual penalties.</p>
            </div>
            <button class="btn btn-primary btn-sm" onclick="openMakeCustomFineModal()">
              + Make Custom Fine / Penalty
            </button>
          </div>

          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Record</th>
                  <th>Student</th>
                  <th>Book Title</th>
                  <th>Overdue Days</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                ${studentsWithFines.length === 0 ? `
                  <tr><td colspan="7" style="text-align:center; padding:2rem; color:var(--text-muted);">No recorded fines at this moment.</td></tr>
                ` : studentsWithFines.map(b => `
                  <tr>
                    <td><code>${b.id}</code></td>
                    <td><strong>${escapeHtml(b.studentName)}</strong> (${b.studentRoll})</td>
                    <td>${escapeHtml(b.bookTitle)}</td>
                    <td>${b.overdueDays || 0} days</td>
                    <td><span class="fine-amount ${b.finePaid ? 'cleared' : 'due'}">₹${b.calculatedFine}</span></td>
                    <td>
                      <span class="status-pill ${b.finePaid ? 'returned' : 'overdue'}">
                        ${b.finePaid ? 'Paid' : 'Unpaid'}
                      </span>
                    </td>
                    <td>
                      ${!b.finePaid ? `
                        <button class="btn btn-sm btn-primary" onclick="handleAdminMarkFinePaid('${b.id}')">
                          Mark as Paid
                        </button>
                      ` : `
                        <button class="btn btn-sm btn-secondary" onclick="viewFineReceipt('${b.id}')">View Slip</button>
                      `}
                    </td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Fine Rules Config Box -->
        <div style="background:var(--bg-surface); border:1px solid var(--border-color); border-radius:var(--radius-lg); padding:1.75rem;">
          <h4 style="margin-bottom:0.75rem;">Configure Fine Policy</h4>
          <p style="font-size:0.85rem; color:var(--text-muted); margin-bottom:1.25rem;">Adjust the automated daily overdue rates applicable to all students.</p>

          <form onsubmit="handleSaveFinePolicy(event)">
            <div class="form-group" style="margin-bottom:1rem;">
              <label class="form-label">Daily Fine Rate (₹ / Day)</label>
              <input type="number" id="fineDailyRateInput" value="${finesConfig.dailyRate}" min="1" max="100" required class="form-control">
            </div>

            <div class="form-group" style="margin-bottom:1rem;">
              <label class="form-label">Maximum Fine Cap per Book (₹)</label>
              <input type="number" id="fineMaxCapInput" value="${finesConfig.maxFinePerBook}" min="10" max="1000" required class="form-control">
            </div>

            <div class="form-group" style="margin-bottom:1.5rem;">
              <label class="form-label">Grace Period (Days)</label>
              <input type="number" id="fineGraceInput" value="${finesConfig.gracePeriodDays || 0}" min="0" max="7" class="form-control">
            </div>

            <button type="submit" class="btn btn-primary" style="width:100%;">
              Update Fine Policy
            </button>
          </form>
        </div>
      </div>
    `;
  } else if (tab === "materials") {
    return `
      <div class="action-bar">
        <div>
          <h3>Academic Study Materials Repository (Year & Semester Wise)</h3>
          <p style="color:var(--text-muted); font-size:0.88rem;">Add, update, or remove semester notes, syllabus documents, and question banks.</p>
        </div>
        <button class="btn btn-primary" onclick="openAddMaterialModal()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Upload New Material
        </button>
      </div>

      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Subject & Title</th>
              <th>Year & Semester</th>
              <th>Department</th>
              <th>Category</th>
              <th>Downloads</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${materials.map(m => `
              <tr>
                <td><code>${m.id}</code></td>
                <td>
                  <strong>${escapeHtml(m.title)}</strong>
                  <div style="font-size:0.75rem; color:var(--secondary);">${escapeHtml(m.subjectCode)} - ${escapeHtml(m.subjectName)}</div>
                </td>
                <td>
                  <span class="badge-academic">Year ${m.year} • Sem ${m.semester}</span>
                </td>
                <td><strong>${escapeHtml(m.department)}</strong></td>
                <td><span class="badge-format">${escapeHtml(m.category)}</span></td>
                <td>${m.downloads || 0}</td>
                <td>
                  <div style="display:flex; gap:0.4rem;">
                    <button class="btn btn-sm btn-secondary" onclick="openMaterialPreviewModal('${m.id}')">View</button>
                    <button class="btn btn-sm btn-secondary" onclick="openEditMaterialModal('${m.id}')">Edit</button>
                    <button class="btn btn-sm btn-danger" onclick="confirmDeleteMaterial('${m.id}')">Delete</button>
                  </div>
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `;
  }
}

function handleAdminIssueBook(e) {
  e.preventDefault();
  const studentId = document.getElementById("issueStudentSelect").value;
  const bookId = document.getElementById("issueBookSelect").value;
  const issueDate = document.getElementById("issueDateInput").value;
  const dueDate = document.getElementById("issueDueDateInput").value;

  try {
    const borrow = window.libraryStorage.issueBook(studentId, bookId, issueDate, dueDate);
    showToast(`Book successfully issued to student! Due on ${borrow.dueDate}`, "success");
    renderAdminPortal();
    renderCatalogView();
    renderHomeView();
  } catch (err) {
    showToast(err.message, "error");
  }
}

function handleAdminAcceptReturn(borrowId) {
  try {
    const record = window.libraryStorage.returnBook(borrowId);
    if (record.calculatedFine > 0) {
      showToast(`Book returned! An overdue fine of ₹${record.calculatedFine} has been assessed.`, "warning");
    } else {
      showToast("Book returned successfully with zero penalty.", "success");
    }
    renderAdminPortal();
    renderHomeView();
    renderCatalogView();
  } catch (err) {
    showToast(err.message, "error");
  }
}

function handleAdminMarkFinePaid(borrowId) {
  window.libraryStorage.payFine(borrowId);
  showToast("Fine marked as settled / paid in full.", "success");
  renderAdminPortal();
}

function handleSaveFinePolicy(e) {
  e.preventDefault();
  const dailyRate = Number(document.getElementById("fineDailyRateInput").value);
  const maxFinePerBook = Number(document.getElementById("fineMaxCapInput").value);
  const gracePeriodDays = Number(document.getElementById("fineGraceInput").value);

  window.libraryStorage.saveFinesConfig({ dailyRate, maxFinePerBook, gracePeriodDays });
  showToast("Fine calculation policy updated!", "success");
  renderAdminPortal();
}

function openMakeCustomFineModal() {
  const borrows = window.libraryStorage.getProcessedBorrows();
  const content = `
    <form onsubmit="handleMakeCustomFineSubmit(event)">
      <h3 style="margin-bottom:0.5rem;">Assess Custom Fine / Penalty</h3>
      <p style="color:var(--text-muted); font-size:0.88rem; margin-bottom:1.25rem;">Impose fine for damaged pages, lost item replacement, or exceptional infractions.</p>

      <div class="form-group" style="margin-bottom:1rem;">
        <label class="form-label">Select Active Borrow Record *</label>
        <select id="customFineBorrowSelect" required class="form-control">
          ${borrows.map(b => `
            <option value="${b.id}">${b.id} - ${escapeHtml(b.studentName)} (${b.studentRoll}) : ${escapeHtml(b.bookTitle)}</option>
          `).join("")}
        </select>
      </div>

      <div class="form-group" style="margin-bottom:1rem;">
        <label class="form-label">Penalty Amount (₹) *</label>
        <input type="number" id="customFineAmountInput" min="5" max="2000" value="50" required class="form-control">
      </div>

      <div class="form-group" style="margin-bottom:1.5rem;">
        <label class="form-label">Reason / Remarks</label>
        <input type="text" id="customFineReason" placeholder="e.g. Broken book spine, water damage" class="form-control">
      </div>

      <div style="display:flex; justify-content:flex-end; gap:0.75rem;">
        <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
        <button type="submit" class="btn btn-primary">Apply Fine</button>
      </div>
    </form>
  `;
  showModal("Make Fine Penalty", content);
}

function handleMakeCustomFineSubmit(e) {
  e.preventDefault();
  const borrowId = document.getElementById("customFineBorrowSelect").value;
  const amount = document.getElementById("customFineAmountInput").value;

  window.libraryStorage.makeCustomFine(borrowId, amount);
  showToast(`Custom fine of ₹${amount} applied to record ${borrowId}`, "success");
  closeModal();
  renderAdminPortal();
}

/* ===================================================================
   Admin Add/Edit/Delete Book Modals
   =================================================================== */
function openAddBookModal() {
  const content = `
    <form onsubmit="handleAddBookSubmit(event)">
      <div class="form-grid">
        <div class="form-group form-full">
          <label class="form-label">Book Title *</label>
          <input type="text" id="addBookTitle" required placeholder="e.g. Operating Systems: Three Easy Pieces" class="form-control">
        </div>

        <div class="form-group form-full">
          <label class="form-label">Author(s) *</label>
          <input type="text" id="addBookAuthor" required placeholder="e.g. Remzi H. Arpaci-Dusseau" class="form-control">
        </div>

        <div class="form-group">
          <label class="form-label">ISBN *</label>
          <input type="text" id="addBookIsbn" required placeholder="978-1985086593" class="form-control">
        </div>

        <div class="form-group">
          <label class="form-label">Category / Genre *</label>
          <select id="addBookCategory" required class="form-control">
            <option value="Computer Science">Computer Science</option>
            <option value="Software Engineering">Software Engineering</option>
            <option value="Artificial Intelligence">Artificial Intelligence</option>
            <option value="Database Systems">Database Systems</option>
            <option value="Networking">Networking</option>
            <option value="Electronics">Electronics</option>
            <option value="Mechanical">Mechanical</option>
            <option value="Mathematics">Mathematics</option>
            <option value="Humanities & History">Humanities & History</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Department *</label>
          <select id="addBookDept" required class="form-control">
            <option value="CSE">CSE</option>
            <option value="IT">IT</option>
            <option value="AIDS">AIDS</option>
            <option value="ECE">ECE</option>
            <option value="MECH">MECH</option>
            <option value="General">General</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Total Copies *</label>
          <input type="number" id="addBookCopies" min="1" max="100" value="5" required class="form-control">
        </div>

        <div class="form-group">
          <label class="form-label">Shelf Location *</label>
          <input type="text" id="addBookShelf" required placeholder="e.g. Rack CS-06 / Shelf A" class="form-control">
        </div>

        <div class="form-group">
          <label class="form-label">Publication Year</label>
          <input type="number" id="addBookYear" value="2023" class="form-control">
        </div>

        <div class="form-group form-full">
          <label class="form-label">Cover Image URL</label>
          <input type="url" id="addBookCover" placeholder="https://..." value="https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80" class="form-control">
        </div>

        <div class="form-group form-full">
          <label class="form-label">Book Description / Synopsis</label>
          <textarea id="addBookDesc" rows="3" class="form-control" placeholder="Brief outline of contents..."></textarea>
        </div>
      </div>

      <div style="margin-top:1.5rem; display:flex; justify-content:flex-end; gap:0.75rem;">
        <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
        <button type="submit" class="btn btn-primary">Save Book to Inventory</button>
      </div>
    </form>
  `;
  showModal("Add New Book to Library", content);
}

function handleAddBookSubmit(e) {
  e.preventDefault();
  const bookData = {
    title: document.getElementById("addBookTitle").value,
    author: document.getElementById("addBookAuthor").value,
    isbn: document.getElementById("addBookIsbn").value,
    category: document.getElementById("addBookCategory").value,
    department: document.getElementById("addBookDept").value,
    totalCopies: Number(document.getElementById("addBookCopies").value),
    shelf: document.getElementById("addBookShelf").value,
    year: Number(document.getElementById("addBookYear").value),
    coverUrl: document.getElementById("addBookCover").value,
    description: document.getElementById("addBookDesc").value
  };

  window.libraryStorage.addBook(bookData);
  showToast(`Book "${bookData.title}" added to catalog!`, "success");
  closeModal();
  renderAdminPortal();
  renderCatalogView();
  renderHomeView();
}

function openEditBookModal(bookId) {
  const b = window.libraryStorage.getBookById(bookId);
  if (!b) return;

  const content = `
    <form onsubmit="handleEditBookSubmit(event, '${b.id}')">
      <div class="form-grid">
        <div class="form-group form-full">
          <label class="form-label">Book Title *</label>
          <input type="text" id="editBookTitle" required value="${escapeHtml(b.title)}" class="form-control">
        </div>

        <div class="form-group form-full">
          <label class="form-label">Author(s) *</label>
          <input type="text" id="editBookAuthor" required value="${escapeHtml(b.author)}" class="form-control">
        </div>

        <div class="form-group">
          <label class="form-label">ISBN</label>
          <input type="text" id="editBookIsbn" required value="${escapeHtml(b.isbn)}" class="form-control">
        </div>

        <div class="form-group">
          <label class="form-label">Category / Genre</label>
          <input type="text" id="editBookCategory" value="${escapeHtml(b.category)}" class="form-control">
        </div>

        <div class="form-group">
          <label class="form-label">Total Copies in Inventory *</label>
          <input type="number" id="editBookCopies" min="1" max="100" value="${b.totalCopies}" required class="form-control">
        </div>

        <div class="form-group">
          <label class="form-label">Shelf Location *</label>
          <input type="text" id="editBookShelf" required value="${escapeHtml(b.shelf)}" class="form-control">
        </div>

        <div class="form-group form-full">
          <label class="form-label">Cover Image URL</label>
          <input type="url" id="editBookCover" value="${escapeHtml(b.coverUrl)}" class="form-control">
        </div>

        <div class="form-group form-full">
          <label class="form-label">Synopsis</label>
          <textarea id="editBookDesc" rows="3" class="form-control">${escapeHtml(b.description || '')}</textarea>
        </div>
      </div>

      <div style="margin-top:1.5rem; display:flex; justify-content:flex-end; gap:0.75rem;">
        <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
        <button type="submit" class="btn btn-primary">Save Changes</button>
      </div>
    </form>
  `;
  showModal(`Edit Book #${b.id}`, content);
}

function handleEditBookSubmit(e, bookId) {
  e.preventDefault();
  const updated = {
    title: document.getElementById("editBookTitle").value,
    author: document.getElementById("editBookAuthor").value,
    isbn: document.getElementById("editBookIsbn").value,
    category: document.getElementById("editBookCategory").value,
    totalCopies: Number(document.getElementById("editBookCopies").value),
    shelf: document.getElementById("editBookShelf").value,
    coverUrl: document.getElementById("editBookCover").value,
    description: document.getElementById("editBookDesc").value
  };

  window.libraryStorage.updateBook(bookId, updated);
  showToast("Book inventory updated!", "success");
  closeModal();
  renderAdminPortal();
  renderCatalogView();
  renderHomeView();
}

function confirmDeleteBook(bookId) {
  if (confirm(`Are you sure you want to delete book #${bookId} from library inventory?`)) {
    window.libraryStorage.deleteBook(bookId);
    showToast("Book deleted from inventory.", "info");
    renderAdminPortal();
    renderCatalogView();
    renderHomeView();
  }
}

/* ===================================================================
   Admin Add/Edit/Delete Study Material Modals
   (Year & Semester Wise)
   =================================================================== */
function openAddMaterialModal() {
  const content = `
    <form onsubmit="handleAddMaterialSubmit(event)">
      <div class="form-grid">
        <div class="form-group form-full">
          <label class="form-label">Resource Title *</label>
          <input type="text" id="addMatTitle" required placeholder="e.g. Mobile Computing - Unit Wise Question Bank" class="form-control">
        </div>

        <div class="form-group">
          <label class="form-label">Department *</label>
          <select id="addMatDept" required class="form-control">
            <option value="CSE">CSE</option>
            <option value="IT">IT</option>
            <option value="AIDS">AIDS</option>
            <option value="ECE">ECE</option>
            <option value="MECH">MECH</option>
            <option value="General">General</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Academic Year (1-4) *</label>
          <select id="addMatYear" required class="form-control">
            <option value="1">Year 1</option>
            <option value="2">Year 2</option>
            <option value="3" selected>Year 3</option>
            <option value="4">Year 4</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Semester (1-8) *</label>
          <select id="addMatSemester" required class="form-control">
            <option value="1">Semester 1</option>
            <option value="2">Semester 2</option>
            <option value="3">Semester 3</option>
            <option value="4">Semester 4</option>
            <option value="5">Semester 5</option>
            <option value="6" selected>Semester 6</option>
            <option value="7">Semester 7</option>
            <option value="8">Semester 8</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Category *</label>
          <select id="addMatCat" required class="form-control">
            <option value="Lecture Notes">Lecture Notes</option>
            <option value="Lab Manual">Lab Manual</option>
            <option value="Question Bank">Question Bank</option>
            <option value="Syllabus">Syllabus</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Subject Code *</label>
          <input type="text" id="addMatCode" required placeholder="e.g. CS8601" class="form-control">
        </div>

        <div class="form-group">
          <label class="form-label">Subject Name *</label>
          <input type="text" id="addMatSubject" required placeholder="e.g. Mobile Computing" class="form-control">
        </div>

        <div class="form-group">
          <label class="form-label">Faculty Author</label>
          <input type="text" id="addMatAuthor" value="Dept. Academic Committee" class="form-control">
        </div>

        <div class="form-group">
          <label class="form-label">Format / File Type</label>
          <select id="addMatFormat" class="form-control">
            <option value="PDF">PDF</option>
            <option value="ZIP">ZIP</option>
            <option value="DOCX">DOCX</option>
          </select>
        </div>

        <div class="form-group form-full">
          <label class="form-label">Short Summary</label>
          <input type="text" id="addMatSummary" required placeholder="Brief description of topics covered" class="form-control">
        </div>

        <div class="form-group form-full">
          <label class="form-label">Curriculum / Content Preview</label>
          <textarea id="addMatPreview" rows="3" placeholder="Unit 1: Introduction&#10;Unit 2: Architecture&#10;..." class="form-control"></textarea>
        </div>
      </div>

      <div style="margin-top:1.5rem; display:flex; justify-content:flex-end; gap:0.75rem;">
        <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
        <button type="submit" class="btn btn-primary">Publish Material</button>
      </div>
    </form>
  `;
  showModal("Upload Academic Material (Year/Sem Wise)", content);
}

function handleAddMaterialSubmit(e) {
  e.preventDefault();
  const matData = {
    title: document.getElementById("addMatTitle").value,
    department: document.getElementById("addMatDept").value,
    year: Number(document.getElementById("addMatYear").value),
    semester: Number(document.getElementById("addMatSemester").value),
    category: document.getElementById("addMatCat").value,
    subjectCode: document.getElementById("addMatCode").value,
    subjectName: document.getElementById("addMatSubject").value,
    author: document.getElementById("addMatAuthor").value,
    format: document.getElementById("addMatFormat").value,
    summary: document.getElementById("addMatSummary").value,
    contentPreview: document.getElementById("addMatPreview").value
  };

  window.libraryStorage.addMaterial(matData);
  showToast(`Material for Year ${matData.year} / Sem ${matData.semester} published!`, "success");
  closeModal();
  renderAdminPortal();
  renderMaterialsView();
  renderHomeView();
}

function openEditMaterialModal(matId) {
  const m = window.libraryStorage.getMaterialById(matId);
  if (!m) return;

  const content = `
    <form onsubmit="handleEditMaterialSubmit(event, '${m.id}')">
      <div class="form-grid">
        <div class="form-group form-full">
          <label class="form-label">Resource Title *</label>
          <input type="text" id="editMatTitle" required value="${escapeHtml(m.title)}" class="form-control">
        </div>

        <div class="form-group">
          <label class="form-label">Academic Year</label>
          <select id="editMatYear" class="form-control">
            <option value="1" ${m.year === 1 ? 'selected' : ''}>Year 1</option>
            <option value="2" ${m.year === 2 ? 'selected' : ''}>Year 2</option>
            <option value="3" ${m.year === 3 ? 'selected' : ''}>Year 3</option>
            <option value="4" ${m.year === 4 ? 'selected' : ''}>Year 4</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Semester</label>
          <select id="editMatSemester" class="form-control">
            ${[1,2,3,4,5,6,7,8].map(s => `
              <option value="${s}" ${m.semester === s ? 'selected' : ''}>Semester ${s}</option>
            `).join("")}
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Subject Code</label>
          <input type="text" id="editMatCode" value="${escapeHtml(m.subjectCode)}" class="form-control">
        </div>

        <div class="form-group">
          <label class="form-label">Subject Name</label>
          <input type="text" id="editMatSubject" value="${escapeHtml(m.subjectName)}" class="form-control">
        </div>

        <div class="form-group form-full">
          <label class="form-label">Summary</label>
          <input type="text" id="editMatSummary" value="${escapeHtml(m.summary)}" class="form-control">
        </div>

        <div class="form-group form-full">
          <label class="form-label">Curriculum / Content Preview</label>
          <textarea id="editMatPreview" rows="3" class="form-control">${escapeHtml(m.contentPreview || '')}</textarea>
        </div>
      </div>

      <div style="margin-top:1.5rem; display:flex; justify-content:flex-end; gap:0.75rem;">
        <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
        <button type="submit" class="btn btn-primary">Save Changes</button>
      </div>
    </form>
  `;
  showModal(`Edit Study Material #${m.id}`, content);
}

function handleEditMaterialSubmit(e, matId) {
  e.preventDefault();
  const updated = {
    title: document.getElementById("editMatTitle").value,
    year: Number(document.getElementById("editMatYear").value),
    semester: Number(document.getElementById("editMatSemester").value),
    subjectCode: document.getElementById("editMatCode").value,
    subjectName: document.getElementById("editMatSubject").value,
    summary: document.getElementById("editMatSummary").value,
    contentPreview: document.getElementById("editMatPreview").value
  };

  window.libraryStorage.updateMaterial(matId, updated);
  showToast("Study material updated successfully!", "success");
  closeModal();
  renderAdminPortal();
  renderMaterialsView();
}

function confirmDeleteMaterial(matId) {
  if (confirm(`Delete study material #${matId}?`)) {
    window.libraryStorage.deleteMaterial(matId);
    showToast("Material removed from repository.", "info");
    renderAdminPortal();
    renderMaterialsView();
    renderHomeView();
  }
}

/* ===================================================================
   Auth Modals (Student Login, Student Register, Admin Login)
   =================================================================== */
function openAuthModal(viewType = "student-login") {
  const content = `
    <div>
      <div class="tab-pills" style="margin-bottom:1.5rem;">
        <button class="tab-pill ${viewType === 'student-login' ? 'active' : ''}" onclick="openAuthModal('student-login')">
          Student Login
        </button>
        <button class="tab-pill ${viewType === 'student-register' ? 'active' : ''}" onclick="openAuthModal('student-register')">
          New Student Register
        </button>
        <button class="tab-pill ${viewType === 'admin-login' ? 'active' : ''}" onclick="openAuthModal('admin-login')">
          Librarian Admin Login
        </button>
      </div>

      <div id="authFormArea">
        ${renderAuthFormHTML(viewType)}
      </div>
    </div>
  `;

  showModal("Library Authentication System", content);
}

function renderAuthFormHTML(type) {
  if (type === "student-login") {
    return `
      <form onsubmit="handleStudentLoginSubmit(event)">
        <p style="color:var(--text-muted); font-size:0.88rem; margin-bottom:1.25rem;">
          Sign in using your student email or official Roll Number.
        </p>

        <div class="form-group" style="margin-bottom:1rem;">
          <label class="form-label">Email or Roll Number</label>
          <input type="text" id="stuLoginId" required placeholder="e.g. 21CS101 or aarav.sharma@college.edu" value="21CS101" class="form-control">
        </div>

        <div class="form-group" style="margin-bottom:1.5rem;">
          <label class="form-label">Password</label>
          <input type="password" id="stuLoginPass" required value="password123" class="form-control">
        </div>

        <div style="display:flex; justify-content:space-between; align-items:center;">
          <button type="button" class="btn btn-sm btn-secondary" onclick="quickLoginAs('student', '21CS101')">
            1-Click Demo (Aarav)
          </button>
          <button type="submit" class="btn btn-primary">Login as Student</button>
        </div>
      </form>
    `;
  } else if (type === "student-register") {
    return `
      <form onsubmit="handleStudentRegisterSubmit(event)">
        <p style="color:var(--text-muted); font-size:0.88rem; margin-bottom:1.25rem;">
          Create a new student membership account to borrow books and access study resources.
        </p>

        <div class="form-grid">
          <div class="form-group">
            <label class="form-label">Full Name *</label>
            <input type="text" id="regName" required placeholder="e.g. Priya Sundaram" class="form-control">
          </div>

          <div class="form-group">
            <label class="form-label">Roll Number *</label>
            <input type="text" id="regRoll" required placeholder="e.g. 23CS205" class="form-control">
          </div>

          <div class="form-group">
            <label class="form-label">College Email *</label>
            <input type="email" id="regEmail" required placeholder="priya@college.edu" class="form-control">
          </div>

          <div class="form-group">
            <label class="form-label">Department *</label>
            <select id="regDept" required class="form-control">
              <option value="CSE">CSE</option>
              <option value="IT">IT</option>
              <option value="AIDS">AIDS</option>
              <option value="ECE">ECE</option>
              <option value="MECH">MECH</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Academic Year (1-4) *</label>
            <select id="regYear" required class="form-control">
              <option value="1">Year 1</option>
              <option value="2">Year 2</option>
              <option value="3" selected>Year 3</option>
              <option value="4">Year 4</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Semester (1-8) *</label>
            <select id="regSem" required class="form-control">
              <option value="1">Sem 1</option>
              <option value="2">Sem 2</option>
              <option value="3">Sem 3</option>
              <option value="4">Sem 4</option>
              <option value="5">Sem 5</option>
              <option value="6" selected>Sem 6</option>
              <option value="7">Sem 7</option>
              <option value="8">Sem 8</option>
            </select>
          </div>

          <div class="form-group form-full">
            <label class="form-label">Password *</label>
            <input type="password" id="regPass" required placeholder="Choose a password" value="password123" class="form-control">
          </div>
        </div>

        <div style="margin-top:1.5rem; display:flex; justify-content:flex-end;">
          <button type="submit" class="btn btn-primary">Complete Registration</button>
        </div>
      </form>
    `;
  } else if (type === "admin-login") {
    return `
      <form onsubmit="handleAdminLoginSubmit(event)">
        <p style="color:var(--text-muted); font-size:0.88rem; margin-bottom:1.25rem;">
          Librarian credentials required to enter administration console.
        </p>

        <div class="form-group" style="margin-bottom:1rem;">
          <label class="form-label">Admin Email / Username</label>
          <input type="text" id="admLoginEmail" required value="admin@library.edu" class="form-control">
        </div>

        <div class="form-group" style="margin-bottom:1.5rem;">
          <label class="form-label">Admin Password</label>
          <input type="password" id="admLoginPass" required value="admin" class="form-control">
        </div>

        <div style="display:flex; justify-content:space-between; align-items:center;">
          <button type="button" class="btn btn-sm btn-secondary" onclick="quickLoginAs('admin')">
            1-Click Demo Fill
          </button>
          <button type="submit" class="btn btn-primary">Login as Librarian Admin</button>
        </div>
      </form>
    `;
  }
}

function handleStudentLoginSubmit(e) {
  e.preventDefault();
  const id = document.getElementById("stuLoginId").value.trim();
  const pass = document.getElementById("stuLoginPass").value;

  const student = window.libraryStorage.authenticate(id, pass, "student");
  if (student) {
    window.libraryStorage.setCurrentUser(student);
    updateAuthUI();
    showToast(`Welcome back, ${student.name}!`, "success");
    closeModal();
    navigateTo("student");
    renderStudentPortal();
  } else {
    showToast("Invalid Student Roll Number / Email or Password.", "error");
  }
}

function handleStudentRegisterSubmit(e) {
  e.preventDefault();
  const data = {
    name: document.getElementById("regName").value.trim(),
    rollNo: document.getElementById("regRoll").value.trim().toUpperCase(),
    email: document.getElementById("regEmail").value.trim(),
    department: document.getElementById("regDept").value,
    year: Number(document.getElementById("regYear").value),
    semester: Number(document.getElementById("regSem").value),
    password: document.getElementById("regPass").value
  };

  try {
    const student = window.libraryStorage.registerStudent(data);
    window.libraryStorage.setCurrentUser(student);
    updateAuthUI();
    showToast(`Registration successful! Welcome, ${student.name}.`, "success");
    closeModal();
    navigateTo("student");
    renderStudentPortal();
  } catch (err) {
    showToast(err.message, "error");
  }
}

function handleAdminLoginSubmit(e) {
  e.preventDefault();
  const email = document.getElementById("admLoginEmail").value.trim();
  const pass = document.getElementById("admLoginPass").value;

  const admin = window.libraryStorage.authenticate(email, pass, "admin");
  if (admin) {
    window.libraryStorage.setCurrentUser(admin);
    updateAuthUI();
    showToast("Authenticated as Librarian Administrator.", "success");
    closeModal();
    navigateTo("admin");
    renderAdminPortal();
  } else {
    showToast("Invalid admin credentials.", "error");
  }
}

function openUserProfileModal() {
  const user = window.libraryStorage.getCurrentUser();
  if (!user) return;

  const content = `
    <div>
      <div style="text-align:center; margin-bottom:1.5rem;">
        <div style="width:72px; height:72px; border-radius:50%; background:linear-gradient(135deg, var(--primary), var(--secondary)); color:#fff; display:flex; align-items:center; justify-content:center; font-size:1.8rem; font-weight:800; margin:0 auto 1rem;">
          ${user.name[0]}
        </div>
        <h3 style="font-size:1.4rem;">${escapeHtml(user.name)}</h3>
        <p style="color:var(--text-muted); font-size:0.9rem;">${escapeHtml(user.email)}</p>
        <span class="role-badge ${user.role === 'admin' ? 'admin' : 'student'}" style="margin-top:0.4rem; display:inline-block;">
          ${user.role.toUpperCase()}
        </span>
      </div>

      <div style="background-color:var(--bg-subtle); padding:1.25rem; border-radius:10px; margin-bottom:1.5rem; font-size:0.9rem; line-height:1.8;">
        ${user.role === 'student' ? `
          <div><strong>Student Roll No:</strong> ${user.rollNo}</div>
          <div><strong>Academic Department:</strong> ${user.department || 'CSE'}</div>
          <div><strong>Enrolled:</strong> Year ${user.year}, Semester ${user.semester}</div>
        ` : `
          <div><strong>Designation:</strong> ${user.designation || 'Chief Librarian'}</div>
          <div><strong>Access Level:</strong> Full Administrative Controls</div>
        `}
      </div>

      <div style="display:flex; justify-content:space-between; gap:0.75rem;">
        <button class="btn btn-secondary" onclick="closeModal()">Close</button>
        <button class="btn btn-danger" onclick="handleLogout(); closeModal();">Sign Out</button>
      </div>
    </div>
  `;
  showModal("Account Profile", content);
}

/* ===================================================================
   Contact Us Submission Form
   =================================================================== */
function handleContactSubmit(e) {
  e.preventDefault();
  const name = document.getElementById("contactName").value.trim();
  const email = document.getElementById("contactEmail").value.trim();
  const subject = document.getElementById("contactSubject").value;
  const message = document.getElementById("contactMessage").value.trim();

  window.libraryStorage.saveInquiry({ name, email, subject, message });

  showToast("Inquiry submitted! The library staff will respond shortly.", "success");
  e.target.reset();
}

/* ===================================================================
   UI Event Listeners
   =================================================================== */
function setupEventListeners() {
  // Catalog Live Search
  const catalogSearch = document.getElementById("catalogSearchInput");
  if (catalogSearch) {
    catalogSearch.addEventListener("input", (e) => {
      catalogSearchTerm = e.target.value;
      renderCatalogView();
    });
  }

  // Hero Quick Search
  const heroSearch = document.getElementById("heroSearchInput");
  if (heroSearch) {
    heroSearch.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        catalogSearchTerm = e.target.value;
        navigateTo("catalog");
        const cInp = document.getElementById("catalogSearchInput");
        if (cInp) cInp.value = catalogSearchTerm;
        renderCatalogView();
      }
    });
  }

  // Category filter chips
  document.querySelectorAll(".chip").forEach(chip => {
    chip.addEventListener("click", () => {
      document.querySelectorAll(".chip").forEach(c => c.classList.remove("active"));
      chip.classList.add("active");
      selectedCategory = chip.getAttribute("data-cat");
      renderCatalogView();
    });
  });

  // Availability checkbox
  const availCheck = document.getElementById("catalogAvailCheck");
  if (availCheck) {
    availCheck.addEventListener("change", (e) => {
      showOnlyAvailable = e.target.checked;
      renderCatalogView();
    });
  }

  // Sort selector
  const sortSelect = document.getElementById("catalogSortSelect");
  if (sortSelect) {
    sortSelect.addEventListener("change", (e) => {
      currentSort = e.target.value;
      renderCatalogView();
    });
  }

  // Materials Filters
  const matDept = document.getElementById("matDeptSelect");
  if (matDept) {
    matDept.addEventListener("change", (e) => {
      matDeptFilter = e.target.value;
      renderMaterialsView();
    });
  }
  const matYear = document.getElementById("matYearSelect");
  if (matYear) {
    matYear.addEventListener("change", (e) => {
      matYearFilter = e.target.value;
      renderMaterialsView();
    });
  }
  const matSem = document.getElementById("matSemSelect");
  if (matSem) {
    matSem.addEventListener("change", (e) => {
      matSemFilter = e.target.value;
      renderMaterialsView();
    });
  }
  const matCat = document.getElementById("matCatSelect");
  if (matCat) {
    matCat.addEventListener("change", (e) => {
      matCatFilter = e.target.value;
      renderMaterialsView();
    });
  }
  const matSearch = document.getElementById("matSearchInput");
  if (matSearch) {
    matSearch.addEventListener("input", (e) => {
      matSearchTerm = e.target.value;
      renderMaterialsView();
    });
  }

  // Theme Toggle
  const themeBtn = document.getElementById("themeToggleBtn");
  if (themeBtn) {
    themeBtn.addEventListener("click", toggleTheme);
  }
}

/* ===================================================================
   Modal Helpers
   =================================================================== */
function showModal(title, bodyHTML) {
  const overlay = document.getElementById("globalModalOverlay");
  const titleEl = document.getElementById("globalModalTitle");
  const bodyEl = document.getElementById("globalModalBody");

  if (overlay && titleEl && bodyEl) {
    titleEl.textContent = title;
    bodyEl.innerHTML = bodyHTML;
    overlay.classList.add("active");
  }
}

function closeModal() {
  const overlay = document.getElementById("globalModalOverlay");
  if (overlay) overlay.classList.remove("active");
}

// Close modal on backdrop click or close button
window.addEventListener("click", (e) => {
  const overlay = document.getElementById("globalModalOverlay");
  if (e.target === overlay || e.target.closest(".modal-close") || e.target.closest("[data-close-modal]")) {
    closeModal();
  }
});

// Close modal on Escape key
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeModal();
  }
});

/* ===================================================================
   Toast Notification System
   =================================================================== */
function showToast(message, type = "info") {
  const container = document.getElementById("toastContainer");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;

  let icon = `ℹ️`;
  if (type === "success") icon = `✅`;
  if (type === "error") icon = `⚠️`;
  if (type === "warning") icon = `🔔`;

  toast.innerHTML = `
    <span style="font-size:1.1rem;">${icon}</span>
    <span style="flex:1;">${escapeHtml(message)}</span>
    <button onclick="this.parentElement.remove()" style="background:none; border:none; cursor:pointer; color:var(--text-muted); font-size:1rem;">&times;</button>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(10px)";
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

/* ===================================================================
   Demo Reset Helper
   =================================================================== */
function resetDemoDatabase() {
  if (confirm("Reset all books, study materials, borrow records, and fines back to factory initial state?")) {
    window.libraryStorage.resetAllData();
    showToast("Demo database successfully reseeded!", "success");
    updateAuthUI();
    handleRoute();
  }
}

/* Utility to escape HTML and prevent XSS */
function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
