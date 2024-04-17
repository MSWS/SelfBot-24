import 'dotenv/config'
import OpenAI from 'openai';
import * as chrono from 'chrono-node';

import { Client, Message } from 'discord.js-selfbot-v13';
const client = new Client();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_TOKEN
})

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;

client.on('ready', async () => {
    console.log(`${client.user.username} is ready!`);
    client.user.setPresence({
        afk: true
    })
})

client.on("messageCreate", async message => {
    if (message.guildId === "161245089774043136")
        processEgoMessage(message);

    if (message.mentions.has(client.user.id))
        message.react('<:pingsock:1065009948452474930>');

    if (message.author.id != client.user.id)
        return;

    if (message.content.startsWith(":ed ")) {
        processEdmundMessage(message);
        return;
    } else if (message.content.startsWith(":pro ")) {
        processProMessage(message);
        return;
    } else if (message.content.startsWith(":? ")) {
        processQuestion(message);
        return;
    }

    processCodeBlockMesesage(message);
    processTimeMessage(message);
});

const timeRegex = /<.+>/;

async function processTimeMessage(message) {
    const content = message.content;
    if (!timeRegex.test(content))
        return;

    const replaced = message.content.replace(timeRegex, (match) => {
        const time = getTime(match);
        if (time == null)
            return match;
        const suffix = getSuffix(content);
        return `<t:${Math.floor(time.getTime() / 1000)}:${suffix}>`
    });

    message.edit(replaced);
}

const codeBlockRegex = /```(.|\n)+```/;

async function processCodeBlockMesesage(message) {
    const content = message.content;
    if (!codeBlockRegex.test(content))
        return;

    const replaced = message.content.replace(codeBlockRegex, (match) => {
        return stripCommonWhitespace(match);
    });

    message.edit(replaced);
}

function stripCommonWhitespace(text) {
    const header = text.split("\n")[0];
    let code = text.split("\n").slice(1, -1);

    let maxWhite = Infinity;

    for (const line of code) {
        const white = line.search(/\S/);
        if (white == -1)
            continue;
        if (white < maxWhite)
            maxWhite = white;
    }

    code = code.map(line => line.substring(maxWhite));
    return header + "\n" + code.join("\n") + "\n```";
}

function getSuffix(str) {
    str = str.toLowerCase().substring(1);
    if (str.startsWith("in"))
        return "R"
    if (str.startsWith("on") || str.startsWith("next"))
        return "D"
    if (str.startsWith("at"))
        return "t"

    if (str.includes("in"))
        return "R"
    if (str.includes("on") || str.includes("next"))
        return "D"
    if (str.includes("at"))
        return "f"

    return "f"
}

function getTime(str) {
    return chrono.parseDate(str, { timezone: "PDT" });
}

async function processEdmundMessage(message) {
    const prompt = "Rewrite the following into a sentence in the style of a person who feels deeply envious but tries to mask it with false enthusiasm. Use overly flowery language, a hint of sarcasm, and small focus on their own perceived misfortune.";
    processGenericMessage(":ed", prompt, message);
}

async function processProMessage(message) {
    const prompt = "Rewrite the following into a professional sentence that is concise and to the point. Use formal language and avoid contractions.";
    processGenericMessage(":pro", prompt, message);
}

async function processQuestion(message) {
    const prompt = "You are a helpful AI assistant. Answer the following question in a concise and informative manner. Use formal language and provide supplementary information if possible.";
    processGenericMessage(":?", prompt, message);
}

async function processGenericMessage(prefix, prompt, message, system = false) {
    const msg = message.content.substring(prefix.length + 1)
    message.delete();
    message.channel.sendTyping();

    const chatCompletion = await openai.chat.completions.create({
        messages: [
            {
                role: system ? 'system' : 'user',
                content: prompt,
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

const msRegex = /\bms\b/;

function processEgoMessage(message) {
    if (!msRegex.test(message.content.toLowerCase()))
        return;
    message.react('👀')
}

client.login(DISCORD_TOKEN);
