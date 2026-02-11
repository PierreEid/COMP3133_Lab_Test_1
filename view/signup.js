$('#signupForm').on('submit', async function (event) {
  event.preventDefault();

  const payload = {
    firstname: $('#firstname').val().trim(),
    lastname: $('#lastname').val().trim(),
    username: $('#username').val().trim(),
    password: $('#password').val()
  };

  try {
    const response = await fetch('/api/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      $('#message').text(data.message || 'Signup failed.').attr('class', 'small mt-3 mb-0 text-danger');
      return;
    }

    $('#message')
      .text('Signup successful. Redirecting to login...')
      .attr('class', 'small mt-3 mb-0 text-success');

    setTimeout(() => {
      window.location.href = '/view/login.html';
    }, 900);
  } catch (error) {
    $('#message').text('Server error.').attr('class', 'small mt-3 mb-0 text-danger');
  }
});
