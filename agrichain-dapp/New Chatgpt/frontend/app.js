function listCrop() {

    let name = document.getElementById("name").value;
    let farmer = document.getElementById("farmer").value;
    let price = document.getElementById("price").value;

    alert("Crop Listed (Demo Mode)");

    runAgent("list", name, farmer, price);
}

function buyCrop() {

    let id = document.getElementById("cropId").value;
    let buyer = document.getElementById("buyer").value;

    alert("Crop Bought (Demo Mode)");

    runAgent("buy", id, buyer);
}