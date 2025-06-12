document.addEventListener('DOMContentLoaded', () => {
    // Check if user is on dashboard page
    if (window.location.pathname.includes('dashboard.html')) {
        fetch('/api/user', {
            credentials: 'include'
        })
        .then(response => response.json())
        .then(data => {
            if (data.user) {
                document.getElementById('auth-section').style.display = 'none';
                document.getElementById('server-list').style.display = 'block';
                fetchServers();
            }
        })
        .catch(err => console.error('Error checking user:', err));
    }
});

function fetchServers() {
    fetch('/api/servers', {
        credentials: 'include'
    })
    .then(response => response.json())
    .then(servers => {
        const serverList = document.getElementById('servers');
        serverList.innerHTML = '';
        servers.forEach(server => {
            const serverCard = document.createElement('div');
            serverCard.className = 'server-card';
            serverCard.innerHTML = `
                <h3>${server.name}</h3>
                <p>ID: ${server.id}</p>
            `;
            serverList.appendChild(serverCard);
        });
    })
    .catch(err => console.error('Error fetching servers:', err));
}
