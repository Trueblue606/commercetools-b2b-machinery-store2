export default function RunUpdate() {
  async function runUpdate() {
    const res = await fetch("/api/products/set-embedded-prices", { method: "POST" });
    const data = await res.json();
    console.log("Update result:", data);
    alert(JSON.stringify(data, null, 2));
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Bulk PriceMode Update</h1>
      <button onClick={runUpdate}>Run Bulk Update</button>
    </div>
  );
}
