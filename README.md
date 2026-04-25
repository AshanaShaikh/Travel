# 🌍 Wanderlust — Travel Guide CRUD App

A beautiful full-stack Travel Guide application with complete **Create, Read, Update, Delete** operations powered by **Node.js + Express**, **MySQL**, and a stunning HTML/CSS/JS frontend.

---

## 📁 Project Structure

```
travel-guide/
├── server.js              ← Node.js Express backend (REST API)
├── package.json
├── .env                   ← Database config (edit this!)
├── database/
│   └── schema.sql         ← MySQL schema + sample data
└── public/
    ├── index.html         ← Frontend UI
    ├── style.css          ← Styling
    └── app.js             ← Frontend JS (CRUD logic)
```

---

## ⚙️ Setup Instructions

### Step 1 — Install Node.js
Download from [nodejs.org](https://nodejs.org) if not installed.

### Step 2 — Set up MySQL Database

Open your MySQL client (MySQL Workbench, phpMyAdmin, or terminal) and run:
```sql
source /path/to/travel-guide/database/schema.sql
```
Or copy-paste the contents of `database/schema.sql` into your MySQL client.

### Step 3 — Configure `.env`

Edit the `.env` file with your MySQL credentials:
```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_actual_password
DB_NAME=travel_guide_db
PORT=3000
```

### Step 4 — Install Dependencies

Open terminal in the project folder:
```bash
cd travel-guide
npm install
```

### Step 5 — Start the Server

```bash
npm start
```

For development with auto-restart:
```bash
npm run dev
```

### Step 6 — Open in Browser

Visit: **http://localhost:3000**

---

## 🚀 Features

| Feature | Description |
|---|---|
| ➕ **Create** | Add destinations with name, country, category, description, image, rating, budget, and season |
| 👁 **Read** | Browse all destinations with card view + detailed modal |
| ✏️ **Update** | Edit any destination — changes reflect in MySQL instantly |
| 🗑 **Delete** | Remove destinations with confirmation dialog |
| 🔍 **Search** | Live search by name, country, or description |
| 🎛 **Filter** | Filter by category and budget |
| 📊 **Sort** | Sort by newest, oldest, rating, or name (A–Z) |
| 📈 **Stats** | Live count of destinations, countries, and average rating |

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/destinations` | Get all (supports `?search=&category=&budget=&sort=`) |
| `GET` | `/api/destinations/:id` | Get one destination |
| `POST` | `/api/destinations` | Create new destination |
| `PUT` | `/api/destinations/:id` | Update destination |
| `DELETE` | `/api/destinations/:id` | Delete destination |
| `GET` | `/api/stats` | Get stats summary |

---

## 🛠 Tech Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Node.js, Express.js
- **Database**: MySQL (via `mysql2` driver)
- **Fonts**: Playfair Display + DM Sans (Google Fonts)
