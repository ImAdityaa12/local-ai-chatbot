const express = require("express");
const cors = require("cors");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

app.post("/chat", async (req, res) => {
    const { message } = req.body;
    res.setHeader("Content-Type", "text/plain");

    try {
        const response = await fetch("http://localhost:11434/api/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ model: "deepseek-r1:7b", prompt: message, stream: true })
        });

        if (!response.body) throw new Error("No response from model");

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullResponse = "";

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true }).trim();
            if (chunk) {
                try {
                    const json = JSON.parse(chunk);
                    if (json.response) {
                        fullResponse += json.response; // Append response
                    }
                } catch (e) {
                    console.error("JSON Parse Error:", e);
                }
            }
        }

        res.end(fullResponse.trim()); // Send full response at once
    } catch (error) {
        console.error("Error:", error);
        res.status(500).send("Error processing request");
    }
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
