const cron = require("node-cron");
const Redis = require("ioredis");
const axios = require("axios");

const redis = new Redis();

let runningJobs = {};

// 🔹 logging helper
async function addLog(taskId, message) {
  const log = `${new Date().toISOString()} - ${message}`;
  await redis.lpush(`logs:${taskId}`, log);
}

// 🔹 retry logic
async function executeWithRetry(task, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      await addLog(task.id, `Attempt ${i + 1}`);

      if (task.type === "http") {
        await axios.post(task.url, task.payload || {});
      } else {
        console.log(`Task ${task.id}: ${task.message}`);
      }

      await addLog(task.id, "SUCCESS");
      return "success";

    } catch (err) {
      await addLog(task.id, `FAILED attempt ${i + 1}`);

      if (i === retries - 1) {
        return "failed";
      }
    }
  }
}

// 🔹 schedule task
function scheduleTask(task) {
  if (runningJobs[task.id]) return;

  // validate cron
  if (!cron.validate(task.time)) {
    console.log(`Invalid cron for task ${task.id}`);
    return;
  }

  const job = cron.schedule(task.time, async () => {
    try {
      const workerId = process.pid;

      // 🔐 improved lock (store owner)
      const lock = await redis.set(
        `lock:${task.id}`,
        workerId,
        "NX",
        "EX",
        10
      );

      if (!lock) {
        console.log(`Worker ${workerId} skipped task ${task.id}`);
        return;
      }

      console.log(`Worker ${workerId} executing task ${task.id}`);

      let data = await redis.get(`task:${task.id}`);
      if (!data) return;

      let updated = JSON.parse(data);

      // update status → running
      updated.status = "running";
      await redis.set(`task:${task.id}`, JSON.stringify(updated));

      // execute
      const result = await executeWithRetry(updated);

      // update final state
      updated.status = result;
      updated.counter = (updated.counter || 0) + 1;

      await redis.set(`task:${task.id}`, JSON.stringify(updated));

    } catch (err) {
      console.log(`Error: ${err.message}`);
      await addLog(task.id, `ERROR: ${err.message}`);
    }
  });

  runningJobs[task.id] = job;
}

// 🔹 load tasks
async function loadTasks() {
  const keys = await redis.keys("task:*");

  for (let key of keys) {
    const data = await redis.get(key);
    if (!data) continue;

    const task = JSON.parse(data);

    if (!runningJobs[task.id]) {
      scheduleTask(task);
    }
  }
}

// 🔹 refresh loop
setInterval(loadTasks, 5000);
loadTasks();

console.log("Worker running (final version)...");