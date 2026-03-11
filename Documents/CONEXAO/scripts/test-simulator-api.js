async function testSimulator() {
    const botId = "d0e0fed2-5168-4b49-9226-3926cc7a65ae";
    const body = {
        botId,
        message: "oi, tudo bem?",
        sessionId: "SIM_TEST_123"
    };

    console.log("Calling Local Simulator API...");
    const res = await fetch("http://localhost:3004/api/simulator", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
    });

    console.log("Status:", res.status);
    const data = await res.json();
    console.log("Response:", data);
}

testSimulator();
