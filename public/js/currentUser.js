(function(){
  const urls = {
    getCurrentUser: '/api/user/current',
  };
  const container = document.getElementById('current-user');

  init();

  async function init(){
    const currentUser = await getCurrentUser();
    if(currentUser.id){
      renderCurrentUserMenu(currentUser);
    }
    else{
      renderUnauthorizedMenu();
    }
  }

  function renderCurrentUserMenu(){
    container.innerHTML = `
      <ul class="flex space-x-4 p-4">
        <li><a href="/api/user/logout" class="text-blue-500">Logout</a></li>
      </ul>
    `;
  }

  function renderUnauthorizedMenu(){
    container.innerHTML = `
      <ul class="flex space-x-4 p-4">
        <li><a href="/login.html" class="text-blue-500">Login</a></li>
        <li><a href="/register.html" class="text-blue-500">Register</a></li>
      </ul>
    `;
  }

  async function getCurrentUser(){
    const response = await fetch(urls.getCurrentUser);
    const data = await response.json();
    return data;
  }
})()