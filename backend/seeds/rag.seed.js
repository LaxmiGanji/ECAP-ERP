const seedData = [
  // --- 1. LIBRARY CATALOGS ---
  {
    title: "Introduction to Algorithms (4th Edition)",
    documentType: "catalog",
    author: "Thomas H. Cormen, Charles E. Leiserson, Ronald L. Rivest, Clifford Stein",
    publisher: "MIT Press",
    publishedYear: 2022,
    branch: "Computer Science Engineering",
    subject: "Data Structures and Algorithms",
    semester: 3,
    rackNumber: "CS-A12",
    bookCode: "BK-CS-101",
    quantity: 10,
    availableCount: 7,
    tags: ["Algorithms", "Data Structures", "Sorting", "Graph Theory", "Dynamic Programming", "Cormen"],
    summary: "The definitive guide to computer algorithms covering divide-and-conquer, greedy algorithms, graph theory, and dynamic programming.",
    content: "Comprehensive book on computer algorithms. Topics include: Growth of Functions, Recurrences, Probabilistic Analysis, Heap Sort, Quick Sort, Radix Sort, Red-Black Trees, Dynamic Programming, Greedy Algorithms, Amortized Analysis, B-Trees, Graph Algorithms, Minimum Spanning Trees, Shortest Paths, Maximum Flow, Multithreaded Algorithms, Matrix Operations, Linear Programming, Polynomials and FFT, Number-Theoretic Algorithms, NP-Completeness, and Approximation Algorithms. Located in Central Library Section CS-A12.",
  },
  {
    title: "Artificial Intelligence: A Modern Approach (4th Edition)",
    documentType: "catalog",
    author: "Stuart Russell, Peter Norvig",
    publisher: "Pearson",
    publishedYear: 2020,
    branch: "Artificial Intelligence & Machine Learning",
    subject: "Artificial Intelligence",
    semester: 5,
    rackNumber: "AI-B04",
    bookCode: "BK-AI-201",
    quantity: 8,
    availableCount: 4,
    tags: ["Artificial Intelligence", "Machine Learning", "Neural Networks", "Robotics", "Search Algorithms", "Norvig"],
    summary: "The standard textbook in artificial intelligence covering intelligent agents, search algorithms, knowledge representation, neural networks, and ethics.",
    content: "Comprehensive AI textbook by Russell & Norvig. Key chapters include: Intelligent Agents, Problem-Solving by Searching, Adversarial Search, Constraint Satisfaction Problems, Logical Agents, First-Order Logic, Knowledge Representation, Automated Planning, Probabilistic Reasoning, Machine Learning, Deep Learning, Reinforcement Learning, Natural Language Processing, Computer Vision, and Robotics. Located in AI Research Lab Section AI-B04.",
  },
  {
    title: "Database System Concepts (7th Edition)",
    documentType: "catalog",
    author: "Abraham Silberschatz, Henry F. Korth, S. Sudarshan",
    publisher: "McGraw-Hill",
    publishedYear: 2019,
    branch: "Computer Science Engineering",
    subject: "Database Management Systems",
    semester: 4,
    rackNumber: "CS-D08",
    bookCode: "BK-CS-104",
    quantity: 12,
    availableCount: 9,
    tags: ["SQL", "Database", "DBMS", "Relational Algebra", "Normalization", "Transactions", "NoSQL"],
    summary: "Essential textbook covering relational database design, SQL syntax, indexing, B+ trees, ACID transactions, and distributed databases.",
    content: "Core textbook for DBMS course. Covers Relational Model, SQL Query Language, Complex Queries, Database Design & Entity-Relationship Model, Normalization (1NF, 2NF, 3NF, BCNF), Indexing and Hashing, Query Processing & Optimization, Transaction Management, Concurrency Control, Recovery Systems, Database Architecture, Parallel & Distributed Databases, Object-Based Databases, and NoSQL Systems. Located in Library Floor 2 CS-D08.",
  },
  {
    title: "Operating System Concepts (10th Edition)",
    documentType: "catalog",
    author: "Abraham Silberschatz, Peter B. Galvin, Greg Gagne",
    publisher: "Wiley",
    publishedYear: 2018,
    branch: "Computer Science Engineering",
    subject: "Operating Systems",
    semester: 4,
    rackNumber: "CS-C15",
    bookCode: "BK-CS-105",
    quantity: 15,
    availableCount: 11,
    tags: ["Operating Systems", "Linux", "Processes", "Threads", "Deadlocks", "Virtual Memory", "Paging"],
    summary: "Comprehensive guide to process management, memory virtual memory, file systems, synchronization, and kernel architectures.",
    content: "Standard operating system course book (Dinosaur book). Covers Operating System Structures, Processes, Threads & Concurrency, CPU Scheduling, Process Synchronization (Semaphores, Mutex, Monitors), Deadlocks (Banker's Algorithm), Main Memory Management (Paging, Segmentation), Virtual Memory (Page Replacement Algorithms), Mass Storage Structure, File-System Interface & Implementation, I/O Systems, System Protection, and Security. Located in Rack CS-C15.",
  },
  {
    title: "Computer Networking: A Top-Down Approach (8th Edition)",
    documentType: "catalog",
    author: "James F. Kurose, Keith W. Ross",
    publisher: "Pearson",
    publishedYear: 2021,
    branch: "Computer Science Engineering",
    subject: "Computer Networks",
    semester: 5,
    rackNumber: "CS-N02",
    bookCode: "BK-CS-108",
    quantity: 7,
    availableCount: 5,
    tags: ["Networks", "TCP/IP", "HTTP", "DNS", "Routing Algorithms", "Sockets", "Cybersecurity"],
    summary: "Networking textbook structuring concepts from Application Layer (HTTP, DNS) down to Data Link & Physical Layers with Wireshark labs.",
    content: "Top-down networking approach. Topics: Computer Networks and the Internet, Application Layer (HTTP, SMTP, DNS, Peer-to-Peer, Socket Programming), Transport Layer (UDP, TCP reliable data transfer, Congestion Control), Network Layer (Data Plane & Control Plane, IP Protocol, OSPF, BGP routing), Link Layer (Ethernet, Switches, ARP), Wireless & Mobile Networks, Network Security (Cryptography, Firewalls, IPsec). Located in Rack CS-N02.",
  },
  {
    title: "Digital Design and Computer Architecture",
    documentType: "catalog",
    author: "David Harris, Sarah Harris",
    publisher: "Morgan Kaufmann",
    publishedYear: 2021,
    branch: "Electronics & Communication Engineering",
    subject: "Digital Electronics & Computer Architecture",
    semester: 3,
    rackNumber: "ECE-E05",
    bookCode: "BK-ECE-302",
    quantity: 9,
    availableCount: 6,
    tags: ["Digital Logic", "Verilog", "HDL", "MIPS", "RISC-V", "Registers", "Logic Gates"],
    summary: "Takes readers from logic gates and Boolean algebra through Verilog/VHDL to building a complete RISC microarchitecture.",
    content: "Covers From Zero to One: Logic Gates, Boolean Algebra, Combinational Logic, Sequential Logic, Hardware Description Languages (Verilog and VHDL), Digital Building Blocks, Architecture (MIPS & RISC-V microarchitectures), Memory Systems (Caches, SRAM, DRAM), and I/O Systems. Located in ECE Section Rack ECE-E05.",
  },

  // --- 2. RESEARCH PAPERS ---
  {
    title: "Attention Is All You Need (Transformer Architecture)",
    documentType: "research_paper",
    author: "Ashish Vaswani, Noam Shazeer, Niki Parmar, Jakob Uszkoreit, Llion Jones, Aidan N. Gomez, Łukasz Kaiser, Illia Polosukhin",
    journal: "Advances in Neural Information Processing Systems (NeurIPS 2017)",
    publishedYear: 2017,
    branch: "Artificial Intelligence & Machine Learning",
    subject: "Deep Learning & Natural Language Processing",
    semester: 7,
    fileUrl: "https://arxiv.org/pdf/1706.03762.pdf",
    tags: ["Transformers", "Attention Mechanism", "Deep Learning", "NLP", "BERT", "GPT", "Neural Networks"],
    summary: "Landmark paper introducing the Transformer architecture, dispensing with recurrence and convolutions entirely, relying solely on self-attention mechanisms.",
    content: "Abstract & Core Contributions: We propose the Transformer, a model architecture eschewing recurrence and instead relying entirely on an attention mechanism to draw global dependencies between input and output. The Transformer allows for significantly more parallelization and can reach a new state of the art in translation quality after being trained for as little as twelve hours on eight P100 GPUs. Key components: Multi-Head Self-Attention, Positional Encoding, Scaled Dot-Product Attention, Residual Connections, and Feed-Forward Networks. Foundation for modern LLMs like GPT-4, LLaMA, and Gemini.",
  },
  {
    title: "Deep Residual Learning for Image Recognition (ResNet)",
    documentType: "research_paper",
    author: "Kaiming He, Xiangyu Zhang, Shaoqing Ren, Jian Sun",
    journal: "IEEE Conference on Computer Vision and Pattern Recognition (CVPR 2016)",
    publishedYear: 2016,
    branch: "Artificial Intelligence & Machine Learning",
    subject: "Computer Vision & Image Processing",
    semester: 6,
    fileUrl: "https://arxiv.org/pdf/1512.03385.pdf",
    tags: ["ResNet", "Computer Vision", "Convolutional Neural Networks", "CNN", "Deep Learning", "ImageNet"],
    summary: "Introduces residual learning frameworks (shortcut connections) allowing neural networks with over 150 layers to be trained without vanishing gradients.",
    content: "Deeper neural networks are more difficult to train. We present a residual learning framework to ease the training of networks that are substantially deeper than those used previously. We explicitly reformulate the layers as learning residual functions with reference to the layer inputs, instead of learning unreferenced functions. We evaluate our residual nets on ImageNet dataset with a depth of up to 152 layers—8x deeper than VGG nets but still having lower complexity. Won 1st place in ILSVRC 2015 classification task.",
  },
  {
    title: "Federated Learning: Strategies for Improving Communication Efficiency",
    documentType: "research_paper",
    author: "Jakub Konečný, H. Brendan McMahan, Felix X. Yu, Peter Richtárik, Ananda Theertha Suresh, Dave Bacon",
    journal: "ACM Conference on Embedded Networked Sensor Systems",
    publishedYear: 2020,
    branch: "Computer Science Engineering",
    subject: "Distributed Systems & Cybersecurity",
    semester: 8,
    fileUrl: "https://arxiv.org/pdf/1610.05492.pdf",
    tags: ["Federated Learning", "Privacy", "Distributed Machine Learning", "Edge Computing", "Security"],
    summary: "Presents decentralized machine learning mechanisms where edge devices collaboratively train a shared model without sharing raw user data.",
    content: "Federated Learning enables mobile devices to collaboratively learn a shared prediction model while keeping all the training data on device, decoupling the ability to do machine learning from the need to store the data in the cloud. We introduce two key techniques: Structured Updates (using restricted parameter spaces) and Sketched Updates (using lossy compression and quantization) to reduce uplink communication bandwidth by up to 100x.",
  },
  {
    title: "Lightweight Edge AI for IoT Structural Health Monitoring in Smart Cities",
    documentType: "research_paper",
    author: "Dr. R. Sharma, Prof. Ganji Laxmi, Dr. K. V. Rao",
    journal: "IEEE Internet of Things Journal",
    publishedYear: 2024,
    branch: "Electronics & Communication Engineering",
    subject: "Internet of Things & Embedded Systems",
    semester: 7,
    fileUrl: "https://ieee.org/papers/iot-structural-health-monitoring-2024.pdf",
    tags: ["IoT", "Edge AI", "Structural Health", "Smart Cities", "Sensors", "Microcontrollers"],
    summary: "Research on deploying lightweight quantized Convolutional Neural Networks on ESP32 microcontrollers for real-time bridge strain and vibration anomaly detection.",
    content: "Smart city infrastructure requires continuous monitoring without massive data transmission costs. This paper proposes a 8-bit quantized MobileNet variant operating directly on ESP32-S3 microcontrollers attached to piezoelectric strain gauge sensors. Results demonstrate 97.4% defect classification accuracy with sub-15ms inference latency and 85% reduced power consumption compared to cloud-offloaded processing.",
  },

  // --- 3. PREVIOUS YEAR QUESTION PAPERS (PYQ) ---
  {
    title: "Data Structures & Algorithms - End Semester Question Paper (2024)",
    documentType: "pyq",
    author: "Department of Examination, Sphoorthy Engineering College",
    publishedYear: 2024,
    branch: "Computer Science Engineering",
    subject: "Data Structures and Algorithms",
    semester: 3,
    examType: "Semester Final Exam",
    fileUrl: "https://ecap-portal.edu/pyq/2024/cse/dsa-final.pdf",
    tags: ["DSA", "PYQ", "2024", "BTree", "Graph", "QuickSort", "AVL Tree", "Dijkstra"],
    summary: "2024 Final Exam Paper covering AVL Tree rotations, QuickSort vs MergeSort complexity, Dijkstra's algorithm, and B-Tree insertions.",
    content: `EXAMINATION QUESTION PAPER 2024
Subject: Data Structures & Algorithms (Code: CS301)
Branch: Computer Science & Engineering | Semester: III | Max Marks: 70

SECTION A (Short Answer Questions - 10 x 2 = 20 Marks):
Q1a. Define asymptotic notation (Big-O, Omega, Theta) with mathematical definitions.
Q1b. Differentiate between Linear Data Structures and Non-Linear Data Structures with examples.
Q1c. Write the condition for Queue Overflow and Underflow in a Circular Queue implementation.
Q1d. Explain the concept of Balance Factor in AVL Trees.
Q1e. What is a Hash Collision? Briefly explain Chaining method.
Q1f. Define a Spanning Tree and Minimum Spanning Tree (MST).
Q1g. Differentiate between Inorder and Postorder traversal of Binary Search Tree.
Q1h. State the worst-case time complexity of QuickSort and how to avoid it.
Q1i. Define Breadth-First Search (BFS) algorithm queue operations.
Q1j. What is Dynamic Programming? Mention two classic problems solved by DP.

SECTION B (Long Answer Questions - 5 x 10 = 50 Marks):
Q2. (a) Construct an AVL Tree by inserting elements: 15, 20, 24, 10, 13, 7, 30, 36, 25. Show rotations at each step. (b) Derive Time Complexity of MergeSort using Recurrence Relation.
Q3. (a) Apply Dijkstra's Single Source Shortest Path algorithm on a directed weighted graph with 6 vertices. Show step-by-step distance array updates. (b) Explain Kruskal's algorithm using Disjoint Sets.
Q4. (a) Write a complete C++/Java program to implement a Doubly Linked List with operations: insertAtHead, deleteByValue, and reverse. (b) Explain Expression Evaluation using Stacks (Infix to Postfix conversion).`,
  },
  {
    title: "Database Management Systems - Mid Exam 1 Question Paper (2023)",
    documentType: "pyq",
    author: "Department of Examination",
    publishedYear: 2023,
    branch: "Computer Science Engineering",
    subject: "Database Management Systems",
    semester: 4,
    examType: "Mid 1 Exam",
    fileUrl: "https://ecap-portal.edu/pyq/2023/cse/dbms-mid1.pdf",
    tags: ["DBMS", "PYQ", "2023", "SQL", "ER Model", "Normalization", "3NF", "BCNF"],
    summary: "Mid-1 Question paper covering ER diagrams for University System, SQL JOINs, Functional Dependencies, 3NF, and BCNF normalization.",
    content: `EXAMINATION QUESTION PAPER 2023
Subject: Database Management Systems (Code: CS402)
Branch: CSE / AI & ML | Semester: IV | Max Marks: 30

Q1. (a) Draw an Entity-Relationship (ER) Diagram for a College Management System identifying Entities (Student, Faculty, Course, Department), Attributes, Keys, and Cardinality ratios. (5 Marks)
Q1. (b) Convert the ER diagram into Relational Tables. (5 Marks)

Q2. Consider the relation R(A, B, C, D, E) with Functional Dependencies: F = { A -> BC, CD -> E, B -> D, E -> A }.
(a) Find all Candidate Keys for relation R. (5 Marks)
(b) Determine the highest Normal Form (1NF, 2NF, 3NF, BCNF) of relation R with step-by-step proof. (5 Marks)

Q3. Write SQL Queries for the following schema:
Student(Student_Id, Name, Branch, GPA)
Enrollment(Student_Id, Course_Id, Grade)
Course(Course_Id, Title, Credits, Department)
(a) Find names of students enrolled in 'Artificial Intelligence' with GPA > 8.5.
(b) Display Department name and count of courses offered having credits > 3.
(c) List students who have taken ALL courses offered by Computer Science department. (10 Marks)`,
  },
  {
    title: "Artificial Intelligence & Machine Learning - Semester Exam (2024)",
    documentType: "pyq",
    author: "Examination Cell, Sphoorthy Engineering College",
    publishedYear: 2024,
    branch: "Artificial Intelligence & Machine Learning",
    subject: "Artificial Intelligence",
    semester: 5,
    examType: "Semester Final Exam",
    fileUrl: "https://ecap-portal.edu/pyq/2024/aiml/ai-final.pdf",
    tags: ["AI", "AIML", "PYQ", "2024", "A* Search", "Alpha-Beta Pruning", "Decision Trees", "Naive Bayes"],
    summary: "2024 AIML paper covering A* Search heuristic admissibility, Alpha-Beta pruning in Minimax, Naive Bayes classifier derivation, and Decision Tree entropy.",
    content: `EXAMINATION QUESTION PAPER 2024
Subject: Artificial Intelligence (Code: AI501)
Branch: AI & ML / AI & DS | Semester: V | Max Marks: 70

SECTION A:
1. Explain admissible and consistent heuristics in A* Search.
2. Differentiate between Breadth-First Search and Depth-First Search space complexities.
3. State the Bayes Theorem and explain Naive Bayes independence assumption.
4. What is Overfitting in Decision Trees? How does pruning resolve it?
5. Explain Activation Functions (ReLU, Sigmoid, Softmax) used in Neural Networks.

SECTION B:
6. Apply A* Search algorithm on the 8-Puzzle Problem using Manhattan Distance heuristic. Trace the search tree step-by-step.
7. Apply Alpha-Beta Pruning on a Game Tree with depth 3. Identify pruned nodes and optimal utility value at the root.
8. (a) Derive Information Gain and Entropy formulas for ID3 Decision Tree algorithm. (b) Explain Convolutional Neural Networks (CNN) architecture with Convolution, Pooling, and Fully Connected layers.`,
  },
  {
    title: "Digital Logic Design & Microprocessors - Semester Exam (2023)",
    documentType: "pyq",
    author: "ECE Department Examination Cell",
    publishedYear: 2023,
    branch: "Electronics & Communication Engineering",
    subject: "Digital Electronics",
    semester: 3,
    examType: "Semester Final Exam",
    fileUrl: "https://ecap-portal.edu/pyq/2023/ece/dld-final.pdf",
    tags: ["ECE", "PYQ", "2023", "K-Map", "Flip-Flops", "Multiplexer", "Counters", "8086"],
    summary: "ECE 2023 Question paper covering Karnaugh Map simplification, JK Flip-Flop excitation tables, 4-bit Synchronous Counter design, and 8086 assembly programming.",
    content: `EXAMINATION QUESTION PAPER 2023
Subject: Digital Logic Design (Code: EC302)
Branch: ECE | Semester: III | Max Marks: 70

1. Minimize the Boolean function F(A, B, C, D) = Sigma m(0, 2, 5, 7, 8, 10, 13, 15) using 4-variable Karnaugh Map (K-Map). Implement using NAND gates only.
2. Design a 4-bit Synchronous Up/Down Counter using JK Flip-Flops. Draw logic diagram and state diagram.
3. Design a 16:1 Multiplexer using 4:1 Multiplexers only.
4. Explain 8086 Microprocessor Architecture with block diagram detailing Execution Unit (EU) and Bus Interface Unit (BIU).`,
  },
];

module.exports = { seedData };
