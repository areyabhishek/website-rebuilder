// Test Vercel API directly
const vercelUrl = "https://website-rebuilder-areyabhisheks-projects.vercel.app";

console.log("Testing Vercel API:", vercelUrl);

try {
  const response = await fetch(`${vercelUrl}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url: "https://healmygut.com" }),
  });

  console.log("Status:", response.status);

  const data = await response.json();
  console.log("\nResponse:");
  console.log(JSON.stringify(data, null, 2));

  if (response.ok) {
    console.log("\n✅ SUCCESS!");
  } else {
    console.log("\n❌ FAILED");
    console.log("Error:", data.error);
    console.log("Details:", data.details);
  }
} catch (error) {
  console.error("❌ Request failed:", error.message);
}
