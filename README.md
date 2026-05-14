# ECAP_SPHN - Educational Campus Administration Portal

A comprehensive, responsive, and feature-rich campus management system designed to streamline academic and administrative workflows for Students, Faculty, HODs, Admins, and more.

## 🚀 Key Modules

### 🚍 Transport Management Module
Efficiently manage campus transportation with end-to-end workflows.
- **Admin Capabilities**: Configure buses, routes, stops, and location-based fare structures. Manage seat capacity and track occupancy in real-time.
- **Student Features**: Browse available routes, check live seat availability, enroll in a bus after providing payment reference, and view/download active transport passes.
- **Backend APIs**:
    - `POST /api/transport/routes` | `PUT /api/transport/routes/:id`: CRUD for buses and routes.
    - `GET /api/transport/routes`: Fetch all routes with occupancy data.
    - `POST /api/transport/enroll`: Student enrollment and payment logging.
    - `GET /api/transport/student/:enrollmentNo`: Retrieve student transport pass details.

### 📊 OBE & CO/PO Attainment
Advanced academic tracking for Outcome Based Education.
- Automated calculation of Course Outcome (CO) attainment from Internal Assessment (IA) and Semester End Examination (SEE) marks.
- Generation of detailed Excel reports with CO-PO mapping and attainment summaries.
- Faculty interface for uploading marks and visualizing attainment trends.

### 🏢 Departmental Management (HOD & Faculty)
- **HOD Dashboard**: Real-time leave request approvals, faculty performance tracking, and departmental analytics.
- **Faculty Dashboard**: Attendance tracking, marks management, digital material sharing, and automated timetable views.
- **Leave Management**: Integrated leave application and tracking system with role-based approval workflows.

### 💳 Accounts & Administration
- **Accounts Hub**: Monthly attendance configuration, global holiday management, and automated faculty attendance tracking based on working days.
- **Admin Panel**: Centralized control for student/faculty registration, notice board management, and campus-wide configuration.

### 📚 Library & Placement
- **Library System**: Digital cataloging for books and newspapers, with issue/return tracking for students and faculty.
- **Placement Cell**: End-to-end placement drive management, company registration, student applications, and training reports.

---

## 🛠 Tech Stack

- **Frontend**: React.js, Tailwind CSS (for modern, responsive UI), Framer Motion (for smooth animations), React Icons.
- **Backend**: Node.js, Express.js.
- **Database**: MongoDB with Mongoose ODM.
- **Report Generation**: ExcelJS for generating complex academic reports.
- **Authentication**: JWT-based role-protected routes.

---

## 📱 Design Philosophy
- **Fully Responsive**: Optimized for Mobile, Tablet, and Desktop using flexible grid systems and mobile-first navigation.
- **Modern Aesthetics**: Vibrant color palettes, glassmorphism effects, and micro-animations for a premium user experience.
- **Role-Based Access**: Dedicated dashboards for Admin, Student, Faculty, HOD, Accounts, Library, and Transport.

---

## 🛠 Installation & Setup

### 1. Clone the repository
```bash
git clone https://github.com/LaxmiGanji/ECAP_SPHN.git
```

### 2. Backend Setup
```bash
cd backend
npm install
# Create a .env file and add your MONGO_URL, JWT_SECRET, etc.
npm start
```

### 3. Frontend Setup
```bash
cd frontend
npm install
# Create a .env file and add your REACT_APP_BASE_URL
npm start
```

---

## 📄 License
This project is licensed under the MIT License.

---
**Developed by Laxmi Ganji**