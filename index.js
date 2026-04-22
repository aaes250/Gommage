const express = require('express');
const app = express();
const cron = require('node-cron');

let tasks = []; // ✅ FIXED
let id = 0;

app.use(express.json());

app.post("/schedule", (req, res) => {
  const { time, message } = req.body;

  let task = {
    id: id,
    time,
    message,
    counter: 0,
    job: null
  };

  const job = cron.schedule(time, () => {
    console.log(`Task ${task.id}: ${task.message} ${task.counter}`);
    task.counter++;
  });

  task.job = job;

  tasks.push(task); // ✅ now works

  res.json({ message: "Task scheduled", id: id });

  id++;
});

app.get("/tasks", (req, res) => {
  res.json(tasks.map(t => ({
    id: t.id,
    time: t.time,
    message: t.message,
    counter: t.counter
  })));
});

app.listen(5000, () => {
  console.log('Server is running on port 5000');
});