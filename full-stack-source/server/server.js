const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const crypto = require("crypto");

const app = express();
app.use(cors());
app.use(express.json());

mongoose
  .connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/taskbloom")
  .then(() => console.log("MongoDB connected"))
  .catch((error) => console.error("MongoDB connection error:", error.message));

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true }
}, { timestamps: true });
const User = mongoose.model("User", userSchema);

const taskSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, required: true },
  subject: { type: String, default: "" },
  dueDate: { type: String, default: "" },
  priority: { type: String, enum: ["Low", "Medium", "High"], default: "Medium" },
  completed: { type: Boolean, default: false }
}, { timestamps: true });
const Task = mongoose.model("Task", taskSchema);

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}
function verifyPassword(password, stored) {
  const [salt, originalHash] = (stored || "").split(":");
  if (!salt || !originalHash) return false;
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(originalHash, "hex"));
}

app.get("/", (req, res) => res.send("Welcome to TaskBloom Student Planner!"));
app.get("/api/health", (req, res) => res.json({ status: "ok", database: mongoose.connection.readyState === 1 ? "connected" : "disconnected" }));

app.post("/api/auth/signup", async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");
    if (!name || !email || password.length < 6) {
      return res.status(400).json({ message: "Enter your name, a valid email, and a password with at least 6 characters." });
    }
    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ message: "An account with this email already exists. Please sign in." });
    const user = await User.create({ name, email, passwordHash: hashPassword(password) });
    res.status(201).json({ user: { id: user._id, name: user.name, email: user.email } });
  } catch (error) {
    res.status(500).json({ message: "Could not create account. Make sure MongoDB is running." });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");
    const user = await User.findOne({ email });
    if (!user || !verifyPassword(password, user.passwordHash)) {
      return res.status(401).json({ message: "Incorrect email or password." });
    }
    res.json({ user: { id: user._id, name: user.name, email: user.email } });
  } catch (error) {
    res.status(500).json({ message: "Login failed. Make sure MongoDB is running." });
  }
});

function getUserId(req, res) {
  const id = req.header("x-user-id");
  if (!id || !mongoose.isValidObjectId(id)) {
    res.status(401).json({ message: "Please sign in first." });
    return null;
  }
  return id;
}

app.get("/api/tasks", async (req, res) => {
  const userId = getUserId(req, res); if (!userId) return;
  try { res.json(await Task.find({ userId }).sort({ createdAt: -1 })); }
  catch (error) { res.status(500).json({ message: error.message }); }
});
app.post("/api/tasks", async (req, res) => {
  const userId = getUserId(req, res); if (!userId) return;
  try { const task = await Task.create({ ...req.body, userId }); res.status(201).json(task); }
  catch (error) { res.status(400).json({ message: error.message }); }
});
app.put("/api/tasks/:id", async (req, res) => {
  const userId = getUserId(req, res); if (!userId) return;
  try {
    const task = await Task.findOneAndUpdate({ _id: req.params.id, userId }, req.body, { new: true, runValidators: true });
    if (!task) return res.status(404).json({ message: "Task not found" });
    res.json(task);
  } catch (error) { res.status(400).json({ message: error.message }); }
});
app.delete("/api/tasks/:id", async (req, res) => {
  const userId = getUserId(req, res); if (!userId) return;
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, userId });
    if (!task) return res.status(404).json({ message: "Task not found" });
    res.json({ message: "Task deleted successfully" });
  } catch (error) { res.status(400).json({ message: error.message }); }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
