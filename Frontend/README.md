# Frontend Setup

## Prerequisites
- Node.js (v16+)
- Backend server running on `http://localhost:8000`

## Running Locally

1. **Install dependencies**
```bash
npm install
```

2. **Update API URL (if needed)**
   
   Edit `lib/api.ts` to change the backend URL:
   ```typescript
   export const baseUrl = "http://localhost:8000";
   ```

3. **Start development server**
```bash
npm run dev
```

4. **Open in browser**
```
http://localhost:3000
```

Frontend runs on `http://localhost:3000`