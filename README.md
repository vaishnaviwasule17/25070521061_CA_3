# TaskBloom — EdgeOne-ready ZIP

## Direct static deployment
This ZIP is prepared so the static website can be deployed without installing Node.js or running a build.

1. Extract this ZIP.
2. In EdgeOne Pages, create a static site and upload/connect the **contents of this folder**.
3. Make sure `index.html` is in the deployed site root.
4. No build command is needed for the root static website.
5. Deploy and open the provided URL.

## Working features
- Add, edit, and delete tasks
- Subject, deadline, and priority
- Mark tasks complete
- Filter by priority, due today, or completed
- Completion progress summary
- Responsive desktop/mobile design
- Saves tasks in browser localStorage

## Important: static website vs full-stack app
The root `index.html` is the ready-to-deploy website. It works immediately as a static site, but stores tasks only in the current browser/device.

The `full-stack-source/` folder also contains the supplied React client source and Node/Express server source. Those files are included for your project, but EdgeOne static hosting alone does not run the Node server or provide MongoDB. To make the React version use shared database storage, deploy the backend separately, create a MongoDB Atlas database, set `MONGO_URI` on the backend, and set `VITE_API_URL` to the deployed backend URL before building the React frontend.

Do not upload `node_modules` folders.
