# Smitty's IPFS Pinning Service and API

## Overview

This application provides a web portal for interacting with an IPFS node. Users can pin and unpin files, view their usage statistics, and manage their account through a secure authentication system with JWT. Administrators have additional control over user profiles and allowed users. It is built with Node.js, Express, MongoDB, and EJS for server-side rendering.

At this time I am offering the service to friends and students for free, with an option for donations to help cover costs. I manage an invite-list to control access to the service, and memory limits for pinning so the node is not abused.

Writing this service, along with standing up and configuring the node, then building and configuring the reverse-proxy authentication server for it, has been a magnificent project and amazing learning experience.

## Features

- User sign-up, login, and JWT-based authentication.
- Pin files to an IPFS node and track storage usage.
- View detailed profile and node statistics.
- Admin dashboard for managing user accounts and allowed users.
- API endpoints secured with API key authentication.

## Prerequisites

- A running IPFS node is required. The app makes API calls to the IPFS node; you may need to adjust the API endpoint URLs in the code (located in `/utils/util.js`) depending on your IPFS node's configuration.
- Node.js (v14 or above) and npm installed.
- MongoDB instance (local or cloud) for storing user and profile data.
- Environment variables (e.g., via a `.env` file) for configuration:
  - `MONGO_URI` – MongoDB connection string.
  - `JWT_SECRET` and `JWT_REFRESH_SECRET` – secrets for token generation.
  - `IPFS_TOKEN` – token for authenticating with your IPFS node.
  - Other variables for email and external configurations.

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   ```
2. Navigate to the project directory:
   ```bash
   cd /Users/dgsmith7/Documents/Computation/Code repos/dgs-ipfs-service
   ```
3. Install the dependencies:
   ```bash
   npm install
   ```
4. Create a `.env` file in the root directory and add your configuration tokens and endpoints. For example:
   ```
   MONGO_URI=mongodb://localhost:27017/your-db
   JWT_SECRET=your_jwt_secret
   JWT_REFRESH_SECRET=your_jwt_refresh_secret
   IPFS_TOKEN=your_ipfs_token
   NODE_ENV=development
   PORT=3000
   SMITTYS_EMAIL=your_email@example.com
   ```

## Running the App

1. Ensure your IPFS node is running and accessible.
2. Start your MongoDB instance, if not already running.
3. Run the application:
   ```bash
   npm start
   ```
4. Open your web browser and navigate to `http://localhost:3000` to see the login page.

## Additional Notes

- **IPFS Node Configuration:**  
  The application interacts with the IPFS node via HTTP API calls located in `/utils/util.js`. If your IPFS node runs on a different host or port than expected, update the API endpoint URLs accordingly.
- **API Endpoints:**  
  Details about available API endpoints (e.g., for pinning/unpinning files) are available in the API docs view of the app and the `/public/js/apidocsdata.js` file.
- **Security & Environment:**  
  The `NODE_ENV` variable is used to configure production settings (like secure cookies). Be sure to set it to `production` in your production environment.
- **Development and Testing:**  
  The app is configured with basic logging and error handling. Check the logs (stored in MongoDB via winston-mongodb) if you encounter issues.

Enjoy using the service!
