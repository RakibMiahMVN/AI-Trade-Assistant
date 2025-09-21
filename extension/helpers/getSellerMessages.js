export function getSellerMessages() {
  try {
    const sellerMessages = document.querySelectorAll(
      ".seller-msg:not(.translated)"
    )
    console.log("Scanning for seller messages, found:", sellerMessages.length)

    sellerMessages.forEach(async (msgElement) => {
      const chineseText = msgElement.textContent.trim()
      return chineseText
    })
  } catch (error) {
    console.error("Error scanning for seller messages:", error)
  }
}
