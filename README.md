# 🚀 AssetFlow – Enterprise Asset & Resource Management System

AssetFlow is a modern, full-stack Enterprise Asset & Resource Management System developed for the **Odoo Hackathon 2026**. It enables organizations to efficiently manage assets throughout their entire lifecycle—from registration and allocation to maintenance, transfers, and retirement—using a secure role-based architecture.

---

## 📌 Problem Statement

Organizations often struggle with tracking company assets, assigning them to employees, managing maintenance requests, and maintaining accurate asset records.

AssetFlow solves these challenges by providing a centralized platform for:

- Asset Registration
- Asset Allocation
- Maintenance Management
- Employee Asset Tracking
- Department Management
- Role-Based Access Control
- Asset Lifecycle Management

---

# ✨ Features

## 🔐 Authentication & Authorization

- Secure JWT Authentication
- User Registration & Login
- Role-Based Access Control
- Protected Routes

---

## 👨‍💼 Admin Module

- Admin Dashboard
- Department Management
- Asset Category Management
- Employee Directory
- Role Management
- Organization Statistics

---

## 💼 Asset Management

- Register Assets
- Asset Directory
- Asset Categories
- Asset Status Tracking
- Asset Lifecycle Management

Asset Status includes:

- Available
- Allocated
- Reserved
- Under Maintenance
- Lost
- Retired
- Disposed

---

## 👨‍💻 Asset Allocation

- Allocate Assets to Employees
- Allocation History
- Current Holder Tracking
- Active Allocation Records

---

## 🛠 Maintenance Management

Employees can:

- Raise Maintenance Requests
- Track Request Status

Managers can:

- Approve Requests
- Reject Requests
- Mark In Progress
- Mark Completed

Automatic Status Updates:

Allocated
⬇
Under Maintenance
⬇
Available

---

## 📊 Dashboards

### Admin Dashboard

- Total Employees
- Departments
- Asset Categories
- Total Assets
- Pending Maintenance

### Asset Manager Dashboard

- Pending Maintenance
- Assets Under Maintenance
- Completed Today
- Active Allocations

### Employee Dashboard

- My Assets
- Current Allocations
- Pending Maintenance
- Completed Maintenance
- Quick Actions

---

## 🎯 Core Workflow

```text
Admin
    │
    ▼
Create Department
    │
    ▼
Create Asset Category
    │
    ▼
Create Employee
    │
    ▼
Assign Role
    │
    ▼
Asset Manager
    │
    ▼
Register Asset
    │
    ▼
Allocate Asset
    │
    ▼
Employee
    │
    ▼
View Assigned Asset
    │
    ▼
Raise Maintenance Request
    │
    ▼
Asset Manager
    │
    ▼
Approve Request
    │
    ▼
Asset Status Updated
```

---

# 🛠 Tech Stack

### Frontend

- React.js
- Vite
- Tailwind CSS
- React Router

### Backend

- Node.js
- Express.js

### Database

- MongoDB Atlas
- Mongoose

### Authentication

- JWT
- bcrypt

---

# 📂 Project Structure

```
client/
    src/
        components/
        pages/
        layouts/
        hooks/

server/
    controllers/
    models/
    routes/
    middleware/
    utils/

```

---

# 🚀 Installation

Clone the repository

```bash
git clone <repository-url>
```

Install dependencies

```bash
npm install
```

Frontend

```bash
cd client
npm install
npm run dev
```

Backend

```bash
cd server
npm install
npm run dev
```

---

# ⚙ Environment Variables

Create a `.env` file:

```env
PORT=5000

MONGO_URI=your_mongodb_connection_string

JWT_SECRET=your_secret_key
```

---

# 👥 Demo Credentials

### Admin

Email

```
admin@assetflow.com
```

Password

```
Admin@123
```

Employee

Register a new account.

---

# 📸 Demo Flow

1. Login as Admin
2. Create Departments
3. Create Asset Categories
4. Manage Employees
5. Register Assets
6. Allocate Assets
7. Login as Employee
8. View Assigned Assets
9. Raise Maintenance Request
10. Approve Maintenance
11. View Updated Dashboard Statistics

---

# 🔮 Future Scope

- QR Code Asset Tracking
- Email Notifications
- Asset Transfer Workflow
- Analytics Dashboard
- Audit Logs
- Resource Booking Calendar
- Barcode Integration
- Predictive Maintenance using AI

---

# 👨‍💻 Team

Developed by

**Anishka Parekh**

**Rudra Trivedi**

for **Odoo Hackathon 2026**

---

# 📄 License

This project was developed solely for educational and hackathon purposes.
