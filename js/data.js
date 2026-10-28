/**
 * Athena Central Digital Library - Initial Seed Data
 * Contains realistic books, students, academic materials, and borrow history.
 */

const INITIAL_BOOKS = [
  {
    id: "BOK-1001",
    title: "Introduction to Algorithms (CLRS)",
    author: "Thomas H. Cormen, Charles E. Leiserson",
    isbn: "978-0262033848",
    category: "Computer Science",
    department: "CSE",
    shelf: "Rack CS-04 / Shelf B",
    year: 2022,
    totalCopies: 8,
    availableCopies: 5,
    rating: 4.9,
    coverUrl: "https://images.unsplash.com/photo-1532012164546-f432f2e3777a?auto=format&fit=crop&w=600&q=80",
    description: "Comprehensive textbook covering modern computer algorithms, complexity analysis, dynamic programming, and advanced data structures. Indispensable for engineering students."
  },
  {
    id: "BOK-1002",
    title: "Clean Code: A Handbook of Agile Software Craftsmanship",
    author: "Robert C. Martin",
    isbn: "978-0132350884",
    category: "Software Engineering",
    department: "CSE",
    shelf: "Rack CS-02 / Shelf A",
    year: 2020,
    totalCopies: 6,
    availableCopies: 2,
    rating: 4.8,
    coverUrl: "https://images.unsplash.com/photo-1516116211227-bbc13c7a6fc5?auto=format&fit=crop&w=600&q=80",
    description: "A timeless guide on writing readable, maintainable, and robust code. Teaches the values of a software craftsman and code hygiene."
  },
  {
    id: "BOK-1003",
    title: "Artificial Intelligence: A Modern Approach",
    author: "Stuart Russell, Peter Norvig",
    isbn: "978-0134610993",
    category: "Artificial Intelligence",
    department: "AIDS",
    shelf: "Rack AI-01 / Shelf C",
    year: 2021,
    totalCopies: 5,
    availableCopies: 3,
    rating: 4.9,
    coverUrl: "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=600&q=80",
    description: "The definitive authority on AI concepts, intelligent agents, search algorithms, probabilistic reasoning, machine learning, and deep neural architectures."
  },
  {
    id: "BOK-1004",
    title: "Database System Concepts (7th Edition)",
    author: "Abraham Silberschatz, Henry F. Korth",
    isbn: "978-0078022159",
    category: "Database Systems",
    department: "IT",
    shelf: "Rack DB-03 / Shelf D",
    year: 2020,
    totalCopies: 7,
    availableCopies: 4,
    rating: 4.7,
    coverUrl: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80",
    description: "Foundational principles of database design, relational algebra, SQL transactions, concurrency control, and distributed storage engines."
  },
  {
    id: "BOK-1005",
    title: "Computer Networks: A Systems Approach",
    author: "Larry L. Peterson, Bruce S. Davie",
    isbn: "978-0123850591",
    category: "Networking",
    department: "IT",
    shelf: "Rack NET-01 / Shelf B",
    year: 2019,
    totalCopies: 4,
    availableCopies: 1,
    rating: 4.6,
    coverUrl: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=600&q=80",
    description: "Explores the design principles of the internet, TCP/IP stack, socket programming, routing protocols, and cloud network architectures."
  },
  {
    id: "BOK-1006",
    title: "Electronic Devices and Circuit Theory",
    author: "Robert L. Boylestad, Louis Nashelsky",
    isbn: "978-0132622264",
    category: "Electronics",
    department: "ECE",
    shelf: "Rack EC-02 / Shelf A",
    year: 2018,
    totalCopies: 6,
    availableCopies: 4,
    rating: 4.7,
    coverUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80",
    description: "Comprehensive introduction to semiconductor physics, diodes, bipolar junction transistors (BJTs), FET amplifiers, and operational amplifiers."
  },
  {
    id: "BOK-1007",
    title: "Higher Engineering Mathematics",
    author: "Dr. B.S. Grewal",
    isbn: "978-8174091955",
    category: "Mathematics",
    department: "General",
    shelf: "Rack MATH-05 / Shelf A",
    year: 2021,
    totalCopies: 10,
    availableCopies: 7,
    rating: 4.8,
    coverUrl: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=600&q=80",
    description: "The gold standard reference for undergraduate engineering mathematics including linear algebra, differential calculus, Fourier transforms, and complex variables."
  },
  {
    id: "BOK-1008",
    title: "Operating System Concepts (Dinosaur Book)",
    author: "Silberschatz, Galvin, Gagne",
    isbn: "978-1119456339",
    category: "Computer Science",
    department: "CSE",
    shelf: "Rack CS-05 / Shelf C",
    year: 2021,
    totalCopies: 6,
    availableCopies: 0,
    rating: 4.8,
    coverUrl: "https://images.unsplash.com/photo-1629654297299-c8506221ca97?auto=format&fit=crop&w=600&q=80",
    description: "Covers process synchronization, threads, deadlocks, memory management, virtual memory, and file systems implementation across Linux and Windows."
  },
  {
    id: "BOK-1009",
    title: "Engineering Mechanics: Statics and Dynamics",
    author: "R.C. Hibbeler",
    isbn: "978-0133918922",
    category: "Mechanical",
    department: "MECH",
    shelf: "Rack ME-01 / Shelf B",
    year: 2019,
    totalCopies: 5,
    availableCopies: 3,
    rating: 4.6,
    coverUrl: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80",
    description: "Vector analysis, equilibrium of rigid bodies, structural trusses, friction, kinematics of particles, and impulse-momentum equations."
  },
  {
    id: "BOK-1010",
    title: "Design of Machine Elements",
    author: "V.B. Bhandari",
    isbn: "978-9339221126",
    category: "Mechanical",
    department: "MECH",
    shelf: "Rack ME-03 / Shelf C",
    year: 2020,
    totalCopies: 4,
    availableCopies: 2,
    rating: 4.7,
    coverUrl: "https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=600&q=80",
    description: "Principles of mechanical component design, stress concentrations, shafts, keys, couplings, welded joints, gear trains, and rolling contact bearings."
  },
  {
    id: "BOK-1011",
    title: "Sapiens: A Brief History of Humankind",
    author: "Yuval Noah Harari",
    isbn: "978-0062316097",
    category: "Humanities & History",
    department: "General",
    shelf: "Rack LIT-02 / Shelf B",
    year: 2015,
    totalCopies: 4,
    availableCopies: 3,
    rating: 4.9,
    coverUrl: "https://images.unsplash.com/photo-1461360370896-922624d12aa1?auto=format&fit=crop&w=600&q=80",
    description: "Explores how biology and history have defined humans and enhanced our understanding of society, culture, and our collective destiny."
  },
  {
    id: "BOK-1012",
    title: "Python Data Science Handbook",
    author: "Jake VanderPlas",
    isbn: "978-1491912058",
    category: "Data Science",
    department: "AIDS",
    shelf: "Rack AI-03 / Shelf A",
    year: 2022,
    totalCopies: 7,
    availableCopies: 5,
    rating: 4.8,
    coverUrl: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=600&q=80",
    description: "Essential guide to computational and statistical tools in Python: IPython, NumPy, Pandas, Matplotlib, Scikit-Learn, and machine learning pipelines."
  }
];

const INITIAL_STUDENTS = [
  {
    id: "STU-2024-001",
    rollNo: "21CS101",
    name: "Aarav Sharma",
    email: "aarav.sharma@college.edu",
    department: "CSE",
    year: 3,
    semester: 6,
    phone: "+91 98765 43210",
    role: "student",
    password: "password123"
  },
  {
    id: "STU-2024-002",
    rollNo: "22IT204",
    name: "Diya Patel",
    email: "diya.patel@college.edu",
    department: "IT",
    year: 2,
    semester: 4,
    phone: "+91 98765 12345",
    role: "student",
    password: "password123"
  },
  {
    id: "STU-2024-003",
    rollNo: "23AI315",
    name: "Rohan Varma",
    email: "rohan.varma@college.edu",
    department: "AIDS",
    year: 1,
    semester: 2,
    phone: "+91 98451 98765",
    role: "student",
    password: "password123"
  },
  {
    id: "STU-2024-004",
    rollNo: "20ME402",
    name: "Meera Krishnan",
    email: "meera.krishnan@college.edu",
    department: "MECH",
    year: 4,
    semester: 8,
    phone: "+91 98112 34567",
    role: "student",
    password: "password123"
  }
];

const INITIAL_ADMIN = {
  id: "ADM-001",
  name: "Dr. Lakshmi Raman",
  email: "admin@library.edu",
  role: "admin",
  designation: "Chief Librarian & Head of Information Resource Centre",
  password: "admin"
};

/**
 * Seed borrow records.
 * Some records have past due date to demonstrate overdue fine calculation.
 */
const INITIAL_BORROWS = [
  {
    id: "BOR-5001",
    studentId: "STU-2024-001",
    studentRoll: "21CS101",
    studentName: "Aarav Sharma",
    bookId: "BOK-1002",
    bookTitle: "Clean Code: A Handbook of Agile Software Craftsmanship",
    issueDate: "2026-10-01",
    dueDate: "2026-10-15", // overdue
    returnDate: null,
    status: "Overdue",
    calculatedFine: 35, // 7 days overdue * ₹5
    finePaid: false
  },
  {
    id: "BOR-5002",
    studentId: "STU-2024-001",
    studentRoll: "21CS101",
    studentName: "Aarav Sharma",
    bookId: "BOK-1004",
    bookTitle: "Database System Concepts (7th Edition)",
    issueDate: "2026-10-14",
    dueDate: "2026-10-28", // Active
    returnDate: null,
    status: "Active",
    calculatedFine: 0,
    finePaid: false
  },
  {
    id: "BOR-5003",
    studentId: "STU-2024-002",
    studentRoll: "22IT204",
    studentName: "Diya Patel",
    bookId: "BOK-1008",
    bookTitle: "Operating System Concepts (Dinosaur Book)",
    issueDate: "2026-09-20",
    dueDate: "2026-10-04",
    returnDate: null,
    status: "Overdue",
    calculatedFine: 90, // 18 days overdue * ₹5
    finePaid: false
  },
  {
    id: "BOR-5004",
    studentId: "STU-2024-003",
    studentRoll: "23AI315",
    studentName: "Rohan Varma",
    bookId: "BOK-1003",
    bookTitle: "Artificial Intelligence: A Modern Approach",
    issueDate: "2026-10-18",
    dueDate: "2026-11-01",
    returnDate: null,
    status: "Active",
    calculatedFine: 0,
    finePaid: false
  },
  {
    id: "BOR-5005",
    studentId: "STU-2024-001",
    studentRoll: "21CS101",
    studentName: "Aarav Sharma",
    bookId: "BOK-1001",
    bookTitle: "Introduction to Algorithms (CLRS)",
    issueDate: "2026-09-01",
    dueDate: "2026-09-15",
    returnDate: "2026-09-14",
    status: "Returned",
    calculatedFine: 0,
    finePaid: true
  }
];

/**
 * Academic Study Materials organized Year-wise and Semester-wise
 */
const INITIAL_MATERIALS = [
  {
    id: "MAT-301",
    title: "Advanced Data Structures & Algorithms - Complete Notes",
    department: "CSE",
    year: 3,
    semester: 5,
    subjectCode: "CS8501",
    subjectName: "Data Structures & Algorithms",
    category: "Lecture Notes",
    format: "PDF",
    author: "Prof. K. Venkatesh",
    uploadDate: "2026-08-15",
    downloads: 342,
    fileSize: "4.2 MB",
    summary: "Detailed unit-wise notes covering Red-Black Trees, B-Trees, Dynamic Programming paradigms, Graph Algorithms, and NP-Completeness.",
    contentPreview: "Unit 1: Balanced Search Trees (AVL, Red-Black Trees, Splay Trees)\nUnit 2: Priority Queues & Fibonacci Heaps\nUnit 3: Disjoint Sets & Union-Find\nUnit 4: Advanced Graph Algorithms (Tarjan's, Dinic's Max Flow)\nUnit 5: NP-Completeness and Approximation Algorithms"
  },
  {
    id: "MAT-302",
    title: "Internet Programming - Lab Manual & Source Code",
    department: "CSE",
    year: 3,
    semester: 6,
    subjectCode: "CS8602",
    subjectName: "Internet Programming",
    category: "Lab Manual",
    format: "ZIP/PDF",
    author: "Dept. of Computer Science",
    uploadDate: "2026-09-02",
    downloads: 512,
    fileSize: "6.8 MB",
    summary: "Complete lab exercises: HTML5, CSS3, Responsive Design, JavaScript DOM, AJAX, REST APIs, Session Management, and Database Integration.",
    contentPreview: "Exp 1: Responsive Web Page Design using CSS Grid and Flexbox\nExp 2: Client-side Form Validation with JavaScript Regex\nExp 3: Dynamic Single Page Applications with Local Storage\nExp 4: RESTful API Consumption and Asynchronous Data Fetching"
  },
  {
    id: "MAT-303",
    title: "Machine Learning & Neural Networks - End-Sem Question Bank",
    department: "AIDS",
    year: 3,
    semester: 6,
    subjectCode: "AI8601",
    subjectName: "Machine Learning",
    category: "Question Bank",
    format: "PDF",
    author: "Academic Council",
    uploadDate: "2026-09-10",
    downloads: 420,
    fileSize: "2.5 MB",
    summary: "Solved university question papers from 2021-2025 with step-by-step mathematical derivations and architectural diagrams.",
    contentPreview: "Part A: 2-Mark Short Answer Questions (Concepts, Equations, Loss functions)\nPart B: 13-Mark Analytical Questions (Backpropagation, SVM Kernels, Decision Trees, CNN Filters)\nPart C: 15-Mark Application Case Studies"
  },
  {
    id: "MAT-201",
    title: "Database Management Systems - Normalized Design & SQL Guide",
    department: "IT",
    year: 2,
    semester: 4,
    subjectCode: "IT8401",
    subjectName: "Database Systems",
    category: "Lecture Notes",
    format: "PDF",
    author: "Dr. Sandeep Rao",
    uploadDate: "2026-08-20",
    downloads: 290,
    fileSize: "3.7 MB",
    summary: "Comprehensive guide to 1NF to BCNF normalization, E-R mapping, complex SQL joins, indexing techniques, and ACID transactions.",
    contentPreview: "Module 1: Relational Model & Relational Algebra\nModule 2: SQL DDL, DML, Subqueries, Stored Procedures & Triggers\nModule 3: Normal Forms (1NF, 2NF, 3NF, BCNF, 4NF)\nModule 4: Concurrency, Locking & 2PL Protocols"
  },
  {
    id: "MAT-101",
    title: "Engineering Mathematics I - Calculus & Differential Equations",
    department: "General",
    year: 1,
    semester: 1,
    subjectCode: "MA8151",
    subjectName: "Engineering Mathematics I",
    category: "Lecture Notes",
    format: "PDF",
    author: "Mathematics Faculty Group",
    uploadDate: "2026-07-28",
    downloads: 680,
    fileSize: "5.1 MB",
    summary: "Curated problem sheets, step-by-step calculus proofs, matrices eigenvalues/eigenvectors, and Taylor series expansions.",
    contentPreview: "Chapter 1: Matrices - Cayley-Hamilton Theorem, Diagonalization\nChapter 2: Differential Calculus - Curvature, Evolutes\nChapter 3: Functions of Several Variables - Jacobians, Maxima-Minima\nChapter 4: Integral Calculus - Beta & Gamma Functions"
  },
  {
    id: "MAT-401",
    title: "Cloud Computing & DevOps - Semester 7 Curriculum & Syllabus",
    department: "CSE",
    year: 4,
    semester: 7,
    subjectCode: "CS8703",
    subjectName: "Cloud Architecture",
    category: "Syllabus",
    format: "PDF",
    author: "Curriculum Board",
    uploadDate: "2026-06-12",
    downloads: 185,
    fileSize: "1.2 MB",
    summary: "Prescribed university syllabus, evaluation scheme, recommended textbooks, and hands-on laboratory requirements for AWS/Docker/Kubernetes.",
    contentPreview: "Course Objectives:\n1. Understand Virtualization, Cloud service models (IaaS, PaaS, SaaS)\n2. Hands-on Docker containerization & microservices\n3. CI/CD pipelines with GitHub Actions\n4. Cloud security, IAM, and compliance"
  },
  {
    id: "MAT-202",
    title: "Analog and Digital Electronics - Formulas & Circuit Diagrams",
    department: "ECE",
    year: 2,
    semester: 3,
    subjectCode: "EC8352",
    subjectName: "Analog Electronics",
    category: "Lecture Notes",
    format: "PDF",
    author: "Prof. Priya Nair",
    uploadDate: "2026-08-30",
    downloads: 310,
    fileSize: "4.8 MB",
    summary: "Formula handbook, BJT biasing circuits, frequency response curves, Op-Amp 741 configurations, and multivibrator circuits.",
    contentPreview: "Formulas:\n- Voltage Gain Av = -gm * (rc || RL)\n- Op-Amp Inverting Gain = -Rf / R1\n- Slew Rate = dVo/dt |max\n- 555 Timer frequency calculation f = 1.44 / ((R1 + 2*R2)*C)"
  }
];

const INITIAL_FINES_SETTING = {
  dailyRate: 5, // ₹5 or $5 per day overdue
  maxFinePerBook: 250,
  gracePeriodDays: 0
};
