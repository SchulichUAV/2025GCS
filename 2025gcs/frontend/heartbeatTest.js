

// heartbeat testing here
const response = await fetch("http://192.168.1.66:5000/heartbeat-validate");
const jsonifyResponse = await response.json();
console.log(jsonifyResponse);
