document.addEventListener("DOMContentLoaded", () => {
  const nodeStats = JSON.parse(document.querySelector("#stats").textContent);
  //console.log("nodeStats:", nodeStats);

  // --- Node Info ---
  // Remove the ID from nodeInfo and update node-id-display separately:
  const nodeIdDisplay = document.getElementById("node-id-display");
  nodeIdDisplay.innerHTML = `<div><div><span style="color:black;">Node ID:</span> <span
    style="color:red;">${nodeStats.id}</span></div><div><a href="https://ipfs.tech" target="blank" style="color:black;">About IPFS</a></div></div>`;

  const nodeInfo = document.getElementById("node-info");
  nodeInfo.innerHTML = `
<div style="text-align:left;">
  <div><span style="color:black;">Agent Version:</span> <span style="color:red;">${
    nodeStats.agentVersion
  }</span></div>
  <div><span style="color:black;">Version:</span> <span style="color:red;">${
    nodeStats.version
  }</span></div>
  <div><span style="color:black;">IPFS Version:</span> <span style="color:red;">${
    nodeStats.diagSys?.ipfs_version || "N/A"
  }</span></div>
  <div><span style="color:black;">File System Type:</span> <span style="color:red;">${
    nodeStats.diagSys?.diskinfo?.fstype || "N/A"
  }</span></div>
</div>
`;

  // --- Disk Space Pie Chart ---
  const diskCanvas = document.getElementById("diskChart");
  if (diskCanvas) {
    const repoSize = Number(nodeStats.repoSize) || 0;
    const storageMax = Number(nodeStats.storageMax) || 0;
    const dataDisk = [repoSize, storageMax - repoSize];
    new Chart(diskCanvas, {
      type: "pie",
      data: {
        labels: ["Used", "Available"],
        datasets: [
          {
            data: dataDisk,
            backgroundColor: [
              "rgba(255, 99, 132, 0.7)",
              "rgba(54, 162, 235, 0.7)",
            ],
            borderColor: ["rgba(255, 99, 132, 1)", "rgba(54, 162, 235, 1)"],
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: "Disk Space",
          },
        },
      },
    });
  }

  // --- File System Pie Chart ---
  const fsCanvas = document.getElementById("fsChart");
  if (fsCanvas) {
    const freeSpace = Number(nodeStats.diagSys?.diskinfo?.free_space) || 0;
    const totalSpace = Number(nodeStats.diagSys?.diskinfo?.total_space) || 0;
    const usedSpace = Math.max(totalSpace - freeSpace, 0);
    const dataFS = [freeSpace, usedSpace];
    new Chart(fsCanvas, {
      type: "pie",
      data: {
        labels: ["Free Space", "Used Space"],
        datasets: [
          {
            data: dataFS,
            backgroundColor: [
              "rgba(75, 192, 192, 0.7)",
              "rgba(255, 205, 86, 0.7)",
            ],
            borderColor: ["rgba(75, 192, 192, 1)", "rgba(255, 205, 86, 1)"],
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: "File System",
          },
        },
      },
    });
  }

  // --- Bandwidth Stats Horizontal Bar Charts ---
  // Chart 1: Total In / Total Out
  const bwTotalCanvas = document.getElementById("bandwidthTotalChart");
  if (bwTotalCanvas) {
    const bwData = nodeStats.bandwidth || {};
    const totalIn = Number(bwData.TotalIn) || 0;
    const totalOut = Number(bwData.TotalOut) || 0;
    new Chart(bwTotalCanvas, {
      type: "bar",
      data: {
        labels: ["Total In", "Total Out"],
        datasets: [
          {
            label: "Total Bandwidth",
            data: [totalIn, totalOut],
            backgroundColor: [
              "rgba(153, 102, 255, 0.7)",
              "rgba(255, 159, 64, 0.7)",
            ],
            borderColor: ["rgba(153, 102, 255, 1)", "rgba(255, 159, 64, 1)"],
            borderWidth: 1,
          },
        ],
      },
      options: {
        indexAxis: "y",
        responsive: true,
        scales: {
          y: {
            ticks: { autoSkip: false },
          },
        },
        plugins: {
          legend: { display: false }, // Legend removed
          title: { display: true, text: "Total Bandwidth" },
        },
      },
    });
  }
  // Chart 2: Rate In / Rate Out
  const bwRateCanvas = document.getElementById("bandwidthRateChart");
  if (bwRateCanvas) {
    const bwData = nodeStats.bandwidth || {};
    const rateIn = Number(bwData.RateIn) || 0;
    const rateOut = Number(bwData.RateOut) || 0;
    new Chart(bwRateCanvas, {
      type: "bar",
      data: {
        labels: ["Rate In", "Rate Out"],
        datasets: [
          {
            label: "Rate",
            data: [rateIn, rateOut],
            backgroundColor: [
              "rgba(54, 162, 235, 0.7)",
              "rgba(255, 99, 132, 0.7)",
            ],
            borderColor: ["rgba(54, 162, 235, 1)", "rgba(255, 99, 132, 1)"],
            borderWidth: 1,
          },
        ],
      },
      options: {
        indexAxis: "y",
        responsive: true,
        plugins: {
          legend: { display: false }, // Legend removed
          title: { display: true, text: "Bandwidth Rate" },
        },
      },
    });
  }

  // --- Bitswap Stats ---
  const bitswapInfo = document.getElementById("bitswap-info");
  if (bitswapInfo) {
    const bitswap = nodeStats.bitswap || {};
    bitswapInfo.innerHTML = `
<div style="text-align:left;">
  <div><span style="color:black;">Peers:</span> <span style="color:red;">${
    (bitswap.Peers && bitswap.Peers.length) || 0
  }</span></div>
  <div><span style="color:black;">Blocks Received:</span> <span style="color:red;">${
    bitswap.BlocksReceived || 0
  }</span></div>
  <div><span style="color:black;">Data Received:</span> <span style="color:red;">${
    bitswap.DataReceived || 0
  }</span></div>
  <div><span style="color:black;">Dup Blks Received:</span> <span style="color:red;">${
    bitswap.DupBlksReceived || 0
  }</span></div>
  <div><span style="color:black;">Dup Data Received:</span> <span style="color:red;">${
    bitswap.DupDataReceived || 0
  }</span></div>
  <div><span style="color:black;">Messages Received:</span> <span style="color:red;">${
    bitswap.MessagesReceived || 0
  }</span></div>
  <div><span style="color:black;">Blocks Sent:</span> <span style="color:red;">${
    bitswap.BlocksSent || 0
  }</span></div>
  <div><span style="color:black;">Data Sent:</span> <span style="color:red;">${
    bitswap.DataSent || 0
  } bytes</span></div>
  <div><span style="color:black;">Provide Buffer Length:</span> <span style="color:red;">${
    bitswap.ProvideBufLen || 0
  }</span></div>
</div>
`;
  }

  // --- Provide Stats ---
  const provideInfo = document.getElementById("provide-info");
  if (provideInfo) {
    const provide = nodeStats.provide || {};
    // Convert and round durations from nanoseconds to milliseconds (no decimals)
    const avgProvideMs = Math.round((provide.AvgProvideDuration || 0) / 1e6);
    const lastProvideMs = Math.round(
      (provide.LastReprovideDuration || 0) / 1e6
    );
    provideInfo.innerHTML = `
<div style="text-align:left;">
  <div><span style="color:black;">Total Provides:</span> <span style="color:red;">${
    provide.TotalProvides || 0
  }</span></div>
  <div><span style="color:black;">Last Reprovide Batch Size:</span> <span style="color:red;">${
    provide.LastReprovideBatchSize || 0
  }</span></div>
  <div><span style="color:black;">Avg Provide Duration:</span> <span style="color:red;">${avgProvideMs} ms</span></div>
  <div><span style="color:black;">Last Reprovide Duration:</span> <span style="color:red;">${lastProvideMs} ms</span>
  </div>
</div>
`;
  }
});
