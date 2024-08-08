import { Client, GatewayIntentBits, SlashCommandBuilder, Routes } from 'discord.js';
import { REST } from '@discordjs/rest';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import http from 'http';

dotenv.config(); // Load environment variables from .env file

// Create a new client instance
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

// Retrieve the token and client ID from environment variables
const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

// Register slash command
const commands = [
    new SlashCommandBuilder().setName('flip').setDescription('Fetches and displays price calculations.')
];

const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
    try {
        console.log('Started refreshing application (/) commands.');

        await rest.put(
            Routes.applicationCommands(CLIENT_ID), // Use the CLIENT_ID to register commands globally
            { body: commands }
        );

        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error(error);
    }
})();

// Dummy HTTP server to keep Render happy
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Bot is running\n');
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});

// Function to fetch data from the API
async function fetchData() {
    try {
        const response = await fetch('https://api.poefa.xyz/calculate-prices');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('There was a problem with the fetch operation:', error);
        throw error;
    }
}

// When the client is ready, run this code (only once)
client.once('ready', () => {
    console.log('Ready!');
});

// Handle interaction
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand()) return;

    const { commandName } = interaction;

    if (commandName === 'flip') {
        await interaction.deferReply(); // Defer the reply to handle long-running tasks

        try {
            const data = await fetchData();

            const embed = {
                color: 0x0099ff,
                title: 'PoE Flip Assistance',
                description: 'Here are the calculated prices and profits:',
                fields: [
                    { name: 'Divine price', value: `[${data.divine_price} Chaos](https://www.pathofexile.com/trade/exchange/Necropolis/9z28fK)`, inline: true },
                    { name: 'Bulk price (Screaming)', value: `[${data.bulk_price_screaming} Divine](https://www.pathofexile.com/trade/exchange/Necropolis/zdO5Ob2U4)`, inline: true },
                    { name: 'Bulk price (Incandescent)', value: `[${data.bulk_price_incandescent} Divine](https://www.pathofexile.com/trade/exchange/Necropolis/pWOOqJdt0)`, inline: true },
                    { name: 'Bulk price (Maven)', value: `[${data.bulk_price_maven} Divine](https://www.pathofexile.com/trade/exchange/Necropolis/JQr4ZvbIl)`, inline: true },
                    { name: 'Single price (Screaming)', value: `[${data.single_price_screaming} Chaos](https://www.pathofexile.com/trade/exchange/Necropolis/YqM0zE7tY)`, inline: true },
                    { name: 'Single price (Incandescent)', value: `[${data.single_price_incandescent} Chaos](https://www.pathofexile.com/trade/exchange/Necropolis/4rJ2VRgS9)`, inline: true },
                    { name: 'Single price (Maven)', value: `[${data.single_price_maven} Chaos](https://www.pathofexile.com/trade/exchange/Necropolis/LK2Y6PGun)`, inline: true },
                    { name: 'Profit Screaming', value: `${data.profit_screaming} Chaos`, inline: true },
                    { name: 'Profit Incandescent', value: `${data.profit_incandescent} Chaos`, inline: true },
                    { name: 'Profit Maven', value: `${data.profit_maven} Chaos`, inline: true }
                ],
                timestamp: new Date(),
                footer: {
                    text: 'PoE Flip Assistance',
                    icon_url: 'https://pathofexile.com/favicon.ico'
                }
            };

            await interaction.editReply({ embeds: [embed] }); // Edit the deferred reply with the results
        } catch (error) {
            await interaction.editReply({ content: `Error: ${error.message}`, ephemeral: true });
        }
    }
});

// Log in to Discord with your app's token
client.login(TOKEN);
