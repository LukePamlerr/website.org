const express = require('express');
const session = require('express-session');
const axios = require('axios');
const app = express();

app.use(express.json());
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: process.env.NODE_ENV === 'production' }
}));

app.get('/auth/discord', (req, res) => {
    const redirectUri = encodeURIComponent('http://localhost:3000/auth/discord/callback');
    res.redirect(`https://discord.com/api/oauth2/authorize?client_id=1379572771746611210&redirect_uri=${redirectUri}&response_type=code&scope=identify guilds`);
});

app.get('/auth/discord/callback', async (req, res) => {
    const code = req.query.code;
    try {
        const tokenResponse = await axios.post('https://discord.com/api/oauth2/token', {
            client_id: '1379572771746611210',
            client_secret: process.env.DISCORD_CLIENT_SECRET,
            grant_type: 'authorization_code',
            code,
            redirect_uri: 'http://localhost:3000/auth/discord/callback'
        }, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        req.session.accessToken = tokenResponse.data.access_token;
        res.redirect('/dashboard.html');
    } catch (error) {
        console.error('Error in OAuth callback:', error);
        res.redirect('/dashboard.html');
    }
});

app.get('/api/user', async (req, res) => {
    if (!req.session.accessToken) {
        return res.json({ user: null });
    }
    try {
        const userResponse = await axios.get('https://discord.com/api/users/@me', {
            headers: { Authorization: `Bearer ${req.session.accessToken}` }
        });
        res.json({ user: userResponse.data });
    } catch (error) {
        res.json({ user: null });
    }
});

app.get('/api/servers', async (req, res) => {
    if (!req.session.accessToken) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    try {
        const guildsResponse = await axios.get('https://discord.com/api/users/@me/guilds', {
            headers: { Authorization: `Bearer ${req.session.accessToken}` }
        });
        const botGuilds = await axios.get('https://discord.com/api/users/@me/guilds', {
            headers: { Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}` }
        });
        const commonGuilds = guildsResponse.data.filter(guild =>
            botGuilds.data.some(botGuild => botGuild.id === guild.id)
        );
        res.json(commonGuilds);
    } catch (error) {
        console.error('Error fetching servers:', error);
        res.status(500).json({ error: 'Failed to fetch servers' });
    }
});

app.use(express.static('public'));

app.listen(3000, () => console.log('Server running on port 3000'));
