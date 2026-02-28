import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

async function testUpload() {
  const dummyBase64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="

  try {
    const cloudinaryRes = await fetch(
      `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify({
              file: dummyBase64,
              upload_preset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'official_id',
              folder: 'official-id/events/payment_proofs'
          }),
      }
    )

    const text = await cloudinaryRes.text()
    console.log("Status:", cloudinaryRes.status)
    console.log("Response:", text)
  } catch(e) {
    console.error("Error:", e)
  }
}
testUpload()
