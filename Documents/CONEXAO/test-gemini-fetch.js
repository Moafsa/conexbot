async function test() {
    console.log("Testing fetch to Google Gemini...");
    const res = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer TEST_KEY"
        },
        body: JSON.stringify({
            model: "gemini-1.5-flash",
            messages: [{ role: "user", content: "hello" }]
        })
    });
    console.log("Status:", res.status);
    console.log("Body:", await res.text());
}
test();
