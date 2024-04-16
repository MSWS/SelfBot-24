import 'dotenv/config'
import OpenAI from 'openai';

import { Client, Message } from 'discord.js-selfbot-v13';
const client = new Client();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_TOKEN
})

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;

client.on('ready', async () => {
    console.log(`${client.user.username} is ready!`);
})

client.on("messageCreate", async message => {
    if (message.guildId === "161245089774043136")
        processEgoMessage(message);

    if (message.author.id != client.user.id)
        return;

    if (message.content.startsWith(":ed ")) {
        processEdmundMessage(messsage);
        return;
    }
});

const re = /\bms\b/;

function processEdmundMessage(message) {
    const msg = message.content.substring(": ed".length)
    message.delete();
    message.channel.sendTyping();

    const chatCompletion = await openai.chat.completions.create({
        messages: [
            {
                role: 'user',
                content: 'Rewrite the following into a sentence in the style of a person who feels deeply envious but tries to mask it with false enthusiasm. Use overly flowery language, a hint of sarcasm, and small focus on their own perceived misfortune.'
            },
            {
                role: 'user',
                content: msg
            }],
        model: 'gpt-3.5-turbo'
    });
    const response = chatCompletion.choices[0].message;
    console.log(response);
    message.channel.send(response);
}

function processEgoMessage(message) {
    if (!re.test(message.content.toLowerCase()))
        return;
    message.react('👀')
}

client.login(DISCORD_TOKEN);
