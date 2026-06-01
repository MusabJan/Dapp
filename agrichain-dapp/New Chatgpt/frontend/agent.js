function runAgent(action, data1, data2, data3) {

    console.log("AI Agent triggered:", action);

    let output = "";

    if (action === "list") {

        output += "🤖 AI Agent Active\n";
        output += "Crop: " + data1 + "\n";

        if (data1 && data1.toLowerCase().includes("wheat")) {
            output += "✅ Wheat demand high\n";
        } else {
            output += "⚠️ Market check recommended\n";
        }

    }

    if (action === "buy") {

        output += "🤖 Buying Analysis\n";
        output += "Crop ID: " + data1 + "\n";

        if (parseInt(data1) <= 5) {
            output += "✅ Safe buy\n";
        } else {
            output += "⚠️ Risk detected\n";
        }
    }

    let box = document.getElementById("agentBox");

    if (!box) {
        console.log("agentBox not found!");
        return;
    }

    box.innerText = output;
}