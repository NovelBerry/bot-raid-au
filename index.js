const express = require('express');

const fetch = require('node-fetch');

const fs = require('fs'); // Módulo para trabajar con el sistema de archivos



const app = express();

const port = 3000;



// Aquí es donde pondrás las credenciales de tu bot.

// Puedes encontrarlas en el Portal de Desarrolladores de Discord.

const CLIENT_ID = '1410973617868771399';

const CLIENT_SECRET = 'atECOsqionKN5cK8RFd9O0FbYtgUAI11';

const REDIRECT_URI = 'https://bot-raid-au.netlify.app/';

const guildId = '1410794978208121014';



// Función para guardar los tokens en un archivo

const saveTokens = (userId, tokens) => {

    let tokenData = {};

    if (fs.existsSync('tokens.json')) {

        const fileContent = fs.readFileSync('tokens.json', 'utf8');

        tokenData = JSON.parse(fileContent);

    }

    

    tokenData[userId] = tokens;

    fs.writeFileSync('tokens.json', JSON.stringify(tokenData, null, 2));

};



// Ruta de inicio para que el usuario haga clic y comience la autorización

app.get('/', (req, res) => {

    res.send('<a href="/login">Iniciar sesión con Discord</a>');

});



// Ruta de redirección para la autorización de Discord

app.get('/login', (req, res) => {

    const discordAuthUrl = `https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=guilds.join identify`;

    res.redirect(discordAuthUrl);

});



// Ruta de retorno (callback) después de que el usuario autoriza

app.get('/callback', async (req, res) => {

    const code = req.query.code;



    if (!code) {

        return res.send('No se encontró el código de autorización.');

    }



    try {

        // Intercambia el código por un token de acceso

        const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {

            method: 'POST',

            headers: {

                'Content-Type': 'application/x-www-form-urlencoded',

            },

            body: new URLSearchParams({

                client_id: CLIENT_ID,

                client_secret: CLIENT_SECRET,

                grant_type: 'authorization_code',

                code: code,

                redirect_uri: REDIRECT_URI,

            }),

        });



        const tokenData = await tokenResponse.json();

        const accessToken = tokenData.access_token;

        const refreshToken = tokenData.refresh_token;



        // Aquí obtenemos la información del usuario para guardar su ID

        const userResponse = await fetch('https://discord.com/api/v10/users/@me', {

            headers: {

                'Authorization': `Bearer ${accessToken}`,

            },

        });

        const userData = await userResponse.json();

        const userId = userData.id;



        // Guardamos el token de acceso y el de recarga del usuario

        saveTokens(userId, { accessToken, refreshToken });



        // Aquí es donde unimos al usuario al servidor

        // Esta parte es la misma que teníamos antes

        const joinResponse = await fetch(`https://discord.com/api/v10/users/@me/guilds/${guildId}`, {

            method: 'PUT',

            headers: {

                'Authorization': `Bearer ${accessToken}`,

                'Content-Type': 'application/json',

            },

            body: JSON.stringify({

                access_token: accessToken,

            }),

        });

        

        const joinData = await joinResponse.json();



        if (joinResponse.ok) {

            res.send('¡Unido al servidor con éxito!');

        } else {

            res.send(`Ocurrió un error al unir al servidor: ${JSON.stringify(joinData)}`);

        }



    } catch (error) {

        console.error(error);

        res.send('Ocurrió un error en el proceso de autorización.');

    }

});



app.listen(port, () => {

    console.log(`Servidor escuchando en http://localhost:${port}`);

});