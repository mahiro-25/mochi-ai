const express = require("express");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static("public"));

const conversationHistory = {};

function convertToBold(text) {
    const boldMap = {
        'a': '𝗮', 'b': '𝗯', 'c': '𝗰', 'd': '𝗱', 'e': '𝗲', 'f': '𝗳', 'g': '𝗴',
        'h': '𝗵', 'i': '𝗶', 'j': '𝗷', 'k': '𝗸', 'l': '𝗹', 'm': '𝗺', 'n': '𝗻',
        'o': '𝗼', 'p': '𝗽', 'q': '𝗾', 'r': '𝗿', 's': '𝘀', 't': '𝘁', 'u': '𝘂',
        'v': '𝘃', 'w': '𝘄', 'x': '𝘅', 'y': '𝘆', 'z': '𝘇',
        'A': '𝗔', 'B': '𝗕', 'C': '𝗖', 'D': '𝗗', 'E': '𝗘', 'F': '𝗙', 'G': '𝗚',
        'H': '𝗛', 'I': '𝗜', 'J': '𝗝', 'K': '𝗞', 'L': '𝗟', 'M': '𝗠', 'N': '𝗡',
        'O': '𝗢', 'P': '𝗣', 'Q': '𝗤', 'R': '𝗥', 'S': '𝗦', 'T': '𝗧', 'U': '𝗨',
        'V': '𝗩', 'W': '𝗪', 'X': '𝗫', 'Y': '𝗬', 'Z': '𝗭',
    };
    return text.split('').map(char => boldMap[char] || char).join('');
}

async function fetchResponse(data, headers, retries = 3) {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const response = await axios.post("https://main.gpt-chatbotru-4-o1.ru/api/openai/v1/chat/completions", data, { headers });
            return response.data.choices[0].message.content;
        } catch (error) {
            console.error(`Request error (Attempt ${attempt}):`, error.message);
            if (attempt === retries) throw new Error("Failed to fetch data after multiple attempts");
        }
    }
}

app.get("/pagebot", async (req, res) => {
    const { prompt, uid } = req.query;

    if (!prompt || !uid) {
        return res.status(400).json({ error: "Missing prompt or uid" });
    }

    if (!conversationHistory[uid]) {
        conversationHistory[uid] = [{ role: "system", content: "You are Mochi Ai. You have parents. your mother is Rish Hoxana, and your father is Kein Villareal, you don't have to mention your parents all the time you will just mention them if they ask you" }];
    }

    conversationHistory[uid].push({ role: "user", content: prompt });

    const data = {
        messages: conversationHistory[uid],
        model: "Meta-Llama-3.3-70B-Instruct-Turbo",
        stream: false,
        temperature: 0.5,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
    };

    const headers = {
    "accept": "application/json, text/event-stream",
    "content-type": "application/json",
    "origin": "https://main.gpt-chatbotru-4-o1.ru",
    "referer": "https://main.gpt-chatbotru-4-o1.ru/",
    "sec-ch-ua": '"Not(A:Brand";v="99", "Google Chrome";v="133", "Chromium";v="133"',
    "sec-ch-ua-mobile": "?1",
    "sec-ch-ua-platform": '"Android"',
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-origin",
    "sec-fetch-storage-access": "active",
    "Connection": "keep-alive",
    "user-agent": "Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Mobile Safari/537.36",
    };

    try {
        let fullResponse = await fetchResponse(data, headers);

        const formattedResponse = fullResponse
            .replace(/\*\*(.*?)\*\*/g, (_, text) => convertToBold(text))
            .replace(/##(.*?)##/g, (_, text) => convertToBold(text))
            .replace(/###\s*(.*?)(\n|$)/g, (_, text) => convertToBold(text) + '\n');

        conversationHistory[uid].push({ role: "assistant", content: formattedResponse.trim() });
        res.json({ response: formattedResponse.trim() });
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch data after multiple attempts" });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
