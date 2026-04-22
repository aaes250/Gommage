const express = require('express');
const app = express();

const Redis = require("ioredis");
const redis = new Redis();

const { v4: uuidv4 } = require('uuid');

app.use(express.json());

// 🔹 CREATE TASK
app.post("/schedule", async (req, res) => {
  const { time, message, type, url, payload } = req.body;

  // validation
  if (!time) {
    return res.status(400).json({ error: "Time is required" });
  }

  if (type === "http" && !url) {
    return res.status(400).json({ error: "URL required for HTTP task" });
  }

  const taskId = uuidv4();

  const task = {
    id: taskId,
    time,
    message: message || "",
    type: type || "log",
    url: url || null,
    payload: payload || null,
    counter: 0,
    status: "pending"
  };

  await redis.set(`task:${taskId}`, JSON.stringify(task));

  res.json({ message: "Task scheduled", id: taskId });
});

// 🔹 GET TASKS
app.get("/tasks", async (req, res) => {
  const keys = await redis.keys("task:*");

  const tasks = await Promise.all(
    keys.map(key => redis.get(key))
  );

  res.json(tasks.map(t => JSON.parse(t)));
});

// 🔹 GET LOGS
app.get("/logs/:id", async (req, res) => {
  const logs = await redis.lrange(`logs:${req.params.id}`, 0, -1);
  res.json(logs);
});

// 🔹 DELETE TASK
app.delete("/task/:id", async (req, res) => {
  const taskId = req.params.id;

  await redis.del(`task:${taskId}`);
  await redis.del(`logs:${taskId}`);

  res.send("Task deleted");
});

app.get("/ui-tasks", async (req, res) => {
  const keys = await redis.keys("task:*");

  const tasks = await Promise.all(
    keys.map(key => redis.get(key))
  );

  const uiData = tasks.map(t => {
    const task = JSON.parse(t);

    return {
      TaskId: task.id,
      Time: task.time,
      Message: task.message,
      Counter: task.counter,
      Status: task.status,
      Actions: {
        delete: `/task/${task.id}`,
        logs: `/logs/${task.id}`
      }
    };
  });

  res.json(uiData);
});

app.listen(5000, () => {
  console.log('Server is running on port 5000');
});