# Shahira Code

<p align="center">
	<img src="public/logo.png" alt="Shahira Code logo" width="140" />
</p>

Shahira Code is a visual DSA learning platform that turns code into live animations. Students can type array operations, run curated problems, inspect time and space complexity, and track practice progress through a React frontend backed by a Spring Boot API.

![Shahira Code preview](docs/images/homepage.png)

## About The Project

Shahira Code is built to make data structures and algorithms easier to understand through motion. Instead of reading dry examples, users can type commands like `arr.append(88)`, `arr.insert(1, 50)`, `arr.reverse()`, or `arr.sort()` and immediately see how the array changes step by step.

The app includes a landing playground, a full editor experience, problem sets, profile tracking, pricing plan access, authentication, and backend persistence for user progress.

## Key Features

- Live DSA animation for array operations.
- Interactive editor with visual preview, logs, and complexity display.
- Quick actions for append, search, insert, reverse, sort, and similar operations.
- Curated problems with difficulty labels and completion tracking.
- Playground area for larger visualizers, including a 1D and 2D array visualizer.
- User authentication with email/password and Google login support.
- Profile, saved problem progress, and editor state APIs.
- Pricing plan flow for Free, Pro, and Advanced access levels.
- Code execution endpoint backed by a configurable Piston-compatible service.

## Screenshots

### Home Page

![Home page preview](docs/images/homepage.png)

The home page highlights the main idea: type code, watch the data structure move, and learn the operation visually.

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | React 18, Vite, React Router |
| Styling | CSS modules/files in `src/pages`, `src/styles`, and component CSS |
| Backend | Java 17, Spring Boot 3.3 |
| API | Spring Web, Spring Security |
| Database | H2 by default, MySQL supported through environment variables |
| Persistence | Spring Data JPA |
| Code execution | Local Spring endpoint plus configurable Piston execute URL |

## Project Structure

```text
.
|-- src/                         # React frontend source
|   |-- app/                     # Main app shell and route state
|   |-- components/              # Editors and visual preview components
|   |-- features/                # Auth and array execution helpers
|   |-- pages/                   # Home, problems, profile, pricing, contact, playground
|   |-- services/                # Frontend API clients
|   `-- styles/                  # Global and syntax styles
|-- public/                      # Static assets and standalone visualizer HTML
|-- shahira-code/                # Spring Boot backend
|   |-- src/main/java/...        # Auth, profile, pricing, progress, execution APIs
|   |-- src/main/resources/      # Spring application configuration
|   `-- sql/                     # Database schema
|-- execution/                   # Local helper scripts for code execution/autocommit
|-- docs/images/                 # README images
`-- package.json                 # Frontend scripts and dependencies
```

## Getting Started

### Prerequisites

- Node.js 18 or newer.
- npm.
- Java 17.
- Maven wrapper included in `shahira-code`.

### Frontend Setup

Install dependencies:

```bash
npm install
```

Start the Vite development server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

### Backend Setup

From the backend folder:

```bash
cd shahira-code
.\mvnw spring-boot:run
```

The backend uses H2 by default:

```properties
spring.datasource.url=jdbc:h2:file:./data/codeviz;MODE=MySQL;AUTO_SERVER=TRUE
spring.datasource.username=sa
spring.datasource.password=
```

To use MySQL, provide these environment variables:

```bash
DB_URL=jdbc:mysql://localhost:3306/codeviz
DB_USERNAME=your_user
DB_PASSWORD=your_password
DB_DRIVER=com.mysql.cj.jdbc.Driver
```

### Frontend API URL

If the frontend and backend are on different origins, set:

```bash
VITE_API_BASE_URL=http://localhost:8080
```

## Main API Endpoints

| Area | Endpoint |
| --- | --- |
| Auth | `POST /api/auth/signup`, `POST /api/auth/login`, `POST /api/auth/google`, `GET /api/auth/me`, `POST /api/auth/logout` |
| Profile | `GET /api/profile`, `PUT /api/profile` |
| User problems | `GET /api/user-problems`, `POST /api/user-problems`, `DELETE /api/user-problems/{problemId}` |
| Progress | `GET /api/user-progress`, `POST /api/user-progress` |
| Editor state | `GET /api/editor-state`, `PUT /api/editor-state` |
| Pricing | `POST /api/pricing-signups` |
| Execution | `GET /api/execute/health`, `POST /api/execute` |

## Learning Flow

1. Open the home page and try a quick array action.
2. Open the editor to write Python-like array commands.
3. Watch the preview update while logs explain each operation.
4. Browse practice problems and solve them from the editor.
5. Save completion progress to your profile.
6. Use the playground for larger visualizers.

## Current Focus

Shahira Code currently focuses on arrays and beginner-friendly DSA visualization. The structure is ready for more topics such as strings, hashing, stacks, queues, trees, graphs, recursion, dynamic programming, and greedy algorithms.

## License

This project is currently private/internal. Add a license before publishing it publicly.
