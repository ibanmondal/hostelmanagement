document.getElementById('studentForm').addEventListener('submit', async (e) => {
    e.preventDefault();
  
    const form = e.target;
    const data = {
      name: form.name.value,
      roomNumber: form.roomNumber.value,
      year: form.year.value
    };
  
    const res = await fetch('/add-student', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  
    const message = await res.text();
    alert(message);
    form.reset();
  });
  function toggleChatbot() {
    const bot = document.getElementById('chatbot-container');
    bot.classList.toggle('hidden');
  }
  
  