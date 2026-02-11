const existingSession = localStorage.getItem('chatUser');
if (existingSession) {
  window.location.href = '/view/chat.html';
}

$('#loginForm').on('submit', async function (event) {
  event.preventDefault();

  const payload = {
    username: $('#username').val().trim(),
    password: $('#password').val()
  };

  try {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      $('#message').text(data.message || 'Login failed.').attr('class', 'small mt-3 mb-0 text-danger');
      return;
    }

    localStorage.setItem('chatUser', JSON.stringify(data.user));
    window.location.href = '/view/chat.html';
  } catch (error) {
    $('#message').text('Server error.').attr('class', 'small mt-3 mb-0 text-danger');
  }
});
