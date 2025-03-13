export const apiContent = [
  {
    endpoint: "/api/pin",
    purpose:
      "Pin a file from your local file structure to the node. (This increases your storage usage).  Be sure you have the packages listed as imports installed.",
    codeString:
      '\nimport fs from "fs"\nimport path from "path"\nimport FormData from "form-data"\n' +
      "\nasync function pinToSmittys(url, projectname) {\n   // Read the file fully as a buffer\n   const buffer = fs.readFileSync(url);\n   const formData = new FormData();\n" +
      '   formData.append("file", buffer, path.basename(url));\n' +
      "\n   // Get the entire multipart body as a Buffer\n   const bodyBuffer = formData.getBuffer();\n   const contentLength = Buffer.byteLength(bodyBuffer);\n   // Combine the headers from formData with an explicit Content-Length\n   const headers = {\n" +
      '     "x-api-username": "yourUsername",\n' +
      '     "x-api-key": "yourRawApiKey",\n' +
      "     ...formData.getHeaders(),\n" +
      '     "Content-Length": contentLength,\n' +
      "   };\n   console.log(bodyBuffer);\n   try {\n     const response = await fetch(\n       `https://pin.dgs-creative.com/api/pin?projectname=${encodeURIComponent(\n         projectname\n       )}`,\n       {\n" +
      '         method: "POST",\n' +
      "         headers: headers,\n         body: bodyBuffer,\n       }\n     );\n     const data = await response.json();\n     if (response.ok) {\n" +
      '       console.log("File pinned successfully:", data.IpfsHash);\n' +
      "       return { IpfsHash: data.cid };\n     }\n   } catch (err) {\n" +
      '     console.error("Error pinning file:", err);\n' +
      "\n// Usage\n" +
      'pinToSmittys("./images/kitten1.png", "FosterCats");\n',
  },
  {
    endpoint: "/api/unpin",
    purpose:
      "Remove a pin from the node (This reduces your storage usage).  You can have up to 10 CIDs in the array.",
    codeString:
      "\nasync function unpinFromSmittys(cidArray) {\n  let body = { cids: cidArray };\n  const headers = {\n" +
      '    "Content-Type": "application/json",\n    "x-api-username": "yourUsername",\n    "x-api-key": "yourRawApiKey",\n' +
      "  };\n  return await fetch(`https://pin.dgs-creative.com/api/unpin`, {\n" +
      '    method: "POST",\n' +
      "    headers: headers,\n    body: JSON.stringify(body),\n  })\n    .then((r) => r.json())\n    .then((response) => {\n" +
      '      console.log("Unpin response from IPFS:", response);\n' +
      "      return response;\n    })\n    .catch((err) => {\n" +
      '      console.error("Error unpinning pins:", err);\n' +
      "      throw err;\n    });\n}\n\n// Usage\n" +
      'unpinFromSmittys(["QmRnbvzvhPSwj1cHRrpSsck1Ses59U1dA8kBhPR852Pd9b"]);',
  },
];
