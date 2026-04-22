import { useEffect, useState } from "react";

function App() {
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetch("/tasks")
        .then(res => res.json())
        .then(data => {
          console.log(data);
          setTasks(data);
        })
        .catch(err => {
          console.error("Error fetching tasks:", err);
        });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <h1>Tasks</h1>
      {tasks.length === 0 ? (
        <p>No tasks yet 😴</p>
      ) : (
        tasks.map(t => (
          <div key={t.id}>
            <p>{t.message} ({t.time})</p>
            <p>Count: {t.counter}</p>
          </div>
        ))
      )}
    </div>
  );
}

export default App;