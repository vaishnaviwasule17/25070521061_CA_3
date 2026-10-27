# TaskBloom full-stack source

- `client/`: React + Vite frontend source
- `server/`: Node.js + Express + Mongoose API source

The React frontend defaults to `http://localhost:5000`. For online deployment, create `client/.env` based on `.env.example` and set `VITE_API_URL` to the deployed backend URL, then build the frontend (`npm install` and `npm run build`) and deploy the generated `dist/` directory. Deploy the backend separately with `MONGO_URI` set to your MongoDB Atlas connection string. EdgeOne static Pages hosting does not itself run this Node backend.
