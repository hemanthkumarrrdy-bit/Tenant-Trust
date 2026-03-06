# Tenant Trust

Tenant Trust is a full-stack SaaS web application designed to bring transparency to the rental market. It empowers renters by providing detailed building insights, landlord reviews, rent trend analysis, and a platform for tenants to share their experiences.

## 🚀 Features

- **Advanced Search**: Search for specific buildings or landlords to see aggregated ratings and reviews.
- **Rent Trends Analysis**: Visualize historical rent data to see if a building's rent is trending up or down.
- **Tenant Reviews**: Authenticated users can submit detailed reviews about property management, maintenance, pests, and noise levels.
- **Landlord & Building Profiles**: Dedicated profile pages showcasing aggregate scores, recent reviews, and key statistics.
- **User Authentication**: Secure sign-up and sign-in functionality using JWT tokens and bcrypt password hashing.

## 🛠️ Tech Stack

**Frontend:**
- HTML5, CSS3 (Modern, Responsive, SaaS-style UI)
- Vanilla JavaScript (ES6+) for DOM manipulation and API integration

**Backend:**
- Node.js & Express.js
- Local JSON-based Database (for mock persistence)
- `jsonwebtoken` for auth
- `bcryptjs` for security

## 📦 Project Structure

```
├── backend/
│   ├── db/          # Database schemas, seeds, and JSON stores
│   ├── middleware/  # Express middleware (e.g., auth checks)
│   ├── routes/      # Express API route handlers
│   ├── server.js    # Entry point for the backend API
│   └── package.json # Backend dependencies
├── css/             # Global stylesheets
├── js/              # Frontend Javascript (API fetches, UI logic)
├── data/            # Backup frontend static JSON data
├── images/          # Assets and icons
└── *.html           # Frontend views (index, search, building, etc.)
```

## 💻 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm (Node Package Manager)

### Installation & Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/hemanthkumarrrdy-bit/Tenant-Trust.git
   cd Tenant-Trust
   ```

2. **Install Backend Dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Start the Backend Server**
   ```bash
   npm run dev
   # The server will run on http://localhost:3001
   ```

4. **Launch the Frontend**
   - Simply open `index.html` in your favorite web browser. 
   - No frontend build step is required! The application connects seamlessly to the local backend API.

## 🤝 Contribution

Contributions, issues, and feature requests are welcome! Feel free to check the issues page.

## 📝 License

This project is open-source and available under the [MIT License](LICENSE).
