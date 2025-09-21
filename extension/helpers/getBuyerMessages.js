function getBuyerMessages() {
  const buyerMessages = document.querySelectorAll(".user-msg:not(.translated)")
  console.log("Scanning for buyer messages, found:", buyerMessages.length)

  buyerMessages.forEach(async (msgElement) => {
    const buyerText = msgElement.textContent.trim()
    console.log("Processing buyer message:", buyerText)

    return buyerText
  })
}
