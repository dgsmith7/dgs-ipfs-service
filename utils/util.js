import Profile from "../models/ProfileModel.js";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
import { Blob } from "buffer";
import FormData from "form-data";
import bcrypt from "bcryptjs";
import User from "../models/UserModel.js";
import logger from "../config/logger.js";

dotenv.config();

let IPFSToken = process.env.IPFS_TOKEN;
let otpMap = new Map();

// otp stuff
export async function nDigitOTP(n) {
  // produce a code from hash of length n
  let pool = "0123456789abcdefghijklmnopqrstuvwxyz";
  let OTP = "";
  for (let i = 0; i < n; i++) {
    let num = parseInt(Math.random() * pool.length);
    OTP += pool.charAt(num);
  }
  return OTP;
}

export async function sendOtp(recipient) {
  // Generate One-Time-Passcode with n digits
  const passcode = await nDigitOTP(6);
  console.log(passcode);
  otpMap.set(recipient, passcode);
  await sendMessage(
    "Your OTP from Smitty's",
    `Your one-time passcode is:\n\n${otpMap.get(recipient)}`,
    recipient
  );
}

export async function validateOtp(email, otp, newPassword) {
  if (otp === otpMap.get(email)) {
    otpMap.delete(email);
    try {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      // Update the user's password assuming "username" field matches the email
      await User.findOneAndUpdate(
        { username: email },
        { password: hashedPassword }
      );
      return { message: "success" };
    } catch (err) {
      return { message: "fail", error: err.message };
    }
  } else {
    return { message: "fail" };
  }
}

// nodemailer stuff
export async function sendMessage(sub, txt, recipient) {
  let transporter = nodemailer.createTransport({
    host: process.env.GMAIL_HOST,
    port: process.env.MAIL_PORT,
    secure: process.env.MAIL_SECURE,
    auth: {
      user: process.env.GMAIL_USERNAME,
      pass: process.env.GMAIL_PASSWORD,
    },
    requireTLS: process.env.MAIL_TLS,
  });

  let message = {
    from: process.env.MESSAGE_FROM,
    to: recipient,
    subject: sub,
    text: txt,
  };

  await transporter
    .sendMail(message)
    .then((response) => {
      console.log("Message sent", response);
      return { message: "success" };
    })
    .catch((err) => {
      console.log("Message not sent:", err);
      return { message: "fail" };
    });
}

// ipfs node stuff
export async function refreshAllPins() {
  let rawList;
  let listOfPins = [];
  try {
    const response = await fetch(
      "https://ipfs.dgs-creative.com/api/v0/pin/ls?type=all&quiet=false&names=true",
      {
        method: "POST",
        headers: {
          Authorization: "Bearer " + IPFSToken,
        },
      }
    );
    rawList = await response.json();
  } catch (err) {
    logger.error("An error fetching all pins:", err);
  }
  listOfPins = Object.keys(rawList.Keys).map((key) => ({
    cid: key,
    type: rawList.Keys[key].Type,
    name: rawList.Keys[key].Name,
    size: 0,
  }));
  return listOfPins;
}

export async function loadPinSizes(pins) {
  for (const pin of pins) {
    try {
      const response = await fetch(
        `https://ipfs.dgs-creative.com/api/v0/object/stat?arg=${pin.cid}`,
        {
          method: "POST",
          headers: {
            Authorization: "Bearer " + IPFSToken,
          },
        }
      );
      const data = await response.json();
      if (data.CumulativeSize) {
        // Update: divide by 1000 instead of 1024
        pin.size = Math.ceil(data.CumulativeSize / 1000);
      } else {
        pin.size = 0;
      }
    } catch (err) {
      logger.error("Error in loadPinSizes for cid", pin.cid, err);
      pin.size = 0;
    }
  }
}

export async function pin(file) {
  const formData = new FormData();
  formData.append("file", file.buffer, {
    filename: file.originalname,
    contentType: file.mimetype,
  });
  const bodyBuffer = formData.getBuffer();
  const contentLength = Buffer.byteLength(bodyBuffer);
  const headers = {
    Authorization: "Bearer " + IPFSToken,
    ...formData.getHeaders(),
    "Content-Length": contentLength,
  };
  try {
    const response = await fetch("https://ipfs.dgs-creative.com/api/v0/add", {
      method: "POST",
      headers,
      body: bodyBuffer,
    });
    const contentType = response.headers.get("content-type");
    let result;
    if (contentType && contentType.includes("application/json")) {
      result = await response.json();
    } else {
      result = await response.text();
      try {
        result = JSON.parse(result);
      } catch (e) {
        console.log("Received plain text response:", result);
        return;
      }
    }
    return { Hash: result.Hash };
  } catch (err) {
    logger.error("An error -", err);
  }
}

export async function add(cid, name) {
  try {
    const response = await fetch(
      `https://ipfs.dgs-creative.com/api/v0/pin/add?arg=${cid}&name=${name}`,
      {
        method: "POST",
        headers: {
          Authorization: "Bearer " + IPFSToken,
        },
      }
    );
    if (!response.ok) {
      const errText = await response.text();
      throw new Error(errText);
    }
    const data = await response.json();
    return data;
  } catch (err) {
    logger.error("Error in add function:", err);
    throw err;
  }
}

// Updated unpin function to accept an array of CIDs
export async function unpin(cidArray) {
  const validCids = cidArray.filter(
    (cid) => typeof cid === "string" && cid.trim().length > 0
  );
  if (validCids.length === 0) {
    throw new Error("No valid CIDs provided");
  }
  const queryString = validCids
    .map((cid) => `arg=${encodeURIComponent(cid)}`)
    .join("&");
  return await fetch(
    `https://ipfs.dgs-creative.com/api/v0/pin/rm?${queryString}`,
    {
      method: "POST",
      headers: {
        Authorization: "Bearer " + IPFSToken,
      },
    }
  )
    .then((r) => r.json())
    .then((response) => {
      return response;
    })
    .catch((err) => {
      logger.error("Error unpinning pins:", err);
      throw err;
    });
}

export async function sizeCID(cid) {
  try {
    const response = await fetch(
      `https://ipfs.dgs-creative.com/api/v0/block/stat?arg=${cid}`,
      {
        method: "POST",
        headers: {
          Authorization: "Bearer " + IPFSToken,
        },
      }
    );
    const data = await response.json();
    if (data.CumulativeSize !== undefined) {
      // Update: divide by 1000
      return Math.ceil(data.CumulativeSize / 1000);
    } else if (data.Size !== undefined) {
      return Math.ceil(data.Size / 1000);
    }
    return 0;
  } catch (err) {
    logger.error("Error in sizeCID:", err);
    return 0;
  }
}

export async function getNodeStats() {
  const stats = {};

  async function fetchStream(url) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: "Bearer " + IPFSToken,
        },
      });
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let result = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        result += decoder.decode(value, { stream: true });
      }
      try {
        return JSON.parse(result);
      } catch (err) {
        return result;
      }
    } catch (err) {
      logger.error("Error fetching stream from " + url, err);
      return null;
    }
  }

  const idData = await fetchStream("https://ipfs.dgs-creative.com/api/v0/id");
  stats.id = idData?.ID || "N/A";
  stats.agentVersion = idData?.AgentVersion || "N/A";
  stats.addresses = idData?.Addresses || [];

  const repoData = await fetchStream(
    "https://ipfs.dgs-creative.com/api/v0/repo/stat?size-only=true"
  );
  stats.repoSize = Number(repoData?.RepoSize) || 0;
  stats.storageMax = Number(repoData?.StorageMax) || 0;
  stats.repoPath = repoData?.RepoPath || "N/A";
  stats.version = repoData?.Version || "N/A";

  const diagData = await fetchStream(
    "https://ipfs.dgs-creative.com/api/v0/diag/sys"
  );
  stats.diagSys = diagData || "N/A";

  const bwData = await fetchStream(
    "https://ipfs.dgs-creative.com/api/v0/stats/bw"
  );
  stats.bandwidth = bwData || {};

  const bitswapData = await fetchStream(
    "https://ipfs.dgs-creative.com/api/v0/stats/bitswap"
  );
  stats.bitswap = bitswapData || {};

  const provideData = await fetchStream(
    "https://ipfs.dgs-creative.com/api/v0/stats/provide"
  );
  stats.provide = provideData || {};

  return stats;
}
