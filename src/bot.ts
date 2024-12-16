import 'dotenv/config'
import OpenAI from 'openai';
import * as chrono from 'chrono-node';

import { Client, Message, TextChannel } from 'discord.js-selfbot-v13';
import { sendWebhook } from './webhook';
import moment from 'moment';
import 'moment-timezone';

const client = new Client();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_TOKEN
})

const textReplacements = {
    "coolo": "(⌐■_■)",
    "lfguns": "☜(ﾟヮﾟ☜)",
    "rfguns": "(☞ﾟヮﾟ)☞"
};

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;

client.on('ready', async () => {
    console.log(`${client.user!.username} is ready!`);
    client.user!.setPresence({
        status: 'invisible',
        afk: true
    })
})

client.on("messageCreate", async message => {
    if (message.guildId === "161245089774043136")
        processEgoMessage(message);

    if (message.mentions.has(client.user!.id)) {
        const nickName = await message.guild?.members.fetchMe().then(me => me.nickname);
        if (!nickName || nickName === client.user!.displayName)
            await message.react('<:pingsock:1065009948452474930>');
    }

    if (message.author.id != client.user!.id)
        return;

    if (message.content.startsWith(":? ")) {
        processQuestion(message);
        return;
    }

    const oldContent = message.content;

    // Check if https://youtu.be/ is in the message
    if (message.content.includes("https://youtu.be/"))
        message.content = stripSiParameter(message.content);

    processReplacemenets(message);
    processCodeBlockMesesage(message);
    processTimeMessage(message);

    if (oldContent == message.content)
        return;
    await message.edit(message.content);
});

client.on("messageUpdate", async (oldMessage, newMessage) => {
    if (!oldMessage.author)
        return;
    if (oldMessage.author?.id == client.user!.id)
        return;
    if (oldMessage.author?.bot || oldMessage.author.system)
        return;
    if (oldMessage.content == newMessage.content)
        return;
    if (oldMessage.content == null)
        return;
    const channel = oldMessage.channel as TextChannel;

    const webhookData = {
        "username": (oldMessage.guild?.name ?? oldMessage.author.username) + (" > #" + (channel.name ?? "DMs")),
        "embeds": [
            {
                "author": {
                    "name": oldMessage.author.username,
                    "icon_url": oldMessage.author.displayAvatarURL() ?? oldMessage.author.defaultAvatarURL,
                },
                "description": `\`\`\`${oldMessage.content}\`\`\`\n\`\`\`${newMessage.content}\`\`\`\n${newMessage.url}`,
                "color": 0x0000FF,
            }
        ]
    }

    await sendWebhook(process.env.WEBHOOK_URL!, webhookData);
});

client.on("messageDelete", async message => {
    if (message.author?.id == client.user!.id)
        return;
    if (!message.author)
        return;
    if (message.author?.bot)
        return;

    const channel = message.channel as TextChannel;

    const webhookData = {
        "username": (message.guild?.name ?? message.author.username) + (" > #" + (channel.name ?? "DMs")),
        "embeds": [
            {
                "author": {
                    "name": message.author.username,
                    "icon_url": message.author.displayAvatarURL() ?? message.author.defaultAvatarURL,
                },
                "description": `\`\`\`${message.content}\`\`\`\n${message.url}`,
                "color": 0xFF0000,
            }
        ]
    }
    await sendWebhook(process.env.WEBHOOK_URL!, webhookData);
});

async function processReplacemenets(message: Message) {
    const content = message.content;
    for (const [key, value] of Object.entries(textReplacements)) {
        if (content.includes(key))
            message.content = content.replace(key, value);
    }
}

const timeRegex = /<[^@]+>/;

async function processTimeMessage(message: Message) {
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

    if (replaced == content)
        return;

    // message.edit(replaced);
    message.content = replaced;
}

const codeBlockRegex = /```(.|\n)+```/;

async function processCodeBlockMesesage(message: Message) {
    const content = message.content;
    if (!codeBlockRegex.test(content))
        return;

    const replaced = message.content.replace(codeBlockRegex, (match) => {
        return stripCommonWhitespace(match);
    });

    // message.edit(replaced);
    message.content = replaced;
}

function stripCommonWhitespace(text: string) {
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

function getSuffix(str: string) {
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

function getTime(str: string) {
    // Automatically use local timezone
    const ref = {
      instant: new Date(),
      timezone: -new Date().getTimezoneOffset()
    };
    return chrono.parseDate(str, ref);
}

async function processQuestion(message: Message<boolean>) {
    const prompt = "You are a helpful AI assistant. Answer the following question in a concise and informative manner. Use formal language and provide supplementary information if possible.";
    processGenericMessage(":?", prompt, message);
}

async function processGenericMessage(prefix: string, prompt: string, message: Message<boolean>, system = false) {
    const msg = message.content.substring(prefix.length + 1)
    const quotingMessage = message.reference ? await message.fetchReference() : null;
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

    if (quotingMessage)
        quotingMessage.reply(response);
    else
        message.channel.send(response);
    console.log(response);
}

const msRegex = /\bms\b/;

function processEgoMessage(message: Message<boolean>) {
    if (!msRegex.test(message.content.toLowerCase()))
        return;
    message.react('👀')
}

function stripSiParameter(text: string): string {
    const youtubeUrlPattern = /(https?:\/\/youtu\.be\/[^?#\s]+)\?si=[^&\s]+/g;

    return text.replace(youtubeUrlPattern, (_match, p1) => {
        // p1 represents the YouTube URL without the 'si' parameter
        return p1;
    });
}


client.login(DISCORD_TOKEN);
