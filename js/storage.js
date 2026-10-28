/**
 * Athena Central Digital Library - Storage & State Management
 * Persistent localStorage storage manager for books, users, borrows, fines, and materials.
 */

const STORAGE_KEYS = {
  BOOKS: "athena_library_books",
  STUDENTS: "athena_library_students",
  BORROWS: "athena_library_borrows",
  MATERIALS: "athena_library_materials",
  FINES_CONFIG: "athena_library_fines_config",
  CURRENT_USER: "athena_library_current_user",
  INQUIRIES: "athena_library_inquiries"
};

class LibraryStorage {
  constructor() {
    this.initDefaults();
  }

  initDefaults() {
    if (!localStorage.getItem(STORAGE_KEYS.BOOKS)) {
      localStorage.setItem(STORAGE_KEYS.BOOKS, JSON.stringify(INITIAL_BOOKS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.STUDENTS)) {
      localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(INITIAL_STUDENTS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.BORROWS)) {
      localStorage.setItem(STORAGE_KEYS.BORROWS, JSON.stringify(INITIAL_BORROWS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.MATERIALS)) {
      localStorage.setItem(STORAGE_KEYS.MATERIALS, JSON.stringify(INITIAL_MATERIALS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.FINES_CONFIG)) {
      localStorage.setItem(STORAGE_KEYS.FINES_CONFIG, JSON.stringify(INITIAL_FINES_SETTING));
    }
    if (!localStorage.getItem(STORAGE_KEYS.INQUIRIES)) {
      localStorage.setItem(STORAGE_KEYS.INQUIRIES, JSON.stringify([]));
    }
  }

  resetAllData() {
    localStorage.removeItem(STORAGE_KEYS.BOOKS);
    localStorage.removeItem(STORAGE_KEYS.STUDENTS);
    localStorage.removeItem(STORAGE_KEYS.BORROWS);
    localStorage.removeItem(STORAGE_KEYS.MATERIALS);
    localStorage.removeItem(STORAGE_KEYS.FINES_CONFIG);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    localStorage.removeItem(STORAGE_KEYS.INQUIRIES);
    this.initDefaults();
  }

  // --- CURRENT USER AUTH ---
  getCurrentUser() {
    const raw = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  setCurrentUser(user) {
    if (!user) {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    } else {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    }
  }

  logout() {
    this.setCurrentUser(null);
  }

  // --- BOOKS CRUD ---
  getBooks() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.BOOKS)) || [];
    } catch {
      return [];
    }
  }

  saveBooks(books) {
    localStorage.setItem(STORAGE_KEYS.BOOKS, JSON.stringify(books));
  }

  getBookById(id) {
    return this.getBooks().find(b => b.id === id);
  }

  addBook(bookData) {
    const books = this.getBooks();
    const newBook = {
      id: "BOK-" + Math.floor(1000 + Math.random() * 9000),
      rating: 4.8,
      coverUrl: bookData.coverUrl || "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80",
      availableCopies: Number(bookData.totalCopies),
      ...bookData,
      totalCopies: Number(bookData.totalCopies)
    };
    books.unshift(newBook);
    this.saveBooks(books);
    return newBook;
  }

  updateBook(id, updatedFields) {
    const books = this.getBooks();
    const index = books.findIndex(b => b.id === id);
    if (index !== -1) {
      // maintain available copies sanity
      const oldBook = books[index];
      const newTotal = Number(updatedFields.totalCopies ?? oldBook.totalCopies);
      const issuedCount = oldBook.totalCopies - oldBook.availableCopies;
      const newAvail = Math.max(0, newTotal - issuedCount);

      books[index] = {
        ...oldBook,
        ...updatedFields,
        totalCopies: newTotal,
        availableCopies: updatedFields.availableCopies !== undefined ? Number(updatedFields.availableCopies) : newAvail
      };
      this.saveBooks(books);
      return books[index];
    }
    return null;
  }

  deleteBook(id) {
    const books = this.getBooks().filter(b => b.id !== id);
    this.saveBooks(books);
  }

  // --- STUDENTS / USERS ---
  getStudents() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.STUDENTS)) || [];
    } catch {
      return [];
    }
  }

  saveStudents(students) {
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
  }

  getStudentById(id) {
    return this.getStudents().find(s => s.id === id || s.rollNo === id);
  }

  registerStudent(studentData) {
    const students = this.getStudents();
    const exists = students.some(
      s => s.email.toLowerCase() === studentData.email.toLowerCase() ||
           s.rollNo.toUpperCase() === studentData.rollNo.toUpperCase()
    );
    if (exists) {
      throw new Error("Student with this Roll Number or Email already exists!");
    }

    const newStudent = {
      id: "STU-" + new Date().getFullYear() + "-" + Math.floor(100 + Math.random() * 900),
      role: "student",
      year: Number(studentData.year || 1),
      semester: Number(studentData.semester || 1),
      ...studentData
    };
    students.push(newStudent);
    this.saveStudents(students);
    return newStudent;
  }

  authenticate(identifier, password, role = "student") {
    if (role === "admin") {
      if ((identifier.toLowerCase() === INITIAL_ADMIN.email.toLowerCase() || identifier.toLowerCase() === "admin") &&
          password === INITIAL_ADMIN.password) {
        return { ...INITIAL_ADMIN };
      }
      return null;
    }

    const students = this.getStudents();
    const student = students.find(
      s => (s.email.toLowerCase() === identifier.toLowerCase() || s.rollNo.toUpperCase() === identifier.toUpperCase()) &&
           s.password === password
    );
    return student || null;
  }

  // --- BORROWS & ISSUES ---
  getBorrows() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.BORROWS)) || [];
    } catch {
      return [];
    }
  }

  saveBorrows(borrows) {
    localStorage.setItem(STORAGE_KEYS.BORROWS, JSON.stringify(borrows));
  }

  getFinesConfig() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.FINES_CONFIG)) || INITIAL_FINES_SETTING;
    } catch {
      return INITIAL_FINES_SETTING;
    }
  }

  saveFinesConfig(config) {
    localStorage.setItem(STORAGE_KEYS.FINES_CONFIG, JSON.stringify(config));
  }

  /**
   * Calculates live days overdue and fine amount.
   */
  calculateFineForBorrow(borrowRecord) {
    const config = this.getFinesConfig();
    const dueDate = new Date(borrowRecord.dueDate);
    const endDate = borrowRecord.returnDate ? new Date(borrowRecord.returnDate) : new Date();

    // calculate difference in days
    const diffTime = endDate.setHours(0,0,0,0) - dueDate.setHours(0,0,0,0);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > config.gracePeriodDays) {
      const overdueDays = diffDays - config.gracePeriodDays;
      const rawFine = overdueDays * config.dailyRate;
      const fine = Math.min(rawFine, config.maxFinePerBook);
      return {
        isOverdue: true,
        overdueDays,
        fineAmount: fine
      };
    }

    return {
      isOverdue: false,
      overdueDays: 0,
      fineAmount: 0
    };
  }

  /**
   * Refreshes borrow records with live calculated fine info
   */
  getProcessedBorrows() {
    const raw = this.getBorrows();
    return raw.map(b => {
      const fineInfo = this.calculateFineForBorrow(b);
      let status = b.status;
      if (b.returnDate) {
        status = "Returned";
      } else if (fineInfo.isOverdue) {
        status = "Overdue";
      } else {
        status = "Active";
      }

      return {
        ...b,
        status,
        calculatedFine: fineInfo.fineAmount,
        overdueDays: fineInfo.overdueDays
      };
    });
  }

  issueBook(studentId, bookId, issueDateStr, dueDateStr) {
    const books = this.getBooks();
    const book = books.find(b => b.id === bookId);
    if (!book) throw new Error("Book not found!");
    if (book.availableCopies <= 0) throw new Error("No copies available for issue!");

    const student = this.getStudentById(studentId);
    if (!student) throw new Error("Student not found!");

    // Decrement available copies
    book.availableCopies -= 1;
    this.saveBooks(books);

    // Create borrow record
    const borrows = this.getBorrows();
    const newBorrow = {
      id: "BOR-" + Math.floor(5000 + Math.random() * 5000),
      studentId: student.id,
      studentRoll: student.rollNo,
      studentName: student.name,
      bookId: book.id,
      bookTitle: book.title,
      issueDate: issueDateStr || new Date().toISOString().split("T")[0],
      dueDate: dueDateStr || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      returnDate: null,
      status: "Active",
      calculatedFine: 0,
      finePaid: false
    };

    borrows.unshift(newBorrow);
    this.saveBorrows(borrows);
    return newBorrow;
  }

  returnBook(borrowId, finePaid = false) {
    const borrows = this.getBorrows();
    const record = borrows.find(b => b.id === borrowId);
    if (!record) throw new Error("Borrow record not found!");
    if (record.returnDate) throw new Error("Book has already been returned!");

    const todayStr = new Date().toISOString().split("T")[0];
    record.returnDate = todayStr;
    record.status = "Returned";

    // Recalculate fine at return time
    const fineInfo = this.calculateFineForBorrow(record);
    record.calculatedFine = fineInfo.fineAmount;
    if (finePaid || record.calculatedFine === 0) {
      record.finePaid = true;
    }

    this.saveBorrows(borrows);

    // Increment available book copies
    const books = this.getBooks();
    const book = books.find(b => b.id === record.bookId);
    if (book) {
      book.availableCopies = Math.min(book.totalCopies, book.availableCopies + 1);
      this.saveBooks(books);
    }

    return record;
  }

  payFine(borrowId) {
    const borrows = this.getBorrows();
    const record = borrows.find(b => b.id === borrowId);
    if (!record) throw new Error("Borrow record not found!");
    record.finePaid = true;
    this.saveBorrows(borrows);
    return record;
  }

  makeCustomFine(borrowId, amount) {
    const borrows = this.getBorrows();
    const record = borrows.find(b => b.id === borrowId);
    if (!record) throw new Error("Borrow record not found!");
    record.calculatedFine = Number(amount);
    record.finePaid = false;
    this.saveBorrows(borrows);
    return record;
  }

  // --- STUDY MATERIALS (YEAR & SEMESTER WISE) ---
  getMaterials() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.MATERIALS)) || [];
    } catch {
      return [];
    }
  }

  saveMaterials(materials) {
    localStorage.setItem(STORAGE_KEYS.MATERIALS, JSON.stringify(materials));
  }

  getMaterialById(id) {
    return this.getMaterials().find(m => m.id === id);
  }

  addMaterial(materialData) {
    const materials = this.getMaterials();
    const newMaterial = {
      id: "MAT-" + Math.floor(100 + Math.random() * 900),
      uploadDate: new Date().toISOString().split("T")[0],
      downloads: 0,
      fileSize: "2.4 MB",
      format: materialData.format || "PDF",
      year: Number(materialData.year),
      semester: Number(materialData.semester),
      ...materialData
    };
    materials.unshift(newMaterial);
    this.saveMaterials(materials);
    return newMaterial;
  }

  updateMaterial(id, updatedData) {
    const materials = this.getMaterials();
    const index = materials.findIndex(m => m.id === id);
    if (index !== -1) {
      materials[index] = {
        ...materials[index],
        ...updatedData,
        year: Number(updatedData.year ?? materials[index].year),
        semester: Number(updatedData.semester ?? materials[index].semester)
      };
      this.saveMaterials(materials);
      return materials[index];
    }
    return null;
  }

  deleteMaterial(id) {
    const materials = this.getMaterials().filter(m => m.id !== id);
    this.saveMaterials(materials);
  }

  incrementMaterialDownload(id) {
    const materials = this.getMaterials();
    const mat = materials.find(m => m.id === id);
    if (mat) {
      mat.downloads = (mat.downloads || 0) + 1;
      this.saveMaterials(materials);
    }
  }

  // --- CONTACT / INQUIRIES ---
  saveInquiry(inquiry) {
    const inquiries = JSON.parse(localStorage.getItem(STORAGE_KEYS.INQUIRIES)) || [];
    const item = {
      id: "INQ-" + Date.now(),
      createdAt: new Date().toLocaleString(),
      ...inquiry
    };
    inquiries.unshift(item);
    localStorage.setItem(STORAGE_KEYS.INQUIRIES, JSON.stringify(inquiries));
    return item;
  }

  getInquiries() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.INQUIRIES)) || [];
    } catch {
      return [];
    }
  }
}

// Global storage instance
window.libraryStorage = new LibraryStorage();
