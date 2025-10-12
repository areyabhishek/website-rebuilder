import { config } from 'dotenv';
config();

const url = "https://healmygut.com";

console.log("Testing generation for:", url);
console.log("Calling /api/generate...\n");

try {
  const response = await fetch("http://localhost:3000/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("❌ Generation failed!");
    console.error("Status:", response.status);
    console.error("Error:", data.error);
    console.error("Details:", data.details);
    process.exit(1);
  }

  console.log("✅ Generation succeeded!");
  console.log("Response:", JSON.stringify(data, null, 2));
} catch (error) {
  console.error("❌ Request failed:", error.message);
  process.exit(1);
}
